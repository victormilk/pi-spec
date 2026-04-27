# Specs Config (.specs/config.yaml) Requirements

Spec: `specs-config`
Status: requirements-approved
Created: 2026-04-27
Brainstorm: `./brainstorm.md`

## Overview

Introduce a single, project-wide `.specs/config.yaml` containing free-form, agent-interpreted context (project goal, tech stack, code principles, post-task hooks). Spec workflow agents SHALL **always** load this file at the start of every spec workflow action (brainstorm, spec init, implementation, task check, status, validate, and any other spec workflow gate) and use it to adapt their behavior. A missing file SHALL be auto-scaffolded with a starter template plus a warning, without blocking work. A malformed file SHALL surface a warning, and work SHALL continue without applied config. Hook entries with an `auto: true` flag SHALL be executed by the agent at the relevant gate; `auto: false` entries SHALL be surfaced as reminders only.

## Scope

### In Scope

- Canonical file location: `.specs/config.yaml` (single, project-wide).
- Free-form YAML schema; agent interprets keys without strict validation.
- Always loading the config at the start of every spec workflow action (brainstorm, spec init, implementation, task check, status, validate, and any other spec workflow gate).
- Auto-scaffolding a starter `.specs/config.yaml` when it is missing.
- Warning behavior when the file is missing or malformed (non-blocking).
- Hook execution semantics governed by an `auto` flag on each hook entry.
- Surfacing/applying interpreted context (project goal, tech stack, principles) to agent output during spec workflow steps.

### Out of Scope

- Per-spec config overrides (no `.specs/<slug>/config.yaml`).
- Strict schema validation or required keys.
- Replacing or rewriting existing spec skill prompts.
- Runtime behavior of the user's project beyond spec-workflow agents.
- Migrating or auto-translating any existing project config files into `.specs/config.yaml`.

## User Stories

- As a project lead, I want a single `.specs/config.yaml` capturing project goal, tech stack, and code principles, so that spec agents produce consistent specs and implementations aligned to my project's rules.
- As a developer running the spec workflow for the first time, I want the agent to scaffold a starter config when none exists, so that I can fill in project context without hunting for a template.
- As a developer, I want hook commands (e.g., `npm test`) to optionally run automatically after each completed task, so that I can enforce post-task validation without manual invocation.
- As a developer, I want a malformed `config.yaml` to warn rather than block, so that a typo does not halt my spec or implementation work.
- As a developer, I want non-auto hooks surfaced as reminders, so that I am aware of expected post-task actions without surprise side effects.

## Functional Requirements

Use stable IDs and testable EARS-style statements.

- **FR-001**: WHEN any spec workflow action begins (including but not limited to brainstorm, spec init, implementation start, task check, status, and validation), THE system SHALL always attempt to read `.specs/config.yaml` from the project root before performing the action.
- **FR-001a**: THE system SHALL NOT skip, cache across sessions, or conditionally bypass the `.specs/config.yaml` load step; the file SHALL be re-read at the start of every spec workflow action so that edits take effect immediately.
- **FR-002**: IF `.specs/config.yaml` does not exist when a spec workflow action begins, THE system SHALL create a starter `.specs/config.yaml` containing illustrative example keys (project goal, tech stack, principles, hooks) as commented YAML, emit a non-blocking warning identifying the new file path, and continue executing the action.
- **FR-003**: IF `.specs/config.yaml` exists and parses as valid YAML, THE system SHALL treat its top-level keys as free-form, agent-interpreted context (no rigid schema enforcement) and use them to inform subsequent spec/implementation output.
- **FR-004**: IF `.specs/config.yaml` exists but fails to parse as valid YAML, THE system SHALL emit a non-blocking warning that names the file and the parse error, SHALL NOT apply any config from it, and SHALL continue executing the action.
- **FR-005**: WHEN the loaded config contains `hooks.after_task` entries, THE system SHALL associate those entries with the post-task-check moment (after `spec_task_check` succeeds).
- **FR-006**: WHEN a hook entry has `auto: true`, THE system SHALL execute its `command` after the associated action completes and SHALL report the command's exit status and output summary to the user.
- **FR-007**: WHEN a hook entry has `auto: false` (or omits `auto`), THE system SHALL surface the hook's `command` to the user as a reminder and SHALL NOT execute it automatically.
- **FR-008**: WHEN the loaded config contains project context keys (e.g., `project.goal`, `project.tech_stack`), THE system SHALL incorporate that context into the brainstorm, requirements, design, and task outputs it generates.
- **FR-009**: WHEN the loaded config contains code principle keys (e.g., `principles.tdd`, `principles.no_comments`), THE system SHALL adapt its implementation behavior to honor those principles (e.g., write tests first when `tdd: true`, omit comments when `no_comments: true`).
- **FR-010**: IF a hook command executed under `auto: true` exits with a non-zero status, THE system SHALL report the failure to the user and SHALL NOT silently swallow the error.

## Non-Functional Requirements

- **NFR-001**: THE config-loading step SHALL be non-blocking on missing/malformed files (warn and proceed) so the spec workflow remains usable without a config.
- **NFR-002**: THE starter scaffold SHALL be human-readable YAML with inline comments explaining each example key.
- **NFR-003**: THE config file location SHALL be exactly `.specs/config.yaml` (no alternate paths, no per-spec overrides) to keep behavior predictable.
- **NFR-004**: Warnings emitted for missing or malformed config SHALL be visible in the agent's normal output channel (not hidden), and SHALL identify the file path.
- **NFR-005**: Auto-executed hooks SHALL run with the project root as the working directory, matching the user's expected shell context.

## Acceptance Criteria

- [ ] FR-001 / FR-001a: Triggering any spec workflow action (brainstorm, init, implementation, task check, status, validate) with `.specs/config.yaml` present results in the file being read at the start of every such action — verified by editing the file between two actions and observing the new values applied on the second action.
- [ ] FR-002: Triggering any spec workflow action with no `.specs/config.yaml` produces a starter file at that path containing example keys and a visible warning; the action still completes.
- [ ] FR-003: A valid `.specs/config.yaml` with arbitrary top-level keys is loaded without schema errors and its values appear in subsequent agent reasoning/output.
- [ ] FR-004: A `.specs/config.yaml` containing invalid YAML produces a warning naming the file and parse error; the action still completes; no config values are applied.
- [ ] FR-005 / FR-006: A config with `hooks.after_task: [{ command: "echo ok", auto: true }]` causes `echo ok` to run after `spec_task_check`, and the result is reported.
- [ ] FR-007: A config with `hooks.after_task: [{ command: "npm test", auto: false }]` causes the agent to remind the user to run `npm test` after task check, without executing it.
- [ ] FR-008: With `project.goal` and `project.tech_stack` set, generated requirements/design/tasks reference that context.
- [ ] FR-009: With `principles.tdd: true`, generated tasks include test-first steps; with `principles.no_comments: true`, generated implementation guidance omits code comments.
- [ ] FR-010: An `auto: true` hook whose command exits non-zero is reported as failed to the user.

## Edge Cases

- `.specs/` directory does not yet exist when scaffolding: directory must be created alongside the config file.
- The very first spec workflow action in a fresh project: the agent SHALL still load (and therefore scaffold) `.specs/config.yaml` before doing anything else.
- `.specs/config.yaml` exists but is empty (zero bytes): treated as valid and empty (no values applied), no warning required.
- YAML parses but contains unexpected types (e.g., `hooks.after_task` is a string instead of a list): agent ignores the malformed section, warns, and continues with the rest of the config.
- Multiple hook entries under the same trigger: all entries are processed in order; auto entries are executed sequentially.
- Hook command references a binary not found on `PATH`: reported as a hook failure (FR-010) without halting the workflow.
- Config file is present but unreadable due to permissions: treated like malformed (warn + proceed).
- Concurrent task checks: hooks for each completed task fire independently and are reported per task.
- Project goal / principles change mid-workflow (file edited between actions): because the file is always re-read at the start of every action (FR-001a), updates take effect immediately on the next action without any restart or cache invalidation.

## Dependencies and Constraints

- Depends on a YAML parser available to the spec workflow agents.
- Depends on the agents' ability to execute shell commands (for `auto: true` hooks) and capture exit status/output.
- Constrained to project-layer specs only (`.specs/**`), per existing spec workflow conventions.
- Must not change existing `spec_brainstorm` / `spec_init` / `spec_task_check` external interfaces; behavior changes are additive (load + interpret + scaffold + warn + hook execution).

## Open Questions

- [ ] Should the starter scaffold include a comment block with a link to documentation explaining the (informal) conventions, or be minimal?
- [ ] Should `auto: true` hook execution prompt for confirmation on the very first run per project (one-time opt-in) or run silently from the start?
- [ ] Should the warning for missing/malformed config be repeated on every gate, or rate-limited to once per session?
- [ ] Are there any reserved top-level keys we want to formally document (even if not validated), to encourage convergence across projects?
