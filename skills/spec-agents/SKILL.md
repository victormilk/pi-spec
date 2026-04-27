---
name: spec-agents
description: Use optional bundled spec subagents with pi-subagents. Use when installing, invoking, or coordinating spec-brainstorm, spec-requirements, spec-designer, spec-task-planner, or spec-reviewer agents for SDD workflows.
---

# Spec Agents

This package includes optional subagent definitions in `../../agents/`.

They are not required for the core spec workflow. Use them only when `pi-subagents` is installed or the user asks for agent delegation.

## Install Agents Into the Project Layer

Run the extension command:

```text
/spec-install-agents
```

This copies bundled agent markdown files into:

```text
.pi/agents/
```

Use `--force` to overwrite existing project agents:

```text
/spec-install-agents --force
```

## Included Agents

- `spec-brainstorm-agent`: required pre-spec brainstorming with one question at a time
- `spec-requirements-agent`: requirements elicitation and EARS quality review
- `spec-design-agent`: design drafting and traceability review
- `spec-task-planner-agent`: implementation task decomposition
- `spec-review-agent`: cross-file spec and implementation drift review

## Delegation Guidance

Keep one primary agent responsible for decisions. Use subagents for advisory work, reviews, or focused drafting. Do not let multiple writers edit the same spec files concurrently.
