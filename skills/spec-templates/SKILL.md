---
name: spec-templates
description: Use the bundled generated-file templates for .specs/<feature>/brainstorm.md, requirements.md, design.md, and tasks.md. Use when creating or repairing spec file structure.
---

# Spec Templates

Use these templates for generated spec files:

- Brainstorm: `../../templates/spec/brainstorm.md`
- Requirements: `../../templates/spec/requirements.md`
- Design: `../../templates/spec/design.md`
- Tasks: `../../templates/spec/tasks.md`

Prefer the `spec_init` tool when available. It fills these placeholders:

- `{{SLUG}}`
- `{{TITLE}}`
- `{{DESCRIPTION}}`
- `{{SUMMARY}}`
- `{{DATE}}`

## Repairing Existing Specs

When repairing structure:

1. Preserve existing user-authored content.
2. Add missing sections from the templates.
3. Preserve requirement IDs and task numbers unless renumbering is explicitly requested.
4. Keep generated files under `.specs/**`.
