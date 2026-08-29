# Project Audit — Up to Issue #45

**Repository:** `ft_transcendence` · branch `ai_ocr` · HEAD `d41346e` ("build: patches", 2026-08-29 10:19 +08) · working tree clean
**Scope:** Issues #8, #12, #13, #15–#45. Inspection only — no file in the repository was modified, created, deleted or committed.

> **Commit numbering warning (carried forward).** Git subjects use a *different* numbering scheme than this brief. `b8236d7 build: Issue 45 - Student Worksheet Library` is **not** this brief's #45 (Mastery Map); the Mastery Map landed earlier, and the rule-based checker landed as `87ca310 build: Issue 32 - Checker`. Every conclusion below comes from reading source, migrations and tests at HEAD, never from commit messages.

---

## 1. Current Technology Stack

Verified from manifests and source.

| Layer | Actual technology | Evidence |
|---|---|---|
| Frontend | Next.js **16.2.6** App Router, React **19.2.4**, TypeScript 5 | `frontend/package.json` |
| Styling | MUI **9.1.1** + Emotion; no Tailwind, no CSS modules | `frontend/package.json` |
| Frontend tests | **Vitest 4.1** + Testing Library + jsdom; separate unit and integration configs | `vitest.config.mts`, `vitest.integration.config.mts` |
| Backend | **Spring Boot 4.x**, Java 17 — three services: `auth`, `grading`, `learning` | `backend/*/pom.xml` |
| Database | **PostgreSQL**, one instance, three isolated schemas | `compose.yaml`, `README.md` |
| Migrations | **Flyway**, per-schema history (`learning` now at **V21**, `grading` at **V8**, `auth` at V1) | `backend/*/src/main/resources/db/migration` |
| ORM | Spring Data JPA / Hibernate, `ddl-auto=validate` | `backend/*/src/main/resources/application.properties` |
| Validation | jakarta.validation on request records and entities, service-level cross-field rules, plus DB `CHECK` constraints | `ClassRequest`, `QuestionRequest`, `Question`, all migrations |
| PDF | **Apache PDFBox 3.0.6**, programmatic composition, embedded Noto Sans (CID) for non-ASCII | `learning-service/pom.xml`, `pdf/PdfDocumentService.java` |
| Auth | BCrypt + JJWT 0.11.5, `ROLE_TUTOR` / `ROLE_STUDENT`, `anyRequest().denyAll()` default | `auth-service/security`, `learning/config/SecurityConfig` |
| Service-to-service | Durable outbox + `X-Learning-Integration-Key` shared secret, `@EnableScheduling` retry dispatcher | `grading/service/MasterySyncDispatcher`, `learning/mastery/ApprovedMarkingSyncController` |
| Backend tests | JUnit 5, Spring Boot Test, MockMvc, H2, Testcontainers Postgres (`disabledWithoutDocker`) | `backend/*/pom.xml` |

---

## 2. Audit Summary

```
Completed:            33
Partially Complete:    0
Not Started:           0
Blocked/Broken:        0
```
(33 rows; #17 and #19 audited together as one class-flow item.)

**Every issue in this brief's scope is now implemented and connected.** The two headline defects from the #43 audit are fixed and covered by regression tests: the Class Detail read-only-transaction write (#23) now runs the insight refresh in `Propagation.REQUIRES_NEW` with a dedicated PostgreSQL Testcontainers test, and diagnostic worksheet generation (#36) now actually creates `DIAGNOSTIC` worksheets from mastery evidence and is reachable from the builder UI.

**One live defect was found outside this brief's scope** — in the Student Worksheet Library, which the repo shipped after the Mastery Map. It is a silent cross-service ID mismatch that permanently hides marked scores from students. It is detailed in §5 and it does not block #46, but it should be fixed first because it sits on the same evidence chain the alerts feature will read.

### Verification actually performed

| Check | Result |
|---|---|
| Frontend unit suite (`vitest run`), **executed by this audit** on HEAD source in a clean Linux container with `npm ci` | **52 files, 237 tests, 0 failures** (117 s) |
| Frontend integration suite (`vitest run --config vitest.integration.config.mts`), **executed by this audit** | **1 file, 6 tests, 0 failures** |
| `tsc --noEmit`, **executed by this audit** | **0 errors** |
| Backend suites | **Not executable in this environment** — read below |
| Backend recorded results (surefire/failsafe reports on disk, written 2026-08-29 02:22–02:23 UTC, i.e. *after* the HEAD commit at 02:19:51 UTC) | auth 23 unit / 12 IT · grading 54 / 34 · learning 122 / 93 — **0 failures, 0 errors** |

**Why the backend could not be re-run here.** The developer's machine (via the session's Linux VM) has a Java **runtime only** — `javac` is absent, exactly as `README.md` and `DEPENDENCIES.md` warn — and no Maven or Docker. The cloud container this audit runs in *does* have JDK 21, Maven 3.9 and Docker, but its egress proxy returns `403` for `repo.maven.apache.org`, so no Spring Boot dependency can be resolved there either. Backend status therefore rests on source review plus the on-disk reports, which are current for HEAD (only `alert/AlertWorkflowTest`'s *failsafe* report predates it; its surefire run at 02:22 is current and green).

The frontend result above is stronger than the previous audit's: it was produced by this audit from the HEAD working tree, not reported second-hand.

---

## 3. Issue Status

| Issue | Description | Status |
|---|---|---|
| #15 | Application shell (sidebar + top nav) | COMPLETED |
| #16 | Class database schema | COMPLETED |
| #17 / #19 | Overall class list + create/edit flows | COMPLETED |
| #18 | Class list retrieval API | COMPLETED |
| #20 | Class create/update APIs | COMPLETED |
| #21 | Class create/edit UI flow | COMPLETED |
| #22 | Class list UI | COMPLETED |
| #23 | Class detail page | COMPLETED |
| #24 | Student database schema | COMPLETED |
| #25 | Student list page | COMPLETED |
| #26 | Create/edit student flow | COMPLETED |
| #27 | Tutor notes for students | COMPLETED |
| #12 | Student profile UI | COMPLETED |
| #13 | Student profile retrieval API | COMPLETED |
| #8 | Overall student profile page | COMPLETED |
| #28 | Syllabus taxonomy schema | COMPLETED |
| #29 | Seed P5/P6 Science taxonomy | COMPLETED |
| #30 | Question bank database schema | COMPLETED |
| #31 | Question bank list page | COMPLETED |
| #32 | Add/edit question form | COMPLETED |
| #33 | Question detail page | COMPLETED |
| #34 | Worksheet database schema | COMPLETED |
| #35 | Worksheet generation flow | COMPLETED |
| #36 | Diagnostic worksheet generation | COMPLETED |
| #37 | Worksheet detail page | COMPLETED |
| #38 | Printable worksheet PDFs | COMPLETED |
| #39 | Student answer database schema | COMPLETED |
| #40 | Manual result entry page | COMPLETED |
| #41 | Mistake type taxonomy | COMPLETED |
| #42 | Rule-based keyword/component checker | COMPLETED |
| #43 | Mastery record database schema | COMPLETED |
| #44 | Mastery score calculation | COMPLETED |
| #45 | Mastery map component | COMPLETED |

---

# Completed Issues

#15 — COMPLETED
#16 — COMPLETED
#17 / #19 — COMPLETED
#18 — COMPLETED
#20 — COMPLETED
#21 — COMPLETED
#22 — COMPLETED
#23 — COMPLETED
#24 — COMPLETED
#25 — COMPLETED
#26 — COMPLETED
#27 — COMPLETED
#12 — COMPLETED
#13 — COMPLETED
#8 — COMPLETED
#28 — COMPLETED
#29 — COMPLETED
#30 — COMPLETED
#31 — COMPLETED
#32 — COMPLETED
#33 — COMPLETED
#34 — COMPLETED
#35 — COMPLETED
#36 — COMPLETED
#37 — COMPLETED
#38 — COMPLETED
#39 — COMPLETED
#40 — COMPLETED
#41 — COMPLETED
#42 — COMPLETED
#43 — COMPLETED
#44 — COMPLETED
#45 — COMPLETED

---

# Outstanding / Partial Issues

**None.** No issue in scope is Partially Complete, Not Started, Blocked or Broken.

For the record, the four items the #43 audit had open are now closed, each verified against current source:

- **#23** — `ClassInsightService.insights` is `@Transactional(propagation = Propagation.REQUIRES_NEW)`; `ClassDetailPostgresIntegrationTest` proves two consecutive detail requests succeed on real PostgreSQL and enqueue exactly one refresh. `ClassSchedule` now renders the timetable (`ClassDetail.tsx`).
- **#36** — `DiagnosticWorksheetService.generate` builds a `WorksheetType.DIAGNOSTIC` draft through the normal idempotent boundary, rejects topics outside the current recommendation set, and writes the evidence reason into the instructions. `WorksheetBuilder` exposes "Get diagnostic suggestions" → "Generate diagnostic draft".
- **#41** — `MistakeType` carries the full ten-value canonical taxonomy with a derived `DiagnosticCategory`; `GET /api/grading/mistakes/{me,students/:id}` serves it; `MarkingReview.tsx` lets the tutor pick a type at approval and `/mistakes` shows the student their confirmed history.
- **#42** — `checkWeighted` scores per-component mark allocations (total must equal the question maximum), returns per-component evidence, and is exposed at `POST /api/grading/tutor/questions/{id}/rule-check` with a tutor-facing preview in `QuestionDetail.tsx`. Marking-component keywords are persisted (`V20`).

Other gaps the #43 audit listed are also closed: question-bank search (`findQuestionBank` with accent-folded code/prompt/keyword matching + a search field in `QuestionList`), worksheet snapshots and `worksheet_type`/`subject`/unique `(worksheet_id, position)` (`V18`), student self-profile now served by `GET /api/learning/student/profile` instead of mock data, taxonomy leaves and the duplicate Plant/Human node (`V17`), Generate Worksheet plus an approved-worksheet metric on the tutor student profile, and multi-question atomic manual result entry with an edit path into `/tutor/reviews/{id}`.

---

# Missing / Broken Integrations

## Confirmed defect — approved results never match worksheet questions in the Student Worksheet Library

**Severity: high (silent).** A student who has been fully marked keeps seeing the worksheet as *Submitted* with no score, forever.

**Where.** `learning-service/.../worksheet/WorksheetService.java`, `outcome(...)`:

```java
Set<Long> questionIds = worksheet.getQuestions().stream()
    .map(WorksheetQuestion::getId)                       // worksheet_questions.id (join-row id)
    .collect(toSet());
...
if (result.getWorksheetQuestionId() != null && questionIds.contains(result.getWorksheetQuestionId())) { ... }
```

**Why it cannot match.** `mastery_approved_results.worksheet_question_id` is populated from grading, and grading never sends a `worksheet_questions.id`:

- Manual entry — `grading/.../MarkingReviewService.createManualResults` calls `Submission.createAnswer(document, entry.questionBankId(), entry.questionBankId(), …)`, with the comment *"Persist that stable ID on both sides until it exposes a distinct instance ID."* So `worksheet_question_id` **is the question-bank id**.
- OCR review — `createMarkingReview` takes `worksheetQuestionId` from the client, and the only worksheet payload a client has is `WorksheetRequests.QuestionSummary`, whose `id` is `question.getId()` — again the **question-bank id**. `worksheet_questions.id` is not exposed by any API, so no caller can supply it.

Consequently the `MARKED` branch (and the whole `ScoreSummary`) is unreachable in production; the code falls through to `SUBMITTED`.

**Why the test suite does not catch it.** `StudentWorksheetLibraryIntegrationTest`'s helper `question(...)` returns `SELECT id FROM worksheet_questions …` and seeds `mastery_approved_results` with that value — the one namespace the real producer never uses. The test asserts the code path, not the contract.

**Fix options** (pick one and make it explicit in the schema comment):
1. Compare against the question-bank id — `worksheet.getQuestions().stream().map(q -> q.getQuestion().getId())` — matching what grading actually sends, and rename the column/field to say so; or
2. Expose the true worksheet-question instance id in `QuestionSummary`, have both grading paths send it, and backfill existing rows.

Whichever is chosen, the library test must seed from the producer's namespace (or, better, drive the row through `ApprovedMarkingSyncController`) so the contract is what is asserted.

## Chains verified as sound

```
Class Schema → API → List → Detail                                     OK
Student Schema → API → List → Profile (tutor + student self)           OK
Taxonomy → Questions → Add/Edit → List → Detail                        OK
Question Bank → Generate → Save → Detail → PDF                         OK
Worksheet → Student Answers → Result Entry → Checker → Mistake Type    OK
Student Answer → Topic → Mastery Calculation → Record → Mastery Map    OK
```

Mastery is unaffected by the defect above: `MasteryService` keys on `(student_profile_id, syllabus_topic_id)` and rebuilds from `mastery_approved_results` ordered by `reviewed_at`, so scores, statuses and history are correct regardless of the question-id namespace. Delivery is durable (outbox + scheduled retry), idempotent (revision guard), and reversible (`RETRACTED` on flag/reset).

## Lower-severity notes

1. **Worksheet PDF reads the live question, not the snapshot** — `PdfDocumentService.createWorksheetPdf` uses `worksheetQuestion.getQuestion()` while the JSON API prefers the `*_snapshot` columns added in `V18`. Harmless today only because `QuestionService.update` throws `QuestionInUseException` when content changes on a question used by any worksheet; if that guard is ever relaxed, the PDF and the API will disagree.
2. **Builder topic chips show `Topic #12` rather than the topic name** (`WorksheetBuilder.tsx`) — cosmetic, but the tutor is selecting syllabus topics blind after adding them.
3. **`SidebarProps.disableCollapsibleSidebar` / `container` are accepted and explicitly voided**, and `sidebar-divider-item.tsx` / `sidebar-header-item.tsx` have no importers. Dead surface area, no behavioural impact.
4. **Alerts already exist.** `V9__create_alerts.sql` (`tutor_alerts` with type/severity/status/dedup key/lifecycle constraints), `AlertGenerationService`, `AlertController` and `AlertList.tsx` are all in the tree and wired. Before starting #46, confirm what it is meant to add beyond what is already there.

---

# Outstanding Tests

No implementation is missing, so these are coverage gaps on shipped code, ordered by risk.

## Blocking the defect fix (write with the fix)

- `learning-service/src/test/java/.../worksheet/StudentWorksheetLibraryIntegrationTest.java` *(modify)*
  - A worksheet whose approved results were produced the way grading produces them (question-bank id in `worksheet_question_id`) reports `MARKED` with the correct `ScoreSummary`.
  - Partially marked worksheet stays `SUBMITTED` with no score.
  - A retracted (`active = false`) result drops the worksheet back out of `MARKED`.
- `learning-service/src/test/java/.../mastery/ApprovedMarkingSyncControllerTest.java` *(modify)*
  - End-to-end within learning: post a sync payload shaped exactly like `ApprovedMarkingSyncPayload`, then assert the library outcome — closing the loop the seeded test currently bypasses.

## Worksheet generation and editing (#35, #37)

- `learning-service/src/test/java/.../worksheet/WorksheetGenerationTest.java` *(modify)*
  - `INSUFFICIENT_ACTIVE_QUESTIONS`: request more questions than the active bank holds for a topic → request is `FAILED`, no worksheet row is created, failure code and message are returned.
  - Question-type filter narrows selection and can itself trigger the insufficient path.
- `learning-service/src/test/java/.../worksheet/WorksheetDetailIntegrationTest.java` *(modify)* — HTTP-level `PATCH /api/learning/tutor/worksheets/{id}`:
  - Add, remove and replace questions (reordering is already covered at service level by `WorksheetRepositoryTest`).
  - Archived or foreign question id → 400, draft unchanged.
  - Non-draft worksheet → `WorksheetNotDraftException` mapped to its HTTP status.
  - Empty `questionIds` list is rejected.

## Diagnostic generation (#36)

- `learning-service/src/test/java/.../worksheet/DiagnosticWorksheetServiceTest.java` *(modify)*
  - A topic outside the current recommendation set is rejected with `InvalidWorksheetRequestException`.
  - `targetMode = STUDENTS` filters recommendations to the selected students only.
  - Selected topics are distributed evenly across the generated question set.

## Mastery calculation (#44)

- `learning-service/src/test/java/.../mastery/MasteryCalculatorTest.java` *(modify)* — the brief's matrix is covered except:
  - Zero result (`awardedMarks = 0`) on a first attempt → `0.00`, status `NEEDS_REVISION`.
  - `availableMarks = 0` → `IllegalArgumentException` (guards the divide-by-zero explicitly rather than by inspection).
  - Boundary scores at exactly 50.00 / 70.00 / 85.00 (statuses are asserted in `MasteryServiceIntegrationTest`; the calculator's rounding at those edges is not).

## Frontend

- `frontend/src/**/*.integration.test.tsx` *(create)* — the "integration" config currently matches exactly one file (`auth-flow`, 6 tests). Component tests all inject mocked service functions, so no test exercises a service module against a stubbed HTTP layer. Worth one integration file per critical flow (worksheet generate → edit → approve; manual result entry; mastery map load/error), driven through the real `services/*` modules with `fetch` stubbed.

---

# Recommended Completion Order

No issue in scope remains outstanding. Recommended work before or alongside #46:

1. **Student Worksheet Library ID mismatch** (§5) — one-line fix plus a contract-shaped test. Do this first: it is a live, silent, student-facing bug, and #46's alerting will read the same approved-result chain.
2. **Worksheet `PATCH` HTTP tests and the insufficient-questions path** — the draft-edit endpoint performs a native `DELETE` + re-insert against a unique `(worksheet_id, position)` constraint and is the least-covered risky code in the worksheet flow.
3. **Mastery calculator boundary and zero-score tests** — cheap, and they pin the formula before alerts start reacting to score thresholds.
4. **Clarify the #46 scope against existing `tutor_alerts`** — the schema, generation service, API and UI already exist; decide whether #46 is an extension, a rework, or NO LONGER REQUIRED.

---

# Ready for Issue #46?

### YES
**Issues through #45 are sufficiently complete and tested to proceed to Issue #46 — Create Alert Database Schema.**

Two caveats to carry into that work, neither of which is an incomplete issue in this scope:

1. Fix the Student Worksheet Library ID mismatch (§5) first — it is a live defect on the evidence chain alerts will consume.
2. `tutor_alerts` and its generation service, API and UI already exist (`V9`, `AlertGenerationService`, `AlertController`, `AlertList.tsx`). Confirm what #46 adds before writing a new migration; the answer may be that #46 is largely **NO LONGER REQUIRED**.

---

*Audit performed 29 August 2026 against HEAD `d41346e`. Frontend suites and typecheck were executed as part of this audit; backend results are the developer's own post-HEAD run recorded under `backend/*/target/`, and could not be independently re-executed (no `javac` on the development machine, no Maven Central egress in the audit container).*
