---
name: spec-requirements
description: Draft and refine requirements for a .specs/<feature>/requirements.md file. Use for user stories, scope, acceptance criteria, EARS-style SHALL statements, and requirement IDs before design or implementation.
---

# Spec Requirements

Use this skill for the requirements phase of a project-layer spec.

## Inputs

- Completed `.specs/<feature>/brainstorm.md`
- User goal or feature name
- Existing `.specs/<feature>/requirements.md`, if present
- Related code/docs only when needed to remove ambiguity

## Output File

Write requirements to:

```text
.specs/<feature-slug>/requirements.md
```

Read `brainstorm.md` first. Start from `../../templates/spec/requirements.md` or use `spec_init` when available. If `brainstorm.md` is missing for a new spec, pause requirements drafting and run the brainstorm gate first.

## Requirements Quality Bar

A complete requirements file includes:

- Overview and explicit scope/non-scope
- User stories in “As a..., I want..., so that...” form
- Functional requirements with stable IDs (`FR-001`, `FR-002`, ...)
- Non-functional requirements with stable IDs (`NFR-001`, ...)
- Testable EARS-style statements using `SHALL`
- Acceptance criteria checkboxes
- Edge cases, dependencies, constraints, and open questions

## EARS Patterns

Use these patterns when possible:

- Ubiquitous: `THE system SHALL <response>.`
- Event-driven: `WHEN <event>, THE system SHALL <response>.`
- State-driven: `WHILE <state>, THE system SHALL <response>.`
- Optional: `WHERE <feature>, THE system SHALL <response>.`
- Unwanted behavior: `IF <condition>, THEN THE system SHALL <response>.`

## Clarification Protocol

Ask one question at a time when requirements affect:

- User roles or permissions
- Data model or persistence
- External integrations
- Error/retry behavior
- Security, privacy, accessibility, or performance
- Backwards compatibility or migration

If the user wants speed, document assumptions in `Open Questions` and label them as assumptions.

## Done Criteria

Before moving to design, ensure every requirement is testable and every open question is either answered, deferred, or called out as an implementation risk.
