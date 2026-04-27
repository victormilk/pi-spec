# Spec Task Check Brainstorm

Spec: `spec-task-check`  
Status: brainstorm-complete  
Created: 2026-04-27

## User Intent

## User Intent
Provide a reliable way to mark tasks complete in `.specs/<slug>/tasks.md` after each task finishes, instead of relying on free-form edits. Each task should carry a stable ID so the tool (and humans) can reference it unambiguously.

## Answers / Decisions
- **ID format:** `T-001`, `T-002`, ... — sequential, zero-padded, stable across reorderings.
- **Tool scope:** workflow-aware. The tool toggles `[x]` for a given ID and also drives `tasks.md` `Status:` transitions:
  - First task checked while status is `tasks-approved` → flip to `implementation-in-progress`.
  - All tasks checked → flip to `implementation-complete`.
  - Refuse to check while status is `tasks-draft` (mirrors the existing implementation-readiness gate).
- **Template change:** the bundled `tasks.md` template adds an explicit `ID: T-00N` line under each task so IDs are visible to humans and parseable by the tool.
- **Tool name:** `spec_task_check` exposed by the `pi-spec` extension, alongside `spec_brainstorm`, `spec_init`, `spec_status`, `spec_validate`.

## Proposal
1. Update `templates/spec/tasks.md` to add `ID: T-001` (etc.) lines under each example task.
2. Add a `spec_task_check` tool in `extensions/pi-spec/index.ts` with parameters `{ spec, id, uncheck? }`.
   - Locate the task block whose body contains `ID: <id>`.
   - Flip the checkbox on the parent `- [ ] N. ...` line (or back to `[ ]` when `uncheck: true`).
   - After mutation, recompute counts and update `Status:` per rules above.
   - Refuse if `tasks-draft`, return a clear error if ID not found, idempotent if already in target state.
3. Surface the tool through prompt guidelines so agents call it after each completed task.

## Assumptions
- Existing specs without `ID:` lines remain valid; tool only operates on tasks that declare an `ID:`.
- Tasks are unique by ID per spec; we will not auto-assign IDs to legacy tasks.
- Status line format remains `Status: <value>` on its own line, as the templates already use.

## Open Doubts
- None blocking. Renumbering on reorder is explicitly out of scope; users keep IDs stable manually.

## Clarifying Questions Asked

- TODO: Record key questions asked one at a time and the user's answers.

## Proposed Approach

- TODO: Summarize the recommended direction before requirements are drafted.

## Assumptions

- TODO: List assumptions accepted during brainstorming.

## Remaining Doubts

- TODO: List unresolved questions, if any, and whether they block requirements.

## Decision

- [ ] User approved creating the spec skeleton and drafting requirements.
