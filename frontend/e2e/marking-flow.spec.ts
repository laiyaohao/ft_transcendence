import { expect, test } from "@playwright/test";
import { login, seededScenario } from "./support/stack";

test("submission upload uses offline OCR and exposes the real OCR review state", async ({ page }) => {
  const scenario = await seededScenario();
  await login(page, scenario.student.email, scenario.student.password, /\/student\/dashboard/);
  await page.goto(`/upload?ws=${scenario.worksheetId}&studentId=${scenario.studentId}`);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "handwritten-answer.png",
    mimeType: "image/png",
    // A tiny valid PNG is sufficient because the offline OCR provider returns
    // a fixed transcription. No student document is stored in this fixture.
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLk7wAAAABJRU5ErkJggg==", "base64"),
  });
  await page.getByRole("button", { name: /review submission/i }).click();
  await page.getByRole("button", { name: /submit for ai marking/i }).click();
  await expect(page.getByText(/review the extracted text/i)).toBeVisible();
});
