# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: personalisation-flow.spec.ts >> tutor can open the real diagnostic worksheet recommendation workflow
- Location: e2e/personalisation-flow.spec.ts:4:5

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: /sign in|login/i }) resolved to 3 elements:
    1) <button tabindex="0" type="submit" aria-busy="false" class="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-sizeMedium MuiButton-colorPrimary MuiButton-fullWidth mui-b0i0ka">Sign In</button> aka getByRole('button', { name: 'Sign In', exact: true })
    2) <button tabindex="0" type="button" class="MuiButtonBase-root MuiButton-root MuiButton-outlined MuiButton-sizeMedium MuiButton-colorPrimary MuiButton-fullWidth mui-x1b13j">…</button> aka getByRole('button', { name: 'Sign in with Google' })
    3) <button tabindex="0" type="button" class="MuiButtonBase-root MuiButton-root MuiButton-outlined MuiButton-sizeMedium MuiButton-colorPrimary MuiButton-fullWidth mui-x1b13j">…</button> aka getByRole('button', { name: 'Sign in with Facebook' })

Call log:
  - waiting for getByRole('button', { name: /sign in|login/i })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e5]:
      - heading "Sign In" [level=1] [ref=e6]
      - generic [ref=e7]:
        - generic [ref=e8]:
          - generic [ref=e9]: Email
          - generic [ref=e11]:
            - textbox "Email" [ref=e12]:
              - /placeholder: your@email.com
              - text: e2e.tutor@example.test
            - group
        - generic [ref=e13]:
          - generic [ref=e14]: Password
          - generic [ref=e16]:
            - textbox "Password" [active] [ref=e17]:
              - /placeholder: ••••••
              - text: E2eTutor!Pass123
            - group
        - generic [ref=e18] [cursor=pointer]:
          - checkbox "Remember me" [ref=e20]
          - generic [ref=e23]: Remember me
        - button "Sign In" [ref=e24] [cursor=pointer]
        - button "Forgot your password?" [ref=e25] [cursor=pointer]
      - separator [ref=e26]:
        - generic [ref=e27]: or
      - generic [ref=e28]:
        - button [ref=e29] [cursor=pointer]
        - button [ref=e36] [cursor=pointer]
        - paragraph [ref=e41]:
          - text: Don't have an account?
          - link "Sign Up" [ref=e42] [cursor=pointer]:
            - /url: /signup
    - contentinfo [ref=e43]:
      - link "Privacy Policy" [ref=e44] [cursor=pointer]:
        - /url: /privacy
      - link "Terms of Use" [ref=e45] [cursor=pointer]:
        - /url: /terms
  - alert [ref=e46]
```

# Test source

```ts
  1  | import { expect, type Page } from "@playwright/test";
  2  | 
  3  | /**
  4  |  * Full MVP flows intentionally require a clean, seeded Compose profile.  The
  5  |  * application currently has no supported reset/seed API, so pretending that
  6  |  * arbitrary local data represents those workflows would hide regressions.
  7  |  */
  8  | export type E2eScenario = {
  9  |   tutor: { email: string; password: string };
  10 |   student: { email: string; password: string };
  11 |   classId: number;
  12 |   studentId: number;
  13 |   topicId: number;
  14 |   questionId: number;
  15 |   worksheetId: number;
  16 | };
  17 | 
  18 | let scenario: Promise<E2eScenario> | undefined;
  19 | 
  20 | export function seededScenario(): Promise<E2eScenario> {
  21 |   scenario ??= fetch(process.env.E2E_SEED_URL ?? "http://127.0.0.1:8090/context").then(async (response) => {
  22 |     if (!response.ok) throw new Error("The disposable E2E seed is unavailable. Start `docker compose --env-file compose.e2e.env -f compose.yaml -f compose.e2e.yaml --profile e2e up --build --wait`.");
  23 |     return response.json() as Promise<E2eScenario>;
  24 |   });
  25 |   return scenario;
  26 | }
  27 | 
  28 | export async function login(page: Page, email: string, password: string, home: RegExp): Promise<void> {
  29 |   await page.goto("/login");
  30 |   await page.getByLabel(/email/i).fill(email);
  31 |   await page.getByLabel(/password/i).fill(password);
> 32 |   await page.getByRole("button", { name: /sign in|login/i }).click();
     |                                                              ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: /sign in|login/i }) resolved to 3 elements:
  33 |   await expect(page).toHaveURL(home);
  34 | }
  35 | 
```