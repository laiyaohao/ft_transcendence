request validation
response schemas
error format
HTTP status behaviour
pagination conventions
sorting/filter syntax
date serialization
nullable vs optional
IDs
versioning
idempotency
authorization boundary
frontend/server trust boundary

Never infer an API contract independently from frontend needs.

Before changing an endpoint:

1. locate its server implementation;
2. locate all callers;
3. locate shared types/schema;
4. locate tests;
5. identify compatibility consequences.