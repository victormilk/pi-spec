# Spec Task Check Requirements

Spec: `spec-task-check`  
Status: requirements-approved  
Created: 2026-04-27  
Brainstorm: `./brainstorm.md`

## Overview

Pi agents and humans currently mark tasks complete in `.specs/<slug>/tasks.md` by hand-editing the checkbox, which is error-prone and decoupled from the spec workflow status. This spec adds:

1. A stable, human-visible task identifier (`ID: T-NNN`) on every task in the bundled `tasks.md` template.
2. A new `spec_task_check` extension tool that flips a task's checkbox by ID and advances `Status:` through the existing workflow states.

Together this makes "mark the task done after each completed task" a one-call operation that also keeps spec status truthful.

## Scope

### In Scope

- New extension tool `spec_task_check({ spec, id, uncheck? })` that mutates `.specs/<slug>/tasks.md`.
- Update `templates/spec/tasks.md` so newly initialized specs have `ID: T-001`, `T-002`, `T-003` lines under each task block.
- Workflow-aware status transitions on `tasks.md`:
  - `tasks-approved` → `implementation-in-progress` on first task checked.
  - `implementation-in-progress` → `implementation-complete` when all tasks are checked.
  - Reverse transition on `uncheck: true` only when the file would otherwise be inconsistent (complete → in-progress).
- Refusal to operate while `Status:` is `tasks-draft`.
- Prompt guidelines telling agents to call `spec_task_check` after each completed task.

### Out of Scope

- Auto-assigning IDs to tasks in legacy specs that were created before this change.
- Renumbering or reordering tasks.
- A slash command (CLI surface). Tool-only for now.
- Editing `requirements.md` / `design.md` checkboxes.

## User Stories

- As a Pi agent implementing a spec, I want to mark a task complete by ID, so that the spec's `tasks.md` and `Status:` stay accurate without free-form edits.
- As a spec author, I want each task to expose a stable `T-NNN` ID, so that I can reference and check it unambiguously across sessions.
- As a reviewer, I want `Status:` in `tasks.md` to reflect actual progress, so that I can tell at a glance whether a spec is in progress or complete.

## Functional Requirements

- **FR-001**: WHEN `spec_task_check` is called with a valid `spec` slug and a task `id` that exists in that spec's `tasks.md`, THE system SHALL flip the checkbox of the matching task line from `[ ]` to `[x]` (or to `[ ]` when `uncheck: true`) and persist the file.
- **FR-002**: IF the task is already in the requested state, THE system SHALL leave the file unchanged and return a clear "already checked"/"already unchecked" result (idempotent success).
- **FR-003**: IF the requested `id` is not found in `tasks.md`, THE system SHALL return an error naming the missing ID and SHALL NOT modify the file.
- **FR-004**: IF the spec's `tasks.md` `Status:` is `tasks-draft`, THE system SHALL refuse the call and instruct the user to approve `tasks.md` first.
- **FR-005**: WHEN a task is checked and the prior `Status:` is `tasks-approved`, THE system SHALL update `Status:` to `implementation-in-progress`.
- **FR-006**: WHEN the last open task becomes checked, THE system SHALL update `Status:` to `implementation-complete`.
- **FR-007**: WHEN a task is unchecked and `Status:` is `implementation-complete`, THE system SHALL update `Status:` to `implementation-in-progress`.
- **FR-008**: THE bundled `templates/spec/tasks.md` SHALL include an `ID: T-001`, `ID: T-002`, `ID: T-003` line on each example task so newly created specs ship with parseable IDs.

## Non-Functional Requirements

- **NFR-001**: THE tool SHALL be safe under concurrent invocation by serializing writes through the existing `withFileMutationQueue` helper that other `pi-spec` mutations already use.
- **NFR-002**: THE tool SHALL preserve existing formatting (indentation, blank lines, surrounding content) of `tasks.md` other than the targeted checkbox and, when applicable, the `Status:` line.

## Acceptance Criteria

- [ ] FR-001/002/003 verified by calling `spec_task_check` against a fixture spec: check, re-check (idempotent), and check a missing ID (error).
- [ ] FR-004 verified by calling the tool against a `tasks-draft` spec and asserting refusal.
- [ ] FR-005/006/007 verified by walking a fixture spec from `tasks-approved` through `implementation-complete` and back.
- [ ] FR-008 verified by running `spec_init` on a fresh slug and grepping the generated `tasks.md` for `ID: T-00`.
- [ ] `pnpm typecheck` passes.

## Edge Cases

- Multiple tasks declaring the same `ID:` — tool errors with "ambiguous id" and refuses to mutate.
- Task line spans multiple list items (sub-bullets) — tool only flips the parent `- [ ] N. ...` line, never the sub-bullets.
- `tasks.md` missing a `Status:` line — tool inserts/updates `Status:` after performing the checkbox change.
- File contains both `[X]` and `[x]` — tool normalizes to lowercase `[x]` only on lines it edits; other lines are left alone.
- `uncheck: true` on a task that is already unchecked — idempotent success.

## Dependencies and Constraints

- Must integrate with `extensions/pi-spec/index.ts` and reuse `resolveSpecDir`, `readIfExists`, `extractStatus`, `countTasks`, `withFileMutationQueue`, and `updateSpecStatus`.
- Template change is additive; existing specs without `ID:` lines continue to validate via `spec_validate`.

## Open Questions

- [x] Should the tool also auto-assign IDs to legacy tasks? — No (resolved in brainstorm).
