---
name: spec-brainstorm
description: Brainstorm feature ideas before creating .specs/<feature>/ specs. Use to identify user intent, ask one clarifying question at a time, propose an approach, and record brainstorm.md before requirements are drafted.
---

# Spec Brainstorm

Use this skill before creating any new spec. Brainstorming is a required quality gate that reduces rework by clarifying intent before requirements are written.

## Goal

Clarify:

- User intent and desired outcome
- Target users and stakeholders
- Problem context and success criteria
- Scope and explicit non-scope
- Constraints, risks, dependencies, and deadlines
- Proposed approach and key assumptions
- Remaining doubts that should block or shape requirements

## Conversation Protocol

- Ask exactly one question at a time.
- Choose the highest-impact next question based on the user's previous answer.
- Do not dump a long questionnaire.
- Keep questions practical and easy to answer.
- If the user asks to skip, explain that brainstorm is required before spec creation and ask the single most important question.
- Do not call `spec_init` until the user approves creating the spec.

## Completion Protocol

When the idea is clear enough, present a concise **Brainstorm Summary**:

```markdown
## Brainstorm Summary

- User intent:
- Target users/stakeholders:
- Problem and desired outcome:
- In scope:
- Out of scope:
- Constraints/risks:
- Proposed approach:
- Assumptions:
- Remaining doubts:
- Suggested spec slug:
```

Then ask:

> Should I create the spec skeleton and draft requirements now?

Only after the user approves:

1. Record the summary with `spec_brainstorm` when available.
2. Create the skeleton with `spec_init`.
3. Draft `requirements.md` only.

## Output File

The brainstorm record is stored at:

```text
.specs/<feature-slug>/brainstorm.md
```

This file is a pre-spec artifact and should be read before requirements, design, tasks, or implementation work.
