# E2E test environment gaps

The Compose overlay in `compose.e2e.yaml` supplies a deterministic, offline OpenAI-compatible AI/OCR endpoint. It responds only with checked-in fixture results and needs no network or external credentials.

`docker/e2e-seed` now provides a disposable Compose-only seed. It creates the linked Tutor account, Student account/profile, class, question, and approved assigned worksheet by using the same authenticated APIs as the application. Its local `/context` endpoint makes only the resulting test IDs and E2E-only credentials available to Playwright, so the browser suite needs no manual IDs or production endpoint.

Remaining product gaps are asserted honestly rather than simulated: the current upload screen still selects worksheet display data from `student-mock-data`, no UI control exposes the existing Tutor worksheet PDF endpoint, and upload/OCR does not itself create a marking review, tutor approval, mastery update, or mistake history. Therefore the affected specs cover the real current capability (assigned worksheet, offline OCR review, diagnostic availability, and PDF API), not a false end-to-end marking/personalisation claim.
