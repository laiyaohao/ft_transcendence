# Project Audit — Up to Issue #33

**Repository:** `ft_transcendence` · branch `ai_ocr` · audited 27 Aug 2026
**Stack:** Next.js 16 (App Router, React 19, MUI 9, TypeScript, Vitest) + three Spring Boot services (`auth-service`, `grading-service`, `learning-service`) with Flyway-managed, service-isolated PostgreSQL schemas. Everything in issues #8–#33 lives in **`learning-service`** and the Next.js **`frontend`**.

> **Note on commit numbering.** Git commit subjects (`build: Issue 33 - AI Marking`) use a different numbering scheme than the GitHub issues audited here. All conclusions below come from reading the actual code, migrations, and tests — not from commit messages.

---

## Summary

```
Completed:            15
Partially Complete:    6
Not Started:           0
Blocked/Broken:        0
```
(21 rows — #17 and #19 are audited together as one class-flow item.)

**Verification performed:** frontend test suite executed in full — **29 test files, 136 tests, 0 failures**. `tsc --noEmit` passes clean. Backend tests could **not** be executed in this environment (JDK 11 only, no `javac`/Maven; the project needs JDK 17), so backend status is based on source review plus the recorded `surefire`/`failsafe` reports — see *Test Execution Caveat* below.

---

## Issue Audit

| Issue | Description | Status | Main Missing Work |
|---|---|---|---|
| #15 | Application shell (sidebar + top nav) | COMPLETE | — |
| #16 | Class database schema | COMPLETE | — |
| #17 / #19 | Overall class list + create/edit flows | COMPLETE | — |
| #18 | Class list retrieval API | COMPLETE | — |
| #20 | Class create/update APIs | COMPLETE | — |
| #21 | Class create/edit UI flow | COMPLETE | — |
| #22 | Class list UI | COMPLETE | — |
| #23 | Class detail page | PARTIAL | `?classId=` deep links ignored by targets; student rows not linked to profiles; Generate Worksheet disabled |
| #24 | Student database schema | COMPLETE | — |
| #25 | Student list page | PARTIAL | Ignores `?classId=` from the URL, so the link from Class Detail lands unfiltered |
| #26 | Create/edit student flow | COMPLETE | — |
| #27 | Tutor notes for students | COMPLETE | — |
| #12 | Student profile UI | PARTIAL | Recent improvement, worksheets completed, AI insights, Generate Worksheet, Upload Completed Worksheet |
| #13 | Student profile retrieval API | COMPLETE | — |
| #8 | Overall student profile page | PARTIAL | Same five items as #12 |
| #28 | Syllabus taxonomy schema | COMPLETE | — |
| #29 | Seed P5/P6 Science taxonomy | COMPLETE | (note) 3 topics carry no subtopic leaf |
| #30 | Question bank schema | COMPLETE | — |
| #31 | Question bank list page | PARTIAL | Topic filter is a raw numeric ID box — no subject/level/topic picker |
| #32 | Add/edit question form | PARTIAL | "Syllabus topic ID" is free-text numeric — no taxonomy selector |
| #33 | Question detail page | COMPLETE | — |

---

## #15 — Build application shell with sidebar and top navigation

**Status:** COMPLETE

### Existing Files
- `frontend/src/app/(main)/layout.tsx`, `wrapper.tsx`, `auth-guard.tsx`
- `frontend/src/components/sidebar.tsx`, `sidebar-page-item.tsx`, `sidebar-header-item.tsx`, `sidebar-divider-item.tsx`
- `frontend/src/components/topbar.tsx`, `navigation-config.ts`
- `frontend/src/context/sidebar-context.tsx`, `viewport-context.tsx`, `providers/*`
- `frontend/src/proxy.ts` (Next 16 middleware), `frontend/src/lib/auth.ts`
- `frontend/src/app/theme-provider.tsx`, `theme/theme-primitives.ts`, `globals.css`

### What Works
- Role-aware navigation: separate TUTOR and STUDENT item sets from `getNavigationItems(role)`, with correct active-item matching including nested routes.
- Topbar with account menu, profile link, and working logout that clears the session.
- `AuthGuard` renders four distinct states — loading, authorized, unauthenticated (sign-in prompt), unauthorized (return-home prompt) — and redirects appropriately.
- Server-side route hygiene in `proxy.ts`: protected-path redirects, public-path redirects for signed-in users, and role-based path checks, with a matcher covering every app route.
- Responsive desktop/mobile sidebar rendering, `#main-content` landmark, MUI theme + colour-mode provider.

### What Is Missing
- Nothing blocking. `sidebar-header-item` / `sidebar-divider-item` exist but the tutor nav is currently a flat list — grouping is available but unused.

### Tests Found
- `frontend/src/components/sidebar.test.tsx` (3)
- `frontend/src/components/topbar.test.tsx` (3)
- `frontend/src/components/navigation-config.test.ts` (4)
- `frontend/src/app/(main)/auth-guard.test.tsx` (5)
- `frontend/src/proxy.test.ts` (4)
- `frontend/src/lib/auth.test.ts` (4)

### Tests Still Required
- Mobile drawer open/close interaction.
- Keyboard focus moving to `#main-content` on route change.

### Recommendation
**CLOSE**

---

## #16 — Create class database schema

**Status:** COMPLETE

### Existing Files
- `backend/learning-service/src/main/resources/db/migration/V2__create_classes.sql`
- `V3__create_students.sql` (adds `uk_tutor_classes_id_owner`)
- `backend/learning-service/src/main/java/com/fttranscendence/learning/classroom/TutorClass.java`, `TutorClassRepository.java`

### What Works
- `tutor_classes`: owner scoping (`tutor_id > 0`), `normalized_class_name` with `UNIQUE (tutor_id, normalized_class_name)` for case/whitespace-insensitive duplicate prevention, non-blank checks on name/subject/level, `ACTIVE|INACTIVE` status check, `created_at`/`updated_at`, owner+status index.
- `class_schedules`: composite PK, day-of-week enumeration check, `start_time < end_time` check, `ON DELETE CASCADE` to the parent class.
- Composite unique key `(id, tutor_id)` enables owner-scoped composite FKs from memberships — cross-tutor references are impossible at the database level.

### What Is Missing
- Nothing. Subject and level are free text rather than FKs into the syllabus taxonomy — a deliberate choice, but see *Missing / Broken Connections*.

### Tests Found
- `classroom/TutorClassRepositoryTest.java` (5): required fields, invalid owner IDs, case/whitespace-insensitive duplicate names, inactive status + owner-scoped soft delete, no unscoped hard delete.
- `database/MigrationIntegrationTest.java`, `database/PostgresMigrationIntegrationTest.java`

### Tests Still Required
- None.

### Recommendation
**CLOSE**

---

## #18 — Implement API to retrieve class list · #20 — Implement APIs to create and update classes

**Status:** COMPLETE (both)

### Existing Files
- `classroom/ClassController.java`, `ClassService.java`, `ClassRequest.java`, `ClassDetailResponse.java`
- `config/SecurityConfig.java`, `security/JwtAuthenticationFilter.java`, `AuthenticatedUser.java`

### What Works
- `GET /api/learning/tutor/classes` — owner-scoped list.
- `GET /api/learning/tutor/classes/{classId}` — full detail (see #23).
- `POST` / `PUT /api/learning/tutor/classes[/{classId}]` — create and update with `@Valid` bodies.
- Structured `ApiError{code, message, fields}` for every failure mode: `CLASS_NOT_FOUND` (404), `CLASS_ALREADY_EXISTS` (409), `INVALID_CLASS_REQUEST` (400), `VALIDATION_FAILED` (400, per-field), `CLASS_DATABASE_UNAVAILABLE` (503), malformed JSON, and path-variable validation.
- `SecurityConfig` restricts `/api/learning/tutor/**` to `hasRole("TUTOR")`; every handler resolves the owner from `@AuthenticationPrincipal`, never from the request body.

### What Is Missing
- No pagination or filtering on the list endpoint (fine at current scale).
- No `DELETE`; deactivation is via `status: INACTIVE` — intentional.

### Tests Found
- `classroom/ClassControllerIntegrationTest.java` (5): owner-scoped list/create/update, unauthenticated + wrong-role rejection, structured validation/duplicate/missing/invalid-schedule errors, inactive status, duplicate schedules, database-error path.

### Tests Still Required
- None.

### Recommendation
**CLOSE** both

---

## #21 — Class creation/editing UI · #22 — Class list UI · #17 / #19 — Overall class flows

**Status:** COMPLETE

### Existing Files
- `frontend/src/components/classes/ClassForm.tsx`, `ClassList.tsx`
- `frontend/src/app/(main)/classes/page.tsx`, `classes/new/page.tsx`, `classes/[classId]/edit/page.tsx`
- `frontend/src/services/classes.ts`

### What Works
- Create and edit share one `ClassForm`; the edit route loads the class, shows a skeleton, and renders a *"Class cannot be edited"* card for an invalid or foreign ID.
- Client validation for name/subject/level plus schedule rows; server `fields` map is projected back onto the matching inputs; duplicate-submission guard while a request is in flight.
- `ClassList` covers all four render states — skeleton, retryable error, "No classes yet" empty state with a create CTA, and "No classes match these filters" — plus search/status filtering and per-card links to detail and edit.
- `services/classes.ts` runtime-validates every response shape before it reaches a component and raises typed `ClassApiError` with status and field map.

### What Is Missing
- Nothing for these issues.

### Tests Found
- `classes/ClassForm.test.tsx` (6), `classes/ClassList.test.tsx` (6), `services/classes.test.ts` (15)

### Tests Still Required
- None.

### Recommendation
**CLOSE**

---

## #23 — Build class detail page

**Status:** PARTIALLY COMPLETE

### Existing Files
- `frontend/src/components/classes/ClassDetail.tsx`
- `frontend/src/app/(main)/classes/[classId]/page.tsx`
- `classroom/ClassDetailResponse.java`, `ClassService.java`
- `insight/ClassInsightController.java`, `ClassInsightService.java`, `ClassInsightSnapshot.java`, `ClassInsightRefreshWorker.java`

### What Works
All six required sections render from real backend data:

| Required section | State |
|---|---|
| Class information | ✅ name, subject, level, status, schedules |
| Student list | ✅ first 5 with mastery %, record counts, "View all N" |
| Class mastery overview | ✅ `MasterySummary` — average, record count, students with mastery |
| Weak topics | ✅ `weakAreas` with score bars and affected-student chips |
| Student progress | ✅ per-student mastery + class-insight panel with persisted snapshots and tutor feedback |
| Recent worksheets | ✅ `worksheets` list with status/due dates |
| Generate Worksheet action | ⚠️ present but **disabled**, with an explanatory note |

- Loading skeleton, retryable error card, per-section empty states, and invalid-ID guard.
- The insight panel degrades independently: class data stays visible when the snapshot fails, with its own retry.

### What Is Missing
- **`Generate Worksheet` is a disabled placeholder** — expected before #34, but the issue is not closable until it is wired.
- **Dead deep links.** "View students" → `/students?classId={id}` and "View worksheets" → `/worksheets?classId={id}`. Neither target page reads `useSearchParams`, so both land on an unfiltered list.
- **Student rows are not links.** Names render as plain text; there is no path from a class to an individual student profile (only the bulk "View all" link, which is itself unfiltered).
- Class-insight ranking/feedback is read-only in this view ("Editing them is not available in this view yet").

### Tests Found
- `classes/ClassDetail.test.tsx` (7): loading, full render of all sections, empty states, retryable missing/wrong-owner error, invalid-reference guard, insight-failure isolation, background-refresh labelling.
- `classroom/ClassDetailIntegrationTest.java` (3): full detail from owned records, partial/empty details without inventing mastery or insights, missing/foreign class hiding + auth.

### Tests Still Required
- A test asserting the class → student-profile navigation path once student rows become links.
- A test asserting `?classId=` actually filters the students and worksheets pages.

### Recommendation
**COMPLETE MISSING WORK** — wire the deep links and student-row links now; leave `Generate Worksheet` for #34.

---

## #24 — Create student database schema

**Status:** COMPLETE

### Existing Files
- `V3__create_students.sql`
- `student/StudentProfile.java`, `ClassMembership.java`, `StudentProfileRepository.java`

### What Works
- `student_profiles`: owner scoping, optional `login_user_id` with `UNIQUE` so two profiles cannot claim one login, non-blank name, `UNIQUE (id, tutor_id)` for composite FK reuse.
- `class_memberships`: `UNIQUE (student_profile_id, class_id)`, **owner-scoped composite FKs** to both `student_profiles(id, tutor_id)` and `tutor_classes(id, tutor_id)` — a cross-tutor membership is rejected by the database, not just by service code. `CASCADE` on student removal, `RESTRICT` on class removal.

### What Is Missing
- Nothing required by the issue. The profile is deliberately thin (name + optional login link); all learning data lives in `mastery_records`, `worksheets`, `alerts`, `reports`, and `tutor_notes`.

### Tests Found
- `student/StudentProfileRepositoryTest.java` (7): canonical profile with optional login and several classes, required-field validation, duplicate login identity, duplicate membership, cross-tutor membership rejection, cascade/restrict semantics, no unscoped hard delete.

### Tests Still Required
- None.

### Recommendation
**CLOSE**

---

## #25 — Build student list page

**Status:** PARTIALLY COMPLETE

### Existing Files
- `frontend/src/components/students/StudentList.tsx`, `frontend/src/app/(main)/students/page.tsx`
- `frontend/src/services/students.ts`
- `student/StudentController.java` (`GET /api/learning/tutor/students?classId=`)

### What Works
- Responsive student cards with initials, class-membership chips, name search, class filter (including "Unassigned"), and per-card links to profile and edit.
- Loading skeleton, retryable error card, "No students yet" empty state with a create CTA, and "No students match these filters".
- Backend supports `?classId=` filtering server-side and returns owner-scoped results only.

### What Is Missing
- The page **ignores the `classId` query parameter**. `fetchTutorStudents(classId?)` accepts one and `StudentList` never passes it, so `/students?classId=7` shows every student with the filter set to "All classes".

### Tests Found
- `students/StudentList.test.tsx` (2): loading + cards + search + filters + navigation; empty and retryable error states.
- `services/students.test.ts` (13)
- `student/StudentManagementIntegrationTest.java` (5)

### Tests Still Required
- A test that `/students?classId=N` pre-selects the class filter.

### Recommendation
**COMPLETE MISSING WORK** (small — read the search param and seed the filter)

---

## #26 — Build create/edit student flow

**Status:** COMPLETE

### Existing Files
- `frontend/src/components/students/StudentForm.tsx`
- `frontend/src/app/(main)/students/new/page.tsx`, `students/[studentId]/edit/page.tsx`
- `student/StudentService.java`, `StudentRequest.java`

### What Works
- Shared create/edit form: full name, optional student login ID, and a **class-membership picker populated from `fetchTutorClasses()`** — the class list feeds the student form correctly.
- Client validation for name, numeric login ID, and duplicate class selection; server field errors mapped back to inputs; in-flight duplicate-submit guard.
- Backend rejects duplicate memberships (`DUPLICATE_MEMBERSHIP`), foreign classes (`CLASS_NOT_FOUND`), and duplicate login identities (`LOGIN_IDENTITY_CONFLICT`) with structured errors.

### What Is Missing
- Nothing required. The login ID is a raw numeric field — there is no user-lookup/search against `auth-service`, so a tutor must know the ID. Worth a follow-up issue, not a gap in #26.

### Tests Found
- `students/StudentForm.test.tsx` (3), `student/StudentManagementIntegrationTest.java` (5)

### Tests Still Required
- Missing-required-field submission (name blank) at component level — currently implicit.

### Recommendation
**CLOSE**

---

## #27 — Implement tutor notes for students

**Status:** COMPLETE

### Existing Files
- `V12__create_tutor_notes.sql`
- `student/TutorNote.java`, `TutorNoteRepository.java`, `TutorNoteService.java`, `TutorNoteRequest.java`
- `frontend/src/components/students/TutorNotes.tsx`

### What Works
- Owner-scoped table with a composite FK to `student_profiles(id, tutor_id)`, non-blank content check, and a `(tutor_id, student_profile_id, updated_at DESC, id DESC)` index for newest-first reads.
- Full CRUD: `GET/POST/PUT/DELETE /api/learning/tutor/students/{studentId}/notes[/{noteId}]`, with `TUTOR_NOTE_NOT_FOUND` and `TUTOR_NOTE_DATABASE_UNAVAILABLE` error codes.
- UI supports create, inline edit, delete with pending states, error banner with retry, and newest-first ordering. Rendered only inside the tutor-only branch of the profile, so a student-shaped payload never requests notes.

### Tests Found
- `student/TutorNoteIntegrationTest.java` (4): create/edit/delete/newest-first, XSS payload retained as plain text, empty/malformed rejection, foreign-student hiding, student-role denial, database-error path.
- `students/TutorNotes.test.tsx` (4)

### Tests Still Required
- None.

### Recommendation
**CLOSE**

---

## #13 — Implement API to retrieve student profile

**Status:** COMPLETE

### Existing Files
- `student/StudentController.java`, `StudentService.java`, `StudentProfileResponse.java`
- `mastery/MasteryRecord.java`, `MasteryHistory.java`, `report/ProgressReport.java`, `alert/TutorAlert.java`

### What Works
- `GET /api/learning/tutor/students/{studentId}/profile` and `GET /api/learning/student/profile`, sharing one response shape.
- Returns classes, metrics (average mastery, topic count, total attempts, last calculated), full topic mastery, derived `learningProfile.strengths` / `focusAreas`, mastery history, assigned worksheets, and a `tutorOnly` block (alerts + report metadata).
- `tutorOnly` is **null** for student self-access, so tutor workflow data cannot leak through the shared shape. Report snapshot content and submission identifiers are deliberately excluded.

### Tests Found
- `student/StudentProfileIntegrationTest.java` (4): canonical complete profile for owner + restricted fields for a linked student, partial/new profiles without inventing metrics, missing/foreign/unlinked hiding and role enforcement, database-error path.

### Tests Still Required
- None.

### Recommendation
**CLOSE**

---

## #12 — Build student profile UI · #8 — Complete overall student profile page

**Status:** PARTIALLY COMPLETE (both)

### Existing Files
- `frontend/src/components/students/StudentProfile.tsx`
- `frontend/src/app/(main)/students/[studentId]/page.tsx`
- `frontend/src/components/students/TutorNotes.tsx`

### What Works

| Required item | State |
|---|---|
| Student information | ✅ avatar, name, class chips, edit link |
| Mastery score | ✅ "Overall mastery" metric tile |
| Recent improvement | ⚠️ **not a metric** — a "Mastery history" list of previous → new score changes exists, but no headline improvement figure |
| Current weak area | ✅ "Focus areas" count tile + growth-area list |
| Worksheets completed | ❌ only **assigned** worksheets are shown; no completed count or completion state |
| Learning profile | ✅ strengths / growth-areas panel |
| Strengths | ✅ |
| Areas for growth | ✅ |
| Topic mastery | ✅ sorted rows with progress bars and focus-area chips |
| AI insights | ❌ **absent** — the class page has an insight panel; the student page has none |
| Tutor notes | ✅ full CRUD, tutor-only |
| Generate Worksheet | ❌ **absent** — no button at all |
| Upload Completed Worksheet | ❌ **absent** — `/upload` exists but is not reachable from the profile |

- Also correct: loading skeleton, invalid-reference guard, retryable error with a "Back to students" escape, empty states that never fabricate values, and a tutor-records card for alerts and reports.

### What Is Missing
1. A **recent improvement** metric (the backend already returns `history` with previous/new scores — this is a derivation, not new API work).
2. A **worksheets completed** count — needs a completion signal the current `WorksheetAssignmentSummary` does not carry.
3. An **AI insights** section for the student (no per-student insight endpoint exists; `insight/` is class-scoped only).
4. **Generate Worksheet** action.
5. **Upload Completed Worksheet** action.

### Tests Found
- `students/StudentProfile.test.tsx` (4): loading → full canonical profile with safe action links, partial/new-profile states without fabricated values, invalid/missing/server errors, and no private-note request for a student-facing payload.
- `services/students.test.ts` (13), `student/StudentProfileIntegrationTest.java` (4)

### Tests Still Required
- Rendering and empty state of a recent-improvement metric.
- Rendering and empty state of a worksheets-completed metric.
- AI-insights section: loading, failure isolation, and unavailable state.
- Generate Worksheet / Upload Completed Worksheet action rendering and navigation.

### Recommendation
**COMPLETE MISSING WORK** for both #12 and #8. Items 1 and 5 are cheap and can be done now; items 2, 3 and 4 depend on worksheet and insight work (#34+) and should be tracked as explicit sub-tasks rather than silently deferred.

---

## #28 — Create syllabus taxonomy database schema

**Status:** COMPLETE

### Existing Files
- `V4__create_syllabus.sql`, `V6__create_questions.sql` (adds `uk_syllabus_topics_id_node_type`)
- `syllabus/SyllabusTopic.java`, `SyllabusTopicRepository.java`

### What Works
The required relationship is supported — and the implementation is a **superset**, with an extra MOE `THEME` tier:

```
SUBJECT (depth 0)
  → LEVEL (depth 1)
      → THEME (depth 2)
          → TOPIC (depth 3)
              → SUBTOPIC (depth 4)
```

- A single `CHECK` constraint binds `node_type`, `depth`, `parent_id` and `parent_depth` together, so a node can only ever attach to the correct parent tier.
- The composite FK `(parent_id, parent_depth) → (id, depth)` makes level-skipping and cycles impossible at the database level.
- Stable `code` uniqueness, `UNIQUE (parent_id, sort_order)` and `UNIQUE (parent_id, name)` for deterministic sibling ordering, `curriculum_version`, mandatory `source_reference`, `active` flag, and `ON DELETE RESTRICT`.
- The repository intentionally exposes **no mutation methods** — taxonomy changes go through migrations only.

### What Is Missing
- There is no explicit *Learning Objective* tier below `SUBTOPIC`. If learning objectives are needed as first-class records later, that is a new tier or a new table.

### Tests Found
- `syllabus/SyllabusIntegrationTest.java` (6): roots + complete topic set, every parent at the required depth, duplicate stable-code rejection, cycle and skipped-level rejection, deterministic sibling ordering, and no mutation methods on the repository.

### Tests Still Required
- None.

### Recommendation
**CLOSE**

---

## #29 — Seed P5/P6 Science syllabus taxonomy

**Status:** COMPLETE (with a coverage note)

### Existing Files
- `V5__seed_p5_p6_science.sql`

### What Works
- 24 active nodes under `MOE_PRIMARY_SCIENCE_2023`, each carrying the MOE PDF source URL: 1 subject, 2 levels (Primary 5, Primary 6), 4 themes (P5: Cycles, Systems · P6: Energy, Interactions), 9 topics, 8 subtopics.
- Every insert resolves its parent by `code` via `SELECT`, so IDs are never hard-coded and the seed is re-runnable in a clean database.
- The exact node count and hierarchy are asserted in `SyllabusIntegrationTest`.

### What Is Missing
- Three topics have **no subtopic leaf**: `SCI_P5_SYSTEMS_ELECTRICAL`, `SCI_P6_ENERGY_CONVERSION`, `SCI_P6_INTERACTIONS_ENVIRONMENT`. Questions can still attach directly to a `TOPIC`, so this is not a blocker — but topic-level granularity will be coarser for those three when generating worksheets.

### Tests Found
- `syllabus/SyllabusIntegrationTest.java` (6) — asserts the exact expected code set.

### Tests Still Required
- None for the seed itself; extend the assertion list if the three gaps are filled.

### Recommendation
**CLOSE** (open a small follow-up for the three missing subtopic sets)

---

## #30 — Create question bank database schema

**Status:** COMPLETE

### Existing Files
- `V6__create_questions.sql`
- `question/Question.java`, `MarkingComponent.java`, `QuestionRepository.java`

### What Works
Every field the issue calls for is supported:

| Required field | Where |
|---|---|
| Subject | via taxonomy walk from `syllabus_topic_id` (not denormalized) |
| Level | via taxonomy walk (not denormalized) |
| Topic | `syllabus_topic_id` when `node_type = TOPIC` |
| Subtopic | `syllabus_topic_id` when `node_type = SUBTOPIC` |
| Question | `prompt VARCHAR(4000)` |
| Question type | 7-value CHECK enum |
| Marks | `total_marks DECIMAL(6,2) > 0` |
| Model answer | `model_answer VARCHAR(4000)` |
| Keywords | `question_keywords` — ordered, unique per question, lower-cased by CHECK |
| Marking components | `marking_components` — ordered, described, individually marked, cascade-deleted |

- The composite FK `(syllabus_topic_id, syllabus_topic_type) → syllabus_topics(id, node_type)` plus `CHECK (syllabus_topic_type IN ('TOPIC','SUBTOPIC'))` makes it structurally impossible to hang a question off a subject, level, or theme.
- `code` is canonicalised to uppercase by CHECK and globally unique; `archive_state` gives soft archival with `ON DELETE RESTRICT` from the taxonomy.

### What Is Missing
- Subject and level are **derivable but not stored or exposed**. The list API returns only the leaf topic `{id, code, name, nodeType}`, so the UI cannot show or filter by subject/level without walking the tree — see *Missing / Broken Connections*.

### Tests Found
- `question/QuestionRepositoryTest.java` (9): complete multi-component question, missing required fields, TOPIC/SUBTOPIC-only enforcement, non-existent taxonomy reference, marking components that do not total the question marks, cascade + orphan removal, canonicalised duplicate codes, case/whitespace-insensitive duplicate keywords, archive-without-hard-delete.

### Tests Still Required
- None.

### Recommendation
**CLOSE**

---

## #31 — Build question bank list page

**Status:** PARTIALLY COMPLETE

### Existing Files
- `frontend/src/components/questions/QuestionList.tsx`
- `frontend/src/app/(main)/questions/page.tsx`
- `frontend/src/services/questions.ts`
- `question/QuestionController.java`, `QuestionService.java`

### What Works
- `GET /api/learning/tutor/questions` with `topicId`, `questionType`, `archiveState`, `page`, `size` (1–100) and a stable pagination envelope (`items`, `page`, `size`, `totalElements`, `totalPages`, `hasNext`).
- Skeleton loading state, retryable error card, "No questions match these filters" empty state with a clear-filters action, previous/next pagination that resets on filter change, and a selection that survives page changes.
- Every card links to the detail page and keeps an edit shortcut; response payloads are runtime-validated before render.

### What Is Missing
- **The topic filter is a raw numeric "Syllabus topic ID" text box.** There is no subject → level → topic → subtopic picker, and no way to see which ID corresponds to which topic. A tutor cannot use this filter without querying the database directly.
- No free-text search over prompt or keywords.
- No subject/level filter (the API does not expose those fields).

### Tests Found
- `questions/QuestionList.test.tsx` (5): loading before cards, combined controls + pagination reset + selection retention, responsive empty state + clear filters, retryable service/invalid-payload error, detail and edit links.
- `services/questions.test.ts` (9)
- `question/QuestionListIntegrationTest.java` (5): active-question listing with stable pagination, combined filters + empty page past the end, invalid-query rejection + tutor-role enforcement, and two database-error paths.

### Tests Still Required
- Topic-picker rendering, cascade behaviour (subject → level → topic → subtopic), and loading/error states for the taxonomy fetch.
- A test that selecting a topic in the picker issues the correct `topicId` query.

### Recommendation
**COMPLETE MISSING WORK** — the list itself is solid; the taxonomy picker is the outstanding piece.

---

## #32 — Build add/edit question form

**Status:** PARTIALLY COMPLETE

### Existing Files
- `frontend/src/components/questions/QuestionForm.tsx`
- `frontend/src/app/(main)/questions/new/page.tsx`, `questions/[questionId]/edit/page.tsx`
- `question/QuestionRequest.java`, `QuestionService.java`

### What Works
- All question fields are present: code, question type, availability, prompt, total marks, keywords, model answer, and a repeatable marking-criteria list with add/remove.
- Strong client validation: two-decimal mark precision, **criteria marks must total exactly the question marks**, ≤100 criteria, ≤100 unique keywords, length caps matching the database.
- Server `fields` errors map onto the matching inputs; duplicate-submit guard; the edit route pre-fills from the fetched question.
- Backend refuses content changes to a question already used in a worksheet (`QUESTION_IN_USE`, 409) while still allowing archive-only updates, and resolves the syllabus node type server-side rather than trusting the client.

### What Is Missing
- **"Syllabus topic ID" is a free-text numeric field** with the helper text *"Use an existing active topic or subtopic."* There is no subject/level/topic/subtopic selector, no name shown for the entered ID, and no validation feedback until the server rejects it. This is the single biggest usability gap in the question bank.

### Tests Found
- `questions/QuestionForm.test.tsx` (4)
- `question/QuestionMutationIntegrationTest.java` (4): create/read/replace all tutor-only metadata, invalid taxonomy + marks + duplicate code rejection, worksheet-protection with archive-only updates permitted, missing/malformed/unauthorised rejection.

### Tests Still Required
- Taxonomy selector: valid selection, cascade reset when the parent changes, and the topic-fetch failure state.
- Backend-rejection test for an out-of-range/invalid topic selected through the picker.

### Recommendation
**COMPLETE MISSING WORK** — replace the ID field with a taxonomy picker.

---

## #33 — Build question detail page

**Status:** COMPLETE

### Existing Files
- `frontend/src/components/questions/QuestionDetail.tsx`
- `frontend/src/app/(main)/questions/[questionId]/page.tsx`

### What Works
- Renders code, type label, total marks, prompt, ordered marking guidance with per-criterion marks, model answer, syllabus link (`name · code · nodeType`), and keyword chips with an explicit "no key terms recorded" state.
- Back link to the question bank, edit shortcut, and an "Add to worksheet draft" action that is correctly disabled for archived questions, with a polite live-region status message.
- Skeleton loading, invalid-reference guard, and a retryable error card.
- The draft selection is stored in `sessionStorage` with a documented rationale and a storage-unavailable fallback — deliberately local until the #34 worksheet editor consumes it.

### What Is Missing
- Nothing for this issue. Subject and level are not shown alongside the topic, because the API returns only the leaf node — see *Missing / Broken Connections*.

### Tests Found
- `questions/QuestionDetail.test.tsx` (6)
- `question/QuestionDetailIntegrationTest.java` (3): complete tutor detail with syllabus + marking metadata, archived questions visible to tutors but role-protected, structured not-found.

### Tests Still Required
- None.

### Recommendation
**CLOSE**

---

## Existing Working Flow

Three chains work end-to-end today, from migration through to a rendered page.

**Classes**

```
V2/V3 migrations → TutorClass + TutorClassRepository → ClassService
  → GET/POST/PUT /api/learning/tutor/classes → services/classes.ts (runtime-validated)
  → ClassList (/classes) → ClassForm (/classes/new, /classes/[id]/edit)
  → ClassDetail (/classes/[id]) with mastery, weak areas, insights, worksheets
```

A tutor can sign in, land on a role-correct shell, create a class with schedules, see it in the list, edit it, and open a detail page assembled from real mastery and worksheet records. Duplicate names, foreign classes, and database outages all surface as structured, retryable UI states.

**Students**

```
V3 + V12 migrations → StudentProfile + ClassMembership + TutorNote
  → /api/learning/tutor/students[/{id}][/profile][/notes] → services/students.ts
  → StudentList (/students) → StudentForm (/students/new, /students/[id]/edit)
  → StudentProfile (/students/[id]) → TutorNotes (CRUD)
```

The student form pulls its class options from the live class API, so **Classes → Students is genuinely connected**, and the composite owner-scoped FKs make a cross-tutor membership impossible. The profile page renders mastery, history, learning profile, classes, assigned worksheets, alerts, reports, and tutor notes from one canonical endpoint.

**Question bank**

```
V4 (taxonomy) → V5 (P5/P6 seed) → V6 (questions + components + keywords)
  → QuestionService (resolves node type from the taxonomy) → /api/learning/tutor/questions
  → services/questions.ts → QuestionList (/questions) → QuestionForm (new/edit)
  → QuestionDetail (/questions/[id]) → sessionStorage worksheet draft
```

Create → list → filter → open → edit → archive all work, and the database refuses any question that does not point at an active TOPIC or SUBTOPIC.

---

## Missing / Broken Connections

**1. Syllabus taxonomy → Question Bank UI — the significant gap.**
There is **no `SyllabusController`** in `learning-service`. The taxonomy is reachable only from inside the JVM (`SyllabusTopicRepository`, used by `QuestionService`, `WorksheetService`, `ClassInsightService`). Consequently:
- `QuestionForm` asks the tutor to type a numeric **"Syllabus topic ID"**.
- `QuestionList` filters by the same raw numeric ID.
- `WorksheetBuilder` already asks for **comma-separated topic IDs** — so this gap will land on #34 immediately.
The chain `Syllabus Taxonomy → Question Bank → Question List → Add/Edit → Detail` is intact at the *data* layer and broken at the *presentation* layer.

**2. Class Detail → Students / Worksheets deep links are inert.**
`ClassDetail` links to `/students?classId={id}` and `/worksheets?classId={id}`. No page other than `/tutor/worksheets/new` calls `useSearchParams`, so both links reach an unfiltered list. The backend already supports `GET /students?classId=`.

**3. Class Detail → individual student profile has no path.**
Student rows in the class detail render as text, not links to `/students/{id}`.

**4. `/topics` is disconnected from the real taxonomy.**
`app/(main)/topics/page.tsx` and `topics/[topicId]/page.tsx` import from `lib/student-mock-data.ts`. They are student-facing mock screens with no relationship to `syllabus_topics`.

**5. Subject and Level are invisible on questions.**
`QuestionBankItem.syllabusTopic` carries only `{id, code, name, nodeType}`. Neither the list nor the detail page can display or filter by subject or level without a taxonomy endpoint.

**6. Worksheet generation is stubbed everywhere (expected pre-#34).**
`ClassDetail`'s Generate Worksheet button is disabled with an explanatory note; the tutor dashboard's Generate/Upload buttons only announce text. `StudentProfile` has neither button at all.

**7. Class subject/level are free text.**
`tutor_classes.subject` and `class_level` are unconstrained strings, unrelated to the taxonomy. A class of `"P5"` / `"Science"` has no structural link to `SCI_P5`, which will matter when worksheets are generated for a class.

**8. Orphan file outside the service tree.**
`grading-service/src/test/java/com/fttranscendence/grading/controller/SubmissionControllerTest.java` sits at the repository root, outside `backend/grading-service/`. It is not part of any Maven module and will never run.

---

## Outstanding Issues in Recommended Order

### 1. Syllabus taxonomy API + picker component (affects #31, #32)
Add a read-only `SyllabusController` (`GET /api/learning/shared/syllabus/...` returning subjects, levels, themes, topics, subtopics — the repository already has every query needed), a `services/syllabus.ts` client, and one reusable cascading `SyllabusPicker`. **Do this first:** it is the only item that blocks work already queued, it unblocks #31 and #32 together, and `WorksheetBuilder` will need the exact same component for #34.

### 2. #32 — Replace the "Syllabus topic ID" field with the picker
Depends on step 1. Small change once the component exists; makes the question form usable by an actual tutor.

### 3. #31 — Replace the numeric topic filter with the picker
Depends on step 1. Consider adding subject/level filters once the API exposes the parent chain.

### 4. #23 — Wire the class detail deep links
Independent of the taxonomy work. Make student rows link to `/students/{id}`, and make `/students` and `/worksheets` honour `?classId=`.

### 5. #25 — Honour `?classId=` on the students page
The same change as the second half of step 4; keep it on this issue if you prefer the smaller scope.

### 6. #12 / #8 — Recent improvement + Upload Completed Worksheet
Both are derivable from data already returned. Recent improvement comes from `profile.history`; the upload action is a link to the existing `/upload` route with the student in context.

### 7. #12 / #8 — Worksheets completed, AI insights, Generate Worksheet
Genuinely blocked on worksheet and per-student insight work. Track them explicitly against #34+ rather than leaving #12 and #8 open indefinitely.

### 8. #29 — Fill the three empty topics (optional)
Add subtopics for `SCI_P5_SYSTEMS_ELECTRICAL`, `SCI_P6_ENERGY_CONVERSION`, `SCI_P6_INTERACTIONS_ENVIRONMENT` in a new migration and extend the `SyllabusIntegrationTest` assertion list.

---

## Tests Still Required

**Backend (`learning-service`)**
- `syllabus/SyllabusControllerIntegrationTest.java` — *new*: successful tree/children retrieval, unknown parent ID → 404, invalid node type → 400, role enforcement, database-unavailable path.
- Extend `student/StudentProfileIntegrationTest.java` if a recent-improvement or worksheets-completed field is added to the response.

**Frontend — components**
- `components/syllabus/SyllabusPicker.test.tsx` — *new*: rendering, cascade reset when a parent changes, loading state, taxonomy-fetch error state, empty level.
- `services/syllabus.test.ts` — *new*: response validation, invalid-payload rejection, typed API error.
- `components/questions/QuestionForm.test.tsx` — extend: valid submission via the picker, missing topic selection, backend rejection of the selected topic.
- `components/questions/QuestionList.test.tsx` — extend: picker-driven `topicId` query and filter reset.
- `components/students/StudentList.test.tsx` — extend: `?classId=N` pre-selects the class filter.
- `components/classes/ClassDetail.test.tsx` — extend: student rows link to `/students/{id}`; deep links carry `classId`.
- `components/students/StudentProfile.test.tsx` — extend: recent-improvement metric (value + empty state), Upload Completed Worksheet action, and later worksheets-completed and AI-insights sections.

**Integration**
- A frontend integration test covering class detail → filtered student list → student profile.
- A frontend integration test covering taxonomy pick → question create → question appears under that topic filter.

---

## Test Execution Caveat

- **Frontend: executed and green.** 29 test files, **136 tests, 0 failures**, run per-directory against the repository as it stands. `tsc --noEmit` also passes. (One `act(...)` warning in `StudentForm.test.tsx` — a warning, not a failure.)
- **Backend: not executed.** This environment has JDK 11 with no `javac` and no Maven; the project requires JDK 17. The 20 backend test classes were reviewed as source.
- **The recorded backend reports are stale.** `target/surefire-reports` and `target/failsafe-reports` show all-green results, but their timestamps place the last full run at **26 Aug 02:17** — *before* `ClassDetailIntegrationTest`, `QuestionListIntegrationTest`, `QuestionMutationIntegrationTest`, `QuestionDetailIntegrationTest`, `StudentManagementIntegrationTest`, `StudentProfileIntegrationTest` and `TutorNoteIntegrationTest` were written. The reports also still contain `ClassControllerDatabaseFailureIntegrationTest`, whose source no longer exists.
- **Recommended before acting on this audit:** run `mvn -f backend/learning-service/pom.xml clean verify` on a JDK 17 machine. Roughly 60 backend tests across 20 classes have no recorded green run in this workspace.

---

## Ready for Issue #34?

**NO — Complete the following first: #31, #32.**

The data foundation is genuinely ready: the taxonomy, question bank, class and student schemas are well-constrained, the APIs are owner-scoped with structured error handling, and every read path already has integration coverage. #34 is not blocked by missing data.

It *is* blocked by the missing taxonomy API. `WorksheetBuilder` already asks a tutor to type **comma-separated syllabus topic IDs** — the same unusable pattern as `QuestionForm` and `QuestionList`. Building #34 on top of that repeats the defect a third time. Adding the syllabus endpoint and one shared picker closes #31 and #32 and hands #34 the component it needs on day one.

The remaining partials — #23's deep links and #12/#8's five missing profile items — should be tracked and fixed, but they do not block worksheet development and can proceed in parallel.
