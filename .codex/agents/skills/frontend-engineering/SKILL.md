---
name: frontend-engineering
description: >
  Use when implementing or modifying frontend application code,
  React components, routes, state, forms, hooks, data loading,
  interaction logic, or reusable UI components.
---

# Frontend Engineering

## Before implementation

1. Inspect the existing frontend architecture.
2. Identify existing reusable components.
3. Identify established styling conventions.
4. Identify established state-management conventions.
5. Identify API/data-loading conventions.
6. Identify nearby tests.

Never introduce a new architectural pattern when an existing one solves
the problem adequately.

## Component rules

- Keep presentation and business logic appropriately separated.
- Prefer reusable components for repeated behaviour.
- Avoid premature abstraction.
- Do not duplicate existing components.
- Preserve type safety.
- Keep state as local as reasonably possible.
- Derived values should be derived rather than duplicated in state.

## Async UI

Every asynchronous operation must account for:

- idle
- loading
- success
- empty
- recoverable error
- unrecoverable error where applicable

## Forms

- Validate input at appropriate boundaries.
- Preserve user input after recoverable failures.
- Prevent duplicate submissions.
- Explain validation failures next to the affected field.
- Do not rely exclusively on button disabling for validation.

## Completion

Run:
- formatter
- lint
- type checking
- relevant tests