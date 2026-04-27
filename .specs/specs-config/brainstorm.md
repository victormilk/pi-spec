# Specs Config (.specs/config.yaml) Brainstorm

Spec: `specs-config`  
Status: brainstorm-complete  
Created: 2026-04-27

## User Intent

## Intent
Introduce a single, project-wide `.specs/config.yaml` that captures project context (goal, tech stack) and operating rules (code principles, post-task hooks) so spec workflow agents adapt their behavior automatically before brainstorm, spec init, and implementation gates.

## Likely Users
Anyone using the spec workflow in a project — the config standardizes how agents brainstorm, write requirements, and implement.

## Desired Outcome
Agents consistently load and respect `.specs/config.yaml` before brainstorm/init/implementation. The config provides project-specific context and rules without requiring a rigid schema. Missing config triggers a scaffold + warn flow; auto-flagged hooks execute automatically on task completion.

## Scope Boundaries
- In scope: file convention (`.specs/config.yaml`), agent loading/interpretation behavior, scaffold-when-missing flow, hook execution semantics with `auto` flag.
- Out of scope: rigid schema validation, replacing existing skill prompts, per-spec config overrides.

## Decisions / Answers
- **Location:** `.specs/config.yaml` (project root of the specs tree, not per-spec). Single file, project-wide.
- **Schema:** Free-form YAML — agent interprets keys; no fixed validation.
- **Common (illustrative) keys:**
  - `project.goal`
  - `project.tech_stack`
  - `principles.*` (e.g., `tdd: true`, `no_comments: true`)
  - `hooks.after_task` with `{ command, auto: true|false }`
- **Lifecycle:** Loaded before brainstorm, spec init, and implementation gates.
- **Missing file:** Scaffold a starter `.specs/config.yaml` with example keys, warn, and proceed (do not block).
- **Malformed file:** Warn and proceed without config (do not block).
- **Hook execution:** Each hook entry has an `auto` flag. `auto: true` → agent runs the command (e.g., after `spec_task_check`) and reports the result. `auto: false` → agent surfaces it as a reminder only.

## Proposal
1. Define `.specs/config.yaml` as the canonical project-wide spec config location.
2. Spec agents read this file before each gate (brainstorm, init, implementation, task check).
3. If missing → scaffold a commented starter template with example keys, warn the user, continue.
4. If malformed → warn, proceed without config.
5. The agent treats keys as guidance/context, except `hooks.*.auto: true`, which triggers actual command execution after the relevant gate.

## Risks
- Free-form interpretation can lead to inconsistent agent behavior across runs.
- Auto-executing hooks could cause side effects if commands are misconfigured.
- Users may not discover the file unless it's surfaced clearly when scaffolded.

## Success Criteria
- Agents load `.specs/config.yaml` before brainstorm/init/implementation gates.
- Missing file triggers scaffold + warn; user sees the new file and example keys.
- Malformed file triggers a clear warning but does not block work.
- Hooks with `auto: true` are executed after task completion and results are reported.
- Project goal, tech stack, and principles influence agent output (e.g., TDD-aware tasks, no-comments code style).

## Open Doubts
- Exact starter template content (which example keys to seed) — can be finalized in design.
- How "warn" surfaces (chat message vs. side channel) — finalize in design.
- Whether `auto: true` requires user confirmation on first run — finalize in design.

## Clarifying Questions Asked

- TODO: Record key questions asked one at a time and the user's answers.

## Proposed Approach

- TODO: Summarize the recommended direction before requirements are drafted.

## Assumptions

- TODO: List assumptions accepted during brainstorming.

## Remaining Doubts

- TODO: List unresolved questions, if any, and whether they block requirements.

## Decision

- [ ] User approved creating the spec skeleton and drafting requirements.
