"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import SyllabusPicker from "@/components/syllabus/SyllabusPicker";
import {
  fetchQuestionImportSourcePageUrl,
  importQuestionImportCandidates,
  updateQuestionImportCandidate,
  uploadQuestionImport,
  type QuestionDifficulty,
  type QuestionImportBatch,
  type QuestionImportCandidate,
  type QuestionType,
} from "@/services/questions";

const questionTypes: QuestionType[] = ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_THE_BLANK", "SHORT_ANSWER", "OPEN_ENDED", "CALCULATION", "DIAGRAM"];
const difficulties: QuestionDifficulty[] = ["FOUNDATION", "APPLICATION", "CHALLENGE"];

function SourcePreview({ batchId, candidate }: { batchId: number; candidate: QuestionImportCandidate }) {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    void fetchQuestionImportSourcePageUrl(batchId, candidate.source.pageId).then((nextUrl) => {
      objectUrl = nextUrl;
      if (active) setUrl(nextUrl); else URL.revokeObjectURL(nextUrl);
    }).catch(() => { if (active) setUrl(null); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [batchId, candidate.source.pageId]);
  return <Box><Typography sx={{ color: "#8B837A", fontSize: 11.5, mb: .5 }}>Source: {candidate.source.filename}, page {candidate.source.pageNumber}</Typography>{url ? <Box component="img" src={url} alt={`Original page for import draft ${candidate.number}`} sx={{ display: "block", maxWidth: "100%", maxHeight: 260, border: "1px solid #E4DCD0", borderRadius: "8px" }} /> : <Typography sx={{ color: "#8B837A", fontSize: 12 }}>Source preview unavailable.</Typography>}</Box>;
}

function statusColor(status: QuestionImportCandidate["status"]) {
  if (status === "READY_FOR_REVIEW") return { bgcolor: "#E9EEE8", color: "#4A6B50" };
  if (status === "IMPORTED") return { bgcolor: "#E9EEE8", color: "#4A6B50" };
  return { bgcolor: "#FDF1DF", color: "#8C5A14" };
}

interface CandidateCardProps {
  batchId: number;
  candidate: QuestionImportCandidate;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onChange: (candidate: QuestionImportCandidate) => void;
}

function CandidateCard({ batchId, candidate, selected, onSelect, onChange }: CandidateCardProps) {
  const change = <Key extends keyof QuestionImportCandidate>(key: Key, value: QuestionImportCandidate[Key]) => onChange({ ...candidate, [key]: value });
  const isImported = candidate.status === "IMPORTED";
  return <Card component="article" variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: "14px", bgcolor: "#FFFDFA", borderColor: "#EBE4D9", boxShadow: "none" }}>
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: .75, mb: 1.25 }}><Checkbox checked={selected} disabled={isImported || candidate.status === "FAILED"} onChange={(event) => onSelect(event.target.checked)} slotProps={{ input: { "aria-label": `Select import draft ` } }} sx={{ mt: -.9, ml: -.8, color: "#A09488", "&.Mui-checked": { color: "#9E3A24" } }} /><Box sx={{ flex: 1 }}><Box sx={{ display: "flex", flexWrap: "wrap", gap: .75, alignItems: "center" }}><Typography component="h2" sx={{ fontSize: 16, fontWeight: 600 }}>Draft {candidate.number}</Typography><Chip label={candidate.status.replaceAll("_", " ")} size="small" sx={{ height: 23, fontSize: 10, fontWeight: 700, ...statusColor(candidate.status) }} /><Chip label={`${candidate.confidence}% confidence`} size="small" sx={{ height: 23, bgcolor: "#F0EAE0", color: "#6F675E", fontSize: 10 }} /></Box>{candidate.warningMessage ? <Alert severity="warning" sx={{ mt: .85, py: 0, "& .MuiAlert-message": { py: .35, fontSize: 12.5 } }}>{candidate.warningMessage}</Alert> : null}</Box></Box>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.4fr) minmax(240px, .8fr)" }, gap: 2 }}><Box sx={{ display: "grid", gap: 1.25 }}><TextField label="Question code (optional)" value={candidate.code ?? ""} onChange={(event) => change("code", event.target.value)} disabled={isImported} slotProps={{ htmlInput: { maxLength: 120 } }} /><Box sx={{ pointerEvents: isImported ? "none" : "auto", opacity: isImported ? .65 : 1 }}><SyllabusPicker value={candidate.syllabusTopicId} onChange={(topicId) => change("syllabusTopicId", topicId)} label="Syllabus topic" helperText="Required before import." /></Box><TextField label="Question text" value={candidate.prompt} onChange={(event) => change("prompt", event.target.value)} disabled={isImported} multiline minRows={4} slotProps={{ htmlInput: { maxLength: 4000 } }} /><TextField label="Model answer / solution" value={candidate.modelAnswer} onChange={(event) => change("modelAnswer", event.target.value)} disabled={isImported} multiline minRows={3} slotProps={{ htmlInput: { maxLength: 4000 } }} /><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 120px" }, gap: 1 }}><TextField select label="Question type" value={candidate.questionType} onChange={(event) => change("questionType", event.target.value as QuestionType)} disabled={isImported}>{questionTypes.map((type) => <MenuItem key={type} value={type}>{type.replaceAll("_", " ")}</MenuItem>)}</TextField><TextField select label="Difficulty" value={candidate.difficulty} onChange={(event) => change("difficulty", event.target.value as QuestionDifficulty)} disabled={isImported}>{difficulties.map((difficulty) => <MenuItem key={difficulty} value={difficulty}>{difficulty}</MenuItem>)}</TextField><TextField label="Marks" type="number" value={candidate.totalMarks} onChange={(event) => change("totalMarks", Number(event.target.value))} disabled={isImported} slotProps={{ htmlInput: { min: .01, step: .5 } }} /></Box><FormControlLabel control={<Checkbox checked={candidate.includeSourceImage} onChange={(event) => change("includeSourceImage", event.target.checked)} disabled={isImported} />} label="Attach the original page image as question evidence" /><Typography sx={{ color: "#8B837A", fontSize: 11.5 }}>Suggested tags: {candidate.suggestedTags || "none"}</Typography></Box><SourcePreview batchId={batchId} candidate={candidate} /></Box>
  </Card>;
}

export default function QuestionImportReview() {
  const [batch, setBatch] = React.useState<QuestionImportBatch | null>(null);
  const [files, setFiles] = React.useState<File[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [isWorking, setIsWorking] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const updateCandidate = (candidate: QuestionImportCandidate) => setBatch((current) => current ? { ...current, candidates: current.candidates.map((item) => item.id === candidate.id ? candidate : item) } : current);
  const upload = async () => {
    setError(null); setMessage(null); setIsWorking(true);
    try { const next = await uploadQuestionImport(files); setBatch(next); setSelectedIds(new Set(next.candidates.filter((candidate) => candidate.status !== "FAILED" && candidate.status !== "IMPORTED").map((candidate) => candidate.id))); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The files could not be processed."); }
    finally { setIsWorking(false); }
  };
  const importSelected = async () => {
    if (!batch) return;
    const selected = batch.candidates.filter((candidate) => selectedIds.has(candidate.id));
    setError(null); setMessage(null); setIsWorking(true);
    try {
      const saved = await Promise.all(selected.map((candidate) => updateQuestionImportCandidate(batch.id, candidate.id, {
        code: candidate.code, syllabusTopicId: candidate.syllabusTopicId, prompt: candidate.prompt, modelAnswer: candidate.modelAnswer,
        totalMarks: candidate.totalMarks, questionType: candidate.questionType, difficulty: candidate.difficulty, includeSourceImage: candidate.includeSourceImage,
      })));
      const revised = { ...batch, candidates: batch.candidates.map((candidate) => saved.find((item) => item.id === candidate.id) ?? candidate) };
      setBatch(revised);
      const result = await importQuestionImportCandidates(batch.id, selected.map((candidate) => candidate.id));
      setBatch({ ...revised, candidates: revised.candidates.map((candidate) => selectedIds.has(candidate.id) ? { ...candidate, status: "IMPORTED" } : candidate) });
      setSelectedIds(new Set()); setMessage(`${result.questionIds.length} question${result.questionIds.length === 1 ? "" : "s"} imported. ${result.message}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The reviewed drafts could not be imported."); }
    finally { setIsWorking(false); }
  };
  return <Box component="section" aria-labelledby="question-import-title"><Typography id="question-import-title" component="h1" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: { xs: 30, sm: 38 }, fontWeight: 500, mb: 1 }}>Import questions</Typography><Typography sx={{ color: "#6F675E", fontSize: 14, lineHeight: 1.6, mb: 2.5 }}>Upload PDFs or page images. The system creates review drafts only; no Question Bank entry is created until you confirm the edited drafts.</Typography>{error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}{message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}{!batch ? <Card variant="outlined" sx={{ maxWidth: 720, p: { xs: 2, sm: 3 }, borderRadius: "14px", bgcolor: "#FFFDFA", borderColor: "#EBE4D9", boxShadow: "none" }}><Button component="label" variant="outlined" disabled={isWorking} sx={{ textTransform: "none", borderColor: "#DCCFBE", color: "#2A2622" }}>Choose PDF or page images<input hidden type="file" accept="application/pdf,image/png,image/jpeg" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /></Button>{files.length ? <Typography sx={{ color: "#5A544C", fontSize: 13, mt: 1.25 }}>{files.length} file{files.length === 1 ? "" : "s"}: {files.map((file) => file.name).join(", ")}</Typography> : <Typography sx={{ color: "#8B837A", fontSize: 13, mt: 1.25 }}>Up to 20 PDF, PNG, or JPEG files; 25 MB each.</Typography>}<Box sx={{ mt: 2 }}><Button onClick={() => void upload()} disabled={!files.length || isWorking} sx={{ minHeight: 40, bgcolor: "#9E3A24", color: "white", textTransform: "none", "&:hover": { bgcolor: "#7F2E1E" }, "&.Mui-disabled": { bgcolor: "#E4DCD0" } }}>{isWorking ? "Processing pages…" : "Create review drafts"}</Button></Box></Card> : <><Typography aria-live="polite" sx={{ color: "#6F675E", fontSize: 13, mb: 1.5 }}>{batch.candidates.length} detected draft{batch.candidates.length === 1 ? "" : "s"}; {selectedIds.size} selected for import.</Typography><Box sx={{ display: "grid", gap: 1.5 }}>{batch.candidates.map((candidate) => <CandidateCard key={candidate.id} batchId={batch.id} candidate={candidate} selected={selectedIds.has(candidate.id)} onSelect={(checked) => setSelectedIds((current) => { const next = new Set(current); if (checked) next.add(candidate.id); else next.delete(candidate.id); return next; })} onChange={updateCandidate} />)}</Box><Box sx={{ position: "sticky", bottom: 12, display: "flex", justifyContent: "flex-end", mt: 2 }}><Button onClick={() => void importSelected()} disabled={!selectedIds.size || isWorking} sx={{ minHeight: 44, px: 2, bgcolor: "#9E3A24", color: "white", textTransform: "none", boxShadow: "0 3px 12px rgba(80, 40, 20, .2)", "&:hover": { bgcolor: "#7F2E1E" }, "&.Mui-disabled": { bgcolor: "#E4DCD0" } }}>{isWorking ? "Saving review…" : `Import ${selectedIds.size} reviewed draft${selectedIds.size === 1 ? "" : "s"}`}</Button></Box></>}</Box>;
}
