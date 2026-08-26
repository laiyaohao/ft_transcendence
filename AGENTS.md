# Project Agent Instructions

## Mission

Work on this repository incrementally, safely, and with verifiable tests.

Prefer the cheapest capable model for each task.

The primary engineering agent should remain responsible for:
- task state
- integration
- architectural consistency
- acceptance criteria
- final verification

Do not expand the requested scope without a concrete reason.

---

## Model Routing

Use the following custom agents where appropriate.

### scout_luna

Use for:
- initial repository reconnaissance
- searching files and symbols
- identifying relevant existing implementations
- locating tests
- identifying dependencies
- locating relevant skills
- gathering context
- summarizing large amounts of repository information

Prefer scout_luna before expensive reasoning when repository knowledge
is required.

scout_luna must not modify application code.

### architect_sol

Use only when the task involves:
- ambiguous requirements
- architecture decisions
- significant data-model changes
- authentication or authorization
- security-sensitive behavior
- major refactoring
- difficult debugging after ordinary attempts fail
- consequential API changes
- conflicting architectural constraints

architect_sol should normally produce a plan or review rather than
perform routine implementation.

Do not use architect_sol merely because a task is large.

### implementer_terra

Use for:
- normal feature implementation
- cross-file changes
- business logic
- refactoring
- API implementation
- database integration
- state-management changes
- non-trivial bug fixes
- integration work

Terra is the default implementation model.

### routine_luna

Use for bounded, deterministic work such as:
- repetitive edits
- boilerplate
- straightforward isolated implementation
- renaming
- fixtures
- simple schemas
- documentation
- searching
- mechanical transformations

Every routine_luna task must have:
- a bounded objective
- explicit file scope where practical
- acceptance criteria
- validation instructions

Do not allow multiple writing agents to modify overlapping files
simultaneously.

### test_engineer_terra

Use after meaningful implementation changes for:
- test design
- test harness review
- integration testing
- diagnosing test failures
- verifying edge cases
- checking whether tests actually validate requirements

Test failures caused by implementation should be repaired by the
implementation agent.

---

## Standard Workflow

For substantial feature work:

1. Understand the user's requested outcome.

2. Spawn scout_luna when repository discovery is required.

3. Identify relevant skills using available skill metadata.
   Load only skills materially relevant to the task.

4. If there is a consequential architectural decision, spawn
   architect_sol after reconnaissance and wait for its recommendation.

5. Convert the agreed approach into bounded implementation tasks.

6. Use implementer_terra for normal engineering work.

7. Delegate clearly bounded repetitive work to routine_luna where doing
   so saves time or context.

8. Keep parallel write tasks on disjoint file sets.

9. Integrate changes before final testing.

10. Have test_engineer_terra review the implementation and run the
    appropriate validation.

11. Fix failures and rerun affected tests.

12. Escalate back to architect_sol when:
    - two reasonable repair attempts fail for the same underlying issue;
    - an architectural assumption proves false;
    - requirements conflict;
    - a significant schema/API change becomes necessary;
    - security or authorization implications appear.

13. Before completion, check all acceptance criteria against the final
    implementation.

---

## Skill Routing

Skills encode project-specific procedures and constraints.

Agents must load only the skills materially relevant to their current task.

### Design work

When implementing or modifying tutor-facing UI, use:

- `lumina-design-system`
- `frontend-engineering`

Also use `accessibility` for interactive UI.

The Lumina design skill is an umbrella skill.
Read only the component references relevant to the current screen.

Do not load every design reference by default.

### AI workflows

For functionality where AI proposes, marks, ranks, recommends or
generates content that can affect student state, use:

- `ai-human-approval`
- `data-integrity`

Add `lumina-design-system` when user-facing AI surfaces are involved.

### Backend/API work

Use:

- `api-contracts`

Add:

- `database-and-migrations`

when persistent schema or query behaviour changes.

### Student data or protected actions

Use:

- `security-and-privacy`

Escalate consequential authentication or authorization decisions to
`architect_sol`.

### Testing

After meaningful implementation, use:

- `testing-and-validation`

For user-facing UI, also use:

- `accessibility`
- `browser-qa`

### Skill discovery

`scout_luna` should identify potentially relevant skills during
reconnaissance.

The parent agent decides the final skill set.

Do not activate a skill merely because it is tangentially related.
--

## Testing

Before declaring work complete, run the relevant available checks.

Typical sequence:

1. formatter
2. lint
3. type checking
4. targeted unit tests
5. affected integration tests
6. full test suite when practical

Never claim a test passed unless it was actually executed successfully.

Report tests that could not be run and explain why.

---

## Change Discipline

Prefer:
- existing patterns over new abstractions
- small changes over unnecessary rewrites
- existing dependencies over new dependencies
- testable increments
- explicit validation

Do not:
- introduce dependencies without justification
- silently change public behavior
- rewrite unrelated code
- weaken tests to make an implementation pass
- hide failing tests
- duplicate an existing abstraction without first locating it

---

## Completion Report

At completion report:

- what changed
- files materially changed
- architectural decisions
- tests executed
- test results
- remaining limitations or risks