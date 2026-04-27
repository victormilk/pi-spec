import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	ExtensionAPI,
	ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import {
	DEFAULT_MAX_BYTES,
	DEFAULT_MAX_LINES,
	formatSize,
	truncateHead,
	withFileMutationQueue,
} from "@mariozechner/pi-coding-agent";
import { type Static, Type } from "typebox";
import {
	extractAfterTaskHooks,
	formatConfigContext,
	formatConfigWarnings,
	formatHookResults,
	loadSpecConfig,
	runAfterTaskHooks,
} from "./config.ts";

const extensionDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(extensionDir, "..", "..");

const SPEC_ROOT = ".specs";
const BRAINSTORM_FILE = "brainstorm.md" as const;
const SPEC_FILES = ["requirements.md", "design.md", "tasks.md"] as const;
const STATUS_FILES = [BRAINSTORM_FILE, ...SPEC_FILES] as const;

type SpecFileName = (typeof SPEC_FILES)[number];
type SpecTrackedFileName = (typeof STATUS_FILES)[number];

interface SpecSummary {
	slug: string;
	title: string;
	status: string;
	files: Record<SpecTrackedFileName, boolean>;
	tasks: {
		total: number;
		done: number;
	};
	path: string;
}

const SpecBrainstormParamsSchema = Type.Object({
	name: Type.String({
		description:
			"Human-readable idea/spec name or slug, e.g. 'OAuth login' or 'oauth-login'.",
	}),
	title: Type.Optional(
		Type.String({
			description: "Display title. Defaults to a title-cased version of name.",
		}),
	),
	summary: Type.String({
		description:
			"Outcome of the completed brainstorm: user intent, answers, assumptions, proposal, and remaining doubts.",
	}),
	force: Type.Optional(
		Type.Boolean({
			description: "Overwrite an existing brainstorm.md. Default: false.",
		}),
	),
});

type SpecBrainstormParams = Static<typeof SpecBrainstormParamsSchema>;

const SpecInitParamsSchema = Type.Object({
	name: Type.String({
		description:
			"Human-readable spec name or slug, e.g. 'OAuth login' or 'oauth-login'.",
	}),
	title: Type.Optional(
		Type.String({
			description: "Display title. Defaults to a title-cased version of name.",
		}),
	),
	description: Type.Optional(
		Type.String({
			description: "Initial problem/goal summary for requirements.md.",
		}),
	),
	brainstormSummary: Type.Optional(
		Type.String({
			description:
				"Required unless .specs/<slug>/brainstorm.md already exists. Summary from the completed brainstorm gate.",
		}),
	),
	force: Type.Optional(
		Type.Boolean({
			description:
				"Overwrite existing generated template files. Default: false.",
		}),
	),
});

type SpecInitParams = Static<typeof SpecInitParamsSchema>;

const SpecStatusParamsSchema = Type.Object({
	spec: Type.Optional(
		Type.String({
			description: "Specific spec slug. If omitted, lists all specs.",
		}),
	),
	includeContent: Type.Optional(
		Type.Boolean({
			description:
				"Include generated markdown file contents. Output is truncated. Default: false.",
		}),
	),
});

type SpecStatusParams = Static<typeof SpecStatusParamsSchema>;

const SpecValidateParamsSchema = Type.Object({
	spec: Type.String({ description: "Spec slug to validate." }),
	phase: Type.Optional(
		Type.Union([Type.Literal("structure"), Type.Literal("implementation")], {
			description:
				"Validation phase. Use 'implementation' before coding from an approved tasks.md plan.",
		}),
	),
});

type SpecValidateParams = Static<typeof SpecValidateParamsSchema>;

const SpecTaskCheckParamsSchema = Type.Object({
	spec: Type.String({ description: "Spec slug or `.specs/<slug>` path." }),
	id: Type.String({
		description:
			"Task identifier as written in tasks.md, e.g. `T-001`. Case-insensitive.",
	}),
	uncheck: Type.Optional(
		Type.Boolean({
			description:
				"Set true to flip an `[x]` task back to `[ ]`. Default: false.",
		}),
	),
});

type SpecTaskCheckParams = Static<typeof SpecTaskCheckParamsSchema>;

function specRoot(cwd: string): string {
	return join(cwd, SPEC_ROOT);
}

function normalizeSlug(value: string): string {
	const slug = value
		.trim()
		.toLowerCase()
		.replace(/['’]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/-{2,}/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 80);

	if (!slug) throw new Error(`Invalid spec name: ${value}`);
	return slug;
}

function titleCase(value: string): string {
	return normalizeSlug(value)
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function resolveSpecDir(
	cwd: string,
	spec: string,
): { slug: string; dir: string } {
	const slug = normalizeSlug(spec.replace(/^\.specs\//, ""));
	const dir = join(specRoot(cwd), slug);
	const root = resolve(specRoot(cwd));
	const resolved = resolve(dir);
	if (!resolved.startsWith(`${root}/`) && resolved !== root) {
		throw new Error(`Spec path escaped ${SPEC_ROOT}: ${spec}`);
	}
	return { slug, dir };
}

function renderTemplate(
	template: string,
	params: {
		slug: string;
		title: string;
		description: string;
		date: string;
		summary?: string;
	},
): string {
	return template
		.replaceAll("{{SLUG}}", params.slug)
		.replaceAll("{{TITLE}}", params.title)
		.replaceAll("{{DESCRIPTION}}", params.description)
		.replaceAll("{{SUMMARY}}", params.summary ?? "")
		.replaceAll("{{DATE}}", params.date);
}

async function readIfExists(path: string): Promise<string | undefined> {
	try {
		return await readFile(path, "utf8");
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
		throw error;
	}
}

function extractTitle(markdown: string | undefined, fallback: string): string {
	if (!markdown) return titleCase(fallback);
	const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
	return title || titleCase(fallback);
}

function extractStatus(markdown: string | undefined): string {
	if (!markdown) return "missing";
	return markdown.match(/^Status:\s*(.+)$/m)?.[1]?.trim() ?? "draft";
}

function isDraftStatus(status: string): boolean {
	return /(^|[-\s])draft($|[-\s])/.test(status.trim().toLowerCase());
}

function hasTodoPlaceholders(markdown: string | undefined): boolean {
	return Boolean(markdown?.match(/(^|\s)TODO(?::|\s*$)/im));
}

function countTasks(markdown: string | undefined): {
	total: number;
	done: number;
} {
	if (!markdown) return { total: 0, done: 0 };
	const taskLines = markdown.match(/^\s*-\s+\[[ xX-]\]/gm) ?? [];
	const done = taskLines.filter((line) => /^\s*-\s+\[[xX]\]/.test(line)).length;
	return { total: taskLines.length, done };
}

async function summarizeSpec(cwd: string, slug: string): Promise<SpecSummary> {
	const { dir } = resolveSpecDir(cwd, slug);
	const files = Object.fromEntries(
		STATUS_FILES.map((file) => [file, existsSync(join(dir, file))]),
	) as Record<SpecTrackedFileName, boolean>;
	const brainstorm = await readIfExists(join(dir, BRAINSTORM_FILE));
	const requirements = await readIfExists(join(dir, "requirements.md"));
	const tasks = await readIfExists(join(dir, "tasks.md"));
	return {
		slug,
		title: extractTitle(requirements ?? brainstorm, slug).replace(
			/\s+(Requirements|Brainstorm)$/i,
			"",
		),
		status: extractStatus(tasks ?? requirements ?? brainstorm),
		files,
		tasks: countTasks(tasks),
		path: join(SPEC_ROOT, slug),
	};
}

async function listSpecSlugs(cwd: string): Promise<string[]> {
	const root = specRoot(cwd);
	try {
		const entries = await readdir(root, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name)
			.filter((name) => !name.startsWith("_"))
			.sort((a, b) => a.localeCompare(b));
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
		throw error;
	}
}

async function summarizeSpecs(
	cwd: string,
	maybeSpec?: string,
): Promise<SpecSummary[]> {
	const slugs = maybeSpec
		? [normalizeSlug(maybeSpec.replace(/^\.specs\//, ""))]
		: await listSpecSlugs(cwd);
	return Promise.all(slugs.map((slug) => summarizeSpec(cwd, slug)));
}

function formatSpecSummary(specs: SpecSummary[]): string {
	if (specs.length === 0) {
		return `No specs found. Start with /spec-brainstorm <idea> so Pi can clarify intent before spec creation.`;
	}

	const lines = [`Spec root: ${SPEC_ROOT}/`, ""];
	for (const spec of specs) {
		const fileBits = STATUS_FILES.map(
			(file) => `${spec.files[file] ? "✓" : "·"} ${file}`,
		).join(", ");
		const taskBits =
			spec.tasks.total > 0
				? `${spec.tasks.done}/${spec.tasks.total} tasks complete`
				: "no tasks yet";
		lines.push(`- ${spec.slug} — ${spec.title}`);
		lines.push(`  path: ${spec.path}/`);
		lines.push(`  status: ${spec.status}; ${taskBits}`);
		lines.push(`  files: ${fileBits}`);
	}
	return lines.join("\n");
}

function truncateForTool(text: string): string {
	const truncation = truncateHead(text, {
		maxLines: DEFAULT_MAX_LINES,
		maxBytes: DEFAULT_MAX_BYTES,
	});
	if (!truncation.truncated) return truncation.content;
	return `${truncation.content}\n\n[Output truncated: ${truncation.outputLines} of ${truncation.totalLines} lines (${formatSize(
		truncation.outputBytes,
	)} of ${formatSize(truncation.totalBytes)}).]`;
}

async function includeSpecContents(
	cwd: string,
	specs: SpecSummary[],
): Promise<string> {
	const chunks: string[] = [];
	for (const spec of specs) {
		chunks.push(`\n## ${spec.slug}`);
		const { dir } = resolveSpecDir(cwd, spec.slug);
		for (const file of STATUS_FILES) {
			const content = await readIfExists(join(dir, file));
			if (content === undefined) {
				chunks.push(`\n### ${file}\n(missing)`);
			} else {
				chunks.push(`\n### ${file}\n\`\`\`markdown\n${content}\n\`\`\``);
			}
		}
	}
	return truncateForTool(chunks.join("\n"));
}

async function recordBrainstorm(
	cwd: string,
	params: SpecBrainstormParams,
): Promise<{ slug: string; dir: string; file?: string; skipped?: string }> {
	const slug = normalizeSlug(params.name);
	const title = params.title?.trim() || titleCase(params.name);
	const date = new Date().toISOString().slice(0, 10);
	const { dir } = resolveSpecDir(cwd, slug);
	const target = join(dir, BRAINSTORM_FILE);
	const templatePath = join(packageRoot, "templates", "spec", BRAINSTORM_FILE);
	const template = await readFile(templatePath, "utf8");
	const rendered = renderTemplate(template, {
		slug,
		title,
		description: "",
		summary: params.summary.trim(),
		date,
	});

	await mkdir(dir, { recursive: true });

	let file: string | undefined;
	let skipped: string | undefined;
	await withFileMutationQueue(target, async () => {
		if (existsSync(target) && !params.force) {
			skipped = relative(cwd, target);
			return;
		}
		await writeFile(target, rendered, "utf8");
		file = relative(cwd, target);
	});

	return { slug, dir: relative(cwd, dir), file, skipped };
}

function hasBrainstorm(cwd: string, name: string): boolean {
	const { dir } = resolveSpecDir(cwd, name);
	return existsSync(join(dir, BRAINSTORM_FILE));
}

async function initializeSpec(
	cwd: string,
	params: SpecInitParams,
): Promise<{ slug: string; dir: string; files: string[]; skipped: string[] }> {
	const slug = normalizeSlug(params.name);
	const title = params.title?.trim() || titleCase(params.name);
	const description =
		params.description?.trim() ||
		"TODO: Describe the user problem, target outcome, and boundaries.";
	const date = new Date().toISOString().slice(0, 10);
	const { dir } = resolveSpecDir(cwd, slug);

	await mkdir(dir, { recursive: true });

	const generated: string[] = [];
	const skipped: string[] = [];

	for (const file of SPEC_FILES) {
		const templatePath = join(packageRoot, "templates", "spec", file);
		const target = join(dir, file);
		const template = await readFile(templatePath, "utf8");
		const rendered = renderTemplate(template, {
			slug,
			title,
			description,
			date,
		});

		await withFileMutationQueue(target, async () => {
			if (existsSync(target) && !params.force) {
				skipped.push(relative(cwd, target));
				return;
			}
			await writeFile(target, rendered, "utf8");
			generated.push(relative(cwd, target));
		});
	}

	return { slug, dir: relative(cwd, dir), files: generated, skipped };
}

interface TaskBlock {
	id: string;
	lineIndex: number; // 0-based line index of the parent `- [ ] N. ...` line
	checked: boolean;
}

function parseTaskBlocks(markdown: string): TaskBlock[] {
	const lines = markdown.split(/\r?\n/);
	const parentRe = /^(\s*)-\s+\[([ xX])\]\s+(.*)$/;
	const idRe = /^\s*(?:-\s+)?ID:\s*(T-\d{3,})\s*$/i;
	const headingRe = /^#{1,6}\s/;

	const blocks: TaskBlock[] = [];
	for (let i = 0; i < lines.length; i++) {
		const parent = lines[i].match(parentRe);
		if (!parent) continue;
		const parentIndent = parent[1].length;
		const checked = parent[2].toLowerCase() === "x";
		let id: string | undefined;
		for (let j = i + 1; j < lines.length; j++) {
			const line = lines[j];
			if (line.trim() === "") break;
			if (headingRe.test(line)) break;
			const nextParent = line.match(parentRe);
			if (nextParent && nextParent[1].length <= parentIndent) break;
			const idMatch = line.match(idRe);
			if (idMatch) {
				id = idMatch[1].toUpperCase();
				break;
			}
		}
		if (id) blocks.push({ id, lineIndex: i, checked });
	}
	return blocks;
}

function setCheckboxOnLine(line: string, checked: boolean): string {
	return line.replace(
		/^(\s*-\s+)\[([ xX])\](\s)/,
		(_match, prefix, _state, suffix) =>
			`${prefix}[${checked ? "x" : " "}]${suffix}`,
	);
}

function setStatusLine(markdown: string, newStatus: string): string {
	if (/^Status:\s*.+$/m.test(markdown)) {
		return markdown.replace(/^Status:\s*.+$/m, `Status: ${newStatus}`);
	}
	const lines = markdown.split(/\r?\n/);
	const headingIdx = lines.findIndex((l) => /^#\s+/.test(l));
	if (headingIdx >= 0) {
		lines.splice(headingIdx + 1, 0, "", `Status: ${newStatus}`);
		return lines.join("\n");
	}
	return `Status: ${newStatus}\n${markdown}`;
}

function nextStatusAfterCheck(
	prevStatus: string,
	doneCount: number,
	totalCount: number,
	nowChecked: boolean,
): string | undefined {
	const trimmed = prevStatus.trim();
	if (nowChecked) {
		if (totalCount > 0 && doneCount === totalCount) {
			return trimmed === "implementation-complete"
				? undefined
				: "implementation-complete";
		}
		if (trimmed === "tasks-approved") return "implementation-in-progress";
		return undefined;
	}
	if (trimmed === "implementation-complete")
		return "implementation-in-progress";
	return undefined;
}

interface TaskCheckResult {
	slug: string;
	id: string;
	changed: boolean;
	previous: "[ ]" | "[x]";
	current: "[ ]" | "[x]";
	status: { previous: string; current: string };
	refusal?: string;
}

async function applyTaskCheck(
	cwd: string,
	params: SpecTaskCheckParams,
): Promise<TaskCheckResult> {
	const { slug, dir } = resolveSpecDir(cwd, params.spec);
	const tasksPath = join(dir, "tasks.md");
	const targetId = params.id.trim().toUpperCase();
	const wantChecked = !params.uncheck;

	const result: TaskCheckResult = {
		slug,
		id: targetId,
		changed: false,
		previous: "[ ]",
		current: "[ ]",
		status: { previous: "missing", current: "missing" },
	};

	await withFileMutationQueue(tasksPath, async () => {
		const markdown = await readIfExists(tasksPath);
		if (markdown === undefined) {
			result.refusal = `tasks.md not found for spec '${slug}'. Run spec_init ${slug} first.`;
			return;
		}

		const prevStatus = extractStatus(markdown);
		result.status.previous = prevStatus;
		result.status.current = prevStatus;

		if (isDraftStatus(prevStatus)) {
			result.refusal = `tasks.md is still '${prevStatus}'. Get explicit user approval and set Status to 'tasks-approved' before checking tasks.`;
			return;
		}

		const blocks = parseTaskBlocks(markdown);
		const matches = blocks.filter((b) => b.id === targetId);
		if (matches.length === 0) {
			const known = blocks.map((b) => b.id).join(", ") || "(none)";
			result.refusal = `Task id '${targetId}' not found in ${SPEC_ROOT}/${slug}/tasks.md. Known IDs: ${known}.`;
			return;
		}
		if (matches.length > 1) {
			const lineList = matches.map((b) => `line ${b.lineIndex + 1}`).join(", ");
			result.refusal = `Task id '${targetId}' is ambiguous; declared on ${lineList}. Make IDs unique before calling spec_task_check.`;
			return;
		}

		const block = matches[0];
		result.previous = block.checked ? "[x]" : "[ ]";
		result.current = result.previous;

		if (block.checked === wantChecked) {
			return; // idempotent
		}

		const lines = markdown.split(/\r?\n/);
		lines[block.lineIndex] = setCheckboxOnLine(
			lines[block.lineIndex],
			wantChecked,
		);
		let updated = lines.join("\n");

		const counts = countTasks(updated);
		const nextStatus = nextStatusAfterCheck(
			prevStatus,
			counts.done,
			counts.total,
			wantChecked,
		);
		if (nextStatus && nextStatus !== prevStatus.trim()) {
			updated = setStatusLine(updated, nextStatus);
			result.status.current = nextStatus;
		}

		await writeFile(tasksPath, updated, "utf8");
		result.changed = true;
		result.current = wantChecked ? "[x]" : "[ ]";
	});

	return result;
}

async function validateSpec(
	cwd: string,
	spec: string,
	phase: SpecValidateParams["phase"] = "structure",
): Promise<string> {
	const { slug, dir } = resolveSpecDir(cwd, spec);
	const checks: Array<{ ok: boolean; label: string; detail?: string }> = [];

	let dirExists = false;
	try {
		dirExists = (await stat(dir)).isDirectory();
	} catch {
		dirExists = false;
	}
	checks.push({ ok: dirExists, label: `${SPEC_ROOT}/${slug}/ exists` });

	const brainstorm = await readIfExists(join(dir, BRAINSTORM_FILE));
	checks.push({
		ok: brainstorm !== undefined,
		label: "brainstorm.md exists before spec creation",
		detail:
			"Run /spec-brainstorm first and record the clarified user intent before creating requirements.",
	});
	checks.push({
		ok: Boolean(brainstorm?.match(/^##\s+User Intent/m)),
		label: "brainstorm.md captures user intent",
	});

	const contents: Partial<Record<SpecFileName, string>> = {};
	for (const file of SPEC_FILES) {
		const content = await readIfExists(join(dir, file));
		contents[file] = content;
		checks.push({ ok: content !== undefined, label: `${file} exists` });
	}

	const requirements = contents["requirements.md"];
	checks.push({
		ok: Boolean(requirements?.match(/\bSHALL\b/)),
		label: "requirements.md uses testable SHALL statements",
		detail:
			"Prefer EARS-style acceptance criteria: WHEN/IF/WHILE/GIVEN..., THE system SHALL...",
	});
	checks.push({
		ok: Boolean(requirements?.match(/^##\s+User Stories/m)),
		label: "requirements.md contains user stories",
	});

	const design = contents["design.md"];
	checks.push({
		ok: Boolean(design?.match(/^##\s+Requirements Traceability/m)),
		label: "design.md traces requirements",
	});
	checks.push({
		ok: Boolean(design?.match(/^##\s+Testing Strategy/m)),
		label: "design.md defines testing strategy",
	});

	const tasks = contents["tasks.md"];
	const taskCounts = countTasks(tasks);
	checks.push({
		ok: taskCounts.total > 0,
		label: "tasks.md contains checkbox implementation tasks",
	});
	checks.push({
		ok: Boolean(tasks?.match(/Requirement\(s\):/)),
		label: "tasks.md maps tasks to requirements",
	});

	if (phase === "implementation") {
		const tasksStatus = extractStatus(tasks);
		checks.push({
			ok: tasks !== undefined && !isDraftStatus(tasksStatus),
			label: "tasks.md status is approved for implementation",
			detail:
				"After explicit user approval, update tasks.md to `Status: tasks-approved` (or `Status: implementation-in-progress`) before editing code.",
		});
		checks.push({
			ok: tasks !== undefined && !hasTodoPlaceholders(tasks),
			label: "tasks.md has no TODO placeholders before implementation",
			detail:
				"Replace template placeholders with concrete tasks, file/area hints, and validation steps before implementation.",
		});
	}

	const passed = checks.filter((check) => check.ok).length;
	const lines = [
		`Spec validation: ${slug}`,
		`Phase: ${phase ?? "structure"}`,
		`${passed}/${checks.length} checks passed`,
		"",
	];
	for (const check of checks) {
		lines.push(`${check.ok ? "✓" : "✗"} ${check.label}`);
		if (!check.ok && check.detail) lines.push(`  ${check.detail}`);
	}
	return lines.join("\n");
}

async function updateSpecStatus(ctx: ExtensionContext): Promise<void> {
	if (!ctx.hasUI) return;
	const specs = await summarizeSpecs(ctx.cwd);
	if (specs.length === 0) {
		ctx.ui.setStatus("pi-spec", undefined);
	} else {
		const openTasks = specs.reduce(
			(sum, spec) => sum + Math.max(0, spec.tasks.total - spec.tasks.done),
			0,
		);
		ctx.ui.setStatus(
			"pi-spec",
			ctx.ui.theme.fg(
				"accent",
				`specs:${specs.length}${openTasks ? `/${openTasks}` : ""}`,
			),
		);
	}
}

function shouldInjectSpecContext(prompt: string): boolean {
	return /(^|\s|\/)(spec|requirements?|design|tasks?|ears|acceptance criteria|\.specs)\b/i.test(
		prompt,
	);
}

async function installBundledAgents(
	cwd: string,
	force: boolean,
): Promise<{ installed: string[]; skipped: string[] }> {
	const sourceDir = join(packageRoot, "agents");
	const targetDir = join(cwd, ".pi", "agents");
	await mkdir(targetDir, { recursive: true });
	const entries = await readdir(sourceDir, { withFileTypes: true });
	const installed: string[] = [];
	const skipped: string[] = [];

	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
		if (entry.name.toLowerCase() === "readme.md") continue;
		const source = join(sourceDir, entry.name);
		const target = join(targetDir, entry.name);
		await withFileMutationQueue(target, async () => {
			if (existsSync(target) && !force) {
				skipped.push(relative(cwd, target));
				return;
			}
			await writeFile(target, await readFile(source, "utf8"), "utf8");
			installed.push(relative(cwd, target));
		});
	}
	return { installed, skipped };
}

export default function piSpecExtension(pi: ExtensionAPI): void {
	pi.on("resources_discover", () => ({
		skillPaths: [join(packageRoot, "skills")],
		promptPaths: [join(packageRoot, "prompts")],
	}));

	pi.on("session_start", async (_event, ctx) => {
		await updateSpecStatus(ctx);
	});

	pi.on("before_agent_start", async (event, ctx) => {
		if (!shouldInjectSpecContext(event.prompt)) return;
		const loaded = await loadSpecConfig(ctx.cwd);
		const sections = [
			`[PI SPEC CONTEXT]\nUse project-layer specs in ${SPEC_ROOT}/<feature>/ with brainstorm.md, requirements.md, design.md, and tasks.md. Brainstorm is a required gate before spec creation: identify user intent, ask one question at a time, propose an approach, and only then create requirements/design/tasks. Keep implementation traceable to checked tasks and requirement IDs. Before implementing, verify tasks.md is explicitly approved by the user and no longer tasks-draft (run spec_validate with phase: "implementation"). Use the bundled spec skills when the request is about creating, refining, or implementing a spec.`,
		];
		const warningsText = formatConfigWarnings(loaded.warnings);
		if (warningsText) sections.push(warningsText);
		const contextText = formatConfigContext(loaded.config);
		if (contextText) sections.push(contextText);
		return {
			message: {
				customType: "pi-spec-context",
				display: false,
				content: sections.join("\n\n"),
			},
		};
	});

	pi.registerTool({
		name: "spec_brainstorm",
		label: "Spec Brainstorm",
		description: `Record the completed brainstorm gate under ${SPEC_ROOT}/<slug>/${BRAINSTORM_FILE}. Use only after asking focused questions one at a time and summarizing user intent, assumptions, proposal, and open doubts.`,
		promptSnippet: `Record a completed brainstorm gate before creating a ${SPEC_ROOT}/<feature>/ spec.`,
		promptGuidelines: [
			"Before calling spec_brainstorm, ask clarifying questions one at a time until user intent and success criteria are clear enough.",
			`Use spec_brainstorm to persist the brainstorm outcome before spec_init creates requirements.md, design.md, and tasks.md.`,
		],
		parameters: SpecBrainstormParamsSchema,
		async execute(
			_toolCallId,
			params: SpecBrainstormParams,
			_signal,
			_onUpdate,
			ctx,
		) {
			const loaded = await loadSpecConfig(ctx.cwd);
			const result = await recordBrainstorm(ctx.cwd, params);
			await updateSpecStatus(ctx);
			const lines = [
				`Recorded brainstorm: ${result.slug}`,
				`Directory: ${result.dir}/`,
			];
			if (result.file) lines.push(`Generated:\n- ${result.file}`);
			if (result.skipped) {
				lines.push(`Skipped existing file:\n- ${result.skipped}`);
				lines.push("Use force: true to overwrite it.");
			}
			lines.push(
				"Next: create the spec skeleton with spec_init, then draft requirements.md.",
			);
			const warningsText = formatConfigWarnings(loaded.warnings);
			if (warningsText) lines.push(warningsText);
			return {
				content: [{ type: "text", text: lines.join("\n\n") }],
				details: { ...result, config: loaded.config },
			};
		},
	});

	pi.registerTool({
		name: "spec_init",
		label: "Spec Init",
		description: `Create a project-layer spec skeleton under ${SPEC_ROOT}/<slug>/ using bundled requirements.md, design.md, and tasks.md templates. Requires a completed brainstorm.md or brainstormSummary.`,
		promptSnippet: `Create ${SPEC_ROOT}/<feature>/ spec skeletons from bundled templates after the brainstorm gate.`,
		promptGuidelines: [
			`Do not use spec_init until brainstorm is complete and recorded in ${SPEC_ROOT}/<feature>/${BRAINSTORM_FILE}, or pass brainstormSummary from the completed brainstorm.`,
			"After spec_init, update requirements.md before design.md, then tasks.md; keep requirement IDs traceable through all files.",
		],
		parameters: SpecInitParamsSchema,
		async execute(
			_toolCallId,
			params: SpecInitParams,
			_signal,
			_onUpdate,
			ctx,
		) {
			const loaded = await loadSpecConfig(ctx.cwd);
			const slug = normalizeSlug(params.name);
			if (!hasBrainstorm(ctx.cwd, slug)) {
				if (!params.brainstormSummary?.trim()) {
					return {
						content: [
							{
								type: "text",
								text: [
									`Brainstorm required before creating spec: ${slug}`,
									"Ask one clarifying question at a time, summarize user intent and the proposed approach, then record it with spec_brainstorm or call spec_init with brainstormSummary.",
									`Suggested next prompt: /spec-brainstorm ${params.name}`,
								].join("\n\n"),
							},
						],
						details: { slug, requiresBrainstorm: true },
					};
				}
				await recordBrainstorm(ctx.cwd, {
					name: params.name,
					title: params.title,
					summary: params.brainstormSummary,
				});
			}

			const result = await initializeSpec(ctx.cwd, params);
			await updateSpecStatus(ctx);
			const lines = [
				`Initialized spec: ${result.slug}`,
				`Directory: ${result.dir}/`,
			];
			if (result.files.length > 0)
				lines.push(
					`Generated:\n${result.files.map((file) => `- ${file}`).join("\n")}`,
				);
			if (result.skipped.length > 0)
				lines.push(
					`Skipped existing files:\n${result.skipped.map((file) => `- ${file}`).join("\n")}`,
				);
			lines.push(
				"Next: draft requirements.md, get approval, then create design.md and tasks.md.",
			);
			const warningsText = formatConfigWarnings(loaded.warnings);
			if (warningsText) lines.push(warningsText);
			return {
				content: [{ type: "text", text: lines.join("\n\n") }],
				details: { ...result, config: loaded.config },
			};
		},
	});

	pi.registerTool({
		name: "spec_status",
		label: "Spec Status",
		description: `List specs under ${SPEC_ROOT}/, show generated-file presence, and summarize task progress. Can include truncated file contents.`,
		promptSnippet: `List ${SPEC_ROOT}/ specs and task progress.`,
		promptGuidelines: [
			`Use spec_status before modifying or implementing spec work to understand existing ${SPEC_ROOT}/ state.`,
		],
		parameters: SpecStatusParamsSchema,
		async execute(
			_toolCallId,
			params: SpecStatusParams,
			_signal,
			_onUpdate,
			ctx,
		) {
			const loaded = await loadSpecConfig(ctx.cwd);
			const specs = await summarizeSpecs(ctx.cwd, params.spec);
			const summary = formatSpecSummary(specs);
			const body = params.includeContent
				? `${summary}\n${await includeSpecContents(ctx.cwd, specs)}`
				: summary;
			const warningsText = formatConfigWarnings(loaded.warnings);
			const content = warningsText ? `${warningsText}\n\n${body}` : body;
			return {
				content: [{ type: "text", text: truncateForTool(content) }],
				details: { specs, config: loaded.config },
			};
		},
	});

	pi.registerTool({
		name: "spec_validate",
		label: "Spec Validate",
		description: `Validate that a ${SPEC_ROOT}/<slug>/ spec has requirements, design, tasks, traceability, task checkboxes, and optional implementation readiness.`,
		promptSnippet: `Validate a ${SPEC_ROOT}/<feature>/ spec for SDD completeness; pass phase: "implementation" before coding.`,
		promptGuidelines: [
			"Use spec_validate after updating requirements/design/tasks.",
			"Use spec_validate with phase: 'implementation' before implementing a spec to verify tasks.md has been explicitly approved and is no longer draft.",
		],
		parameters: SpecValidateParamsSchema,
		async execute(
			_toolCallId,
			params: SpecValidateParams,
			_signal,
			_onUpdate,
			ctx,
		) {
			const loaded = await loadSpecConfig(ctx.cwd);
			const phase = params.phase ?? "structure";
			const text = await validateSpec(ctx.cwd, params.spec, phase);
			const warningsText = formatConfigWarnings(loaded.warnings);
			const content = warningsText ? `${warningsText}\n\n${text}` : text;
			return {
				content: [{ type: "text", text: content }],
				details: {
					spec: normalizeSlug(params.spec),
					phase,
					config: loaded.config,
				},
			};
		},
	});

	pi.registerTool({
		name: "spec_task_check",
		label: "Spec Task Check",
		description: `Mark a task in ${SPEC_ROOT}/<slug>/tasks.md as complete (or revert with uncheck) by its \`ID: T-NNN\`. Refuses while Status is tasks-draft, advances Status from tasks-approved → implementation-in-progress on first check and → implementation-complete when all tasks are done.`,
		promptSnippet: `After completing each implementation task, call spec_task_check to mark it [x] by its ID.`,
		promptGuidelines: [
			"Call spec_task_check immediately after a task's validation passes; do not batch checks.",
			"Reference the task by the `ID: T-NNN` line under it, not by ordinal number.",
			"If the tool refuses (tasks-draft, missing/ambiguous ID), surface the refusal to the user instead of editing tasks.md by hand.",
		],
		parameters: SpecTaskCheckParamsSchema,
		async execute(
			_toolCallId,
			params: SpecTaskCheckParams,
			_signal,
			_onUpdate,
			ctx,
		) {
			const loaded = await loadSpecConfig(ctx.cwd);
			const result = await applyTaskCheck(ctx.cwd, params);
			await updateSpecStatus(ctx);
			if (result.refusal) {
				const warningsText = formatConfigWarnings(loaded.warnings);
				const text = warningsText
					? `${warningsText}\n\n${result.refusal}`
					: result.refusal;
				return {
					content: [{ type: "text", text }],
					details: result,
				};
			}
			const lines = [
				`${result.changed ? "Updated" : "No change"}: ${result.slug} ${result.id}`,
				`Checkbox: ${result.previous} → ${result.current}`,
			];
			if (result.status.previous !== result.status.current) {
				lines.push(
					`Status: ${result.status.previous} → ${result.status.current}`,
				);
			} else {
				lines.push(`Status: ${result.status.current}`);
			}
			let hookResults: Awaited<ReturnType<typeof runAfterTaskHooks>> = [];
			let hookExtractWarnings: ReturnType<
				typeof extractAfterTaskHooks
			>["warnings"] = [];
			if (result.changed && !params.uncheck) {
				const extracted = extractAfterTaskHooks(loaded.config, loaded.path);
				hookExtractWarnings = extracted.warnings;
				hookResults = await runAfterTaskHooks(extracted.hooks, ctx.cwd);
			}
			const warningsText = formatConfigWarnings([
				...loaded.warnings,
				...hookExtractWarnings,
			]);
			if (warningsText) lines.push(warningsText);
			const hooksText = formatHookResults(hookResults);
			if (hooksText) lines.push(hooksText);
			return {
				content: [{ type: "text", text: lines.join("\n") }],
				details: { ...result, hooks: hookResults, config: loaded.config },
			};
		},
	});

	pi.registerCommand("specs", {
		description: `Show ${SPEC_ROOT}/ spec status`,
		handler: async (_args, ctx) => {
			const loaded = await loadSpecConfig(ctx.cwd);
			const specs = await summarizeSpecs(ctx.cwd);
			const summary = formatSpecSummary(specs);
			const warningsText = formatConfigWarnings(loaded.warnings);
			const content = warningsText ? `${warningsText}\n\n${summary}` : summary;
			pi.sendMessage(
				{ customType: "pi-spec-status", content, display: true },
				{ triggerTurn: false },
			);
			await updateSpecStatus(ctx);
		},
	});

	pi.registerCommand("spec-init", {
		description: `Create ${SPEC_ROOT}/<feature>/ requirements/design/tasks templates after brainstorm`,
		handler: async (args, ctx) => {
			await loadSpecConfig(ctx.cwd);
			const rawName =
				args.trim() ||
				(ctx.hasUI
					? await ctx.ui.input("New spec name", "OAuth login")
					: undefined);
			if (!rawName?.trim()) {
				ctx.ui.notify("spec-init cancelled: missing spec name", "warning");
				return;
			}

			const slug = normalizeSlug(rawName);
			if (!hasBrainstorm(ctx.cwd, slug)) {
				const message = [
					`Brainstorm required before creating spec: ${slug}`,
					"Start with `/spec-brainstorm <idea>` so Pi can identify intent, ask one question at a time, propose an approach, and record the outcome.",
				].join("\n\n");
				pi.sendMessage(
					{ customType: "pi-spec-init", content: message, display: true },
					{ triggerTurn: false },
				);
				if (ctx.hasUI) ctx.ui.setEditorText(`/spec-brainstorm ${rawName}`);
				await updateSpecStatus(ctx);
				return;
			}

			const result = await initializeSpec(ctx.cwd, { name: rawName });
			const summary = [
				`Initialized ${result.slug} at ${result.dir}/`,
				...result.files.map((file) => `- ${file}`),
			].join("\n");
			pi.sendMessage(
				{ customType: "pi-spec-init", content: summary, display: true },
				{ triggerTurn: false },
			);
			if (ctx.hasUI) ctx.ui.setEditorText(`/spec-requirements ${result.slug}`);
			await updateSpecStatus(ctx);
		},
	});

	pi.registerCommand("spec-install-agents", {
		description:
			"Install optional bundled spec subagents into project .pi/agents/ for pi-subagents users",
		handler: async (args, ctx) => {
			const force = /(^|\s)--force(\s|$)/.test(args);
			const result = await installBundledAgents(ctx.cwd, force);
			const lines = ["Spec agents installation complete."];
			if (result.installed.length > 0)
				lines.push(
					`Installed:\n${result.installed.map((file) => `- ${file}`).join("\n")}`,
				);
			if (result.skipped.length > 0)
				lines.push(
					`Skipped existing files (use --force):\n${result.skipped.map((file) => `- ${file}`).join("\n")}`,
				);
			pi.sendMessage(
				{
					customType: "pi-spec-agents",
					content: lines.join("\n\n"),
					display: true,
				},
				{ triggerTurn: false },
			);
		},
	});
}
