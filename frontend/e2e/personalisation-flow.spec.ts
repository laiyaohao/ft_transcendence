import { expect, test } from "@playwright/test";
import { login, seededScenario } from "./support/stack";

test("tutor can open the real diagnostic worksheet recommendation workflow", async ({ page }) => {
  const scenario = await seededScenario();
  await login(page, scenario.tutor.email, scenario.tutor.password, /\/tutor\/dashboard/);
  await page.goto(`/tutor/worksheets/new?classId=${scenario.classId}`);
  await page.getByRole("button", { name: /get diagnostic suggestions/i }).click();
  await expect(page.getByText(/diagnostic recommendation|insufficient evidence/i)).toBeVisible();
});
