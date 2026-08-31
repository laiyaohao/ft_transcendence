"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { OcrAnswerMapping, OcrPage } from "@/services/submissions";

export type OcrQuestionOption = { id: number; prompt: string };
const EMPTY_QUESTIONS: OcrQuestionOption[] = [];

type Props = {
  pages: OcrPage[];
  questions?: OcrQuestionOption[];
  onCorrect: (id: number, text: string) => Promise<void>;
  onSubmitForReview?: (answers: OcrAnswerMapping[]) => Promise<void>;
};

export default function OcrReview({ pages, questions = EMPTY_QUESTIONS, onCorrect, onSubmitForReview }: Props) {
  const [values, setValues] = React.useState<Record<number, string>>(() => Object.fromEntries(
    pages.map((page) => [page.extractionId, page.text]),
  ));
  const [questionIds, setQuestionIds] = React.useState<Record<number, number | "">>(() => Object.fromEntries(
    pages.map((page) => [page.extractionId, questions.length === 1 ? questions[0]!.id : ""]),
  ));
  const [saving, setSaving] = React.useState<number | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const canSubmit = Boolean(onSubmitForReview)
    && pages.length > 0
    && pages.every((page) => page.status === "READY" && questionIds[page.extractionId]);

  async function submit() {
    if (!onSubmitForReview || !canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmitForReview(pages.map((page) => ({
        extractionId: page.extractionId,
        questionBankId: Number(questionIds[page.extractionId]),
      })));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "The OCR submission could not be sent for Tutor review.");
    } finally {
      setSubmitting(false);
    }
  }

  return <Box>
    <Typography component="h2">Review extracted text</Typography>
    {pages.map((page, index) => <Card key={page.extractionId} variant="outlined" sx={{ p: 2, my: 1.5, borderColor: page.status === "READY" ? "#EBE4D9" : "#D79B63" }}>
      <Typography sx={{ fontWeight: 700 }}>Page {index + 1} · {Math.round(page.confidence * 100)}% confidence</Typography>
      <TextField label={`Page ${index + 1} text`} multiline minRows={3} fullWidth value={values[page.extractionId] || ""}
        onChange={(event) => setValues((current) => ({ ...current, [page.extractionId]: event.target.value }))} sx={{ my: 1 }} />
      {page.status !== "READY" ? <Typography role="status" sx={{ color: "#7A6238", mb: 1 }}>Please check and save this low-confidence extraction.</Typography> : null}
      <Button disabled={saving === page.extractionId} onClick={async () => {
        setSaving(page.extractionId);
        try { await onCorrect(page.extractionId, values[page.extractionId] || ""); }
        finally { setSaving(null); }
      }}>Save correction</Button>
      {onSubmitForReview ? <TextField select fullWidth label={`Page ${index + 1} answer belongs to`} value={questionIds[page.extractionId] ?? ""}
        onChange={(event) => setQuestionIds((current) => ({ ...current, [page.extractionId]: Number(event.target.value) || "" }))} sx={{ mt: 2 }}>
        <MenuItem value="">Choose worksheet question</MenuItem>
        {questions.map((question, questionIndex) => <MenuItem key={question.id} value={question.id}>Question {questionIndex + 1}: {question.prompt}</MenuItem>)}
      </TextField> : null}
    </Card>)}
    {onSubmitForReview ? <Box sx={{ mt: 3 }}>
      <Typography sx={{ color: "#6F675E", mb: 1 }}>Confirming creates the worksheet answer records and sends them to your Tutor for review. AI suggestions remain private until Tutor approval.</Typography>
      {submitError ? <Typography role="alert" sx={{ color: "#9E3A24", mb: 1 }}>{submitError}</Typography> : null}
      <Button disabled={!canSubmit || submitting} onClick={() => void submit()} sx={{ bgcolor: "#9E3A24", color: "#FFFDFA", "&:hover": { bgcolor: "#8A3120" } }}>
        {submitting ? "Submitting…" : "Submit for Tutor Review"}
      </Button>
      {!canSubmit ? <Typography sx={{ color: "#7A6238", fontSize: 13, mt: 1 }}>Correct every flagged page and choose its worksheet question before submitting.</Typography> : null}
    </Box> : null}
  </Box>;
}
