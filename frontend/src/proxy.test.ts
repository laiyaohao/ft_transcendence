import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "./proxy";

function token(role: "TUTOR" | "STUDENT") {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${encode({ alg: "HS256" })}.${encode({ sub: "user@example.com", role, exp: Math.floor(Date.now() / 1000) + 3600 })}.signature`;
}

function request(pathname: string, role?: "TUTOR" | "STUDENT") {
  const headers = new Headers();
  if (role) headers.set("cookie", `auth_token=${token(role)}`);
  return new NextRequest(`http://localhost:3000${pathname}`, { headers });
}

describe("route proxy", () => {
  it("allows a Tutor to open the dashboard and redirects a Student home", () => {
    expect(proxy(request("/tutor/dashboard", "TUTOR")).status).toBe(200);
    const response = proxy(request("/tutor/dashboard", "STUDENT"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("protects the Question Bank and prevents Students from reaching its nested editor", () => {
    expect(proxy(request("/questions/7/edit", "TUTOR")).status).toBe(200);
    const response = proxy(request("/questions/7/edit", "STUDENT"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("sends a signed-in Tutor away from login to the Tutor dashboard", () => {
    const response = proxy(request("/login", "TUTOR"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/tutor/dashboard");
  });
});
