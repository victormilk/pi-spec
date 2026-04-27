import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const extensionDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(extensionDir, "..", "..");

export const CONFIG_FILE = "config.yaml" as const;
const SPEC_ROOT = ".specs";

export interface SpecConfigWarning {
	file: string;
	message: string;
}

export interface SpecConfigLoadResult {
	config: Record<string, unknown>;
	warnings: SpecConfigWarning[];
	scaffolded: boolean;
	path: string;
}

function configPath(projectRoot: string): string {
	return join(projectRoot, SPEC_ROOT, CONFIG_FILE);
}

export async function scaffoldSpecConfig(target: string): Promise<void> {
	await mkdir(dirname(target), { recursive: true });
	const templatePath = join(packageRoot, "templates", "spec", CONFIG_FILE);
	const template = await readFile(templatePath, "utf8");
	await writeFile(target, template, "utf8");
}

/**
 * Load .specs/config.yaml. Always re-reads from disk; never caches across calls.
 * Non-blocking: returns warnings instead of throwing for missing/malformed files.
 */
export async function loadSpecConfig(
	projectRoot: string,
): Promise<SpecConfigLoadResult> {
	const path = configPath(projectRoot);
	const warnings: SpecConfigWarning[] = [];

	if (!existsSync(path)) {
		try {
			await scaffoldSpecConfig(path);
			warnings.push({
				file: path,
				message: `Created starter ${SPEC_ROOT}/${CONFIG_FILE}. Edit it to capture project goal, tech stack, principles, and post-task hooks.`,
			});
		} catch (error) {
			warnings.push({
				file: path,
				message: `Failed to scaffold ${SPEC_ROOT}/${CONFIG_FILE}: ${(error as Error).message}`,
			});
		}
		return { config: {}, warnings, scaffolded: true, path };
	}

	let raw: string;
	try {
		raw = await readFile(path, "utf8");
	} catch (error) {
		warnings.push({
			file: path,
			message: `Could not read ${SPEC_ROOT}/${CONFIG_FILE}: ${(error as Error).message}`,
		});
		return { config: {}, warnings, scaffolded: false, path };
	}

	if (raw.trim() === "") {
		return { config: {}, warnings, scaffolded: false, path };
	}

	let parsed: unknown;
	try {
		parsed = parseYaml(raw);
	} catch (error) {
		warnings.push({
			file: path,
			message: `Failed to parse ${SPEC_ROOT}/${CONFIG_FILE} as YAML: ${(error as Error).message}`,
		});
		return { config: {}, warnings, scaffolded: false, path };
	}

	if (parsed === null || parsed === undefined) {
		return { config: {}, warnings, scaffolded: false, path };
	}

	if (typeof parsed !== "object" || Array.isArray(parsed)) {
		warnings.push({
			file: path,
			message: `Top-level ${SPEC_ROOT}/${CONFIG_FILE} must be a YAML mapping; got ${Array.isArray(parsed) ? "list" : typeof parsed}. Ignoring.`,
		});
		return { config: {}, warnings, scaffolded: false, path };
	}

	return {
		config: parsed as Record<string, unknown>,
		warnings,
		scaffolded: false,
		path,
	};
}

export function formatConfigWarnings(
	warnings: SpecConfigWarning[],
): string | undefined {
	if (warnings.length === 0) return undefined;
	return warnings
		.map((w) => `[pi-spec] config warning: ${w.file}: ${w.message}`)
		.join("\n");
}

export interface HookEntry {
	command: string;
	auto: boolean;
}

export interface HookExtractionResult {
	hooks: HookEntry[];
	warnings: SpecConfigWarning[];
}

/**
 * Pull `hooks.after_task` entries out of a loaded config.
 * Skips malformed sections with a warning instead of throwing.
 */
export function extractAfterTaskHooks(
	config: Record<string, unknown>,
	configFilePath: string,
): HookExtractionResult {
	const warnings: SpecConfigWarning[] = [];
	const hooks: HookEntry[] = [];

	const hooksSection = config.hooks;
	if (hooksSection === undefined || hooksSection === null) {
		return { hooks, warnings };
	}

	if (typeof hooksSection !== "object" || Array.isArray(hooksSection)) {
		warnings.push({
			file: configFilePath,
			message: `'hooks' must be a mapping; got ${Array.isArray(hooksSection) ? "list" : typeof hooksSection}. Skipping hooks.`,
		});
		return { hooks, warnings };
	}

	const afterTask = (hooksSection as Record<string, unknown>).after_task;
	if (afterTask === undefined || afterTask === null) {
		return { hooks, warnings };
	}

	if (!Array.isArray(afterTask)) {
		warnings.push({
			file: configFilePath,
			message: `'hooks.after_task' must be a list; got ${typeof afterTask}. Skipping after_task hooks.`,
		});
		return { hooks, warnings };
	}

	for (let i = 0; i < afterTask.length; i++) {
		const entry = afterTask[i];
		if (entry === null || entry === undefined) continue;
		if (typeof entry !== "object" || Array.isArray(entry)) {
			warnings.push({
				file: configFilePath,
				message: `'hooks.after_task[${i}]' must be a mapping with at least a 'command' field. Skipping entry.`,
			});
			continue;
		}
		const obj = entry as Record<string, unknown>;
		const command = obj.command;
		if (typeof command !== "string" || command.trim() === "") {
			warnings.push({
				file: configFilePath,
				message: `'hooks.after_task[${i}].command' missing or not a non-empty string. Skipping entry.`,
			});
			continue;
		}
		const auto = obj.auto === true;
		hooks.push({ command, auto });
	}

	return { hooks, warnings };
}

export interface HookRunResult {
	command: string;
	auto: boolean;
	executed: boolean;
	exitCode?: number;
	signal?: string | null;
	stdout?: string;
	stderr?: string;
	error?: string;
	reminder?: string;
}

/**
 * Execute auto:true hooks at the project root, capture their output and exit
 * status, and convert auto:false hooks to reminder messages. Never throws.
 */
export async function runAfterTaskHooks(
	hooks: HookEntry[],
	projectRoot: string,
): Promise<HookRunResult[]> {
	const results: HookRunResult[] = [];
	for (const hook of hooks) {
		if (!hook.auto) {
			results.push({
				command: hook.command,
				auto: false,
				executed: false,
				reminder: `Reminder (hooks.after_task): \`${hook.command}\` (auto: false). Run it manually if appropriate.`,
			});
			continue;
		}
		const result = await runShellCommand(hook.command, projectRoot);
		results.push({
			command: hook.command,
			auto: true,
			executed: true,
			...result,
		});
	}
	return results;
}

interface ShellRunOutcome {
	exitCode?: number;
	signal?: string | null;
	stdout?: string;
	stderr?: string;
	error?: string;
}

function runShellCommand(
	command: string,
	cwd: string,
): Promise<ShellRunOutcome> {
	return new Promise((resolveOutcome) => {
		let stdout = "";
		let stderr = "";
		let settled = false;
		const child = spawn(command, {
			cwd,
			shell: true,
			env: process.env,
		});
		child.stdout?.on("data", (chunk: Buffer) => {
			stdout += chunk.toString("utf8");
		});
		child.stderr?.on("data", (chunk: Buffer) => {
			stderr += chunk.toString("utf8");
		});
		child.on("error", (error) => {
			if (settled) return;
			settled = true;
			resolveOutcome({
				stdout,
				stderr,
				error: (error as Error).message,
			});
		});
		child.on("close", (code, signal) => {
			if (settled) return;
			settled = true;
			resolveOutcome({
				exitCode: code ?? undefined,
				signal: signal ?? null,
				stdout,
				stderr,
			});
		});
	});
}

export function formatHookResults(
	results: HookRunResult[],
): string | undefined {
	if (results.length === 0) return undefined;
	const lines: string[] = ["Post-task hooks:"];
	for (const result of results) {
		if (!result.executed) {
			lines.push(`- ${result.reminder}`);
			continue;
		}
		const status =
			result.error !== undefined
				? `error: ${result.error}`
				: result.exitCode === 0
					? "ok"
					: `failed (exit ${result.exitCode}${result.signal ? `, signal ${result.signal}` : ""})`;
		lines.push(`- \`${result.command}\` → ${status}`);
		const tail = (result.stdout ?? "")
			.trim()
			.split(/\r?\n/)
			.slice(-5)
			.join("\n");
		if (tail) lines.push(`  stdout (last 5 lines):\n${indent(tail, "    ")}`);
		const errTail = (result.stderr ?? "")
			.trim()
			.split(/\r?\n/)
			.slice(-5)
			.join("\n");
		if (errTail)
			lines.push(`  stderr (last 5 lines):\n${indent(errTail, "    ")}`);
	}
	return lines.join("\n");
}

function indent(text: string, prefix: string): string {
	return text
		.split(/\r?\n/)
		.map((line) => prefix + line)
		.join("\n");
}

/**
 * Render free-form config as a context block injected into agent prompts.
 * Empty config returns undefined (no block).
 */
export function formatConfigContext(
	config: Record<string, unknown>,
): string | undefined {
	if (Object.keys(config).length === 0) return undefined;
	let body: string;
	try {
		body = JSON.stringify(config, null, 2);
	} catch {
		return undefined;
	}
	return [
		"[PI SPEC PROJECT CONFIG]",
		`Loaded from ${SPEC_ROOT}/${CONFIG_FILE}. Treat keys as project context and operating rules. Honor principles (e.g. tdd, no_comments) and use project.goal / project.tech_stack to ground spec output. Hook execution semantics: hooks.after_task entries with auto:true run automatically after spec_task_check; auto:false entries are reminders only.`,
		"```json",
		body,
		"```",
	].join("\n");
}
