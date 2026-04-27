---
name: tdd
description: Test-driven development with the red-green-refactor loop. Use when the project has `principles.tdd: true` in `.specs/config.yaml`, when implementing tasks from `.specs/<feature>/tasks.md`, or when the user mentions TDD, red-green-refactor, test-first, or integration-style tests. Adapted from Matt Pocock's TDD skill (https://github.com/mattpocock/skills/tree/main/tdd).
---

# Test-Driven Development

Use this skill alongside `spec-implementation` whenever the spec's project config has `principles.tdd: true`, or when the user explicitly asks for test-first work. Each spec task in `tasks.md` should be implemented as one or more vertical TDD slices.

## Philosophy

**Core principle**: Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't.

**Good tests** are integration-style: they exercise real code paths through public APIs and describe _what_ the system does, not _how_. They survive refactors because they don't care about internal structure.

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through side-channels (e.g. raw DB queries instead of the interface). The warning sign: the test breaks under a pure refactor.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.

## Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.** That is "horizontal slicing" and produces crap tests:

- Tests written in bulk verify _imagined_ behavior, not _actual_ behavior.
- You end up testing data shapes and signatures rather than user-facing behavior.
- Tests pass when behavior breaks and fail when it doesn't.

**Correct approach**: Vertical slices via tracer bullets. One test → one implementation → repeat. Each test responds to what the previous cycle taught you.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  ...
```

## Workflow Inside a Spec Task

For each unchecked task in `tasks.md`:

### 1. Plan the slice (before any code)

- [ ] Re-read the requirement IDs the task references.
- [ ] Confirm with the user which behaviors must be tested and which can wait.
- [ ] Look for [deep modules](deep-modules.md): small interface, deep implementation.
- [ ] Sketch the public interface for [testability](interface-design.md).
- [ ] List behaviors (not implementation steps) and get user buy-in.

Ask: "What should the public interface look like? Which behaviors are most important to test?" You can't test everything — focus on critical paths and complex logic.

### 2. Tracer bullet

Write ONE test that confirms ONE thing about the system:

```
RED:   Write a failing test for the first behavior.
GREEN: Write the minimum code to pass it.
```

This proves the path works end-to-end.

### 3. Incremental loop

For each remaining behavior in the task:

```
RED:   Write the next failing test.
GREEN: Add the minimum code to pass it.
```

Rules:

- One test at a time.
- Only enough code to pass the current test.
- Do not anticipate future tests.
- Keep tests focused on observable behavior.

### 4. Refactor

After all tests pass, look for [refactor candidates](refactoring.md):

- [ ] Extract duplication.
- [ ] Deepen modules (move complexity behind simple interfaces).
- [ ] Apply SOLID principles where natural.
- [ ] Reconsider what the new code reveals about existing code.
- [ ] Run tests after each refactor step.

**Never refactor while RED.** Get to GREEN first.

### 5. Close out the task

Only after the task's behaviors are covered and validation passes:

- Update `tasks.md` per `spec-implementation` rules (Validation line should mention the TDD command, e.g. `pnpm test path/to/file ✅`).
- Mention TDD coverage briefly in the task entry so traceability is preserved.

## Per-Cycle Checklist

```
[ ] Test describes behavior, not implementation.
[ ] Test uses the public interface only.
[ ] Test would survive an internal refactor.
[ ] Code is minimal for this test.
[ ] No speculative features added.
[ ] Test was RED before it was GREEN.
```

## Interaction With Other Spec Skills

- `spec-implementation` still owns task ordering, status updates, and `tasks.md` checkboxes.
- This skill governs _how_ each task's code change is produced when TDD is on.
- If the project config disables TDD (`principles.tdd: false` or absent), follow `spec-implementation` without the red-green-refactor loop.
