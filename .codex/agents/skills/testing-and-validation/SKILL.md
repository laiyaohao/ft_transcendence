---
name: testing-and-validation
description: >
  Use when adding tests, changing application behaviour, fixing bugs,
  validating a feature, preparing completion, or reviewing implementation
  correctness.
---

# Testing and Validation

## Testing pyramid

### Unit
Use for:
- calculations
- transformations
- validation
- pure business rules

### Component
Use for:
- component behaviour
- conditional UI
- controls
- validation states

### Integration
Use for:
- API + state interactions
- database-backed workflows
- multi-component behaviour

### End-to-end
Use for critical user flows.

## Critical Lumina flows

Always consider regression coverage for:

1. Generate worksheet
2. Upload worksheet
3. OCR verification
4. AI marking
5. Tutor approval
6. Save learning profile
7. Updated mastery
8. Next worksheet uses updated data

## Test principle

Test observable behaviour, not implementation details.

Do not weaken an assertion merely to make implementation pass.