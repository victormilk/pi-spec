# Spec Task Check Tasks

Spec: `spec-task-check`  
Status: implementation-complete  
Created: 2026-04-27  
Brainstorm: `./brainstorm.md`
Requirements: `./requirements.md`
Design: `./design.md`

## Implementation Plan

- [x] 1. Update bundled tasks template with `ID: T-NNN` lines
  - ID: T-001
  - Requirement(s): FR-008
  - Files/areas: `templates/spec/tasks.md`
  - Validation: After `spec_init` of a fresh fixture slug, `grep -E '^\s*ID: T-00[1-3]$' .specs/<fixture>/tasks.md` returns three lines.

- [x] 2. Implement `spec_task_check` tool in pi-spec extension
  - ID: T-002
  - Requirement(s): FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, NFR-001, NFR-002
  - Files/areas: `extensions/pi-spec/index.ts` (new schema, helper `parseTaskBlocks`, helper `applyTaskCheck`, `pi.registerTool({ name: "spec_task_check", ... })`, prompt guidelines).
  - Validation: `pnpm typecheck` passes; manual fixture run exercises every transition listed in design.md → Requirements Traceability.

- [x] 3. Update README and prompt guidance
  - ID: T-003
  - Requirement(s): FR-001, FR-008
  - Files/areas: `README.md` (Extension Tools section adds `spec_task_check`), tool `promptGuidelines` instructing agents to call `spec_task_check` after each completed task.
  - Validation: `pnpm typecheck`; visual review of README diff.

## Verification Checklist

- [ ] Requirements IDs are referenced by tasks.
- [ ] Design testing strategy is represented by tasks.
- [ ] Each task has a clear validation command or manual check.
- [ ] Rollback/migration tasks are included when applicable. (N/A — additive change, no migration.)

## Execution Notes

- Keep `Status: tasks-draft` until the user explicitly approves this task plan.
- After approval, change status to `tasks-approved` and run implementation-readiness validation before coding.
- When coding starts, change status to `implementation-in-progress`.
- When all tasks are checked and validated, change status to `implementation-complete`.
- Complete tasks in order unless the user approves reordering.
- Mark tasks complete only after validation passes.
- Record deviations from design in design.md before implementing them.
