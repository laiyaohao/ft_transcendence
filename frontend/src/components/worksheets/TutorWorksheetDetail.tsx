"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import {
  approveWorksheet,
  downloadWorksheetPdf,
  updateWorksheet,
  type TutorWorksheet,
  type UpdateWorksheetRequest,
} from "@/services/worksheets";

type Props = {
  worksheet: TutorWorksheet;
  approve?: typeof approveWorksheet;
  update?: typeof updateWorksheet;
  downloadPdf?: typeof downloadWorksheetPdf;
};

function assignmentLabel(worksheet: TutorWorksheet): string {
  if (worksheet.assignments.length === 0) return "Not assigned yet";
  if (worksheet.targetMode === "CLASS") return `Class #${worksheet.assignments[0].classId}`;
  return `${worksheet.assignments.length} selected student${worksheet.assignments.length === 1 ? "" : "s"}`;
}

function datetimeLocal(value: string | null): string {
  return value ? value.slice(0, 16) : "";
}

/** Owner-only worksheet management, deliberately separate from Student results. */
export default function TutorWorksheetDetail({
  worksheet,
  approve = approveWorksheet,
  update = updateWorksheet,
  downloadPdf = downloadWorksheetPdf,
}: Props) {
  const [current, setCurrent] = React.useState(worksheet);
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(worksheet.title);
  const [instructions, setInstructions] = React.useState(worksheet.instructions ?? "");
  const [questionIds, setQuestionIds] = React.useState(worksheet.questions.map((question) => question.id));
  const [dueAt, setDueAt] = React.useState(datetimeLocal(worksheet.dueAt));
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const run = async (operation: () => Promise<TutorWorksheet>) => {
    setBusy(true);
    setError(null);
    try {
      setCurrent(await operation());
      setEditing(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Worksheet could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  const approveDraft = () => run(() => approve(current.id, dueAt || undefined));
  const saveDraft = () => {
    const request: UpdateWorksheetRequest = { title, instructions: instructions || null, questionIds };
    return run(() => update(current.id, request));
  };
  const moveQuestion = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= questionIds.length) return;
    setQuestionIds((ids) => {
      const reordered = [...ids];
      [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
      return reordered;
    });
  };
  const orderedQuestions = questionIds.map((id) => current.questions.find((question) => question.id === id)).filter(Boolean);

  const exportPdf = async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await downloadPdf(current.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${current.code || current.title}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Worksheet PDF could not be created.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 0 } }}>
      <Button component={Link} href="/tutor/worksheets/new" sx={{ textTransform: "none", color: "#6F675E" }}>
        Build another worksheet
      </Button>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 2, my: 2 }}>
        <Box>
          <Typography component="h1" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: { xs: 30, sm: 38 } }}>
            {current.title}
          </Typography>
          <Typography sx={{ color: "#6F675E" }}>
            {current.status} · {current.questions.length} question{current.questions.length === 1 ? "" : "s"} · {assignmentLabel(current)}
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          {current.status === "DRAFT" && (
            <Button onClick={() => setEditing((value) => !value)} disabled={busy} sx={{ border: "1px solid #E4DCD0", color: "#2A2622", textTransform: "none" }}>
              {editing ? "Cancel edit" : "Edit worksheet"}
            </Button>
          )}
          {current.status === "DRAFT" ? (
            <Button onClick={() => void approveDraft()} disabled={busy || !current.questions.length} sx={{ bgcolor: "#9E3A24", color: "#FFFDFA", textTransform: "none" }}>
              Approve & assign worksheet
            </Button>
          ) : (
            <>
              <Button component={Link} href={`/upload?worksheetId=${current.id}`} sx={{ border: "1px solid #E4DCD0", color: "#2A2622", textTransform: "none" }}>
                Upload marked work
              </Button>
              <Button onClick={() => void exportPdf()} disabled={busy} sx={{ bgcolor: "#9E3A24", color: "#FFFDFA", textTransform: "none" }}>
                Download PDF
              </Button>
            </>
          )}
        </Stack>
      </Box>

      {error && <Typography role="alert" sx={{ color: "#B4573F", mb: 2 }}>{error}</Typography>}

      {editing && current.status === "DRAFT" && (
        <Card component="section" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 2, borderRadius: "14px", borderColor: "#EBE4D9", bgcolor: "#FFFDFA" }}>
          <Typography component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, mb: 2 }}>Edit draft</Typography>
          <Stack spacing={2}>
            <TextField label="Title" value={title} required onChange={(event) => setTitle(event.target.value)} />
            <TextField label="Instructions" value={instructions} multiline minRows={3} onChange={(event) => setInstructions(event.target.value)} />
            <TextField label="Assignment due date" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} helperText="One deadline applies to every assigned student." />
            <Button onClick={() => void saveDraft()} disabled={busy || !title.trim() || questionIds.length === 0} sx={{ alignSelf: "start", bgcolor: "#E08A72", color: "#1B1917", textTransform: "none" }}>
              Save draft
            </Button>
          </Stack>
        </Card>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 2fr) minmax(240px, 1fr)" }, gap: 2 }}>
        <Card component="section" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: "14px", borderColor: "#EBE4D9", bgcolor: "#FFFDFA" }}>
          <Typography component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22 }}>Questions</Typography>
          <Box component="ol" sx={{ pl: 3 }}>
            {orderedQuestions.map((question, index) => question && (
              <li key={question.id}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, py: 1 }}>
                  <Typography>{question.prompt} · {question.totalMarks.toFixed(1)} marks</Typography>
                  {editing && <Stack direction="row" spacing={0.5}><Button size="small" onClick={() => moveQuestion(index, -1)} disabled={index === 0 || busy}>Up</Button><Button size="small" onClick={() => moveQuestion(index, 1)} disabled={index === orderedQuestions.length - 1 || busy}>Down</Button></Stack>}
                </Box>
              </li>
            ))}
          </Box>
        </Card>
        <Card component="aside" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: "14px", borderColor: "#EBE4D9", bgcolor: "#FFFDFA" }}>
          <Typography component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, mb: 1 }}>Assignment</Typography>
          <Typography>{assignmentLabel(current)}</Typography>
          <Typography sx={{ color: "#6F675E", mt: 1 }}>{current.dueAt ? `Due ${new Date(current.dueAt).toLocaleString()}` : "No due date"}</Typography>
          {current.instructions && <><Typography component="h3" sx={{ fontWeight: 700, mt: 3 }}>Instructions</Typography><Typography>{current.instructions}</Typography></>}
        </Card>
      </Box>
    </Box>
  );
}
