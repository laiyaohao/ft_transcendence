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

# Code Quality and Readability Guidelines

When creating, modifying, or refactoring code in this repository, optimize primarily for human readability and maintainability.

## Core Principle

Code should be written so that another developer can understand its purpose without having to mentally decode compressed expressions or trace unnecessary abstractions.

Prefer:

* clear;
* explicit;
* predictable;
* boring;
* well-named;

code over clever or compact code.

---

## Human Readability

Do not optimize for the fewest number of lines.

Use additional lines when they make code easier to scan.

For example:

```ts
const activeMemberTasks = memberTasks.filter(
  (task) => task.status === "active"
);
```

is preferred over an unnecessarily long single line.

---

## Line Length

Keep lines approximately 80–100 characters where practical.

This is a readability guideline rather than an absolute rule.

When a function call, conditional, object, array, JSX element, or expression becomes difficult to scan horizontally, break it onto multiple lines.

Prefer:

```ts
const board = await createBoard({
  presetId: preset.id,
  presetName: preset.name,
  createdBy: currentUser.id,
});
```

instead of putting every argument on one line.

---

## Naming

Use names that describe business meaning.

Prefer:

```text
outstandingTasks
presetMembers
createdBoard
assignedMember
hasActiveSubtasks
shouldCreateTaskCard
```

over vague names such as:

```text
data
obj
res
tmp
val
x
thing
```

Boolean names should usually communicate a true/false question:

```text
isActive
hasPermission
canCreateBoard
shouldDisplayCard
```

---

## Functions

Functions should generally perform one understandable responsibility.

If a function contains multiple distinct phases, consider extracting clearly named helpers.

Do not create unnecessary microscopic functions.

Extraction is useful only when it improves comprehension, reuse, testing, or separation of responsibilities.

---

## Complex Logic

Do not compress substantial business logic into a single expression.

Use intermediate variables with meaningful names where they help explain the logic.

Prefer:

```ts
const isAssignedToMember =
  task.memberId === member.id;

const isOutstanding =
  task.status !== "completed";

if (isAssignedToMember && isOutstanding) {
  // ...
}
```

when this is easier to understand than a dense condition.

---

## Control Flow

Prefer early returns and guard clauses when they reduce nesting.

Avoid deeply nested:

```text
if
  if
    if
      if
```

structures where the same behavior can be expressed clearly through guard clauses.

---

## Comments

Comments should primarily explain:

* business reasons;
* important constraints;
* non-obvious decisions;
* compatibility concerns;
* why an unusual implementation exists.

Do not add comments that merely translate the syntax into English.

---

## Business Rules

Important business rules should be easy to locate.

Where practical, place them behind clearly named domain functions instead of duplicating them across UI, APIs, and database operations.

The name of the function should help explain the rule.

---

## Frontend Code

Avoid putting substantial business logic directly inside JSX.

Prefer descriptive event handlers and computed variables.

Break very large components into meaningful subcomponents when doing so improves comprehension.

Do not fragment components merely to make files shorter.

---

## TypeScript

Prefer useful explicit domain types.

Avoid `any` unless genuinely necessary.

Do not introduce advanced generic types when a simpler type communicates the intent more clearly.

---

## Abstractions

Do not abstract code simply because two pieces of code look slightly similar.

A shared abstraction should make the system easier to understand.

Do not introduce:

* unnecessary wrapper classes;
* unnecessary factories;
* unnecessary indirection;
* generic helpers with unclear purposes;
* architecture patterns that do not solve an actual problem.

---

## Refactoring Safety

When performing cleanup or readability refactoring:

* preserve existing behavior;
* preserve API contracts;
* preserve database behavior;
* preserve authorization rules;
* preserve routes;
* preserve integration behavior;
* preserve user-facing workflows.

Do not mix unrelated feature changes into a readability refactor.

---

## Validation

After meaningful code changes, use the project's existing validation tools where applicable:

* tests;
* type checking;
* lint;
* formatter;
* build.

Do not remove or weaken tests simply to make a refactor pass.

---

## Existing Conventions

Follow existing project conventions where they are reasonable.

When existing conventions conflict with readability, prefer the clearer implementation while minimizing unnecessary repository-wide churn.

---

## Code Review Test

Before considering code complete, ask:

1. Is the purpose obvious?
2. Are the names meaningful?
3. Are any lines unnecessarily long?
4. Is any logic unnecessarily compressed?
5. Is there excessive nesting?
6. Is business logic mixed with presentation logic?
7. Are abstractions helping or hurting comprehension?
8. Could a new developer safely modify this code?

If the answer to the last question is no, simplify further.

---

## Priority

Always favor:

```text
Clarity > cleverness
Explicitness > compression
Maintainability > fewer lines
Human readability > abstraction for abstraction's sake
```
