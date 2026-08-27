"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  createManualResult,
  type ManualResultRequest,
  type MarkingReview,
} from "@/services/submissions";
import type { TutorWorksheet } from "@/services/worksheets";

export type ManualResultStudent = { id: number; fullName: string };

type Props = {
  worksheet: TutorWorksheet;
  students: ManualResultStudent[];
  submit?: (input: ManualResultRequest) => Promise<MarkingReview>;
  onCreated?: (review: MarkingReview) => void;
};

/** Accessible fallback for a Tutor who must enter a score without an upload. */
export default function ManualResultForm({
  worksheet,
  students,
  submit = createManualResult,
  onCreated,
}: Props) {
  const [studentId, setStudentId] = React.useState("");
  const [questionBankId, setQuestionBankId] = React.useState("");
  const [answer, setAnswer] = React.useState("");
  const [marks, setMarks] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const selectedQuestion = worksheet.questions.find((question) => question.id === Number(questionBankId));

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedStudentId = Number(studentId);
    const parsedQuestionId = Number(questionBankId);
    const parsedMarks = Number(marks);
    if (!Number.isSafeInteger(parsedStudentId) || !Number.isSafeInteger(parsedQuestionId)
      || !Number.isFinite(parsedMarks) || !answer.trim() || !feedback.trim()) {
      setError("Choose a student and question, then provide the answer, marks and feedback.");
      return;
    }
    if (!selectedQuestion || parsedMarks < 0 || parsedMarks > selectedQuestion.totalMarks) {
      setError(`Marks must be between 0 and ${selectedQuestion?.totalMarks ?? 0}.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const review = await submit({
        worksheetId: worksheet.id,
        studentId: parsedStudentId,
        questionBankId: parsedQuestionId,
        answer: answer.trim(),
        marks: parsedMarks,
        feedback: feedback.trim(),
      });
      onCreated?.(review);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The manual result could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const unavailable = worksheet.status !== "APPROVED" || students.length === 0 || worksheet.questions.length === 0;
  return (
    <Card component="section" variant="outlined" sx={{ maxWidth: 760, mx: "auto", p: { xs: 2, sm: 3 }, borderRadius: "14px", borderColor: "#EBE4D9", bgcolor: "#FFFDFA" }}>
      <Typography component="h1" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: { xs: 28, sm: 36 }, mb: 0.5 }}>
        Enter a result manually
      </Typography>
      <Typography sx={{ color: "#6F675E", mb: 2 }}>{worksheet.title}</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        This records a Tutor-approved result and its audit history. It does not create or alter OCR source pages.
      </Alert>
      {unavailable ? (
        <Alert severity="warning" role="alert">
          {worksheet.status !== "APPROVED" ? "Approve and assign this worksheet before entering results." : "This worksheet needs at least one assigned student and question."}
        </Alert>
      ) : (
        <Box component="form" noValidate onSubmit={(event) => void submitForm(event)}>
          <Stack spacing={2}>
            {error && <Alert severity="error" role="alert">{error}</Alert>}
            <FormControl fullWidth required>
              <InputLabel id="manual-result-student-label">Student</InputLabel>
              <Select aria-label="Student" labelId="manual-result-student-label" id="manual-result-student" value={studentId} label="Student" onChange={(event) => setStudentId(event.target.value)} disabled={busy}>
                {students.map((student) => <MenuItem key={student.id} value={String(student.id)}>{student.fullName}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel id="manual-result-question-label">Worksheet question</InputLabel>
              <Select aria-label="Worksheet question" labelId="manual-result-question-label" id="manual-result-question" value={questionBankId} label="Worksheet question" onChange={(event) => { setQuestionBankId(event.target.value); setMarks(""); }} disabled={busy}>
                {worksheet.questions.map((question) => <MenuItem key={question.id} value={String(question.id)}>{question.code} · {question.totalMarks} marks</MenuItem>)}
              </Select>
            </FormControl>
            <TextField id="manual-result-answer" label="Student answer or observation" value={answer} onChange={(event) => setAnswer(event.target.value)} multiline minRows={4} required disabled={busy} slotProps={{ htmlInput: { "aria-label": "Student answer or observation" } }} />
            <TextField id="manual-result-marks" label={`Marks${selectedQuestion ? ` (out of ${selectedQuestion.totalMarks})` : ""}`} value={marks} onChange={(event) => setMarks(event.target.value)} type="number" required disabled={busy} slotProps={{ htmlInput: { "aria-label": "Marks", min: 0, max: selectedQuestion?.totalMarks, step: 0.01 } }} />
            <TextField id="manual-result-feedback" label="Tutor feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} multiline minRows={3} required disabled={busy} helperText="This feedback is stored with the approved result." slotProps={{ htmlInput: { "aria-label": "Tutor feedback" } }} />
            <Button type="submit" disabled={busy} sx={{ alignSelf: "start", bgcolor: "#9E3A24", color: "#FFFDFA", textTransform: "none", "&:hover": { bgcolor: "#7E2E1D" } }}>
              {busy ? "Saving result…" : "Save approved result"}
            </Button>
          </Stack>
        </Box>
      )}
    </Card>
  );
}
