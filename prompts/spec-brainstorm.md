---
description: Brainstorm a feature idea before creating a .specs/<feature>/ spec
argument-hint: "<idea or goal>"
---

Use the `spec-brainstorm` and `spec-driven-development` skills.

Brainstorm this idea before any spec files are created: $ARGUMENTS

Required behavior:

- Do not call `spec_init` yet.
- Identify the user's intent, desired outcome, likely users, scope boundaries, constraints, and risks.
- Ask exactly one clarifying question at a time.
- After each user answer, decide the next most valuable question instead of dumping a questionnaire.
- When the idea is clear enough, present a concise **Brainstorm Summary** with:
  - User intent
  - Target users/stakeholders
  - Problem and desired outcome
  - In-scope and out-of-scope boundaries
  - Key constraints/risks
  - Proposed approach
  - Remaining doubts or assumptions
  - Suggested spec slug
- Ask: “Should I create the spec skeleton and draft requirements now?”
- Only after the user approves, record the brainstorm with `spec_brainstorm`, then create the spec with `spec_init`, then draft `requirements.md`.
