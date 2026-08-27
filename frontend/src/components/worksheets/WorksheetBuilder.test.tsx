import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { SyllabusTree } from "@/services/syllabus";
import { WorksheetBuilder } from "./WorksheetBuilder";

const syllabus: SyllabusTree = { items: [{ id: 1, code: "SCI", name: "Science", nodeType: "SUBJECT", parentId: null, children: [{ id: 2, code: "SCI_P5", name: "Primary 5", nodeType: "LEVEL", parentId: 1, children: [{ id: 3, code: "SCI_P5_CYCLES", name: "Cycles", nodeType: "THEME", parentId: 2, children: [{ id: 4, code: "SCI_WATER", name: "Water", nodeType: "TOPIC", parentId: 3, children: [] }] }] }] }] };

async function choose(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  await user.click(await screen.findByLabelText(label));
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("WorksheetBuilder", () => {
  it("validates selected taxonomy topics, previews, then approves a draft", async () => {
    const user = userEvent.setup();
    const generate = vi.fn().mockResolvedValue({ id: 1, status: "SUCCEEDED", message: "Ready", worksheet: { id: 9, code: "GEN-9", title: "Water drill", instructions: null, targetMode: "CLASS", status: "DRAFT", dueAt: null, questions: [{ id: 2, code: "Q", prompt: "Explain evaporation.", totalMarks: 2, questionType: "OPEN_ENDED", topicName: "Water" }], assignments: [] } });
    const approve = vi.fn().mockResolvedValue({ id: 9, code: "GEN-9", title: "Water drill", instructions: null, targetMode: "CLASS", status: "APPROVED", dueAt: null, questions: [], assignments: [] });
    render(<WorksheetBuilder classId={1} generate={generate} approve={approve} loadSyllabus={async () => syllabus} />);
    await user.click(screen.getByRole("button", { name: "Generate worksheet draft" }));
    expect(screen.getByRole("alert")).toBeVisible();
    await choose(user, "Subject", "Science"); await choose(user, "Level", "Primary 5"); await choose(user, "Theme", "Cycles"); await choose(user, "Topic", "Water");
    await user.click(screen.getByRole("button", { name: "Add selected topic" }));
    await user.click(screen.getByRole("button", { name: "Generate worksheet draft" }));
    expect(await screen.findByText("Explain evaporation.", { exact: false })).toBeVisible();
    expect(generate).toHaveBeenCalledWith(1, expect.objectContaining({ topicIds: [4] }), expect.any(String));
    await user.click(screen.getByRole("button", { name: "Approve & assign worksheet" }));
    expect(approve).toHaveBeenCalledWith(9);
  });
});
