---
description: Show status for all specs or one .specs/<feature>/ spec
argument-hint: "[spec-slug]"
---

Use `spec_status` if available.

Target: `$1`

Summarize:

- Existing specs under `.specs/**`
- Missing generated files, including required `brainstorm.md`
- Task progress
- Recommended next gate for each spec, starting with brainstorm when missing

Do not edit files.
