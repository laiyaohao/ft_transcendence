import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ classId: null as string | null }));
const worksheets = vi.hoisted(() => ({ fetchTutorWorksheets: vi.fn() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: (key: string) => key === "classId" ? navigation.classId : null }),
}));
vi.mock("@/services/worksheets", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/worksheets")>();
  return { ...actual, fetchTutorWorksheets: worksheets.fetchTutorWorksheets };
});

import TutorWorksheetsPage from "./page";

describe("TutorWorksheetsPage", () => {
  beforeEach(() => {
    navigation.classId = null;
    worksheets.fetchTutorWorksheets.mockResolvedValue([]);
  });

  it("opens the in-generator target selector instead of redirecting to My Classes", async () => {
    render(<TutorWorksheetsPage />);
    expect(screen.getByRole("link", { name: "Generate Worksheet" })).toHaveAttribute("href", "/tutor/worksheets/new");
  });
});
