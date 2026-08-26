import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TutorClass } from "@/services/classes";
import { StudentApiError, type TutorStudent } from "@/services/students";
import StudentForm from "./StudentForm";

const classes: TutorClass[] = [{ id: 12, tutorId: 7, className: "Primary 5 Science", subject: "Science", level: "Primary 5", status: "ACTIVE", schedules: [] }];
const student: TutorStudent = { id: 1, tutorId: 7, fullName: "Bella Tan", loginUserId: null, classes: [], createdAt: "2026-01-01T00:00:00", updatedAt: "2026-01-01T00:00:00" };

describe("StudentForm", () => {
  it("validates fields and submits owner-scoped class memberships once", async () => {
    const user = userEvent.setup();
    const submitStudent = vi.fn().mockResolvedValue(student);
    const onComplete = vi.fn();
    render(<StudentForm mode="create" submitStudent={submitStudent} onComplete={onComplete} loadClasses={async () => classes} />);
    await screen.findByText("Primary 5 Science");
    await user.click(screen.getByRole("button", { name: "Create student" }));
    expect(await screen.findByText("Student name is required.")).toBeVisible();
    await user.type(screen.getByLabelText("Student name"), " Bella Tan ");
    await user.click(screen.getByRole("button", { name: /Primary 5 Science/ }));
    await user.click(screen.getByRole("button", { name: "Create student" }));
    await waitFor(() => expect(submitStudent).toHaveBeenCalledWith({ fullName: "Bella Tan", loginUserId: null, classIds: [12] }));
    expect(onComplete).toHaveBeenCalledWith(student);
  });

  it("shows server failures and prevents duplicate pending submissions", async () => {
    const user = userEvent.setup();
    let resolve!: (value: TutorStudent) => void;
    const submitStudent = vi.fn(() => new Promise<TutorStudent>((complete) => { resolve = complete; }));
    render(<StudentForm mode="create" submitStudent={submitStudent} onComplete={vi.fn()} loadClasses={async () => []} />);
    await user.type(screen.getByLabelText("Student name"), "Bella Tan");
    await user.click(screen.getByRole("button", { name: "Create student" }));
    expect(screen.getByRole("button", { name: "Creating student…" })).toBeDisabled();
    expect(submitStudent).toHaveBeenCalledOnce();
    resolve(student);
  });

  it("surfaces structured server validation", async () => {
    const user = userEvent.setup();
    render(<StudentForm mode="create" submitStudent={vi.fn().mockRejectedValue(new StudentApiError("Login identity is already linked", 409, { loginUserId: "Choose another login ID." }))} onComplete={vi.fn()} loadClasses={async () => []} />);
    await user.type(screen.getByLabelText("Student name"), "Bella Tan");
    await user.click(screen.getByRole("button", { name: "Create student" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("already linked");
    expect(screen.getByText("Choose another login ID.")).toBeVisible();
  });
});
