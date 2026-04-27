---
name: spec-design
description: Create or refine .specs/<feature>/design.md from accepted requirements. Use for architecture, data/API/UI design, error handling, security, testing strategy, rollout, and requirements traceability.
---

# Spec Design

Use this skill for the design phase after requirements exist.

## Required Reads

Before editing design, read:

- `.specs/<feature>/brainstorm.md`
- `.specs/<feature>/requirements.md`
- Existing `.specs/<feature>/design.md`, if present
- Relevant code/docs needed to make concrete decisions

## Output File

Write design to:

```text
.specs/<feature-slug>/design.md
```

Start from `../../templates/spec/design.md` when creating a new design.

## Design Quality Bar

A complete design covers:

- Summary of the chosen approach
- Goals and non-goals
- Architecture and component boundaries
- Data model, validation, persistence, and migrations
- API, UI, command, configuration, or event changes
- Error handling and recovery
- Security/privacy considerations
- Testing strategy
- Rollout, migration, and rollback
- Requirements traceability table
- Risks, trade-offs, and alternatives considered

## Traceability

Every `FR-*` and `NFR-*` from requirements must appear in `Requirements Traceability` with:

- The design decision that satisfies it
- A validation method or test type

If a requirement is not feasible, do not silently drop it. Mark it as blocked or propose a requirement change.

## Done Criteria

Before moving to tasks:

- Requirements are traceable to design choices
- Risky assumptions are explicit
- Testing strategy is concrete enough to become tasks
- Implementation boundaries are clear enough for a coding agent to execute
