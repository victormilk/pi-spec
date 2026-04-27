---
description: Onboard a new user to pi-spec and the spec-driven development workflow
argument-hint: "[project or feature context]"
---

Use the `spec-driven-development` skill if available.

Onboard a new user to this Pi spec-driven development package.

Optional user/project context: `$ARGUMENTS`

Your response should be friendly, concise, and practical:

1. Explain that specs live in `.specs/<feature-slug>/` with `brainstorm.md`, `requirements.md`, `design.md`, and `tasks.md`.
2. Explain the workflow gates: Brainstorm → Requirements → Design → Tasks → Implementation → Review.
3. Explain that brainstorming is required before spec creation and asks one clarifying question at a time.
4. List the most useful commands:
   - `/spec-brainstorm <idea or goal>`
   - `/spec-new <feature or goal>`
   - `/spec-requirements <spec-slug>`
   - `/spec-design <spec-slug>`
   - `/spec-tasks <spec-slug>`
   - `/spec-implement <spec-slug>`
   - `/spec-review <spec-slug>`
   - `/specs`
5. If the `spec_status` tool is available, use it to summarize any existing `.specs/**` work before recommending next steps.
6. Give the user a simple first action. If they provided a feature or goal, suggest the exact `/spec-brainstorm ...` or `/spec-new ...` command. Otherwise ask what feature they want to explore first.
7. Do not create or modify files during onboarding unless the user explicitly asks you to start a spec.
