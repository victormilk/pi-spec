# {{TITLE}} Tasks

Spec: `{{SLUG}}`  
Status: tasks-draft  
Created: {{DATE}}  
Brainstorm: `./brainstorm.md`
Requirements: `./requirements.md`
Design: `./design.md`

## Implementation Plan

Only include implementation tasks after requirements and design are accepted. Keep tasks small, ordered, and traceable.

- [ ] 1. TODO: Prepare implementation foundation
  - Requirement(s): FR-001
  - Files/areas: TODO
  - Validation: TODO

- [ ] 2. TODO: Implement core behavior
  - Requirement(s): FR-001, FR-002
  - Files/areas: TODO
  - Validation: TODO

- [ ] 3. TODO: Add tests and documentation
  - Requirement(s): FR-001, FR-002, NFR-001
  - Files/areas: TODO
  - Validation: TODO

## Verification Checklist

- [ ] Requirements IDs are referenced by tasks.
- [ ] Design testing strategy is represented by tasks.
- [ ] Each task has a clear validation command or manual check.
- [ ] Rollback/migration tasks are included when applicable.

## Execution Notes

- Keep `Status: tasks-draft` until the user explicitly approves this task plan.
- After approval, change status to `tasks-approved` and run implementation-readiness validation before coding.
- When coding starts, change status to `implementation-in-progress`.
- When all tasks are checked and validated, change status to `implementation-complete`.
- Complete tasks in order unless the user approves reordering.
- Mark tasks complete only after validation passes.
- Record deviations from design in design.md before implementing them.
