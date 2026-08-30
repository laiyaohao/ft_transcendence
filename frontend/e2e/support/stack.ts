import { expect, type Page } from "@playwright/test";

/**
 * Full MVP flows intentionally require a clean, seeded Compose profile.  The
 * application currently has no supported reset/seed API, so pretending that
 * arbitrary local data represents those workflows would hide regressions.
 */
export type E2eScenario = {
  tutor: { email: string; password: string };
  student: { email: string; password: string };
  classId: number;
  studentId: number;
  topicId: number;
  questionId: number;
  worksheetId: number;
};

let scenario: Promise<E2eScenario> | undefined;

export function seededScenario(): Promise<E2eScenario> {
  scenario ??= fetch(process.env.E2E_SEED_URL ?? "http://127.0.0.1:8090/context").then(async (response) => {
    if (!response.ok) throw new Error("The disposable E2E seed is unavailable. Start `docker compose --env-file compose.e2e.env -f compose.yaml -f compose.e2e.yaml --profile e2e up --build --wait`.");
    return response.json() as Promise<E2eScenario>;
  });
  return scenario;
}

export async function login(page: Page, email: string, password: string, home: RegExp): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|login/i }).click();
  await expect(page).toHaveURL(home);
}
