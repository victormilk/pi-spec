# Specs Config (.specs/config.yaml) Tasks

Spec: `specs-config`
Status: implementation-complete
Created: 2026-04-27
Brainstorm: `./brainstorm.md`
Requirements: `./requirements.md`
Design: `./design.md`

## Implementation Plan

Tasks are ordered. Each task is small, traceable to requirement IDs, and includes a concrete validation step.

- [x] 1. Define starter template for `.specs/config.yaml`
  - ID: T-001
  - Requirement(s): FR-002, NFR-002
  - Files/areas: spec workflow agent assets (new constant/asset for the starter YAML body)
  - Validation: snapshot test asserts the starter template contains `project.goal`, `project.tech_stack`, `principles.tdd`, `principles.no_comments`, and `hooks.after_task` example, all with explanatory inline comments and `auto: false` defaults.

- [x] 2. Implement `scaffold_spec_config(path)`
  - ID: T-002
  - Requirement(s): FR-002, NFR-002, NFR-003
  - Files/areas: spec workflow agent (new helper alongside loader)
  - Validation: unit test — given a non-existent path under a temp dir, the helper creates `.specs/` if missing, writes the starter template byte-for-byte, and is idempotent only in the sense that it is never called when the file already exists.

- [x] 3. Implement `load_spec_config(project_root)` core
  - ID: T-003
  - Requirement(s): FR-001, FR-001a, FR-003, NFR-003
  - Files/areas: spec workflow agent (new module: spec config loader)
  - Validation: unit tests — (a) valid YAML returns parsed dict with arbitrary top-level keys preserved; (b) two consecutive calls re-read the file from disk (edit between calls reflected); (c) loader resolves exactly `.specs/config.yaml` from project root and does not search alternates.

- [x] 4. Add missing-file branch to `load_spec_config`
  - ID: T-004
  - Requirement(s): FR-002, NFR-001, NFR-004
  - Files/areas: spec workflow agent (loader)
  - Validation: unit test — when the file is absent, loader invokes `scaffold_spec_config`, emits a non-blocking warning containing the file path on the standard agent output channel, and returns an empty dict.

- [x] 5. Add malformed/unreadable branches to `load_spec_config`
  - ID: T-005
  - Requirement(s): FR-004, NFR-001, NFR-004
  - Files/areas: spec workflow agent (loader)
  - Validation: unit tests — (a) invalid YAML produces a warning naming the file and the parse error and returns `{}`; (b) zero-byte file returns `{}` with no warning; (c) permission-denied read produces a warning naming the IO error and returns `{}`.

- [x] 6. Handle sectional malformation gracefully
  - ID: T-006
  - Requirement(s): FR-003, NFR-001
  - Files/areas: spec workflow agent (loader / context injector)
  - Validation: unit test — a config where `hooks.after_task` is a string instead of a list produces a sectional warning, that section is skipped, and the rest of the dict is still returned/applied.

- [x] 7. Wire loader into every spec workflow action
  - ID: T-007
  - Requirement(s): FR-001, FR-001a
  - Files/areas: spec workflow entry points for `spec_brainstorm`, `spec_init`, `spec_status`, `spec_validate`, `spec_task_check`, and the implementation start path
  - Validation: integration tests — each action calls `load_spec_config` as its first step (verified via spy/mock); editing `.specs/config.yaml` between two consecutive actions causes the second action to observe the new values.

- [x] 8. Implement Context Injector for project + principles keys
  - ID: T-008
  - Requirement(s): FR-008, FR-009
  - Files/areas: spec workflow agent (context layer used by brainstorm/requirements/design/tasks/implementation generation)
  - Validation: integration tests — (a) `project.goal` and `project.tech_stack` set → generated requirements/design/tasks reference that context; (b) `principles.tdd: true` → generated tasks include test-first steps; (c) `principles.no_comments: true` → generated implementation guidance omits code comments.

- [x] 9. Implement `run_after_task_hooks(config, project_root)` Hook Runner
  - ID: T-009
  - Requirement(s): FR-005, FR-006, FR-007, FR-010, NFR-005
  - Files/areas: spec workflow agent (new module: hook runner)
  - Validation: unit tests — (a) `auto: true` entry runs the command with `cwd = project_root` and reports exit status + output; (b) `auto: false` (or missing) entry produces a reminder and no subprocess; (c) multiple entries execute in order with independent reports; (d) non-zero exit reported as failed; (e) missing binary reported as failed; (f) hook runner never raises (workflow non-blocking).

- [x] 10. Wire Hook Runner into `spec_task_check` post-success path
  - ID: T-010
  - Requirement(s): FR-005, FR-006, FR-007, FR-010
  - Files/areas: spec workflow `spec_task_check` entry point
  - Validation: integration test — successful `spec_task_check` invokes `run_after_task_hooks` exactly once with the freshly loaded config; failed task check does not invoke it.

- [x] 11. End-to-end manual validation
  - ID: T-011
  - Requirement(s): FR-001, FR-002, FR-004, FR-006, FR-007, FR-009
  - Files/areas: e2e checklist in spec workflow docs/tests
  - Validation: manual run — (a) fresh project (no `.specs/`) → first `spec_brainstorm` creates `.specs/config.yaml` with starter template and warns; (b) hand-corrupt YAML → next action warns and proceeds; (c) configure `hooks.after_task: [{ command: "echo hello", auto: true }]` → after `spec_task_check`, output reports `hello`; (d) flip the same hook to `auto: false` → reminder shown, no execution; (e) set `principles.tdd: true` and re-generate tasks → tests-first steps appear.

- [x] 12. Regression sweep of existing spec workflow tests
  - ID: T-012
  - Requirement(s): NFR-001
  - Files/areas: existing spec workflow test suite
  - Validation: full test suite passes with the loader prepended to every action; no existing test breaks.

## Verification Checklist

- [ ] Every requirement (FR-001..FR-010, NFR-001..NFR-005) is referenced by at least one task.
- [ ] Design testing strategy (unit + integration + e2e + regression) is represented by tasks T-002..T-012.
- [ ] Each task has a clear validation command or manual check.
- [ ] Non-blocking behavior (NFR-001) is exercised by T-004, T-005, T-006, T-009, T-012.
- [ ] No rollback/migration tasks are required (per design: no data migration, revert-only rollback).

## Execution Notes

- Keep `Status: tasks-draft` until the user explicitly approves this task plan.
- After approval, change status to `tasks-approved` and run implementation-readiness validation (`spec_validate phase: implementation`) before coding.
- When coding starts, change status to `implementation-in-progress`.
- When all tasks are checked and validated, change status to `implementation-complete`.
- Complete tasks in order unless the user approves reordering.
- Mark tasks complete only after validation passes.
- Record deviations from design in design.md before implementing them.
