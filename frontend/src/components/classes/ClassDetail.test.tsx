import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { TutorClassDetail } from "@/services/classes";

import ClassDetail from "./ClassDetail";

const detail: TutorClassDetail = {
  id: 12, tutorId: 7, className: "Primary 5 Science", subject: "Science", level: "Primary 5", status: "ACTIVE",
  schedules: [{ dayOfWeek: "MONDAY", startTime: "16:00", endTime: "17:30" }],
  students: [{ id: 21, fullName: "Bella Tan", overallMastery: 68, masteryRecordCount: 4 }],
  mastery: { averageScore: 68, recordCount: 4, studentsWithMastery: 1 },
  weakAreas: [{ topicId: 41, topicName: "Adaptation", averageScore: 45, affectedStudentCount: 1 }],
  insight: { status: "UNAVAILABLE", message: "Insights will appear after the analysis service is available." },
  worksheets: [{ id: 31, title: "P5 Science — Adaptation Mini Test", status: "APPROVED", dueAt: "2026-09-15T23:59:00+08:00", assignedAt: "2026-09-01T10:00:00+08:00" }],
};

describe("ClassDetail", () => {
  it("shows a loading skeleton before it renders the owner-scoped detail", async () => {
    let resolve!: (value: TutorClassDetail) => void;
    render(<ClassDetail classId={12} loadClass={() => new Promise<TutorClassDetail>((complete) => { resolve = complete; })} />);
    expect(screen.getByTestId("class-detail-skeleton")).toBeVisible();
    resolve(detail);
    expect(await screen.findByRole("heading", { name: "Primary 5 Science" })).toBeVisible();
  });

  it("renders students, mastery, weak areas, insight availability, worksheets, and responsive sections", async () => {
    render(<ClassDetail classId={12} loadClass={async () => detail} />);
    expect(await screen.findByText("Bella Tan")).toBeVisible();
    expect(screen.getAllByText("68%")).toHaveLength(2);
    expect(screen.getByText("Adaptation")).toBeVisible();
    expect(screen.getByText("Insights will appear after the analysis service is available.")).toBeVisible();
    expect(screen.getByText("P5 Science — Adaptation Mini Test")).toBeVisible();
    expect(screen.getByText("Generate Worksheet")).toBeDisabled();
    expect(screen.getByRole("link", { name: "Edit class" })).toHaveAttribute("href", "/classes/12/edit");
    expect(screen.getByRole("link", { name: "View students" })).toHaveAttribute("href", "/students?classId=12");
    expect(screen.getByRole("link", { name: "View worksheets" })).toHaveAttribute("href", "/worksheets?classId=12");
  });

  it("shows actionable empty states for a class without learning data", async () => {
    render(<ClassDetail classId={12} loadClass={async () => ({ ...detail, students: [], mastery: { averageScore: null, recordCount: 0, studentsWithMastery: 0 }, weakAreas: [], worksheets: [] })} />);
    expect(await screen.findByText("No students in this class")).toBeVisible();
    expect(screen.getByText("No weak areas identified")).toBeVisible();
    expect(screen.getByText("No worksheets assigned")).toBeVisible();
  });

  it("shows a retryable missing or wrong-owner error", async () => {
    const loadClass = vi.fn().mockRejectedValueOnce(new Error("Class 12 was not found for this tutor")).mockResolvedValueOnce(detail);
    const user = userEvent.setup();
    render(<ClassDetail classId={12} loadClass={loadClass} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("not found for this tutor");
    await user.click(screen.getByRole("button", { name: "Retry loading class" }));
    expect(await screen.findByText("Bella Tan")).toBeVisible();
  });

  it("does not request invalid class references", () => {
    const loadClass = vi.fn();
    render(<ClassDetail classId={0} loadClass={loadClass} />);
    expect(screen.getByRole("alert")).toHaveTextContent("reference is invalid");
    expect(loadClass).not.toHaveBeenCalled();
  });
});
