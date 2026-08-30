import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ classId: "12", studentId: "31" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => key === "classId" ? navigation.classId : key === "studentId" ? navigation.studentId : null,
  }),
}));

vi.mock("@/components/worksheets/WorksheetBuilder", () => ({
  WorksheetBuilder: ({ classId, initialStudentId }: { classId: number; initialStudentId?: number }) => <output data-testid="worksheet-target-context">{classId}:{initialStudentId ?? "none"}</output>,
}));

import GenerateWorksheetPage from "./page";

describe("GenerateWorksheetPage", () => {
  beforeEach(() => {
    navigation.classId = "12";
    navigation.studentId = "31";
  });

  it("passes valid class and future student context into the in-generator selector", () => {
    render(<GenerateWorksheetPage />);
    expect(screen.getByTestId("worksheet-target-context")).toHaveTextContent("12:31");
  });

  it("does not pass malformed query values as trusted targets", () => {
    navigation.classId = "not-a-number";
    navigation.studentId = "0";
    render(<GenerateWorksheetPage />);
    expect(screen.getByTestId("worksheet-target-context")).toHaveTextContent("0:none");
  });
});
