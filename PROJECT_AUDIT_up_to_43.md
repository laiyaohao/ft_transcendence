# Project Audit — Up to Issue #43

**Repository:** `ft_transcendence` · branch `ai_ocr` · HEAD `f2b1dfb` · audited 28 Aug 2026
**Scope:** Issues #8, #12, #13, #15–#43. Audit only — no files were modified, created, deleted, or committed.

> **Note on commit numbering (carried forward from the #33 audit, and now confirmed worse).** Git commit subjects use a *different* numbering scheme than the issues audited here. `f2b1dfb build: Issue 43 - report PDF export` and `89db53f build: Issue 42 - Report Page` do not correspond to this brief's #43 (Mastery Record Schema) or #42 (Rule-Based Answer Checker); the checker was actually landed as `87ca310 build: Issue 32 - Checker`. **Every conclusion below comes from reading the code, migrations, and tests — never from commit messages.** See §8 for why this matters.

---

## 1. Current Technology Stack

Verified from manifests and source, not assumed.

| Layer | Actual technology | Evidence |
|---|---|---|
| Frontend framework | Next.js **16.2.6**, App Router, React **19.2.4** | `frontend/package.json:22-25` |
| Styling | MUI **9.1.1** + Emotion (`@emotion/react`, `@emotion/styled`) — no Tailwind, no CSS modules | `frontend/package.json:14-21` |
| Frontend language | TypeScript 5, `tsc --noEmit` typecheck script | `frontend/package.json:9` |
| Frontend tests | **Vitest 4.1** + Testing Library + jsdom; separate unit and integration configs | `frontend/vitest.config.mts`, `vitest.integration.config.mts` |
| Backend framework | **Spring Boot 4.0.6** (auth, learning) / **4.1.0** (grading), Java 17 | `backend/*/pom.xml` parent blocks |
| Database | **PostgreSQL 18-alpine**; one instance, three isolated schemas (`auth`, `grading`, `learning`) | `compose.yaml:2-17`, `README.md` "Database ownership" |
| Migrations | **Flyway**, per-schema history, `clean-disabled=true` | `backend/*/src/main/resources/application.properties` |
| ORM | **Spring Data JPA / Hibernate**, `ddl-auto=validate` (never mutates tables) | `backend/learning-service/src/main/resources/application.properties` |
| Validation | **jakarta.validation** (`@NotBlank`, `@Size`, `@Positive`, `@Valid`, `@AssertTrue`) on request records *and* entities, plus service-level cross-field rules, plus DB `CHECK` constraints | `ClassRequest.java:14-33`, `QuestionRequest.java`, `Question.java:209-217` |
| PDF | **Apache PDFBox 3.0.6**, direct programmatic composition — not HTML-to-PDF, not browser print | `backend/learning-service/pom.xml:77-81`, `pdf/PdfDocumentService.java` |
| PDF fonts | Noto Sans Regular/Bold embedded as subsetted `PDType0Font` (CID) — real non-ASCII support | `resources/fonts/NotoSans-*.ttf`, `PdfDocumentService.java:155-167` |
| Auth | BCrypt + JJWT 0.11.5 signed JWTs, `ROLE_TUTOR` / `ROLE_STUDENT` authorities, `anyRequest().denyAll()` default | `auth-service/security/JwtService.java`, `learning/config/SecurityConfig.java:37` |
| JSON | **Jackson 3** (`tools.jackson.*`), auto-configured by Spring Boot 4 | `learning/report/ReportService.java:5` |
| Backend tests | JUnit 5 + Spring Boot Test + MockMvc + Testcontainers (Postgres, `disabledWithoutDocker`); surefire (unit) / failsafe (IT) | `backend/*/pom.xml` |

---

## 2. Audit Summary

```
Completed:            20
Partially Complete:   10
Not Started:           1
Blocked/Broken:        0  (two confirmed production defects flagged — see §5)
```
(31 rows — #17 and #19 audited together as one class-flow item.)

**Verification performed.** All conclusions are from reading source, migrations, and test assertions on the live working tree. Two headline defects were independently re-verified line-by-line after the domain sweeps, not taken on trust.

**Frontend suite: executed and green.** `npm test` on the developer's machine, 28 Aug 14:46 — **44 test files, 195 tests, 0 failures, 19.56 s**. Every frontend conclusion in this audit is therefore backed by an observed run, not just source reading. Four `act(...)` warnings appeared (in `QuestionForm`/`SyllabusPicker`, `topbar`/`ButtonBase`, `StudentForm`); none failed, but see §8 item 10.

**Backend suite: still unverified — it cannot currently be run at all.** `npm run test:auth` failed before compiling a single class:

```
[ERROR] No compiler is provided in this environment.
        Perhaps you are running on a JRE rather than a JDK?
```

The development machine has a Java **runtime**, not a **JDK** — there is no `javac`. `README.md` and `DEPENDENCIES.md` already call this out ("a complete JDK 17 containing `javac`; a Java runtime alone cannot compile the backend"). Because `npm test` chains the suites and halts on first failure, **grading-service and learning-service never ran either**. This audit environment cannot substitute: the shell reaching the project folder has JDK 11, no Maven Central access (`403 from proxy`), and no Docker for Testcontainers.

Backend status therefore rests on source review plus the recorded `surefire`/`failsafe` reports under `backend/*/target/` — real output from earlier runs on 25–28 Aug, some of which are stale. **§7 flags exactly which.** This is not a footnote: it is the second of the two items blocking #44 in §9, and it is now a harder blocker than expected, because the toolchain needed to clear it is missing.

---

## 3. Issue Status

| Issue | Description | Status | Main Missing Work |
|---|---|---|---|
| #15 | Application shell (sidebar + top nav) | COMPLETE | — |
| #16 | Class database schema | COMPLETE | — |
| #17 / #19 | Overall class list + create/edit flows | COMPLETE | — |
| #18 | Class list retrieval API | COMPLETE | — |
| #20 | Class create/update APIs | COMPLETE | — |
| #21 | Class create/edit UI flow | COMPLETE | — |
| #22 | Class list UI | COMPLETE | — |
| #23 | Class detail page | PARTIALLY COMPLETE | Write inside a read-only transaction — endpoint likely 503s on PostgreSQL; schedule not rendered |
| #24 | Student database schema | COMPLETE | — |
| #25 | Student list page | COMPLETE | — |
| #26 | Create/edit student flow | COMPLETE | — |
| #27 | Tutor notes for students | COMPLETE | — |
| #12 | Student profile UI | PARTIALLY COMPLETE | No Generate Worksheet action; no worksheets-completed metric (needs backend field) |
| #13 | Student profile retrieval API | COMPLETE | — |
| #8 | Overall student profile page | PARTIALLY COMPLETE | Student-facing `/profile` is 100% mock data; real endpoint exists but has no caller |
| #28 | Syllabus taxonomy schema | COMPLETE | — |
| #29 | Seed P5/P6 Science taxonomy | COMPLETE | 3 topics have no subtopic leaf; seed is not re-runnable |
| #30 | Question bank schema | COMPLETE | — |
| #31 | Question bank list page | PARTIALLY COMPLETE | **No search of any kind**; `SyllabusPicker` reset bug clears the whole cascade |
| #32 | Add/edit question form | COMPLETE | — |
| #33 | Question detail page | COMPLETE | — |
| #34 | Worksheet database schema | PARTIALLY COMPLETE | No marks/prompt snapshot; no unique `(worksheet_id, position)`; no subject; no worksheet-type column |
| #35 | Worksheet generation flow | PARTIALLY COMPLETE | Selection ignores topic spread; no student-generation UI; no remove/replace question |
| #36 | Diagnostic worksheet generation | **NOT STARTED** | Generates nothing — existing service is a read-only mastery triage list, unreachable from the UI |
| #37 | Worksheet detail page | PARTIALLY COMPLETE | Subject, topics and total marks not rendered (topic data is already on the wire) |
| #38 | Printable worksheet PDFs | COMPLETE | — |
| #39 | Student answer schema | COMPLETE | `worksheet_question_id` carries two different ID namespaces (acknowledged debt) |
| #40 | Manual result entry page | PARTIALLY COMPLETE | No edit path (409 dead end); one question per save |
| #41 | Mistake type taxonomy | PARTIALLY COMPLETE | 10-value `MistakeType` has no API and no UI; a rival 4-value taxonomy is the one in use |
| #42 | Rule-based keyword/component checker | PARTIALLY COMPLETE | **Component half unbuilt** — ignores per-component mark weights; no endpoint; only runs when AI fails |
| #43 | Mastery record schema | COMPLETE | — |

---

## Issue Audit

### Application Shell

## #15 — Build application shell with sidebar and top navigation

**Status:** COMPLETE

### Evidence
- `frontend/src/app/(main)/layout.tsx`, `wrapper.tsx`, `auth-guard.tsx`
- `frontend/src/components/sidebar.tsx`, `topbar.tsx`, `navigation-config.ts`
- `frontend/src/proxy.ts`, `frontend/src/lib/auth.ts`

### What Works
- Role-aware navigation is real: `navigation-config.ts:24-48` returns disjoint TUTOR/STUDENT item sets; `isNavigationItemSelected:50-54` handles exact and nested matches without `/` matching everything.
- Desktop `<aside>` at ≥880px plus a horizontal mobile rail, both with `aria-label` and `aria-current` (`sidebar.tsx:60,109`).
- Topbar has a working skip-link to `#main-content` (matches `wrapper.tsx:35`), keyboard-accessible account menu, and a logout that clears the session and redirects (`topbar.tsx:52-56`).
- Route gating is doubled — client `auth-guard.tsx:31-51` and edge `proxy.ts` on the `auth_token` cookie.

### What Is Missing
- `SidebarProps.disableCollapsibleSidebar` and `container` are accepted then discarded (`sidebar.tsx:41-42`). There is no collapse behaviour; `wrapper.tsx:22,32` renders `Sidebar` twice to fake responsive switching.
- `sidebar-divider-item.tsx` and `sidebar-header-item.tsx` are dead code (no importers).

### Tests Found
- `frontend/src/components/navigation-config.test.ts`, `sidebar.test.tsx`, `topbar.test.tsx`
- `frontend/src/app/(main)/auth-guard.test.tsx`, `frontend/src/proxy.test.ts`, `frontend/src/lib/auth.test.ts`

### Tests Still Required
- None for shipped behaviour. If a collapsible sidebar was in scope, it has no implementation and therefore no tests.

### Recommendation
CLOSE (raise a separate ticket if collapse was actually required)

---

### Classes

## #16 — Create class database schema

**Status:** COMPLETE

### Evidence
- `backend/learning-service/src/main/resources/db/migration/V2__create_classes.sql`
- `.../V3__create_students.sql:1-2` (adds `uk_tutor_classes_id_owner`)
- `backend/learning-service/src/main/java/com/fttranscendence/learning/classroom/TutorClass.java`

### What Works
- `tutor_classes` with owner, name, `normalized_class_name`, subject, level, status, timestamps; DB-level guards `tutor_id > 0`, non-blank trims, `status IN ('ACTIVE','INACTIVE')`, `UNIQUE (tutor_id, normalized_class_name)` (`V2:11-16`).
- `class_schedules` child table: composite PK, day enum check, `start_time < end_time`, `ON DELETE CASCADE` (`V2:19-34`).
- Entity mirrors it — `@ElementCollection` `ScheduleSlot` with `equals`/`hashCode` so duplicates collapse (`TutorClass.java:221-237`); `@PrePersist`/`@PreUpdate` derive `normalizedClassName` (`:94-122`).
- `ddl-auto=validate` catches entity/schema drift at boot.

### What Is Missing
- Nothing. `tutor_id` is an unvalidated cross-service id by deliberate design (`docs/architecture/service-boundaries.md`).

### Tests Found
- `backend/.../database/MigrationIntegrationTest.java:58-148`
- `backend/.../classroom/TutorClassRepositoryTest.java`
- `backend/.../database/PostgresMigrationIntegrationTest.java`

### Tests Still Required
- None.

### Recommendation
CLOSE

---

## #17 / #19 — Complete overall class list and create/edit class flows

**Status:** COMPLETE

### Evidence
- `frontend/src/app/(main)/classes/page.tsx`, `classes/new/page.tsx`, `classes/[classId]/edit/page.tsx`, `classes/[classId]/page.tsx`
- `frontend/src/components/classes/ClassList.tsx`, `ClassForm.tsx`, `ClassDetail.tsx`
- `frontend/src/services/classes.ts:324-392`

### What Works
- The whole loop is navigable: list → Create class → form → `router.push("/classes")`; card → Open class summary → detail; card/detail → Edit → prefilled form → save → list.
- Edit prefill is real, with a distinct "not available in your account" message for a foreign/missing id (`edit/page.tsx:38-49`).
- Every class component is reachable from a route — no orphans.

### What Is Missing
- The edit page fetches the whole class list to find one class (`edit/page.tsx:40-41`) although `GET /classes/{id}` exists. Works, but O(n) per edit.
- No delete/archive action; deactivation only via the status select.

### Tests Found
- `frontend/src/components/classes/ClassList.test.tsx`, `ClassForm.test.tsx`, `ClassDetail.test.tsx`
- `frontend/src/services/classes.test.ts`

### Tests Still Required
- Route-level tests for `classes/new` and `classes/[classId]/edit` — the `router.push` wiring and the prefill/`MissingClass` branch are untested.

### Recommendation
CLOSE

---

## #18 — Implement API to retrieve class list

**Status:** COMPLETE

### Evidence
- `backend/.../classroom/ClassController.java:38-51`
- `backend/.../classroom/ClassService.java:57-63, 231-247`
- `backend/.../classroom/TutorClassRepository.java:16-25`
- `backend/.../config/SecurityConfig.java:33`

### What Works
- `GET /api/learning/tutor/classes` returns only `tutorId`-owned rows, sorted case-insensitively by name then id (`ClassService.java:241-246`), each with sorted schedules.
- `GET .../{classId}` 404s (`CLASS_NOT_FOUND`) on a foreign or missing id rather than 403 — ids are not enumerable.
- Role gating at the filter chain (`hasRole("TUTOR")`), `anyRequest().denyAll()` default.
- Structured `ApiError(code, message, fields)`, with `DataAccessException` → `503 CLASS_DATABASE_UNAVAILABLE`.

### What Is Missing
- No pagination or server-side filtering — the list is unbounded and `ClassList.tsx:145-152` filters client-side.
- `ownedClasses` runs two queries (ACTIVE + INACTIVE) then re-sorts in memory, though `findAllByTutorIdOrderByClassNameAsc` already exists.

### Tests Found
- `backend/.../classroom/ClassControllerIntegrationTest.java:48-106`
- `frontend/src/services/classes.test.ts:67-105`

### Tests Still Required
- Large-list/pagination coverage, only if pagination is added.

### Recommendation
CLOSE

---

## #20 — Implement APIs to create and update classes

**Status:** COMPLETE

### Evidence
- `backend/.../classroom/ClassController.java:53-69, 86-117`
- `backend/.../classroom/ClassService.java:192-229, 249-303`
- `backend/.../classroom/ClassRequest.java:14-33`

### What Works
- `POST` → 201; `PUT /{classId}` owner-scoped via `findByIdAndTutorId`, 404 otherwise.
- jakarta.validation on the request record plus service rules annotations cannot express — start<end and no duplicate slots (`ClassService.java:261-278`) — all surfaced as `400 INVALID_CLASS_REQUEST`.
- Duplicate names caught twice: application pre-check (`:288-303`) and the unique constraint via `DataIntegrityViolationException` → `409 CLASS_ALREADY_EXISTS`.
- `MethodArgumentNotValidException` maps to a `fields` map the form consumes directly (`ClassForm.tsx:198`).

### What Is Missing
- No `DELETE`/archive endpoint. `TutorClassRepository.deactivateOwnedClass:27-35` is implemented and tested but has **no caller in main code** — dead capability.
- `ensureNameAvailable` calls `ownedClasses(tutorId)` up to three times per request (`:290,297`) — up to 6 extra queries per create/update.

### Tests Found
- `backend/.../classroom/ClassControllerIntegrationTest.java:109-240`
- `frontend/src/services/classes.test.ts:164-225`

### Tests Still Required
- Boundary test on `@Size(max = 7)` schedules — 7 accepted, 8 rejected, currently unasserted server-side.

### Recommendation
CLOSE

---

## #21 — Build class creation/editing UI flow

**Status:** COMPLETE

### Evidence
- `frontend/src/components/classes/ClassForm.tsx`
- `frontend/src/app/(main)/classes/new/page.tsx:19`, `classes/[classId]/edit/page.tsx:79`

### What Works
- One component serves both modes, prefilled by `valuesFor(initialClass)` (`:52-61`), with mode-specific labels (`:209-210`).
- Client validation mirrors the server contract exactly — max lengths 120/80/40, ≤7 schedules, per-slot day/start/end, `start >= end` rejection, duplicate-slot detection (`:67-109`).
- Server field errors merge into the same error map (`:197-199`) so a 409 on `className` lights up the right input.
- Double-submit blocked by a ref guard plus a disabled button (`:142,180,256`).

### What Is Missing
- `addSchedule` sets `errors.schedules = ""` rather than deleting the key (`:170`) — a falsy-string sentinel, harmless today.
- The `status` select appears on create too, so a class can be created directly INACTIVE.

### Tests Found
- `frontend/src/components/classes/ClassForm.test.tsx` (6 interaction tests incl. trimmed-payload assertion at `:48-54`)

### Tests Still Required
- Nothing significant.

### Recommendation
CLOSE

---

## #22 — Build class list UI

**Status:** COMPLETE

### Evidence
- `frontend/src/components/classes/ClassList.tsx`, `frontend/src/app/(main)/classes/page.tsx:26`

### What Works
- Four genuine states: skeleton (`:100-113`), `role="alert"` error with retry (`:161-169`), "No classes yet", and "No classes match these filters" with a clear-filters action.
- Status pills with `aria-pressed`; search matches className, subject **and** level (`:145-152`).
- Cards show name, level, status chip, subject chip, human-readable schedule with a "Schedule to be confirmed" fallback (`:53-55`).

### What Is Missing
- Filtering and search are entirely client-side over an unbounded list.
- Hard-coded hex colours throughout while `theme/theme-primitives.ts` sits unused — consistency risk, not functional.

### Tests Found
- `frontend/src/components/classes/ClassList.test.tsx` (6 tests: skeleton→cards, schedule rendering, filter + search, retryable error, empty + clear, keyboard reachability)

### Tests Still Required
- None.

### Recommendation
CLOSE

---

## #23 — Build class detail page

**Status:** PARTIALLY COMPLETE

> The feature set is genuinely complete and well tested. It is downgraded from COMPLETE for one reason: a confirmed write-inside-a-read-only-transaction that H2 masks and PostgreSQL will reject. See §5 defect **D2**.

### Evidence
- `backend/.../classroom/ClassDetailResponse.java`, `ClassService.java:66-161`
- `frontend/src/components/classes/ClassDetail.tsx`, `frontend/src/app/(main)/classes/[classId]/page.tsx`
- `backend/.../insight/ClassInsightService.java:93-96, 177-178`

### What Works — required items, item by item

| Required item | Backend | Frontend | Real? |
|---|---|---|---|
| Class information | `className/subject/level/status/schedules` | header `ClassDetail.tsx:181` | Yes (schedules returned but not rendered) |
| Student list | `findAllByTutorIdAndClassIdOrderByFullNameAsc` (`ClassService.java:71-72`) | first 5 + "View all N" (`:189`) | Yes |
| Student progress | `overallMastery` + `masteryRecordCount` per student (`:137-147`) | per-row percent, `—` when null | Yes |
| Topic/class mastery | `MasterySummary(averageScore, recordCount, studentsWithMastery)` | 3 metric tiles (`:185`) | Yes |
| Weak areas | topics averaged, filtered `< 70.00`, sorted by affected count (`:98-105`) | progress bars + "N AFFECTED" chips (`:190`) | Yes |
| Recent worksheets | `findClassAssignedWorksheetsByTutorId` + assignment dates (`:107-110,149-161`) | rows with status chip and link (`:65-72`) | Yes |
| Generate Worksheet | — | links to `/tutor/worksheets/new?classId={id}` (`:194`), and that route reads `classId` | Yes |

- Deep links resolve: `/students?classId=` is honoured by `students/page.tsx:13-15`; student rows link to `/students/{id}`.
- Insight failure is isolated — class data stays visible when the snapshot request fails (`:193`).

### What Is Missing
- **The endpoint is likely broken on PostgreSQL.** `ClassService.getOwnedClassDetail` is `@Transactional(readOnly = true)` (`ClassService.java:65`) and calls `insightService.insights(...)` at `:131`. `ClassInsightService.insights` is `@Transactional` with default REQUIRED propagation, so it **joins** the read-only transaction rather than starting a new one — Spring ignores an inner `readOnly` flag on a participating transaction. Inside it, `requestRefreshIfMissingOrStale` → `requestRefresh` executes `jdbc.update("update class_insight_refresh_queue …")` and an `insert` (`ClassInsightService.java:177-178`). PostgreSQL rejects writes in a read-only transaction, which `ClassController.java:95-99` would surface as `503 CLASS_DATABASE_UNAVAILABLE` on the **first** load of any class detail and after every mastery change. The sibling endpoint `GET /classes/{id}/insights` is unaffected — `ClassInsightController.java:31` calls `insights()` directly, starting its own writable transaction.
- Class schedule is in the payload but never rendered on the detail page.
- `findClassAssignedWorksheetsByTutorId` does not filter by status (`WorksheetRepository.java:49-61`), so DRAFT/ARCHIVED class worksheets appear here — while the student profile equivalent filters to APPROVED. The same class shows two different worksheet sets in two places.

### Tests Found
- `backend/.../classroom/ClassDetailIntegrationTest.java` (full detail with real averages 50.00/60.00, weak-area ordering, partial/empty class returning nulls not invented values, 404/404/401/403)
- `frontend/src/components/classes/ClassDetail.test.tsx` (7 tests, all four action hrefs incl. Generate Worksheet, insight-failure isolation)
- `frontend/src/services/classes.test.ts:107-161`

### Tests Still Required
- **A PostgreSQL-backed test of `GET /api/learning/tutor/classes/{id}` on a class with no insight snapshot.** `ClassDetailIntegrationTest.java:77` asserts `insight.status = REFRESHING`, i.e. it *does* exercise the write path — but only against H2 (`src/test/resources/application.properties:1`, `jdbc:h2:mem:learning-test;MODE=PostgreSQL`). This is the exact test that would have caught D2.
- A backend test pinning whether a DRAFT class worksheet should appear in `worksheets`.

### Recommendation
COMPLETE MISSING WORK — fix the transaction boundary before closing.

---

### Students

## #24 — Create student database schema

**Status:** COMPLETE

### Evidence
- `backend/learning-service/src/main/resources/db/migration/V3__create_students.sql`
- `backend/.../student/StudentProfile.java`, `ClassMembership.java`

### What Works
- `student_profiles` with owner, optional `login_user_id`, name, timestamps; checks `tutor_id > 0`, `login_user_id > 0 OR NULL`, non-blank name, `UNIQUE (login_user_id)`, `UNIQUE (id, tutor_id)` (`V3:4-16`).
- `class_memberships` enforces tenancy **in the database** — composite FKs `(student_profile_id, tutor_id)` and `(class_id, tutor_id)` (`V3:26-29`) make a cross-tutor membership physically impossible. Student deletion cascades; class deletion is `RESTRICT`.
- `UNIQUE (student_profile_id, class_id)` prevents duplicate memberships.

### What Is Missing
- No `status`/archived flag on a student (classes have one) — students can be edited but never deactivated.

### Tests Found
- `backend/.../student/StudentProfileRepositoryTest.java` (7 tests incl. cross-tutor membership rejection and cascade vs restrict)
- `backend/.../database/MigrationIntegrationTest.java:63-64`

### Tests Still Required
- None.

### Recommendation
CLOSE

---

## #25 — Build student list page

**Status:** COMPLETE

> Upgraded from PARTIAL in the #33 audit: the `?classId=` deep link is now honoured end to end.

### Evidence
- `frontend/src/components/students/StudentList.tsx`, `frontend/src/app/(main)/students/page.tsx`
- `backend/.../student/StudentController.java:43-49`, `StudentService.java:61-74`

### What Works
- `GET /api/learning/tutor/students?classId=` is owner-scoped and validates class ownership before filtering (`StudentService.java:64-66`) — a foreign `classId` returns `404 CLASS_NOT_FOUND`, not an empty list.
- The deep link from class detail works: `students/page.tsx:13-15` parses it, `StudentList` passes it to the service (`:70,78`) and syncs the visible filter (`:88`).
- Cards render avatar/initials, linked-vs-tutor-managed state, class chips with `+N` overflow, updated date, profile/edit links. Skeleton, retryable error, empty state with CTA, no-match state with clear-filters.

### What Is Missing
- The class-filter dropdown is built only from classes present on already-loaded students (`:90-94`), so a `?classId=`-deep-linked page lists only that one class in the dropdown.
- No server-side pagination; search is client-side.

### Tests Found
- `frontend/src/components/students/StudentList.test.tsx` (incl. `expect(loadStudents).toHaveBeenCalledWith(12)` proving the deep link reaches the service)
- `backend/.../student/StudentManagementIntegrationTest.java:74-99`
- `frontend/src/services/students.test.ts:62-89`

### Tests Still Required
- A test that the class-filter dropdown is usable when deep-linked.

### Recommendation
CLOSE

---

## #26 — Build create/edit student flow

**Status:** COMPLETE

### Evidence
- `frontend/src/components/students/StudentForm.tsx`, `students/new/page.tsx`, `students/[studentId]/edit/page.tsx`
- `backend/.../student/StudentController.java:59-74`, `StudentService.java:101-192`

### What Works
- `POST` → 201; `PUT /{studentId}` owner-scoped. Membership diffing is real set-reconciliation, removing then adding only what changed (`StudentService.java:141-160`).
- jakarta.validation plus service rules: duplicate `classId` → `409 DUPLICATE_MEMBERSHIP`, non-owned class → `404 CLASS_NOT_FOUND`, reused login → `409 LOGIN_IDENTITY_CONFLICT` checked pre-emptively (`:333-342`) **and** via the unique constraint (`:367-372`).
- The membership picker loads owned classes with its own skeleton/error/retry (`StudentForm.tsx:114-132`), `aria-pressed` toggles, de-dupes before submit (`:69`).

### What Is Missing
- No delete/deactivate for a student (no endpoint, no UI).
- `students/[studentId]/edit/page.tsx` uses a bare "Loading student…" `role="status"` instead of the skeleton pattern used elsewhere — cosmetic.

### Tests Found
- `frontend/src/components/students/StudentForm.test.tsx`
- `backend/.../student/StudentManagementIntegrationTest.java:49-190` (rejections followed by a GET proving the student was not mutated)
- `frontend/src/services/students.test.ts:90-139`

### Tests Still Required
- Route-level test for `students/[studentId]/edit` (prefill + error branch).

### Recommendation
CLOSE

---

## #27 — Implement tutor notes for students

**Status:** COMPLETE

### Evidence
- `backend/learning-service/src/main/resources/db/migration/V12__create_tutor_notes.sql`
- `backend/.../student/TutorNote.java`, `TutorNoteRepository.java`, `TutorNoteService.java`, `StudentController.java:89-124`
- `frontend/src/components/students/TutorNotes.tsx`, `frontend/src/services/students.ts:423-465`

### What Works
- Full CRUD under the `TUTOR`-only path, so students can never reach notes.
- Tenancy enforced three times: composite FK `(student_profile_id, tutor_id)` (`V12:10-11`), `requireOwnedStudent` (`TutorNoteService.java:70-74`), and `findByIdAndTutorIdAndStudentProfileId` on every mutation. The entity re-validates ownership on persist and update (`TutorNote.java:54-72`).
- Ordering `updated_at DESC, id DESC` with a matching index (`V12:14-15`); UI re-sorts optimistically with the same rule.
- Rendered as text with `whiteSpace: pre-wrap` — no `dangerouslySetInnerHTML` anywhere. `TutorNotes` mounts only when `profile.tutorOnly` is non-null (`StudentProfile.tsx:111`), so a student payload never triggers a note request.

### What Is Missing
- Nothing functional. Notes are unpaginated.

### Tests Found
- `backend/.../student/TutorNoteIntegrationTest.java` (XSS payload retained as literal text; foreign-student/foreign-note hiding; 503 database-failure variant)
- `frontend/src/components/students/TutorNotes.test.tsx` (real DOM XSS assertion — `container.querySelector("script")` null, `window.__noteXss` undefined)
- `frontend/src/services/students.test.ts:164-201`

### Tests Still Required
- None.

### Recommendation
CLOSE

---

## #12 — Build student profile UI

**Status:** PARTIALLY COMPLETE

### Evidence
- `frontend/src/components/students/StudentProfile.tsx`
- `frontend/src/components/students/LearningInsightsPanel.tsx`, `frontend/src/services/insights.ts`
- `frontend/src/app/(main)/students/[studentId]/page.tsx:48`

### What Works — required items

| Required item | State | Where |
|---|---|---|
| Student information | Yes | `:83-87` |
| Learning profile | Yes | `:105` |
| Strengths | Yes, top 3 with score | `:105` |
| Areas for growth | Yes, top 3 focus areas | `:105` |
| Topic mastery | Yes, sorted desc, FOCUS AREA chip below 55 | `:99, :56-65` |
| Weak areas | Yes, focus-area count tile + growth list | `:93, :105` |
| Tutor notes | Yes, tutor payloads only | `:111` |
| Worksheets | **Partial** — assigned only, no completion state | `:109` |
| Progress information | Yes — overall mastery, attempts, recent improvement, last updated, history | `:90-94, :101` |
| AI / evidence insights | Yes — `LearningInsightsPanel` now on the page | `students/[studentId]/page.tsx:48` |
| Relevant actions | **Partial** — Upload + Edit present, **no Generate Worksheet** | `:86` |

- Empty states are honest — `percent(null)` renders `—`, never a fabricated 0 (`:38-40`). Invalid id short-circuits before any request (`:118-123`).

### What Is Missing
1. **No Generate Worksheet action** — class detail has one (`ClassDetail.tsx:194`), the student profile does not.
2. **No worksheets-completed metric** — `StudentProfileResponse.WorksheetAssignmentSummary` carries no completion signal, so only assignments can be listed. Needs a backend field.
3. Reports in the tutor-records card are plain text; `/reports/[reportId]` exists as a route but nothing links to it.

### Tests Found
- `frontend/src/components/students/StudentProfile.test.tsx` (4 tests, real hrefs, `+6%` improvement derivation, honest empty states)
- `frontend/src/components/students/LearningInsightsPanel.test.tsx` — **1 test, happy path only (17 lines)**
- `frontend/src/services/students.test.ts:140-163`, `insights.test.ts`

### Tests Still Required
- Generate Worksheet action rendering + href, once added.
- Worksheets-completed metric, once the backend supplies it.
- `LearningInsightsPanel` loading, error-with-retry, and empty-findings states.
- Route-level test that profile + insights + mastery compose without one failure blanking the others.

### Recommendation
COMPLETE MISSING WORK (items 1 and 3 are cheap; item 2 needs a backend field)

---

## #13 — Implement API to retrieve student profile

**Status:** COMPLETE

### Evidence
- `backend/.../student/StudentController.java:76-87`
- `backend/.../student/StudentService.java:83-99, 194-321`
- `backend/.../student/StudentProfileResponse.java`

### What Works
- Two endpoints share one response shape: `GET /tutor/students/{id}/profile` (owner-scoped) and `GET /student/profile` (resolved by `login_user_id`).
- The payload is assembled from records, not stubs: class summaries, metrics, full topic mastery, `learningProfile.strengths` (≥85) and `focusAreas` (<70 or NEEDS_REVISION) (`:224-238`), mastery history capped at 50 newest-first, and effective worksheets combining direct **and** class assignments, APPROVED only (`:257-283`).
- `tutorOnly` is populated for tutors and **null** for student self-access (`:249-251`); `ReportMetadata` omits the snapshot, `HistoryItem` omits `sourceSubmissionId`.
- Missing, foreign and unlinked all return the same `404 STUDENT_PROFILE_NOT_FOUND` — ids are not enumerable.

### What Is Missing
- Nothing on the producer side. `/api/learning/student/profile` has **no frontend caller** — a consumer gap, tracked under #8.

### Tests Found
- `backend/.../student/StudentProfileIntegrationTest.java` (exact computed values `averageMastery 73.50`, `totalAttempts 5`; `tutorOnly` null for the student; `sourceSubmissionId`/`snapshot` proven absent)
- `backend/.../insight/LearningProfileIntegrationTest.java`, `LearningProfileServiceTest.java`
- `backend/.../security/DataAccessAuthorizationIntegrationTest.java:59-77`

### Tests Still Required
- None.

### Recommendation
CLOSE

---

## #8 — Complete overall student profile page

**Status:** PARTIALLY COMPLETE

### Evidence
- Tutor-facing: `frontend/src/app/(main)/students/[studentId]/page.tsx`
- Student-facing: `frontend/src/app/(main)/profile/page.tsx`
- `frontend/src/lib/student-mock-data.ts`

### What Works
- The **tutor-facing** student page is a complete, routed, live-data page composing `StudentProfile` + `LearningInsightsPanel` + `MasteryMap` (`:48`), each loading independently with its own skeleton, error and retry (`:16-43`), so one failing request does not blank the page.
- TUTOR-gated by `lib/auth.ts:22` and `proxy.ts`.

### What Is Missing
1. **The student-facing `/profile` page is entirely mock-backed.** `profile/page.tsx:13` imports `student` from `lib/student-mock-data`; it hard-codes "Primary 5 · Lumina Academy" and student ID `LUM-2026-0148` (`:24-26`). "Edit profile" and "Change password" only set a local status string.
2. `GET /api/learning/student/profile` and `/student/learning-profile` are implemented, role-gated and integration-tested server-side, but `/profile` calls neither.
3. `navigation-config.ts:32,43` points **both** roles at `/profile`, so a signed-in tutor also sees the student mock.
4. Inherits #12's gaps.

### Tests Found
- Component/service tests listed under #12.
- **No test exists for `students/[studentId]/page.tsx` or `profile/page.tsx`.**

### Tests Still Required
- Page test for `/students/[studentId]` asserting the three panels coexist and fail independently.
- Once `/profile` is wired: loading, error, and rendered-identity tests.

### Recommendation
COMPLETE MISSING WORK — the tutor half is done; the student self-service profile is still a static mock.

---

### Syllabus Taxonomy

## #28 — Create syllabus taxonomy schema

**Status:** COMPLETE

### Evidence
- `backend/learning-service/src/main/resources/db/migration/V4__create_syllabus.sql`
- `.../V6__create_questions.sql` (adds `uk_syllabus_topics_id_node_type`)
- `backend/.../syllabus/SyllabusTopic.java`, `SyllabusTopicRepository.java`, `SyllabusService.java`, `SyllabusController.java`

### What Works
- A **real self-referencing hierarchy**, not flattened columns. One table `syllabus_topics` with `parent_id`, `depth`, `node_type` and five tiers — `SUBJECT(0) → LEVEL(1) → THEME(2) → TOPIC(3) → SUBTOPIC(4)` — a superset of the required Subject → Level → Topic → Subtopic (extra MOE `THEME` tier).
- Level-skipping and cycles are impossible at the DB level: `ck_syllabus_topics_hierarchy` binds `node_type`/`depth`/`parent_id`/`parent_depth`, and the composite FK `(parent_id, parent_depth) → syllabus_topics (id, depth) ON DELETE RESTRICT` forces the parent to sit exactly one tier up.
- Read-only by design: `SyllabusTopic` is `@Immutable`; the repository extends bare `Repository` and exposes no `save*`/`delete*`. Curriculum changes go through migrations only.
- `GET /api/learning/shared/syllabus/tree` and `/children` serve it; `SecurityConfig.java:35` allows TUTOR and STUDENT.

### What Is Missing
- No Learning Objective tier below `SUBTOPIC`, and no objective/description column. `SUBTOPIC` is the leaf. If learning objectives must be first-class records, that is a sixth tier or a new table.
- `UNIQUE (parent_id, sort_order)` and `UNIQUE (parent_id, name)` do not constrain root rows — `parent_id IS NULL` for `SUBJECT` and PostgreSQL treats NULLs as distinct, so two subjects could share a name.

### Tests Found
- `backend/.../syllabus/SyllabusIntegrationTest.java` (drives real `DataIntegrityViolationException` for duplicate `code` and for an UPDATE making a node a child of its own descendant; reflectively asserts no `save*`/`delete*`)
- `backend/.../syllabus/SyllabusControllerIntegrationTest.java`
- `backend/.../database/PostgresMigrationIntegrationTest.java` (real Postgres 17 via Testcontainers)

### Tests Still Required
- A negative test that a `TOPIC` cannot be inserted under a `LEVEL` (skipped `THEME`).
- Root-uniqueness test, if duplicate `SUBJECT` rows matter.

### Recommendation
CLOSE

---

## #29 — Seed P5/P6 Science syllabus taxonomy

**Status:** COMPLETE

### Evidence
- `backend/learning-service/src/main/resources/db/migration/V5__seed_p5_p6_science.sql` (174 lines, 24 INSERTs)

### What Works
- **24 rows exactly:** 1 `SUBJECT` (`SCI`), 2 `LEVEL` (`SCI_P5`, `SCI_P6`), 4 `THEME`, 9 `TOPIC`, 8 `SUBTOPIC`. All carry `curriculum_version = 'MOE_PRIMARY_SCIENCE_2023'` and the MOE PDF URL in `source_reference`.
- P5 (Cycles, Systems): Cycles in plants and animals, Cycles in matter and water, Plant system, Human system, Electrical system; subtopics Reproduction, Water, Respiratory and circulatory systems.
- P6 (Energy, Interactions): Energy forms and uses, Energy conversion, Interaction of forces, Interactions within the environment; subtopics Photosynthesis, Frictional force, Gravitational force, Elastic spring force.
- A genuine syllabus, not a token sample — sourced against a cited MOE document, every insert resolving its parent by `code` so no IDs are hard-coded.
- `sort_order` (10/20/30) gives deterministic curriculum ordering, asserted by `returnsSiblingsInDeterministicCurriculumOrder`.

### What Is Missing
- **Not idempotent.** Plain `INSERT`/`INSERT … SELECT` with no `ON CONFLICT DO NOTHING` and no `WHERE NOT EXISTS`. Re-running against a populated schema violates `uk_syllabus_topics_code`. Safe under Flyway, unsafe if replayed manually. (`PostgresMigrationIntegrationTest`'s second `flyway.migrate()` returning 0 proves Flyway bookkeeping, not seed idempotency.)
- **3 topics have no subtopic leaf:** `SCI_P5_SYSTEMS_ELECTRICAL`, `SCI_P6_ENERGY_CONVERSION`, `SCI_P6_INTERACTIONS_ENVIRONMENT`. Questions can attach directly to a `TOPIC`, so this is coarser granularity, not a blocker.
- No learning-objective statements (the schema has no tier — see #28).
- Coverage against the actual MOE PDF cannot be verified offline; the P5 `Systems` theme is worth a source check for a missing `Cell system` topic.

### Tests Found
- `backend/.../syllabus/SyllabusIntegrationTest.java` (asserts `countByCurriculumVersionAndActiveTrue == 24`, the exact 9-code TOPIC list, theme names per level, sibling ordering)
- `backend/.../database/PostgresMigrationIntegrationTest.java` (re-asserts 24 rows on real Postgres)

### Tests Still Required
- None for the seed as written. If idempotency becomes a requirement, add a double-apply test.

### Recommendation
CLOSE (small follow-up for the 3 subtopic gaps and the MOE source re-check)

---

### Question Bank

## #30 — Create question bank database schema

**Status:** COMPLETE

### Evidence
- `backend/learning-service/src/main/resources/db/migration/V6__create_questions.sql`
- `backend/.../question/Question.java`, `MarkingComponent.java`, `QuestionRepository.java`

### What Works
- **The taxonomy link is a real composite FOREIGN KEY, not a loose string.** `fk_questions_syllabus_topic (syllabus_topic_id, syllabus_topic_type) REFERENCES syllabus_topics (id, node_type) ON DELETE RESTRICT`, backed by `uk_syllabus_topics_id_node_type`. With `ck_questions_taxonomy_type CHECK (syllabus_topic_type IN ('TOPIC','SUBTOPIC'))` it is **structurally impossible** to hang a question off a subject, level or theme, and impossible to delete a referenced topic.
- Field coverage: `prompt VARCHAR(4000)`, `question_type` (7-value CHECK enum), `total_marks DECIMAL(6,2) > 0`, `model_answer VARCHAR(4000)`, `archive_state` soft-delete, `code` globally unique and forced uppercase.
- **Marking components are a separate table**, not JSON: `marking_components(id, question_id, position, description, marks)` with `UNIQUE (question_id, position)` and `ON DELETE CASCADE`, mapped `@OneToMany` with `orphanRemoval`.
- **Keywords are a separate ordered collection table**: `question_keywords(question_id, position, keyword)`, PK `(question_id, position)`, `UNIQUE (question_id, keyword)`, `CHECK (keyword = LOWER(TRIM(keyword)))`.
- Aggregate invariants in the entity: `@AssertTrue isMarkStructureValid()` requires component marks to sum exactly to `total_marks`; `isSyllabusTopicAssignable()` requires an *active* TOPIC/SUBTOPIC.

### What Is Missing
- Subject and level are derivable by walking `parent_id` but are **not stored and not exposed**. `QuestionService.SyllabusTopicSummary` returns only `{id, code, name, nodeType}` of the leaf, so no consumer can show or filter by subject/level.
- No owner column — the bank is global, so any TUTOR can edit any question. Deliberate (documented in `QuestionRequest.java`) but unasserted by any test.
- A deactivated syllabus topic (`active = false`) does not hide its questions: `findQuestionBank` filters only on `archiveState`.

### Tests Found
- `backend/.../question/QuestionRepositoryTest.java` (canonicalisation `" sci-water-001 "` → `SCI-WATER-001`; `SUBJECT`-typed topic fails validation while `TOPIC` passes; real `DataIntegrityViolationException` for `syllabus_topic_id = 999999`; unequal marks throw on flush; archive-not-delete; reflectively asserts no `delete*`)
- `backend/.../database/MigrationIntegrationTest.java`, `PostgresMigrationIntegrationTest.java` (15 migrations, 25 tables on real Postgres)

### Tests Still Required
- A test that `ON DELETE RESTRICT` blocks deleting a syllabus topic that has questions.
- A test that `syllabus_topic_type` cannot drift from the referenced node's `node_type`.

### Recommendation
CLOSE

---

## #31 — Build question bank list page

**Status:** PARTIALLY COMPLETE

### Evidence
- `frontend/src/app/(main)/questions/page.tsx`, `frontend/src/components/questions/QuestionList.tsx`
- `frontend/src/components/syllabus/SyllabusPicker.tsx`, `frontend/src/services/questions.ts`, `syllabus.ts`
- `backend/.../question/QuestionController.java`, `QuestionRepository.java` (`findQuestionBank`)

### What Works
- **Filtering is genuinely server-side.** `QuestionController.list` accepts `topicId`, `questionType`, `archiveState`, `page`, `size` and passes them to a `@Query` with a separate `countQuery` and `Pageable`.
- Frontend↔backend wiring is correct — path, method and every param name match; the envelope (`items/page/size/totalElements/totalPages/hasNext`) matches `QuestionService.QuestionPage` field-for-field and is runtime-validated by `parseQuestionBankPage`.
- **The taxonomy picker now exists** and is wired in (`QuestionList.tsx:~103`). The prior audit's "raw numeric ID box" finding (`PROJECT_AUDIT_up_to_33.md:46`) is now **stale**.
- Skeleton, retryable error card, empty state with Clear filters, prev/next pagination, page reset on filter change, selection retained across pages.

### What Is Missing
- **No search of any kind — not server-side, not client-side.** No `search`/`q` param on the controller, no `like` predicate in the repository, no text input in the component. Questions cannot be found by code, prompt text, or keyword — despite `question_keywords` being indexed by `(question_id, keyword)`.
- No subject/level filter — the API cannot express one (see #30).
- **`SyllabusPicker` reset bug:** choosing "Keep selected topic" in the Subtopic dropdown calls `onChange(null)` (`change()` → `next[depth] = null` → `selectedNode = null`), clearing the whole Subject→Topic cascade instead of falling back to the parent topic.
- Dead import: `TextField` at `QuestionList.tsx:10` is unused — a likely `next lint` failure.

### Tests Found
- `frontend/src/components/questions/QuestionList.test.tsx` (drives the picker through Subject→Level→Theme→Topic and asserts `loadQuestions` last called with `{page: 0, topicId: 14, questionType: "OPEN_ENDED"}`)
- `frontend/src/components/syllabus/SyllabusPicker.test.tsx` — **does not cover the "Keep selected topic" reset path**, which is why the bug is undetected
- `frontend/src/services/questions.test.ts`
- `backend/.../question/QuestionListIntegrationTest.java` (shallow payload asserted via `doesNotExist()`, combined filters, four distinct 400 codes), `QuestionListDatabaseFailureIntegrationTest`

### Tests Still Required
- Search coverage (none can exist until search exists).
- `SyllabusPicker` test for reverting a subtopic to "Keep selected topic" — should keep the topic id.
- A test that changing a parent level resets deeper selections.

### Recommendation
COMPLETE MISSING WORK — add search and fix the picker reset bug. If the issue body never required search, this reduces to a bug fix and can CLOSE.

---

## #32 — Build add/edit question form

**Status:** COMPLETE

### Evidence
- `frontend/src/components/questions/QuestionForm.tsx`
- `frontend/src/app/(main)/questions/new/page.tsx`, `questions/[questionId]/edit/page.tsx`
- `backend/.../question/QuestionRequest.java`, `QuestionService.java`

### What Works
- Every field present: code, syllabus topic (via `SyllabusPicker`, not a raw ID box), question type, availability, prompt, total marks, keywords, and a repeatable add/remove marking-criteria list.
- `POST` (201) and `PUT /{id}` (200) wired correctly; `syllabus_topic_type` is deliberately **not** client-controlled — `QuestionService.apply` resolves it from the topic id.
- Validation is layered: client `validateQuestionForm` (2-dp precision, criteria must total exactly, ≤100 criteria, ≤100 unique keywords) → bean validation → `validateAggregate` → DB CHECKs. Server field errors map back onto inputs.
- `QUESTION_IN_USE` 409 blocks content edits to a question already in a worksheet while still allowing archive-only updates (`changesContent` + `isUsedByAnyWorksheet`).

### What Is Missing
- The shared `SyllabusPicker` defect silently clears `values.syllabusTopicId`, so the form then fails its own required-topic validation with no explanation.
- No delete action — archive only (intentional; `QuestionRepositoryTest` reflectively asserts no `delete*`).
- Dead expression `helperText={depth === 4 ? undefined : undefined}` in `SyllabusPicker.tsx`.

### Tests Found
- `frontend/src/components/questions/QuestionForm.test.tsx` (fills through the picker cascade and asserts the exact submitted payload; unequal-marks and 3-dp rejection block the service call entirely)
- `backend/.../question/QuestionMutationIntegrationTest.java` (canonicalisation asserted; real `worksheet_questions` row driving `QUESTION_IN_USE` 409 while an archive-only PUT succeeds)

### Tests Still Required
- The picker subtopic-revert case (shared with #31).
- A test that selecting a non-assignable node (THEME/LEVEL) leaves the form blocked-but-explained.

### Recommendation
CLOSE — with a separate bug ticket for the `SyllabusPicker` reset defect and the lint error.

---

## #33 — Build question detail page

**Status:** COMPLETE

### Evidence
- `frontend/src/app/(main)/questions/[questionId]/page.tsx`, `frontend/src/components/questions/QuestionDetail.tsx`
- `backend/.../question/QuestionController.java` (`GET /{questionId}`)

### What Works
- Returns and renders code, syllabus topic summary, type, prompt, total marks, model answer, archive state, ordered `markingComponents[{position,description,marks}]`, `keywords`, `createdAt`, `updatedAt` — all runtime-validated by `parseTutorQuestion` before render.
- Back link, edit shortcut, and an "Add to worksheet draft" action correctly disabled for `ARCHIVED` questions, with `role="status"` feedback and a `sessionStorage`-unavailable fallback.
- Skeleton loading, invalid-reference guard (`questionId <= 0` never calls the API), stale-response guard via a `requestId` ref, retryable error card.

### What Is Missing
- Subject and level are not shown beside the topic — the API returns only the leaf node (see #30).
- The worksheet-draft selection is browser-local `sessionStorage` and **is not consumed by any worksheet flow** (see §5).

### Tests Found
- `frontend/src/components/questions/QuestionDetail.test.tsx` (asserts `"SCI_P5_WATER · subtopic"`, both criterion descriptions, draft button disabling and `role="status"` announcement, storage-unavailable path)
- `backend/.../question/QuestionDetailIntegrationTest.java` (every detail field incl. `markingComponents[1].marks` and `keywords[0]` canonicalised)

### Tests Still Required
- None material.

### Recommendation
CLOSE

---

### Worksheets

## #34 — Create worksheet database schema

**Status:** PARTIALLY COMPLETE

### Evidence
- `backend/learning-service/src/main/resources/db/migration/V7__create_worksheets.sql`, `V13__create_worksheet_generation_requests.sql`
- `backend/.../worksheet/Worksheet.java`, `WorksheetQuestion.java`, `WorksheetAssignment.java`

### What Works — required references

| Required | Present? | Where |
|---|---|---|
| Tutor | Yes | `worksheets.tutor_id` + `ck_worksheets_owner CHECK (tutor_id > 0)` (V7:3,14) |
| Class and/or student | Yes | `worksheet_assignments.assignment_type/target_id/class_id/student_profile_id` (V7:52-56), `ck_worksheet_assignments_target` (V7:65-77) forcing exactly one side |
| Subject | **No** | not on `worksheets` at all |
| Questions | Yes | `worksheet_questions.question_id` FK → `questions(id) ON DELETE RESTRICT` (V7:44-45) |
| Topics | Partial | request-side only: `worksheet_generation_request_topics` FK → `syllabus_topics` (V13:24-34) |
| Creation date | Yes | `created_at`/`updated_at`; `approved_at` gated by `ck_worksheets_approval` (V7:28-32) |
| Worksheet type | **No** | `audience_type` is only `CLASS`/`STUDENT` — an audience, not a type |
| Generated/custom status | Inferred only | from `generation_request_id IS NULL` (V13:46) |

- Cross-tutor assignment is impossible at the DB level — composite FKs `(class_id, tutor_id)` and `(student_profile_id, tutor_id)` (V7:86-89).
- Ordering reads back deterministically: `position INTEGER NOT NULL` + `CHECK (position >= 0)` + `idx_worksheet_questions_order`, with `@OrderBy("position ASC, id ASC")` (`Worksheet.java:104`) and `renumberQuestions` on mutation (`:242-248`).
- Idempotency/provenance well modelled: `uk_worksheet_generation_request_key UNIQUE (tutor_id, idempotency_key)` + `request_hash` (V13:9-10,16).

### What Is Missing
- **No unique constraint on `(worksheet_id, position)`.** The only uniqueness is `uk_worksheet_questions_question UNIQUE (worksheet_id, question_id)` (V7:40). Two rows can legally share `position = 0`; ordering is a Java-side invariant only, so any direct SQL write bypasses it.
- **No per-question metadata snapshot.** `worksheet_questions` stores only the FK; marks, prompt and type are read live off `questions` (`WorksheetRequests.java:52-55`, `PdfDocumentService.java:50-51`). Editing a bank question after approval retroactively changes an already-issued worksheet and its PDF. No `marks_snapshot`, no version column.
- **No subject column** — derivable only via assignment → `tutor_classes.subject`, or question → topic. A worksheet with no assignment has no derivable subject.
- **No worksheet-type discriminator** — no `DIAGNOSTIC`/`PRACTICE`/`REVISION` value anywhere, which is also why #36 has nowhere to record itself.
- **Custom worksheets are structurally unreachable:** `WorksheetService.approveAndAssign` throws `WorksheetNotGeneratedException` when `generationRequestId` is null (`:124-125`), so a hand-built worksheet can never be approved or assigned.

### Tests Found
- `backend/.../worksheet/WorksheetRepositoryTest.java` — 12 tests, the strongest suite in the domain: `keepsQuestionOrderStableAndPersistsDraftReordering:86`, `rejectsMismatchedAudienceDuplicateQuestionsAndDuplicateAssignments:165`, `databaseRejectsCrossTutorClassAssignments:204`, `protectsBankQuestionsAndAssignedClassesFromDeletion:220`, `repositoryExposesNoHardDeleteOperation:291`. **All 12 errored in the captured run — stale collateral, see §7.**

### Tests Still Required
- A test that two `worksheet_questions` rows cannot share a `position` (would currently fail — no constraint).
- A drift test: approve, change `questions.total_marks`, re-read the worksheet and PDF, assert issued marks unchanged (would currently fail).
- A test that a worksheet with `generation_request_id IS NULL` can be approved, or an explicit test documenting that custom worksheets are unsupported.

### Recommendation
KEEP OPEN

---

## #35 — Build worksheet generation flow

**Status:** PARTIALLY COMPLETE

### Evidence
- `backend/.../worksheet/WorksheetService.java`, `WorksheetController.java`, `WorksheetRequests.java`
- `backend/.../question/QuestionRepository.java:41-52`
- `frontend/src/components/worksheets/WorksheetBuilder.tsx`, `TutorWorksheetDetail.tsx`, `frontend/src/services/worksheets.ts`

### Step-by-step trace

| Step | Backend | Frontend |
|---|---|---|
| Select Student | Yes — `targetMode=STUDENTS` + `studentIds`, membership-validated (`:161-171`) | **No** — `WorksheetBuilder.tsx:46` hardcodes `targetMode: "CLASS"`; no student picker |
| Select Class | Yes — `classId` path variable, ownership-checked (`:157`) | Partial — only from `?classId=`; `classId=0` renders a dead builder |
| Configure | Yes — `questionCount`, `questionType`, `dueAt`, `title`, `instructions` | Partial — only title + count; `questionType`, `dueAt`, `instructions` have no input |
| Select Topics | Yes — `topicIds` validated against `syllabus_topics` (`:158-160`) | Yes — `SyllabusPicker` + chips, though chips read `Topic #4`, not the name |
| Generate Questions | Yes — `WorksheetService.generate:41-84` | Yes |
| Preview | Yes — response embeds full `WorksheetResponse` | Yes — draft card lists prompt + marks |
| Edit | Yes — `PATCH /worksheets/{id}` title/instructions/`questionIds` (`:107-116`) | Partial — detail page only, reorder only |
| Approve | Yes — approve+assign atomically (`:118-140`) | Yes |

### What Works
- Idempotency is real: `Idempotency-Key` header required, SHA-256 `requestHash` over the canonical request (`:193-198`), replay returns the same request, key reuse with a different body → 409 `IDEMPOTENCY_KEY_REUSED`.
- The question bank **is** the real source — `findDeterministicActiveQuestionBank` filters `archiveState = ACTIVE` and honours topic and type filters.
- Requested count honoured exactly (`.limit(questionCount)`, `:79`); generation refuses rather than under-delivering.
- Insufficient/no matching questions handled explicitly, not silently: `if (bank.size() < questionCount)` → `request.fail("INSUFFICIENT_ACTIVE_QUESTIONS", …)` (`:67-70`), returned as HTTP 202 with `FAILED`; the frontend surfaces it as an error.

### What Is Missing
- **The selection algorithm is not a selection algorithm.** It is `ORDER BY topic.id ASC, question.code ASC, question.id ASC` (`QuestionRepository.java:47`) then `.limit(n)`. Not random, not weighted, not spread across topics. With topics A and B and `questionCount=10`, if A has ≥10 active questions **every question comes from A and B is never represented** — despite the tutor selecting both, with no UI indication. It is also fully deterministic, so regenerating for the same class always yields the identical worksheet.
- **Individual-student generation has no UI.** The backend path is complete but unreachable from `WorksheetBuilder`, and untested.
- **No remove or replace question.** `TutorWorksheetDetail.moveQuestion:70-78` reorders only; no delete, no swap, no add-from-bank. `Worksheet.removeQuestion:220-226` exists but no endpoint or UI reaches it.
- **The sessionStorage draft selection is a dead end** — written by `questions.ts:254-261`, read by nothing (see §5).
- Generation is synchronous despite a `QUEUED`/`RUNNING` status machine; `fetchGenerationRequest` (`worksheets.ts:182`) has no caller.

### Tests Found
- `backend/.../worksheet/WorksheetGenerationTest.java` — 1 test, but strong: inserts `SCI-GEN-002` *before* `SCI-GEN-001` and asserts the worksheet returns `["SCI-GEN-001","SCI-GEN-002"]`, plus idempotent replay and atomic approve/assign. **Errored in the captured run.**
- `frontend/src/components/worksheets/WorksheetBuilder.test.tsx` (four-level drill-down, `topicIds: [4]` passed through, preview, approve)
- `frontend/src/services/worksheets.test.ts` (asserts the `Idempotency-Key` header reaches `fetch`)

### Tests Still Required
- **Topic-spread test** — two topics, one over-supplied, assert questions from both. This is the test that would expose the algorithm gap.
- `INSUFFICIENT_ACTIVE_QUESTIONS` and zero-match tests (`WorksheetService.java:67-70` is untested).
- `targetMode=STUDENTS` generation, including the non-member rejection at `:169`.
- `updateWorksheet` reorder-persistence round trip.
- Frontend test for the `classId=0` dead-builder path.

### Recommendation
COMPLETE MISSING WORK — the topic-distribution gap and the missing student-generation UI are functional, not cosmetic.

---

## #36 — Implement diagnostic worksheet generation

**Status:** NOT STARTED

> Explicitly per the brief's instruction: do not mark COMPLETE merely because a generic generator exists. Here, not even that applies — the file named for this issue generates nothing.

### Evidence
- `backend/.../worksheet/DiagnosticWorksheetService.java` (52 lines, read in full)
- `backend/.../worksheet/WorksheetController.java:91-93`

### What Works
- The endpoint exists and is owner-scoped: `GET /api/learning/tutor/classes/{classId}/worksheet-recommendations`.
- It returns an honest, explicitly-labelled evidence state rather than fabricating data — `Status.INSUFFICIENT_EVIDENCE` when the class is empty (`:31`) or no member has `attemptCount > 0` (`:33-34`).
- Ordering is deterministic — weakest mastery first, tie-broken by student id, topic name, topic id (`:36-39`).

### What Is Missing
This service **does not generate a worksheet**, and is not a thin wrapper over the generator — it does not call the generator at all. Its constructor takes only `TutorClassRepository`, `StudentProfileRepository`, `MasteryRecordRepository` (`:22-25`), and it is `@Transactional(readOnly = true)` (`:27`). The entire body maps mastery rows to a DTO (`:35-43`).

Against each stated requirement:
- **Generate an initial diagnostic worksheet** — absent. Nothing is generated.
- **Select questions across appropriate topics** — absent. No `QuestionRepository` reference exists in the file.
- **Use syllabus taxonomy** — only incidentally, reading `getSyllabusTopic().getName()` off an existing mastery row (`:38,41`). No traversal, no coverage logic.
- **Suitable question distribution** — absent. One row per `(student, topic)` mastery record, no cap, no quota, no question count. 20 students × 30 topics returns 600 undifferentiated rows.
- **Reproducible worksheet records** — absent. Nothing is persisted: no `worksheet_generation_requests` row, no `worksheets` row, no diagnostic marker. The schema has no `DIAGNOSTIC` value anywhere in V7/V13 to record one with.
- **Reachable from the UI** — **no.** `grep -rn "worksheet-recommendations|recommendations" frontend/src` returns zero hits.

### Tests Found
- `backend/.../worksheet/DiagnosticWorksheetServiceTest.java` — 1 test, `returnsExplicitInsufficientEvidenceUntilRecordedMasteryAttemptsExist`. It never asserts a worksheet is produced, which corroborates that no generation is intended by the current design. **Errored in the captured run.**

### Tests Still Required
- Essentially the whole issue: topic-coverage/distribution assertions, reproducibility (same inputs → same worksheet, or a recorded seed), persistence of a diagnostic worksheet record, a diagnostic-type discriminator, and a frontend test for a UI that does not exist.

### Recommendation
KEEP OPEN — do not close on the presence of `DiagnosticWorksheetService.java`. It is a mastery-triage read model, unreachable from the UI.

---

## #37 — Build worksheet detail page

**Status:** PARTIALLY COMPLETE

### Evidence
- `frontend/src/components/worksheets/TutorWorksheetDetail.tsx`, `frontend/src/app/(main)/tutor/worksheets/[worksheetId]/page.tsx`
- `backend/.../worksheet/WorksheetRequests.java:38-61`, `WorksheetController.java:58-60`

### What Works — required display items

| Required | State | Where |
|---|---|---|
| Worksheet title/details | Yes | `:106-108` |
| Student or class | **Raw id only** — `Class #3` / `3 selected students` | `:26-30` |
| Subject | **No** — not on the response at all | — |
| Topics | **No** — `topicName` is on the wire but never rendered | `WorksheetRequests.java:39,55` vs component |
| Questions | Yes — ordered list with prompt and marks | `:158-167` |
| Marks | Per question yes; **worksheet total no** | `:158-167` |
| Worksheet metadata | Thin — status, question count, instructions, due date | `:110,172-173` |

- Actions: Edit (draft only), Save draft, Approve & assign, **Enter result manually** (a real working page), Upload marked work, Download PDF, reorder up/down.
- Backend detail response is complete and owner-scoped via `findByIdAndTutorId` (`WorksheetService.java:95-96,151`).
- `parseTutorWorksheet` rejects malformed payloads field-by-field (`worksheets.ts:128-148`).

### What Is Missing
- **Subject, topics, and total marks are not rendered** — all three are in the issue's display list. `topicName` is already fetched and discarded; the list page computes total marks (`tutor/worksheets/page.tsx:30`) but the detail page does not.
- Class/student shown as a raw id — no name lookup.
- No worksheet code, created/approved date, or generation provenance displayed.
- No preview action distinct from the question list; no export other than PDF.
- The PDF button is hidden for drafts (correct — the backend rejects draft exports at `WorksheetPdfService.java:22`) but there is then no way to preview a draft as a printable page.
- `dueAt` is derived by scanning assignments for the first non-null (`worksheets.ts:144`) — with per-student assignments this silently picks one arbitrary date.

### Tests Found
- `frontend/src/components/worksheets/TutorWorksheetDetail.test.tsx` — 2 tests, genuine (approve wiring with args asserted; post-approve re-render `"APPROVED · 1 question · Class #3"`; edit→type→save asserting `questionIds: [2]`; full blob→anchor→`revokeObjectURL` PDF path)
- `backend/.../worksheet/WorksheetDetailIntegrationTest.java` — solid assertions, **but never executed** (see §7)

### Tests Still Required
- Assertions that subject, topic names and total marks appear (all would fail today).
- A test that a class/student *name* renders rather than `Class #3`.
- Reorder persistence round trip.
- `STUDENTS` audience detail rendering with multiple assignments and due dates.

### Recommendation
COMPLETE MISSING WORK — `topicName` is already on the wire; wiring it up is small.

---

## #38 — Generate printable worksheet PDFs

**Status:** COMPLETE

> The strongest-implemented issue in this audit.

### Evidence
- `backend/learning-service/pom.xml:77-81` — **Apache PDFBox 3.0.6**
- `backend/.../pdf/PdfDocumentService.java`, `worksheet/WorksheetPdfService.java`, `WorksheetController.java:68-77`
- `frontend/src/components/worksheets/TutorWorksheetDetail.tsx:81-97`
- `backend/learning-service/src/main/resources/fonts/NotoSans-{Regular,Bold}.ttf`

### What Works
Real server-side byte-level PDF composition — `new PDDocument()` → `PDPageContentStream` → `document.save(bytes)` returning `byte[]` (`PdfDocumentService.java:36-58`). Not a browser print button; `frontend/package.json` has no PDF dependency.

- **Valid PDF output:** `WorksheetPdfServiceTest:44-45` asserts non-empty bytes **and** `assertArrayEquals("%PDF-".getBytes(US_ASCII), copyOf(bytes, 5))`, then re-parses with `Loader.loadPDF` and extracts text with `PDFTextStripper` (`:47-54`) — proven machine-readable, not merely non-empty.
- **Metadata:** title, subject, author, creator, keywords on `PDDocumentInformation` (`:86-93`), asserted at `:48-49`.
- **Questions and ordering:** iterated in `getQuestions()` order (itself `@OrderBy("position ASC, id ASC")`) with a running number (`:48-52`), asserted by text extraction.
- **Marks displayed:** `"Type: … * Marks: " + marks.stripTrailingZeros().toPlainString()` (`:209`), null-guarded.
- **Pagination:** `ensureSpace(requiredHeight)` triggers `startPage()` whenever `y - required < MARGIN` (`:243-245`); `startPage` closes the prior stream first (`:184`) — no leaked streams. `startsAdditionalPagesForLongWorksheets` builds 32 questions and asserts `getNumberOfPages() > 1`.
- **Non-ASCII: fonts are genuinely registered and used.** `loadFonts` loads both TTFs and `PDType0Font.load(document, resource, true)` embeds them as subsetted Type0/CID fonts (`:155-167`); *every* text call uses `fonts.regular()`/`fonts.bold()` (`:196-210,231-241`) — no `PDType1Font.HELVETICA` fallback, which is what would otherwise throw on non-Latin-1 input. `printableText` NFC-normalises first (`:282-286`); a missing font resource fails loudly (`:164`); word-wrap measures with real font metrics via `font.getStringWidth` (`:266`).
- **Access control before rendering:** owner scope + `status != APPROVED` → `WorksheetNotApprovedException` thrown *before* touching the PDF service; `verifyNoInteractions(documents)` proves it (`WorksheetPdfServiceTest:85`).
- **HTTP contract:** `produces = APPLICATION_PDF_VALUE`, `.contentType(APPLICATION_PDF)`, `ContentDisposition.attachment().filename(name, UTF_8)`; filename sanitised `code.replaceAll("[^A-Za-z0-9._-]", "_")`. Failures map to 409 `WORKSHEET_NOT_APPROVED` and 503 `WORKSHEET_PDF_UNAVAILABLE`.
- **Frontend really downloads:** `downloadWorksheetPdf` fetches with auth headers and returns a `Blob`; `exportPdf` builds an object URL, clicks a synthetic anchor, revokes the URL.

### What Is Missing
Minor only:
- The PDF carries no student/class name, no due date, no assignment context, no "Page x of y".
- Marks are read live from the bank rather than a snapshot (see #34), so a reprint can disagree with the original.
- The "special characters" test (`WorksheetPdfServiceTest:31-33`) uses only `&`, `<`, `>`, `/`, `+` — all ASCII. The Noto embedding is correct by construction, but no test feeds it accented, CJK, or typographic-punctuation input, which is the fonts' entire purpose.
- No assertion that the marks text appears in the extracted PDF text.

### Tests Found
- `backend/.../worksheet/WorksheetPdfServiceTest.java` — 4 tests, real `PdfDocumentService` in 2 of 4. **All 4 passed**, report 28 Aug 06:12 vs source mtime 06:11 — the only fresh, green report in the domain.
- `backend/.../worksheet/WorksheetDetailIntegrationTest.java:49-63,112-130` — asserts content type, `attachment;`, exact filename, `%PDF-` header over the wire, plus 401/403/404/409. **Never executed.**
- `frontend/src/components/worksheets/TutorWorksheetDetail.test.tsx:26-46`

### Tests Still Required
- A true non-ASCII case (e.g. `"Explain condensation — 蒸发, café, ±5 °C"`) asserting round-trip through `PDFTextStripper`.
- An assertion that marks text appears in the extracted text.
- Get `WorksheetDetailIntegrationTest` into an executed phase — it is the only thing testing the HTTP contract.

### Recommendation
CLOSE — log the non-ASCII test gap and the missing student/class header separately.

---

### Student Answers & Marking

## #39 — Create student answer database schema

**Status:** COMPLETE

### Evidence
- `backend/grading-service/src/main/resources/db/migration/V1__create_grading_schema.sql`, `V3__create_answers_and_reviews.sql`, `V6__allow_manual_result_documents.sql`, `V7__create_mastery_sync_outbox.sql`
- `backend/grading-service/src/main/java/com/fttranscendence/grading/model/Submission.java`, `AnswerReview.java`, `SubmissionDocument.java`

### What Works — required relationships

| Required | Actual column | Notes |
|---|---|---|
| Student | `student_id BIGINT NOT NULL` | `CHECK (student_id > 0)`; no FK (separate schema) |
| Worksheet | `worksheet_id BIGINT` | plain BIGINT, no FK |
| Worksheet question | `worksheet_question_id` + `question_bank_id` | plain BIGINTs, no FK |
| Submitted answer | `extracted_answer TEXT` | |
| Awarded mark | `approved_marks DECIMAL(6,2)` (+ advisory `ai_suggested_marks`) | |
| Maximum mark | `max_marks DECIMAL(6,2)` | snapshot at creation |
| Marking state | `review_status` CHECK `IN ('PENDING_REVIEW','FLAGGED','APPROVED')` | |
| Feedback | `approved_feedback TEXT` (+ `ai_suggested_feedback`) | |
| Mistake type | via `mistake_records.mistake_type` FK → `submissions(id)` and `approved_diagnostic_evidence.category` | see #41 |

Also present: `model_answer_snapshot` (immutable rubric snapshot), `syllabus_topic_id`/`_code`, `reviewed_by_user_id`, `reviewed_at`, `legacy_record`, `version` (optimistic lock), `mastery_sync_revision`.

Genuinely strong constraint work in V3:
- `uk_submissions_document_question UNIQUE (submission_document_id, worksheet_question_id)` — one answer per question per submission (`:35-39`).
- `ck_submissions_reference_mode` (`:44-69`) — legacy and canonical rows are mutually exclusive; a canonical row must carry worksheet + worksheet question + question bank + model answer + `max_marks > 0`.
- `ck_submissions_approval_state` (`:86-119`) — `approved_marks >= 0 AND <= max_marks`, and PENDING/FLAGGED rows **physically cannot** hold a final mark or feedback.
- `answer_reviews` audit table (`:121-151`) with before/after marks, feedback, status, and `action IN ('APPROVED','REVISED','FLAGGED','RESET_TO_AI')`.

Every DB constraint is mirrored in `Submission.validateAggregate`/`validateReviewState` (`:380-458`), so rules hold on H2 too.

### What Is Missing
- **The answer↔worksheet-question link is by unenforced integer only.** No cross-schema FKs, by design. Integrity is maintained only at write time by `LearningAuthorizationClient.loadQuestion`/`validateManualResultContext` (`:80-139`) calling the learning REST API. Nothing prevents drift afterwards: if a worksheet question is deleted or re-pointed in learning, the grading row silently dangles. No reconciliation job, no test.
- **Two ID spaces share one column.** In the manual path `worksheetQuestionId` is deliberately populated with the *question-bank* id (`MarkingReviewService.java:114-118`, with an explicit code comment); in the OCR path it holds a real `worksheet_questions.id`. `uk_submissions_document_question` therefore mixes namespaces and any future join on it is ambiguous. Acknowledged debt, not an accident.

### Tests Found
- `backend/grading-service/.../model/SubmissionRepositoryTest.java` — 6 tests (approve→revise keeps both AI and tutor versions in `answer_reviews`; flag/reset produce no final score; duplicate answer rejected)
- `backend/grading-service/.../database/MigrationIntegrationTest.java` — 5 tests (V3 migrates a V1 legacy row to `PENDING_REVIEW`/`legacy_record=true` without inventing an approved mark)
- `backend/grading-service/.../controller/MarkingApprovalIntegrationTest.java` — 4 tests

### Tests Still Required
- A test asserting the manual-path ID-space collision is safe — an OCR answer with `worksheet_question_id = 5` and a manual answer with `question_bank_id = 5` on the same document.
- A drift test: what happens when `worksheet_question_id` no longer resolves in learning.
- A concurrency test for `version` — the column exists but nothing exercises it.

### Recommendation
CLOSE — file a separate follow-up for the dual-ID-space debt already flagged in the code comment.

---

## #40 — Build manual result entry page

**Status:** PARTIALLY COMPLETE

### Evidence
- `frontend/src/app/(main)/tutor/worksheets/[worksheetId]/results/new/page.tsx`
- `frontend/src/components/marking/ManualResultForm.tsx`
- `frontend/src/components/worksheets/TutorWorksheetDetail.tsx:125` (entry point, non-DRAFT only)
- `backend/grading-service/.../controller/MarkingReviewController.java:39-46`, `service/MarkingReviewService.java:94-128`
- `backend/grading-service/src/main/resources/db/migration/V6__allow_manual_result_documents.sql`

### Step-by-step trace
1. **Select Worksheet** — implicit, from the route. There is no worksheet picker in the form.
2. **Select Student** — yes. The page filters the tutor's students to those assigned to the worksheet, directly or via class (`page.tsx:13-20`).
3. **Enter Answers / Marks** — yes, but **one question at a time** (`ManualResultForm.tsx:104-111`). No per-worksheet grid.
4. **Add Feedback** — yes, required (`:112`).
5. **Save** — yes, then `router.push('/tutor/reviews/{id}')` (`page.tsx:48`).

### What Works
Validation is three layers deep and genuinely enforced:
- **UI** (`:52-60`) — rejects missing fields; rejects `parsedMarks < 0` or `> selectedQuestion.totalMarks`; `<input type=number min=0 max=totalMarks step=0.01>`.
- **Client** (`services/submissions.ts:94-97`) — re-checks ids positive, `marks` finite and `>= 0`, answer/feedback non-blank.
- **Server** (`MarkingReviewService.validateManualScore:252-264`) — `marks.setScale(2)` rejects more than 2 dp; `signum() < 0 || > maximum` rejected. Crucially `maximum` is **not the client's number** — it comes from `LearningAuthorizationClient.validateManualResultContext`, which independently verifies the worksheet is APPROVED, contains the question, is assigned to that student, and that the worksheet's `totalMarks` equals the question bank's (`:110-139`).
- **Database** — `ck_submissions_approval_state`.

So: cannot exceed max, cannot go negative, partial/decimal marks work to exactly 2 dp (integration test proves `1.25` persists). Manual results flow through the *same* `Submission.approve()` path as OCR reviews, so they get a real `answer_reviews` audit row and enqueue mastery sync (`:119-123`). Error handling is thorough — 8 typed handlers mapping to `409 MANUAL_RESULT_EXISTS`, `400 INVALID_MANUAL_RESULT`, `404 MANUAL_RESULT_CONTEXT_NOT_FOUND`, `503 QUESTION_CONTEXT_UNAVAILABLE` (`MarkingReviewController.java:86-129`).

### What Is Missing
- **No editing of an existing manual result.** `createManualResult` throws `ManualResultAlreadyExists` → 409 if a row exists for that (document, question) (`:110-112`). Revision is only possible via `/tutor/reviews/{submissionId}` — but **there is no UI listing existing manual results for a worksheet or student**, so a tutor has no way to find that submission id. In practice: enter once, then hit a 409 with no path forward.
- **One question per save.** Marking a 10-question worksheet means 10 round trips, each redirecting away to the review page — the redirect actively breaks batch entry.
- No worksheet selector in the form; no "save and add another".

### Tests Found
- `backend/grading-service/.../controller/ManualResultIntegrationTest.java` — 4 tests with real persistence and `MockRestServiceServer`: 201 + APPROVED + audit history + `SourceType.MANUAL`; partial `1.25` accepted, duplicate rejected; blank answer and `2.01` against max `2` rejected **with `assertEquals(0, submissions.findAll().size())` proving nothing persisted**; unassigned student → context-not-found, student role → forbidden.
- `frontend/src/components/marking/ManualResultForm.test.tsx` — 4 tests (valid `1.5` submit with exact payload; out-of-range `3` vs max `2` blocked with `expect(submit).not.toHaveBeenCalled()`; double-submit prevention; DRAFT unavailable state)
- `frontend/src/services/submissions.test.ts:5-6`

### Tests Still Required
- **Editing an existing manual result** — nothing covers this journey at all.
- Negative marks at the server boundary (UI covers it; the IT only tests the upper bound).
- More than 2 decimal places (`1.005`) — `validateManualScore` has an explicit branch with zero coverage.
- Page-level test for `results/new/page.tsx` (student-eligibility filtering by class vs direct assignment is untested).

### Recommendation
COMPLETE MISSING WORK — the create path is solid and well tested; the edit path and multi-question entry are not built.

---

## #41 — Define mistake type taxonomy

**Status:** PARTIALLY COMPLETE

### Evidence
- `backend/grading-service/.../model/MistakeType.java` (10-value enum with labels)
- `backend/grading-service/.../model/DiagnosticCategory.java` (4-value enum)
- `backend/grading-service/src/main/resources/db/migration/V4__create_mistake_history.sql`, `V7__create_mastery_sync_outbox.sql`
- `backend/learning-service/src/main/resources/db/migration/V14__create_mastery_diagnostic_evidence.sql`
- `frontend/src/lib/student-mock-data.ts:208-260` (mock, not wired)

### What Works
There are **two** real, reusable taxonomies — not ad-hoc strings. Both are Java enums *and* DB `CHECK` constraints, so neither can fragment by spelling.

**Taxonomy A — `MistakeType` (10 categories)**, in the repo's own terminology (`MistakeType.java:13-22`, enforced by `ck_mistake_records_type`, `V4:29-42`) — and it maps 1:1 onto the brief's suggested list:

`CONCEPT_MISUNDERSTANDING` "Concept misunderstanding" · `CALCULATION_ERROR` "Calculation error" · `MISREAD_QUESTION` "Misread question" · `INCOMPLETE_WORKING` "Incomplete working" · `INCORRECT_FORMULA` "Incorrect formula" · `CARELESS_MISTAKE` "Careless mistake" · `WEAK_EXPLANATION` "Weak explanation" · `MISSING_KEY_POINT` "Missing key point" · `WRONG_UNITS` "Wrong units" · `ANSWER_FORMAT_ISSUE` "Answer format issue"

`MistakeType.fromLabel()` accepts either the label or the enum name, case-insensitively, and throws otherwise (`:34-46`).

**Taxonomy B — `DiagnosticCategory` (4 categories)** (`:10-15`): `CONCEPT`, `KEYWORD`, `EXPRESSION`, `APPLICATION`. Enforced at three layers: `ck_approved_diagnostic_evidence_category` (grading V7:16), `ck_mastery_diagnostic_evidence_category` (learning V14:41-43), and a TS union (`frontend/src/services/submissions.ts:39`).

**Linkage for Taxonomy A is real and strict.** `mistake_records` carries `submission_id` FK → `submissions(id) ON DELETE CASCADE`, plus denormalised `student_id`, `worksheet_id`, `worksheet_question_id`, `question_bank_id`, `syllabus_topic_id`/`_code`, `description`, `tutor_note`. `uk_mistake_records_answer_type UNIQUE (submission_id, mistake_type)`. `MistakeRecord`'s constructor refuses to build unless the parent submission is APPROVED, and re-validates on every persist/update that the denormalised provenance still matches (`:82-84,134-154`).

**Taxonomy B is the one actually wired end to end:** tutor picks a category in `MarkingReview.tsx:118-124` → `ApprovalRequest.diagnosticEvidence` → `approved_diagnostic_evidence` → outbox payload → `mastery_diagnostic_evidence` in learning.

### What Is Missing
- **`MistakeType` is dead in production code.** `Submission.addMistake(...)` (`:343-363`) is the only writer, and grep across `backend/*/src/main` shows **no service or controller ever calls it** — the only callers are `MistakeRecordRepositoryTest`. No mistake-type API, no DTO, no enum-listing endpoint; `MistakeRecordRepository`'s five query methods have zero production callers. The 10-category taxonomy is defined and persistable but unreachable by any user.
- **The frontend uses a third, disconnected copy.** `frontend/src/app/(main)/mistakes/page.tsx:15` imports from `lib/student-mock-data.ts`; categories are hard-coded strings that happen to match four `MistakeType` labels, with no import, no API call, no type relationship. A rename on either side silently diverges.
- **Two taxonomies, no documented relationship.** Nothing maps `MISSING_KEY_POINT` → `KEYWORD` or `CONCEPT_MISUNDERSTANDING` → `CONCEPT`, yet both classes' Javadoc claim to be *the* controlled vocabulary.
- No seed data / reference table — adding a category means a migration plus a redeploy of both services.

### Tests Found
- `backend/grading-service/.../model/MistakeRecordRepositoryTest.java` — 6 substantive tests: iterates **all 10** `MistakeType.values()` and asserts all 10 persist on one answer (`:32-55`); repeated `WRONG_UNITS` across two worksheets queryable and counted (`:57-77`); full provenance retained (`:79-105`); duplicate type rejected, `fromLabel("Not a supported mistake")` throws (`:107-137`); **mistakes cannot be created from an unapproved AI suggestion** (`:139-169`); the DB constraint independently rejects a duplicate inserted outside the aggregate (`:171-190`).
- `MarkingApprovalIntegrationTest.persistsOnlyTutorConfirmedDiagnosticsAndQueuesOneEventPerRevision:127-161` (DiagnosticCategory reaches the outbox; raw OCR text does not)

### Tests Still Required
- Any test proving a `MistakeType` is reachable from an API — impossible today.
- A test binding the frontend mistake vocabulary to the backend enum (they currently cannot drift-fail).
- A documented and asserted mapping between `MistakeType` and `DiagnosticCategory`.

### Recommendation
KEEP OPEN — the taxonomy is genuinely defined and well tested at the persistence layer, but it is not usable: no API surface, no UI binding, and a competing 4-value taxonomy is the one actually in the marking flow. **Decide which taxonomy is canonical before closing.**

---

## #42 — Implement rule-based keyword / component answer checker

**Status:** PARTIALLY COMPLETE

> The keyword engine is real, deterministic and well tested — it would pass review on its own. It is downgraded because the **component** half of the issue title is unimplemented, and the checker is unreachable in normal operation.

### Evidence
- `backend/grading-service/.../service/RuleBasedAnswerChecker.java` (152 lines), `RuleCheckResult.java`
- Sole production caller: `backend/grading-service/.../service/AiGradingService.java:121-131`
- Rubric source: `backend/grading-service/.../service/LearningAuthorizationClient.java:92-93, 238-244`
- Component/keyword DDL: `backend/learning-service/src/main/resources/db/migration/V6__create_questions.sql:46-72`

### What Works
Not placeholder logic, and not naive exact-string comparison. Core matching (`:141-151`):

```java
private boolean matches(String normalizedAnswer) {
    return containsPhrase(normalizedAnswer, canonicalValue)
        || synonyms.stream().anyMatch(s -> containsPhrase(normalizedAnswer, s));
}
private static boolean containsPhrase(String normalizedAnswer, String phrase) {
    return !normalizedAnswer.isEmpty()
        && (" " + normalizedAnswer + " ").contains(" " + phrase + " ");
}
```

Normalisation (`:128-139`):

```java
String decomposed = Normalizer.normalize(value, Normalizer.Form.NFKD).replaceAll("\\p{M}", "");
return decomposed.toLowerCase(Locale.ROOT)
    .replaceAll("[^\\p{Alnum}]+", " ").trim().replaceAll("\\s+", " ");
```

Scoring (`:52-57`): `max × matched/total`, HALF_UP to 2 dp, clamped `.min(max).max(ZERO)`.

Behaviour on every case the brief asks about:

| Case | Behaviour |
|---|---|
| Fully correct | all targets matched → full marks, clamped |
| Partially correct | proportional `max × matched/total` at 2 dp |
| Missing components | returned explicitly in `missingKeywords`, with `matchedKeywords` and `"Matched N of M rubric targets."` |
| Extra irrelevant text | ignored — presence-only, so verbosity is neither penalised nor rewarded |
| Case differences | handled — `toLowerCase(Locale.ROOT)` |
| Formatting / whitespace / punctuation | handled — non-alphanumerics collapse to single spaces; NFKD strips accents |
| Empty answer | short-circuits on `isEmpty()` → 0 marks, all targets missing |
| Word boundaries | space-padded containment, so `"heat"` does **not** match `"heats"` |
| Repeated keyword | counted once (`LinkedHashMap` targets) |
| Malformed rubric | throws — empty rubric, blank/duplicate keyword, synonym not belonging to a target (`:68-120`) |

**Rule-based vs AI path, clearly distinguished.** `AiGradingService.evaluateMarking:78-119` POSTs to the configured provider and accepts the result only if structurally valid and `0 <= marks <= max`. The rule checker is reached **only** via `deterministicFallback():121-131` — i.e. when the provider throws (`AI_UNAVAILABLE`) or returns an invalid body (`AI_RESPONSE_INVALID`), returning `providerResponseValid = false`, which `MarkingReview.tsx:105-107` surfaces to the tutor. Either way the score is only an advisory `ai_suggested_marks` until a tutor approves.

### What Is Missing
- **It does not award marks per marking component.** `marking_components` exists with per-component `marks DECIMAL(6,2)`, and `Question` even validates that they sum to `total_marks` (`Question.java:209-217`). But `LearningAuthorizationClient.criteria():238-244` **throws the weights away**, extracting only `description` strings, and those go to the **AI prompt** as `markingCriteria`. The rule checker instead receives `question.keywords()` and divides marks **equally across keywords**. A 3-mark component and a 1-mark component are weighted identically. The issue title says "keyword / component"; only the keyword half is built.
- **No endpoint.** Grep for `RuleBasedAnswerChecker|RuleCheckResult` across the repo returns only the class, its test, and `AiGradingService:125`. There is no way to invoke it directly or preview a deterministic score.
- **Not injected.** `AiGradingService:125` does `new RuleBasedAnswerChecker()` even though the class is `@Service` — the Spring bean is never used.
- **Silently degrades to zero.** If a question has no `question_keywords` rows (nothing requires any), the fallback returns `0.00` with empty `missingKeywords` — indistinguishable from "student wrote nothing".
- **Synonyms are unreachable in production.** The `Map<String, List<String>> approvedSynonyms` overload — the feature that makes the checker robust — is never called; `AiGradingService` uses the 3-arg overload, and there is no schema for storing approved synonyms.
- Whenever the AI provider is healthy, the rule checker never runs at all.

### Tests Found
- `backend/grading-service/.../service/RuleBasedAnswerCheckerTest.java` — 7 tests, exact `BigDecimal` assertions: full marks 4.00/4.00; proportional 3.00 of 6.00; synonyms across case and punctuation (`"METAL is conductive; it TRANSFERS heat!"` → 2.00/2.00); blank answer → 0.00 with the target listed missing; `"Heat, heat, HEAT!"` counted once → 2.50/5.00; three malformed-rubric rejections; a clamp boundary test.
- `backend/grading-service/.../service/AiMarkingServiceTest.java:60-70` — `fallsBackDeterministicallyForTimeoutAndUnavailableProvider` proves the wiring end to end.

### Tests Still Required
- Component-weighted scoring — nothing exists because the feature does not.
- A question with **zero** keywords hitting `deterministicFallback` (currently an untested silent zero).
- The `approvedSynonyms` overload reached through `AiGradingService`.
- Unicode/accent normalisation (the NFKD branch has no test).
- An end-to-end test where the fallback score becomes the persisted `ai_suggested_marks` on a real `Submission`.

### Recommendation
KEEP OPEN

---

### Mastery Tracking

## #43 — Create mastery record database schema

**Status:** COMPLETE

### Evidence
- `backend/learning-service/src/main/resources/db/migration/V8__create_mastery.sql`, `V14__create_mastery_diagnostic_evidence.sql`, `V15__create_marking_review_status_projection.sql`
- `backend/.../mastery/MasteryRecord.java`, `MasteryHistory.java`, `MasteryRecordRepository.java`, `MasteryService.java`, `MasteryController.java`

### What Works — actual DDL

```
mastery_records(
  id, student_profile_id BIGINT NOT NULL, syllabus_topic_id BIGINT NOT NULL,
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  mastery_status VARCHAR(16) NOT NULL DEFAULT 'NOT_STARTED',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_source_submission_id BIGINT, calculated_at, created_at, updated_at)
UNIQUE uk_mastery_records_student_topic (student_profile_id, syllabus_topic_id)
CHECK  score >= 0 AND score <= 100
CHECK  mastery_status IN ('NOT_STARTED','LEARNING','PRACTISING','IMPROVING','MASTERED','NEEDS_REVISION')
CHECK  attempt_count >= 0
FK     student_profile_id -> student_profiles(id) ON DELETE CASCADE
FK     syllabus_topic_id  -> syllabus_topics(id)  ON DELETE RESTRICT

mastery_history(id, mastery_record_id FK ON DELETE CASCADE,
  previous_score, new_score (both 0-100 checked),
  previous_status, new_status (both status-checked),
  source_submission_id (> 0), reason VARCHAR(500) NOT NULL non-blank, created_at)
```

Against the issue's requirements:

| Requirement | Status |
|---|---|
| Student → Subject → Topic/Subtopic → Mastery Record | **Yes** — a real FK to `syllabus_topics`, itself a 5-level self-referential hierarchy, so Subject is reachable by walking `parent_id` to depth 0 |
| Mastery score | `score DECIMAL(5,2)`, 0-100 checked |
| Attempts | `attempt_count INTEGER >= 0` |
| Correct/incorrect performance | Not on `mastery_records` directly — raw marks live in `mastery_approved_results.approved_marks`/`available_marks` (V14) |
| Last updated | `updated_at` **and** `calculated_at` (usefully distinct) |
| Historical vs current | **Yes** — current on `mastery_records`, full transition log in `mastery_history` |
| Topic relationships | **Yes** — via `syllabus_topics.parent_id`; `MasteryController.mapFor:79-95` builds the active hierarchy, `MasteryMap.tsx:35-46` renders it as a forest |

Supporting tables in V14 make the schema genuinely usable rather than a bare table: `mastery_approved_results` is the immutable per-submission projection (`source_submission_id UNIQUE`, `approved_marks`, `available_marks`, `repeated_mistake_count`, `revision`, `active`, `reviewed_at`, `CHECK (approved_marks >= 0 AND available_marks > 0 AND approved_marks <= available_marks)`), and `mastery_diagnostic_evidence` + `_keywords` hold tutor-confirmed categories.

### Is the schema usable for #44? Yes — demonstrably.
`MasteryService.rebuild:88-100` already derives from it: it reads every `active` approved result for (student, topic) ordered by `reviewed_at, source_submission_id`, folds them through the calculator, and calls `record.replaceApprovedAttempts(attempts)` — clearing and replaying history so the record is a pure derivation of the projection and cannot drift. Every input #44 needs is present and reachable: previous score, prior attempt count, awarded and available marks, the repeated-mistake signal (`MasteryService.java:80`), and chronological ordering backed by `idx_mastery_approved_results_topic_active`.

*(Reported, not audited — `MasteryCalculator.java` currently computes `resultPercent = (awarded/available) × 100`, or exactly `0` when `repeatedMistakeCount > 0`, then returns the running arithmetic mean at 2 dp HALF_UP. Status thresholds live separately in `MasteryRecord.statusFor:188-195`.)*

### What Is Missing
- No FK from `last_source_submission_id` or `mastery_approved_results.source_submission_id` to anything — submissions live in the grading schema. Expected, but an orphaned mastery record is possible with no cascade.
- `mastery_records` stores no raw correct/incorrect tally; per-topic accuracy requires joining `mastery_approved_results`.
- `mastery_history.reason` is a formatted string (`"Tutor-approved result: 75.00% attempt evidence"`) rather than structured — fine for display, not queryable.
- `MasteryRecord.markNeedsRevision()` is fully implemented but called by nothing in production.

### Tests Found
- `backend/.../mastery/MasteryCalculatorTest.java` — 2 tests, 5 exact-value assertions (75.00 from 3/4; 62.50 running mean; 100.00 boundary; `Optional.empty()` on null; 37.50 repeated-mistake branch; throws when awarded > available). **Passed in the captured run.**
- `backend/.../mastery/MasteryServiceIntegrationTest.java` — `1.50/2.00` → 75.00, attempt count 1; **re-applying the same result keeps `attemptCount == 1`** (idempotency); unapproved result throws.
- `backend/.../database/LearningRecordsRepositoryTest.java:50-81` — 0.00/100.00 boundaries, history rows, duplicate (student, topic) rejected; `deletingAStudentCascadesItsMasteryHistoryAndAlerts:152+` verified with raw SQL counts. **Errored in the captured run — see §7.**
- `backend/.../mastery/MasteryControllerTest.java` — 5 tests. **Errored in the captured run.**
- `frontend/src/components/mastery/MasteryMap.test.tsx`, `frontend/src/services/mastery.test.ts`, `frontend/src/app/(main)/mastery-pages.test.tsx`

### Tests Still Required
- A rebuild test with **3+ approved attempts** proving the running mean and the full replayed history — `MasteryServiceIntegrationTest` only ever applies one distinct result.
- **A test for a retracted result removing its contribution** — this path is broken *and* untested (§5, defect D1).
- Threshold tests for `statusFor` at exactly 50.00, 70.00, 85.00.
- `markNeedsRevision()` has no coverage.

### Recommendation
CLOSE — the schema meets every requirement, links Student → Topic with a real FK into the syllabus hierarchy, separates current from historical state, and demonstrably supports the #44 calculation.

---

## 4. Working End-to-End Flows

These genuinely work today, verified by reading both ends and the tests between them.

**Classes — Database → API → List → Detail.** `V2`/`V3` → `ClassController` (`GET/POST /classes`, `GET/PUT /{id}`) → `services/classes.ts` → `ClassList` → `ClassDetail`, with the `/classes/{id}/insights` panel loading independently. Every service path matches a controller mapping and method; payload shapes match the request records; every response passes a hand-written runtime validator before reaching a component. **Caveat:** the detail endpoint carries defect D2.

**Students — Database → API → List → Profile.** `V3`/`V12` → `StudentController` (list with `?classId=`, CRUD, `/{id}/profile`, `/{id}/notes`) → `services/students.ts` → `StudentList` → `StudentProfile` + `TutorNotes` + `LearningInsightsPanel` + `MasteryMap`. The `?classId=` deep link from class detail now resolves end to end. Tenancy is enforced by composite FKs in the database, not just in Java.

**Question Bank — Taxonomy → Schema → Add/Edit → List → Detail.** `V4`/`V5`/`V6` → `SyllabusController` + `QuestionController` → `SyllabusPicker` + `QuestionForm`/`QuestionList`/`QuestionDetail`, with real Next.js routes for all four screens and server-side pagination and filtering. **The one link genuinely absent is search.**

**Worksheets — Question Bank → Generate → Save → Detail → PDF.** `findDeterministicActiveQuestionBank` → `WorksheetService.generate` (idempotency-keyed) → `worksheets` + `worksheet_questions` → `TutorWorksheetDetail` → `GET /{id}/pdf` → PDFBox bytes → browser download. This chain is complete and is the most impressive part of the codebase — subject to the topic-distribution flaw in #35.

**Marking approval → Mastery (the APPROVED path only).** Tutor approves in `MarkingReview.tsx` → `MarkingReviewService.approve` bumps `mastery_sync_revision` and writes two rows to `mastery_sync_outbox` in the same transaction (`:309-345`) → `MasterySyncDispatcher` polls every 60 s and POSTs with `X-Learning-Integration-Key` → `ApprovedMarkingSyncController` constant-time-compares the key → `MasteryService.applyApprovedMarking` upserts `mastery_approved_results`, ignores stale revisions, replaces diagnostic evidence, and calls `rebuild()` → `MasteryCalculator` → `MasteryRecord.replaceApprovedAttempts`. Transactional, idempotent, and tested end to end, and it correctly refuses to leak raw OCR answers (`MarkingApprovalIntegrationTest.java:151-153`).

---

## 5. Missing / Broken Integrations

Ordered by severity. D1 and D2 were each independently re-verified line by line.

**D1 — Retraction never reaches mastery, and the outbox retries forever. (Highest severity.)**
`flag()` and `reset()` null out `approved_marks` before enqueuing, then send `state: "RETRACTED"` (`MarkingReviewService.java:167-173, 181-187`); `enqueueMasterySync:309` builds the payload from `submission.getApprovedMarks()` — now null — and `reset()` additionally nulls `reviewedAt`. On the learning side `MasteryService.validate:107` rejects the message outright: `if (input.approvedMarks() == null || input.availableMarks() == null || …) throw new InvalidResultException(...)`, and `:106` fails on `reviewedAt == null`. The controller maps that to 400, `LearningAuthorizationClient.sync` turns a non-2xx into `LearningSyncUnavailable`, and `MasterySyncDispatcher.dispatchOne` records `event.failed(...)` leaving `delivered_at` null — so the event is **retried every 60 seconds, forever, and can never succeed**. Net effect: when a tutor flags or resets a previously approved answer, the mastery score is never retracted and the outbox accumulates permanently undeliverable rows. `grep -rn "RETRACTED"` returns four production references and **zero tests**; `MarkingApprovalIntegrationTest` stubs learning with `withSuccess()` and so never sees the rejection.

**D2 — Class detail writes inside a read-only transaction. (Confirmed by code reading; PostgreSQL-only.)**
`ClassService.getOwnedClassDetail` is `@Transactional(readOnly = true)` (`:65`) and calls `insightService.insights(...)` (`:131`). `ClassInsightService.insights` is `@Transactional` with default REQUIRED propagation, so it **joins** the read-only transaction — Spring ignores an inner `readOnly` flag on a participating transaction. Inside, `requestRefreshIfMissingOrStale:177` → `requestRefresh:178` runs `jdbc.update("update class_insight_refresh_queue …")` and, when no row exists, an `insert`. PostgreSQL rejects writes in a read-only transaction; `ClassController.java:95-99` would surface it as `503 CLASS_DATABASE_UNAVAILABLE` on the **first** load of any class detail and after every mastery change. Masked in CI because tests run on H2 (`src/test/resources/application.properties:1`) while production uses the PostgreSQL driver. `ClassDetailIntegrationTest.java:77` asserts `insight.status = REFRESHING` — i.e. it *does* exercise the write path, just not against the production engine. The sibling `GET /classes/{id}/insights` is unaffected (`ClassInsightController.java:31` starts its own writable transaction).

**D3 — The student-facing half of the app is mock data.** Six routes import `frontend/src/lib/student-mock-data.ts`: `(main)/page.tsx`, `profile/page.tsx`, `mistakes/page.tsx`, `worksheets/page.tsx`, `worksheets/[worksheetId]/page.tsx`, `upload/page.tsx`. So a tutor approves a real worksheet that students can only ever see as fiction, and `navigation-config.ts:32,43` points **both** roles at `/profile`, so tutors see the student mock too. Real endpoints exist and are tested (`GET /api/learning/student/profile`, `/student/learning-profile`) but have no caller.

**D4 — Worksheet drift: no per-question snapshot.** `worksheet_questions` stores only a FK; marks and prompt are read live from `questions` at render and PDF time (`WorksheetRequests.java:52-55`, `PdfDocumentService.java:50-51`). Editing a bank question retroactively changes an already-issued and already-printed worksheet. Highest data-integrity risk in the worksheet domain.

**D5 — `MistakeType` is unreachable.** 10 categories, a constrained table, 6 real tests — and no service, controller, DTO or UI touches it. The frontend `mistakes` page uses a third hard-coded copy from mock data. Meanwhile the 4-value `DiagnosticCategory` is the taxonomy actually flowing through approval into mastery. Two competing vocabularies, no documented mapping.

**D6 — The rule-based checker ignores component weights and has no endpoint.** `LearningAuthorizationClient.criteria():238-244` discards `marking_components.marks`, sending only descriptions to the AI prompt; the checker divides marks equally across `question_keywords`. It is also instantiated with `new` rather than injected, and only ever runs when the AI provider fails.

**D7 — The question→worksheet draft handoff is a dead end.** `addQuestionToWorksheetDraft` writes `worksheet_draft_question_ids` to sessionStorage (`questions.ts:254-261`) and `QuestionDetail.tsx:96` surfaces the action, but neither `WorksheetBuilder.tsx` nor `TutorWorksheetDetail.tsx` imports it. The code comment admits it: *"once that Phase 4 flow is connected"*.

**D8 — Orphan endpoints with no callers.** `GET /shared/syllabus/children` (tested, unused), `GET /classes/{id}/worksheet-recommendations` (#36, zero frontend references), `fetchGenerationRequest` (`worksheets.ts:182`, so the generation-polling path is unreachable), `TutorClassRepository.deactivateOwnedClass` (tested, no production caller).

**D9 — Cross-schema references are unenforced integers with no reconciliation.** By design there are no FKs between `auth`, `grading` and `learning`. Integrity holds only at write time via REST validation. A deletion in learning silently orphans grading and mastery rows, and `worksheet_question_id` additionally carries two different ID namespaces depending on entry path (`MarkingReviewService.java:114-118`).

---

## 6. Outstanding Issues in Recommended Order

**1. #36 — Diagnostic worksheet generation** *(NOT STARTED — largest remaining gap)*
Why first: it is the only issue in scope with no implementation at all, and it is the product's differentiator — an initial diagnostic is what seeds the mastery data everything downstream reads.
Dependencies: needs a worksheet-type discriminator from #34 (there is no `DIAGNOSTIC` value in V7/V13 to record one with), and needs #35's selection algorithm fixed first, since a diagnostic that draws every question from one topic is worse than useless.

**2. #35 — Worksheet generation: topic distribution + student UI**
Why next: the topic-spread flaw silently misleads tutors — selecting five topics can yield a worksheet drawn entirely from one, with no indication. It also blocks #36. The student-generation backend is already complete and tested; only the UI is missing.
Dependencies: none. `QuestionRepository.java:47` and `WorksheetService.java:79` are the two lines to change.

**3. #42 — Component-weighted scoring**
Why next: `marking_components.marks` already exists and is validated to sum to `total_marks`. `LearningAuthorizationClient.criteria():238-244` throws the weights away — restoring them is a small change with a large accuracy gain, and it makes the deterministic path trustworthy enough to expose as an endpoint.
Dependencies: none.

**4. #34 — Worksheet snapshot + position constraint**
Why next: D4 is a silent-corruption class of bug. Add `marks_snapshot`/`prompt_snapshot` columns and a `UNIQUE (worksheet_id, position)` constraint.
Dependencies: a migration; touches #37 and #38 rendering.

**5. #41 — Pick one mistake taxonomy and expose it**
Why next: decide whether `MistakeType` (10) or `DiagnosticCategory` (4) is canonical, then give the winner an API and bind the frontend to it. Until then the `mistakes` page is decorative.
Dependencies: a product decision, not a technical one.

**6. #40 — Manual result edit path + multi-question entry**
Why next: the 409 dead end is a real usability failure — a tutor who saves once cannot find or amend that result.
Dependencies: needs a "results for this worksheet" listing, which does not exist yet.

**7. #37 — Render subject, topics and total marks**
Why next: cheapest item on this list. `topicName` is already on the wire and discarded.
Dependencies: subject needs a decision — derive from the assignment's class, or add the column in #34.

**8. #31 — Question search + `SyllabusPicker` reset fix**
Dependencies: none. The picker bug also affects #32.

**9. #12 / #8 — Generate Worksheet action, worksheets-completed metric, wire `/profile`**
Dependencies: the metric needs a backend field on `WorksheetAssignmentSummary`; `/profile` needs a role split so tutors stop seeing the student mock.

**10. #23 — Fix the transaction boundary**
Listed last only because it is a two-line fix, not because it is unimportant — it is a P0 production defect. Make `getOwnedClassDetail` non-read-only, or call `insights` with `REQUIRES_NEW`, or split the read from the refresh request.

---

## 7. Missing Tests

### Live run — 28 Aug 14:46

**Frontend — 44 files, 195 tests, 0 failures.** Full pass. Notable counts confirming this audit's coverage claims: `SyllabusPicker.test.tsx` **2 tests** (so the "Keep selected topic" reset path is genuinely uncovered — see #31), `LearningInsightsPanel.test.tsx` **1 test** (happy path only — see #12), `TutorWorksheetDetail.test.tsx` **2 tests**, `WorksheetBuilder.test.tsx` **1 test**. No test file exists for any route page, confirming that gap below.

Four `act(...)` warnings surfaced without failing — `SyllabusPicker` (via `QuestionForm > prepopulates an editable multi-component question`), `ForwardRef(ButtonBase)` (via `topbar > opens the account menu by keyboard`), and `StudentForm > shows server failures and prevents duplicate pending submissions`. Unwrapped state updates in tests are a standard source of order-dependent flakiness; worth clearing before they mask a real regression.

**Backend — did not compile.** `maven-compiler-plugin:3.14.1:compile` on `auth-service`: *"No compiler is provided in this environment. Perhaps you are running on a JRE rather than a JDK?"* The chain halted there, so grading-service and learning-service were never reached. **The backend baseline remains exactly as unverified as it was before this run.**

Fix: install a full JDK 17 and point `JAVA_HOME` at it — e.g. `brew install --cask temurin@17`, then `export JAVA_HOME=$(/usr/libexec/java_home -v17)`. Confirm with `javac -version` before re-running. Until then, `npm run verify` cannot pass and no backend regression can be caught.

### Captured test results (earlier runs, from `backend/*/target/`)

| Suite | When | Result |
|---|---|---|
| grading surefire (8 classes) | 28 Aug 00:37 | **31 run, 0 failures, 0 errors** — incl. `RuleBasedAnswerCheckerTest` 7/7, `MistakeRecordRepositoryTest` 6/6, `SubmissionRepositoryTest` 6/6 |
| grading failsafe (9 classes) | 28 Aug 00:38 | **28 run, 0 failures, 0 errors, 1 skipped** — incl. `ManualResultIntegrationTest` 4/4, `MarkingApprovalIntegrationTest` 4/4; `PostgresMigrationIntegrationTest` skipped (no Docker) |
| learning failsafe (25 classes) | 28 Aug 01:39 | all pass, incl. `MasteryServiceIntegrationTest` 1/1 |
| `WorksheetPdfServiceTest` | 28 Aug 06:12 | **4/4 pass** — freshest report in the repo |
| **learning surefire** | 28 Aug 05:35–05:36 | **50 errors across 10 classes** |

The learning surefire failure is one root cause, not fifty: `UnsatisfiedDependencyException: Error creating bean with name 'reportController' … 'reportService' … No qualifying bean of type 'com.fasterxml.jackson.databind.ObjectMapper'`. Downstream classes then report `ApplicationContext failure threshold (1) exceeded`. It collapsed `MasteryControllerTest` (5), `LearningRecordsRepositoryTest` (4), `WorksheetRepositoryTest` (12), `QuestionRepositoryTest` (9), `StudentProfileRepositoryTest` (7), `TutorClassRepositoryTest` (5), `LearningServiceApplicationTests` (4), `AlertWorkflowTest` (2), `DiagnosticWorksheetServiceTest` (1), `WorksheetGenerationTest` (1).

**That report is almost certainly stale.** The stack trace names `/workspace/target/classes/…/ReportService.class` (a Docker build), and current source imports `tools.jackson.databind.ObjectMapper` — Jackson **3**, which Spring Boot **4.0.6** auto-configures. The failing run was against classes compiled *before* the Jackson-3 migration; `ReportService.java` mtime is 05:36:36, the same minute as the failing batch, and later isolated runs at 06:12–06:15 (`ReportIntegrationTest` 7/7, `ReportPdfServiceTest` 5/5) pass.

**It still has not been re-verified.** The 28 Aug 14:46 run was meant to settle this and could not — the toolchain has no `javac`. `MasteryControllerTest` (5 tests) and `LearningRecordsRepositoryTest` (4 tests) — the two suites covering the mastery schema #44 would extend — have not produced a green result since 05:36, and cannot until a JDK is installed. Treat the learning-service unit baseline as **unknown**, not as passing.

### Missing tests grouped by issue

**Database tests**
- #34 — `(worksheet_id, position)` uniqueness (would fail: no constraint); worksheet drift after a bank-question edit (would fail: no snapshot); approval of a `generation_request_id IS NULL` worksheet (currently impossible).
- #28 — `TOPIC` inserted under a `LEVEL` (skipped `THEME`); root-row uniqueness with `parent_id IS NULL`.
- #30 — `ON DELETE RESTRICT` blocking deletion of a referenced syllabus topic; `syllabus_topic_type` drift from the referenced node.
- #39 — the manual/OCR ID-namespace collision on one document; drift when `worksheet_question_id` no longer resolves; optimistic-lock `version` concurrency.
- #43 — `statusFor` thresholds at exactly 50.00/70.00/85.00; `markNeedsRevision()`.

**API tests**
- #20 — the `@Size(max = 7)` schedule boundary.
- #23 — **a PostgreSQL-backed `GET /classes/{id}` on a class with no snapshot** (the D2 test).
- #35 — `INSUFFICIENT_ACTIVE_QUESTIONS` and zero-match branches; `targetMode=STUDENTS` incl. non-member rejection; `updateWorksheet` reorder persistence.
- #37/#38 — `WorksheetDetailIntegrationTest` must actually run: surefire excludes `**/*IntegrationTest.java` (`pom.xml:148-150`) and failsafe has no matching `<includes>`, so the domain's only HTTP-contract tests have **never executed**.
- #40 — negative marks server-side; >2 decimal places (`1.005`); editing an existing manual result.
- #41 — any test proving a `MistakeType` is reachable from an API.
- #43 — **a retraction test** (D1); a rebuild with 3+ attempts.

**Frontend tests**
- Route pages are an entirely untested layer: none of `classes/page.tsx`, `classes/new`, `classes/[classId]`, `classes/[classId]/edit`, `students/page.tsx`, `students/new`, `students/[studentId]`, `students/[studentId]/edit`, `profile`, or `results/new` has a test. Components and services beneath them are well covered; composition and `router.push` wiring is not.
- `LearningInsightsPanel` — loading, error-with-retry, empty-findings (currently 1 happy-path test, 17 lines).
- `SyllabusPicker` — the "Keep selected topic" revert path (the undetected reset bug); parent-level change resetting deeper selections.
- `WorksheetBuilder` — the `classId=0` dead-builder path.
- Question search — none can exist until search exists.

**Worksheet generator tests**
- Correct requested count: covered. Class generation: covered. Deterministic ordering: covered.
- **Missing:** topic-spread across multiple topics (the test that exposes the #35 flaw); student generation; no-matching-questions; insufficient-questions; invalid configuration.

**PDF tests**
- Generated, non-empty, `%PDF-` header, questions present, ordering, metadata, pagination: **all covered and green.**
- **Missing:** true non-ASCII round trip (the current "special characters" test is all ASCII, despite Noto being embedded precisely for this); an assertion that marks text appears in extracted output.

**Answer checker tests**
- Fully correct, partially correct, incorrect, missing keyword, empty answer, case variation, formatting variation: **all covered with exact `BigDecimal` assertions.**
- **Missing:** missing *component* (the feature does not exist); zero-keyword question hitting the silent-zero branch; `approvedSynonyms` reached through `AiGradingService`; NFKD accent normalisation; fallback score persisting as `ai_suggested_marks` on a real `Submission`.

---

## 8. Technical Debt / Risks

Only items that materially affect completion or robustness.

**0. The backend cannot be built or tested on the development machine.** Confirmed by the 28 Aug 14:46 run: `maven-compiler-plugin` reports *"No compiler is provided in this environment. Perhaps you are running on a JRE rather than a JDK?"* — there is no `javac`. `npm run verify` (lint → typecheck → test → build) therefore cannot pass, `npm test` halts at auth-service so grading and learning never execute, and **no backend regression is currently detectable by anyone on this setup**. Every backend claim in this audit rests on source reading plus reports from 25–28 Aug, some stale. This ranks above everything else below because it is what prevents the rest from being verified. Fix: install a full JDK 17 (`brew install --cask temurin@17`), set `JAVA_HOME`, confirm `javac -version`.

**1. Test-database fidelity.** Every backend integration test in scope runs on H2 in PostgreSQL mode (`backend/learning-service/src/test/resources/application.properties:1`). Only `PostgresMigrationIntegrationTest` uses real PostgreSQL, and it is `@Testcontainers(disabledWithoutDocker = true)` — so on a machine without Docker, none of the constraint or transaction behaviour is verified against the production engine. **This is the direct cause of D2 going undetected**, and it makes every "the database enforces this" claim in this audit conditional on H2 behaving like PostgreSQL, which for read-only transactions it does not.

**2. Integration tests that never run.** `backend/learning-service/pom.xml:148-150` excludes `**/*IntegrationTest.java` from surefire, and `maven-failsafe-plugin` (`:128`) has no `<includes>` picking it up. `WorksheetDetailIntegrationTest`'s 4 tests — the only HTTP-contract coverage for worksheets — have never executed. Worth auditing which other `*IntegrationTest` classes fall into the same hole.

**3. Spring Boot version drift.** `grading-service` is on **4.1.0** while `auth-service` and `learning-service` are on **4.0.6** (`backend/*/pom.xml`). Three services sharing JWT and JSON contracts across minor versions is an avoidable source of surprise.

**4. Issue-numbering divergence.** Git commit subjects use a different numbering scheme than the GitHub issues in this brief — `f2b1dfb build: Issue 43 - report PDF export` is not this brief's #43. Combined with the repo containing substantial work *outside* the audited range (OCR pipeline, AI marking, tutor dashboard, tutor alerts, progress reports, class insights), it is currently impossible to reconcile "what shipped" against "what was asked" from history alone. **Recommend adding `Closes #NN` footers referencing real GitHub issue numbers**, otherwise every future audit repeats this manual reconstruction.

**5. Token storage.** The frontend reads the JWT from `localStorage`/a non-HttpOnly cookie (`lib/auth.ts`, `proxy.ts`), so an XSS would expose it. The codebase mitigates well — no `dangerouslySetInnerHTML` anywhere, and `TutorNotes` has an explicit DOM-level XSS test — but the storage choice remains the weak link.

**6. `useSearchParams` without a Suspense boundary.** `students/page.tsx:13`, `tutor/worksheets/page.tsx:17` and `tutor/worksheets/new/page.tsx` call `useSearchParams()` in client pages with no `<Suspense>`, while `upload/page.tsx:17` explicitly wraps its wizard in one. That is the classic Next prerender-bailout error; confirm `next build` passes on Next 16.2.6 before shipping, since `students` is the target of the class-detail deep link.

**7. Lint blockers.** `QuestionList.tsx:10` imports `TextField` unused; `SyllabusPicker.tsx` has a no-op `helperText={depth === 4 ? undefined : undefined}`. Both would likely fail `npm run lint`, which `npm run verify` gates on.

**8. Unbounded lists.** Classes, students, tutor notes and mastery history are all unpaginated with client-side filtering. Fine at demo scale, not at a real tutor's caseload.

**9. Seed non-idempotency.** `V5__seed_p5_p6_science.sql` uses plain INSERTs with no `ON CONFLICT`. Safe under Flyway, destructive if replayed manually during a recovery.

**10. Unwrapped state updates in three frontend tests.** The 28 Aug run emitted `act(...)` warnings for `SyllabusPicker` (via `QuestionForm > prepopulates an editable multi-component question`), `ForwardRef(ButtonBase)` (via `topbar > opens the account menu by keyboard`), and `StudentForm > shows server failures and prevents duplicate pending submissions`. All three pass today, but unwrapped updates are the usual root of order-dependent flakiness — and the first one sits on `SyllabusPicker`, the component that already has the untested reset bug in #31.

---

## 9. Ready for Issue #44?

**NO — complete the following first: D1 (the retraction sync defect, spanning #39/#43), and re-verify the learning-service test baseline.**

The schema itself is not the problem. **#43 is genuinely COMPLETE** and its usability for #44 is not theoretical — `MasteryService.rebuild:88-100` already performs a mastery derivation against it, replaying the immutable `mastery_approved_results` projection through `MasteryCalculator` so the record cannot drift from its inputs. Every input a scoring algorithm needs is present, FK-linked and reachable. If the only question were "is the schema adequate", the answer would be an unqualified yes.

Two things make it unsafe to build on right now:

**1. Retraction never applies (D1).** When a tutor flags or resets a previously approved answer, the `RETRACTED` event is rejected by `MasteryService.validate:106-107` because `approved_marks` — and for `reset()`, `reviewedAt` — have already been nulled before enqueuing. The dispatcher then retries it every 60 seconds forever. So mastery scores permanently include marks the tutor has explicitly withdrawn, and the outbox grows without bound. **#44 would compute scores on knowingly stale data**, and every calculation refinement built on top would inherit the error while making it harder to spot. There are zero tests on this path. This is the one true blocker.

**2. The backend cannot be tested at all, so the learning-service baseline is unknown.** The 28 Aug 14:46 run was supposed to settle this and instead surfaced a worse problem: the development machine has a JRE, not a JDK, so `maven-compiler-plugin` fails before compiling anything and `npm test` halts at auth-service. The last captured learning-service unit run (28 Aug 05:36) collapsed 50 tests across 10 classes on a Jackson 2/3 mismatch, including `MasteryControllerTest` (5) and `LearningRecordsRepositoryTest` (4) — precisely the suites covering the mastery schema #44 would extend. Circumstantial evidence says that break is already fixed (source now imports `tools.jackson`, Spring Boot 4.0.6 auto-configures Jackson 3, isolated 06:12 runs pass), but it cannot be confirmed, and **no backend regression introduced during #44 would be detectable either**. Starting a scoring algorithm with no runnable test suite underneath it is the larger risk of the two.

The frontend half is in good shape and is not a concern: **44 files, 195 tests, 0 failures**, observed.

Two further items are worth fixing before #44 but do not block it: **D2** (class detail 503 on PostgreSQL) is a P0 production bug but sits outside the mastery path, and **#42's** missing component weighting affects only AI-fallback *suggestions*, which a tutor must approve before anything reaches mastery — the human gate contains the damage.

**Recommended sequence:** install JDK 17 and get `npm test` running end to end → confirm the learning-service context loads and `MasteryControllerTest` / `LearningRecordsRepositoryTest` are green → fix D1 with a test that flags an approved answer and asserts the mastery score drops → then start #44.

---

*Audit performed 28 Aug 2026 against branch `ai_ocr` at `f2b1dfb`. No files were modified, created, deleted, installed, or committed. Frontend suite executed on the development machine at 14:46 — 44 files, 195 tests, 0 failures. Backend suite could not be executed anywhere: the development machine has a JRE without `javac`, and the audit environment has JDK 11 (project needs 17), no Maven Central access, and no Docker. See §2, §7 and §8 item 0 for exactly which conclusions rest on captured reports rather than a live run.*
