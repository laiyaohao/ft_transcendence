import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Login from "./login/login";
import Signup from "./signup/signup";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

describe("authentication form integration", () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.replace.mockReset();
    document.cookie = "auth_token=; Max-Age=0; path=/";
  });

  it("submits login credentials through the API client and establishes the browser session", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          token: "login-token",
          email: "tutor@example.com",
          fullName: "Test Tutor",
          role: "tutor",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<Login />);
    await user.type(screen.getByLabelText("Email"), "tutor@example.com");
    await user.type(screen.getByLabelText("Password"), "password-123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8081/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "tutor@example.com",
          password: "password-123",
        }),
      }),
    );
    expect(localStorage.getItem("jwt_token")).toBe("login-token");
    expect(document.cookie).toContain("auth_token=login-token");
    expect(navigation.push).toHaveBeenCalledWith("/classes");
  });

  it("renders a backend login rejection without creating a session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Invalid email or password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const user = userEvent.setup();

    render(<Login />);
    await user.type(screen.getByLabelText("Email"), "tutor@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Invalid email or password")).toBeVisible();
    expect(localStorage.getItem("jwt_token")).toBeNull();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("submits the selected student role during registration", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          token: "registration-token",
          email: "student@example.com",
          fullName: "Test Student",
          role: "student",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<Signup />);
    await user.click(screen.getByRole("button", { name: "Student" }));
    await user.type(screen.getByLabelText("Full name"), "Test Student");
    await user.type(screen.getByLabelText("Email"), "student@example.com");
    await user.type(screen.getByLabelText("Password"), "password-123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8081/api/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "student@example.com",
          password: "password-123",
          fullName: "Test Student",
          role: "student",
        }),
      }),
    );
    expect(localStorage.getItem("jwt_token")).toBe("registration-token");
    expect(navigation.push).toHaveBeenCalledWith("/login");
  });

  it("blocks an empty registration form before it reaches the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<Signup />);
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByText("Please enter a valid name")).toBeVisible();
    expect(screen.getByText("Please enter a valid email address")).toBeVisible();
    expect(screen.getByText("Password must be at least 6 characters")).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
