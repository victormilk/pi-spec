---
name: spec-review
description: Review a .specs/<feature>/ spec or implementation for completeness, traceability, contradictions, missing tests, unchecked tasks, and drift between requirements, design, tasks, and code.
---

# Spec Review

Use this skill for reviewing spec quality or implementation drift.

## Review Inputs

Read the relevant files:

- `.specs/<feature>/brainstorm.md`
- `.specs/<feature>/requirements.md`
- `.specs/<feature>/design.md`
- `.specs/<feature>/tasks.md`
- Code/tests touched by completed tasks, when reviewing implementation

Use `spec_status` and `spec_validate` when available.

## Review Checklist

Check for:

- Missing or shallow brainstorm records before spec creation
- Requirements that are ambiguous, untestable, duplicated, or missing IDs
- Design decisions that do not trace to requirements
- Requirements with no design or task coverage
- Tasks without validation steps
- Completed checkboxes without evidence of validation
- Implementation that changes behavior not covered by the spec
- Missing error handling, security/privacy, accessibility, migration, or rollback coverage
- Open questions that should block implementation

## Output

Return findings by severity:

- **Blockers**: Must fix before next gate
- **Risks**: Should address or explicitly accept
- **Suggestions**: Nice-to-have improvements

Include precise file paths and requirement/task IDs.
