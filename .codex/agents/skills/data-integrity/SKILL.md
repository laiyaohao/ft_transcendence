## Source-of-truth rules

Every derived value must have one canonical derivation.

Never separately persist values that can safely and cheaply be derived
unless the architecture explicitly requires materialization.

## Learning state

Tutor-approved marking is authoritative.

AI suggestions are never authoritative student records.

## Atomic updates

When marking is committed, all affected values must be updated as one
logical operation.

Examples:

- approved score
- topic mastery
- overall mastery
- improvement delta
- weak topic
- mistake history
- pending review count
- worksheet status

A partially updated learning profile is invalid.

## Idempotency

Repeated submission of the same save request must not:
- duplicate mistake history
- increment worksheet totals twice
- decrement pending counts twice

## Derived values

Do not trust values supplied by the frontend when they can be recalculated
from authoritative backend data.