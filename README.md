# pi-spec

Spec-driven development resources for [Pi](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent#extensions).

This package installs a Pi extension that exposes spec tools, slash commands, prompt templates, skills, generated-file templates, and optional subagent definitions.

## Spec Directory

Project-layer specs live under:

```text
.specs/<feature-slug>/
├── brainstorm.md
├── requirements.md
├── design.md
└── tasks.md
```

The extension always treats `.specs/**` as the project spec layer. Brainstorming is a required gate before creating requirements/design/tasks: Pi identifies intent, asks one clarifying question at a time, proposes an approach, and records the outcome in `brainstorm.md`.

## Install / Run

From this repository:

```bash
pi -e .
```

Or install it into a project:

```bash
pi install -l /absolute/path/to/pi-spec
```

After changing package files in a running Pi session, run `/reload`.

## Extension Tools

The extension registers these LLM-callable tools:

- `spec_brainstorm` — record a completed brainstorm in `.specs/<slug>/brainstorm.md`.
- `spec_init` — create `.specs/<slug>/requirements.md`, `design.md`, and `tasks.md` from bundled templates after brainstorming.
- `spec_status` — list specs, generated files, and task progress.
- `spec_validate` — check a spec for core SDD completeness and traceability; pass `phase: "implementation"` before coding to ensure `tasks.md` is no longer draft.

## Slash Commands

Extension commands:

- `/specs` — show `.specs/**` status in the transcript.
- `/spec-init <feature>` — create a new skeleton after `brainstorm.md` exists; otherwise prefill `/spec-brainstorm <feature>`.
- `/spec-install-agents [--force]` — copy optional bundled subagent definitions into `.pi/agents/` for `pi-subagents` users.

Prompt templates:

- `/spec-onboarding [project or feature context]`
- `/spec-brainstorm <idea or goal>`
- `/spec-new <feature or goal>`
- `/spec-requirements <spec-slug> [instructions]`
- `/spec-design <spec-slug> [instructions]`
- `/spec-tasks <spec-slug> [instructions]`
- `/spec-implement <spec-slug> [task number or instructions]`
- `/spec-review <spec-slug> [focus]`
- `/spec-status [spec-slug]`

## Skills

Bundled skills are loaded dynamically by the extension:

- `spec-driven-development`
- `spec-brainstorm`
- `spec-requirements`
- `spec-design`
- `spec-tasks`
- `spec-implementation`
- `spec-review`
- `spec-templates`
- `spec-agents`

## Generated File Templates

Templates live in `templates/spec/`:

- `brainstorm.md`
- `requirements.md`
- `design.md`
- `tasks.md`

They use these placeholders: `{{SLUG}}`, `{{TITLE}}`, `{{DESCRIPTION}}`, `{{SUMMARY}}`, and `{{DATE}}`.

## Optional Subagents

The `agents/` directory contains project-agent definitions for users of `pi-subagents`:

- `spec-brainstorm-agent`
- `spec-requirements-agent`
- `spec-design-agent`
- `spec-task-planner-agent`
- `spec-review-agent`

Install them into `.pi/agents/` with `/spec-install-agents`.

## Development

```bash
pnpm install
pnpm typecheck
pnpm pack --dry-run
```
