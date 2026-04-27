# Spec Task Check Design

Spec: `spec-task-check`  
Status: design-approved  
Created: 2026-04-27  
Brainstorm: `./brainstorm.md`
Requirements: `./requirements.md`

## Summary

Add a single new tool, `spec_task_check`, in `extensions/pi-spec/index.ts`. The tool parses `tasks.md`, locates the parent task line whose body contains `ID: <id>`, flips that line's checkbox, and updates the `Status:` line if the resulting state crosses a workflow boundary. The bundled `templates/spec/tasks.md` is updated to ship with explicit `ID: T-001/002/003` lines.

The implementation reuses existing helpers (`resolveSpecDir`, `readIfExists`, `extractStatus`, `countTasks`, `withFileMutationQueue`, `updateSpecStatus`) so behavior, error handling, and file-locking stay consistent with the other `spec_*` tools.

## Goals and Non-Goals

### Goals

- One-call task completion with stable IDs (FR-001..003, FR-008).
- Workflow-aware status (FR-005/006/007).
- Safe writes (NFR-001) and minimal-diff edits (NFR-002).

### Non-Goals

- Slash command surface.
- Auto-ID assignment / renumbering for legacy specs.
- Editing other spec files.

## Architecture

```mermaid
flowchart TD
  Caller[Agent / User] -->|spec_task_check| Tool[spec_task_check tool]
  Tool --> Resolve[resolveSpecDir + readIfExists]
  Resolve --> Parse[parseTaskBlocks(tasks.md)]
  Parse -->|find by ID| Edit[flip checkbox]
  Edit --> Status[advance Status: line]
  Status --> Write[withFileMutationQueue → writeFile]
  Write --> UI[updateSpecStatus]
```

The tool lives entirely inside `extensions/pi-spec/index.ts`. No new modules, no new dependencies.

## Data Model

A "task block" is parsed from `tasks.md` as:

- A parent line matching `^(\s*)-\s+\[([ xX])\]\s+(.*)$` (the checkbox line).
- Followed by zero or more indented continuation lines until the next blank line, next parent task line, or a heading.
- Each block has a single `ID:` token if any continuation line matches `^\s*ID:\s*(T-\d{3,})\s*$`.

Status line shape: `^Status:\s*(.+)$` on its own line. When updating, the tool rewrites that line in place; if absent, it inserts `Status: <new>` after the first `# ` heading block.

## API / Interface Changes

New extension tool:

```ts
spec_task_check({
  spec: string,         // slug or ".specs/<slug>"
  id: string,           // e.g. "T-001"; case-insensitive, normalized to upper
  uncheck?: boolean,    // default false
})
```

Returns:

```text
{
  spec: "<slug>",
  id: "T-001",
  changed: boolean,         // false if already in target state
  previous: "[ ]" | "[x]",
  current:  "[ ]" | "[x]",
  status: { previous, current }
}
```

Refusal contract: a non-throwing result with `content` text describing the refusal reason for `tasks-draft` and "id not found" cases, mirroring how `spec_init` handles the missing-brainstorm case.

Template change: `templates/spec/tasks.md` gains an `ID: T-00N` continuation line under each of the three example tasks.

## Error Handling

- `tasks-draft` status → return text refusal, no mutation (FR-004).
- ID not found → return text refusal naming the ID; no mutation (FR-003).
- Ambiguous ID (declared on multiple tasks) → return text refusal listing line numbers; no mutation.
- Spec dir / `tasks.md` missing → return text refusal pointing the caller to `spec_init`.
- File system errors propagate as thrown errors (consistent with other `spec_*` tools).

## Security and Privacy

- Reuses `resolveSpecDir`, which already prevents path escape outside `.specs/`.
- No new secrets, no new network calls.

## Testing Strategy

- **Unit / smoke tests:** none currently in this repo for the extension; instead, verify via fixtures and a manual run.
- **Manual validation script** (recorded in tasks): create a fixture spec under a temp `.specs/` dir, run the tool through every transition (draft refusal, first-check status flip, idempotent re-check, missing ID, last-task completion, uncheck rollback), and inspect resulting `tasks.md`.
- **Type safety:** `pnpm typecheck` must pass.
- **Regression:** confirm `spec_validate` still passes against the updated bundled template (`spec_init` a fresh fixture and validate).

## Rollout and Migration

- Additive: existing specs are not modified. Specs without `ID:` lines simply cannot use `spec_task_check` until a user adds IDs manually.
- No feature flag; ship behind the next `pi -e .` reload.

## Requirements Traceability

| Requirement | Design Decision                                                                     | Validation                               |
| ----------- | ----------------------------------------------------------------------------------- | ---------------------------------------- |
| FR-001      | `parseTaskBlocks` + targeted line rewrite via `withFileMutationQueue`               | Manual: check task in fixture spec       |
| FR-002      | Compare prior/next checkbox state, return `changed: false` when equal               | Manual: re-check same task               |
| FR-003      | Return text refusal naming the missing ID before any mutation                       | Manual: check unknown ID                 |
| FR-004      | Read `Status:` via `extractStatus`; refuse when `isDraftStatus()` matches           | Manual: check task in `tasks-draft` spec |
| FR-005      | After a check, if `previous === "tasks-approved"`, set `implementation-in-progress` | Manual: walk through transitions         |
| FR-006      | Recompute `countTasks`; if `done === total`, set `implementation-complete`          | Manual: check last task                  |
| FR-007      | After uncheck, if `previous === "implementation-complete"`, set `in-progress`       | Manual: uncheck after completion         |
| FR-008      | Update `templates/spec/tasks.md` to include `ID: T-001/002/003` lines               | `spec_init` fresh slug + grep `ID: T-`   |
| NFR-001     | All writes go through `withFileMutationQueue(target, …)`                            | Code review                              |
| NFR-002     | Edits target only the matched checkbox line and (if needed) the `Status:` line      | Diff inspection on fixture               |

## Risks and Trade-offs

- **Risk:** Users may copy/paste a task and forget to update `ID:`, producing duplicates. **Mitigation:** explicit "ambiguous id" refusal flags it on first call instead of silently editing the wrong task.
- **Risk:** Status line semantics could drift if other tooling writes `Status:` differently. **Mitigation:** keep the regex permissive (`^Status:\s*(.+)$`) and only rewrite the value, not the whole line.
- **Trade-off:** Sequential `T-NNN` IDs are not auto-assigned, so legacy specs need a one-time hand edit. Accepted to keep this change small and safe.
