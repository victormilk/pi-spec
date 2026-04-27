---
name: spec-driven-development
description: End-to-end spec-driven development workflow for Pi. Use when brainstorming, creating, refining, validating, or implementing project-layer specs in .specs/<feature>/ with brainstorm.md, requirements.md, design.md, and tasks.md.
---

# Spec-Driven Development

Use this skill whenever the task is to define, design, plan, or implement a feature through a spec.

## Directory Contract

All project-layer specs live under:

```text
.specs/<feature-slug>/
├── brainstorm.md
├── requirements.md
├── design.md
└── tasks.md
```

Use a stable, lowercase, hyphenated `<feature-slug>`. Do not put generated specs outside `.specs/**` unless the user explicitly changes the project layer.

Bundled generated-file templates are available at:

- `../../templates/spec/brainstorm.md`
- `../../templates/spec/requirements.md`
- `../../templates/spec/design.md`
- `../../templates/spec/tasks.md`

If the `spec_brainstorm` and `spec_init` tools are available, use them to record the brainstorm gate and create the skeleton instead of manually recreating files.

## Workflow Gates

Proceed in order. Do not skip gates. Brainstorming is required before spec creation.

0. **Brainstorm**
   - Identify the user's intent, desired outcome, target users, scope, constraints, risks, and success criteria.
   - Ask exactly one clarifying question at a time; do not dump a questionnaire.
   - Propose an approach and summarize assumptions/open doubts before creating files.
   - Ask for approval to create the spec skeleton.
   - Record the result in `.specs/<feature>/brainstorm.md` via `spec_brainstorm` when available.

1. **Requirements**
   - Read `.specs/<feature>/brainstorm.md` first.
   - Create or update `.specs/<feature>/requirements.md`.
   - Capture user stories, scope, constraints, open questions, and testable requirements.
   - Use requirement IDs (`FR-001`, `NFR-001`) and EARS-style `SHALL` language.
   - Ask clarifying questions for ambiguity, one question at a time.
   - Stop for user review before design unless the user asked to continue autonomously.

2. **Design**
   - Read accepted requirements first.
   - Create or update `.specs/<feature>/design.md`.
   - Explain architecture, data/API/UI changes, error handling, security, tests, rollout, and trade-offs.
   - Trace every requirement ID to a design decision and validation plan.
   - Stop for user review before tasks unless approved to continue.

3. **Tasks**
   - Read accepted requirements and design first.
   - Create or update `.specs/<feature>/tasks.md`.
   - Write small implementation tasks with checkboxes, file/area hints, validation, and requirement mappings.
   - Stop before implementation unless the user asked to implement.

4. **Implementation**
   - Read `tasks.md` and implement tasks in order.
   - Mark a task complete only after code changes and validation pass.
   - If implementation requires a design change, update `design.md` first and explain the deviation.

## Operating Rules

- Use `spec_status` before changing an existing spec.
- Use `spec_brainstorm` before `spec_init` for new specs.
- Use `spec_validate` before implementation and after large spec edits.
- Preserve requirement IDs once introduced; add new IDs instead of renumbering unless the user approves cleanup.
- Keep files concise but complete. Prefer tables for traceability.
- Do not create specs or implement from vague ideas; brainstorm, clarify, and document assumptions first.
- In final responses, summarize changed spec files and next gate.
