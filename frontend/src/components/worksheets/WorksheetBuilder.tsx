"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import SyllabusPicker from "@/components/syllabus/SyllabusPicker";
import type { SyllabusTree } from "@/services/syllabus";
import { approveWorksheet, generateWorksheet, type TutorWorksheet } from "@/services/worksheets";

export function WorksheetBuilder({
  classId,
  generate = generateWorksheet,
  approve = approveWorksheet,
  loadSyllabus,
}: {
  classId: number;
  generate?: typeof generateWorksheet;
  approve?: typeof approveWorksheet;
  loadSyllabus?: () => Promise<SyllabusTree>;
}) {
  const [topicIds, setTopicIds] = React.useState<number[]>([]);
  const [pendingTopicId, setPendingTopicId] = React.useState<number | null>(null);
  const [count, setCount] = React.useState("15");
  const [title, setTitle] = React.useState("");
  const [draft, setDraft] = React.useState<TutorWorksheet | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const addTopic = () => {
    if (!pendingTopicId) return;
    setTopicIds((current) => current.includes(pendingTopicId) ? current : [...current, pendingTopicId]);
    setPendingTopicId(null);
  };
  const submit = async () => {
    const questionCount = Number(count);
    if (!Number.isSafeInteger(classId) || classId < 1) { setError("Open the builder from a class before generating a worksheet."); return; }
    if (!topicIds.length || !Number.isSafeInteger(questionCount) || questionCount < 1 || questionCount > 100) {
      setError("Choose at least one syllabus topic and between 1 and 100 questions."); return;
    }
    setBusy(true); setError(null);
    try {
      const response = await generate(classId, { targetMode: "CLASS", topicIds, questionCount, title: title || undefined }, crypto.randomUUID());
      if (!response.worksheet) throw new Error(response.message || "Worksheet generation did not produce a draft.");
      setDraft(response.worksheet);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Worksheet generation could not be started."); }
    finally { setBusy(false); }
  };
  const approveDraft = async () => {
    if (!draft) return;
    setBusy(true); setError(null);
    try { setDraft(await approve(draft.id)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Worksheet could not be approved."); }
    finally { setBusy(false); }
  };
  return <Box sx={{ maxWidth: 1100, mx: "auto", py: 3 }}><Typography component="h1" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: { xs: 30, sm: 38 }, mb: 2 }}>Build worksheet</Typography>
    {!draft ? <Card variant="outlined" sx={{ p: 3, borderRadius: "14px", bgcolor: "#FFFDFA", borderColor: "#EBE4D9" }}><Typography component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, mb: 2 }}>Configure a Tutor-reviewed draft</Typography><TextField label="Worksheet title" value={title} onChange={(event) => setTitle(event.target.value)} fullWidth sx={{ mb: 2 }} />
      <SyllabusPicker value={pendingTopicId} onChange={setPendingTopicId} label="Covered syllabus topic" helperText="Add one or more topics that this class has covered." loadSyllabus={loadSyllabus} />
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mt: 1 }}><Button type="button" disabled={!pendingTopicId || topicIds.includes(pendingTopicId)} onClick={addTopic} sx={{ minHeight: 36, border: "1px solid #E4DCD0", borderRadius: "9px", color: "#2A2622", textTransform: "none", fontWeight: 500 }}>Add selected topic</Button>{topicIds.map((id) => <Chip key={id} label={`Topic #${id}`} onDelete={() => setTopicIds((current) => current.filter((item) => item !== id))} sx={{ bgcolor: "#F4E4DE", color: "#9E3A24", fontSize: 12 }} />)}</Box>
      <TextField label="Question count" type="number" value={count} onChange={(event) => setCount(event.target.value)} slotProps={{ htmlInput: { min: 1, max: 100 } }} sx={{ mt: 2, mb: 2 }} />
      {error && <Typography role="alert" sx={{ color: "#B4573F", mb: 2 }}>{error}</Typography>}<Button onClick={() => void submit()} disabled={busy} sx={{ bgcolor: "#E08A72", color: "#1B1917", textTransform: "none", minHeight: 42, fontWeight: 600 }}>{busy ? "Creating draft…" : "Generate worksheet draft"}</Button>
    </Card> : <Card variant="outlined" sx={{ p: 3, borderRadius: "14px", bgcolor: "#FFFDFA", borderColor: "#EBE4D9" }}><Typography component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24 }}>{draft.title}</Typography><Typography sx={{ color: "#6F675E", mb: 2 }}>Draft — Tutor review required before assignment.</Typography>{draft.questions.length === 0 ? <Typography>No questions were selected.</Typography> : <Box component="ol">{draft.questions.map((question) => <li key={question.id}><Typography sx={{ py: 1 }}>{question.prompt} · {question.totalMarks.toFixed(1)} marks</Typography></li>)}</Box>}{error && <Typography role="alert" sx={{ color: "#B4573F", mb: 1 }}>{error}</Typography>}<Button onClick={() => void approveDraft()} disabled={busy || draft.questions.length === 0 || draft.status !== "DRAFT"} sx={{ bgcolor: "#9E3A24", color: "#FFFDFA", textTransform: "none", minHeight: 42 }}>Approve & assign worksheet</Button></Card>}
  </Box>;
}
