"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useRouter, useSearchParams } from "next/navigation";

import Stack from "@/components/lumina-stack";
import OcrReview from "@/components/submissions/OcrReview";
import PageReview from "@/components/submissions/PageReview";
import {
  correctOcrExtraction,
  createOcrDocument,
  releasePagePreview,
  validateUploadFiles,
  type OcrPage,
  type UploadPage,
} from "@/services/submissions";
import { fetchStudentWorksheets, type StudentWorksheet } from "@/services/worksheets";

const button = { minHeight: 42, textTransform: "none", borderRadius: "10px" };
const primary = { ...button, bgcolor: "#9E3A24", color: "#FFFDFA", "&:hover": { bgcolor: "#8A3120" } };
const secondary = { ...button, borderColor: "#E4DCD0", color: "#2A2622", bgcolor: "#FFFDFA" };

function positiveId(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function UploadWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const requestedWorksheetId = positiveId(params.get("ws"));
  const requestedStudentId = positiveId(params.get("studentId"));
  const [step, setStep] = React.useState(1);
  const [worksheets, setWorksheets] = React.useState<StudentWorksheet[]>([]);
  const [loadingWorksheets, setLoadingWorksheets] = React.useState(true);
  const [worksheetError, setWorksheetError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [pages, setPages] = React.useState<UploadPage[]>([]);
  const [ocrPages, setOcrPages] = React.useState<OcrPage[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    void fetchStudentWorksheets({ status: "ASSIGNED" })
      .then((assignments) => {
        if (!active) return;
        setWorksheets(assignments);
        if (requestedWorksheetId !== null && !assignments.some((worksheet) => worksheet.id === requestedWorksheetId)) {
          setSelectedId(null);
          setWorksheetError("That worksheet is not available for your account. Choose one of your assigned worksheets.");
          return;
        }
        setSelectedId(requestedWorksheetId ?? assignments[0]?.id ?? null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setWorksheets([]);
        setSelectedId(null);
        setWorksheetError(error instanceof Error ? error.message : "Your worksheets could not be loaded. Please try again.");
      })
      .finally(() => { if (active) setLoadingWorksheets(false); });
    return () => { active = false; };
  }, [requestedWorksheetId, retryCount]);

  const selected = worksheets.find((worksheet) => worksheet.id === selectedId);
  const hasValidSelection = selected !== undefined;
  const add = (files: File[]) => {
    const result = validateUploadFiles(files, pages);
    setPages((current) => [...current, ...result.pages]);
    setErrors(result.errors);
  };
  const move = (id: string, direction: -1 | 1) => setPages((current) => {
    const index = current.findIndex((page) => page.id === id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= current.length) return current;
    const copy = [...current]; [copy[index], copy[next]] = [copy[next], copy[index]];
    return copy;
  });
  const remove = (id: string) => setPages((current) => {
    const page = current.find((item) => item.id === id);
    if (page) releasePagePreview(page);
    return current.filter((item) => item.id !== id);
  });
  const replace = (id: string, file: File) => {
    const old = pages.find((page) => page.id === id);
    if (!old) return;
    const result = validateUploadFiles([file], pages.filter((page) => page.id !== id));
    if (result.errors.length) { setErrors(result.errors); return; }
    releasePagePreview(old);
    setPages((current) => current.map((page) => page.id === id ? result.pages[0] : page));
  };
  const submit = async () => {
    // The list is server-scoped to the signed-in Student. Recheck it immediately before
    // submitting so a stale or tampered URL cannot submit an unrelated worksheet.
    if (!selected || !requestedStudentId) {
      setErrors([!selected ? "Choose one of your assigned worksheets before submitting." : "Your student account could not be identified. Please sign in again."]);
      return;
    }
    setUploading(true); setErrors([]); setProgress(0);
    try {
      const result = await createOcrDocument({ studentId: requestedStudentId, worksheetId: selected.id, pages });
      setOcrPages(result.pages); setProgress(100); setStep(4);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Upload failed. Please try again."]);
    } finally { setUploading(false); }
  };

  return <Box sx={{ minHeight: "100vh", bgcolor: "#F7F4EF", px: { xs: 2, sm: 4 }, py: 4 }}><Box sx={{ maxWidth: 850, mx: "auto" }}>
    <Typography sx={{ fontSize: 12, letterSpacing: ".1em", color: "#6F675E", mb: 3 }}>STEP {step} OF 4</Typography>
    {step === 1 && <><Typography component="h1" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 31, mb: 2 }}>Which worksheet are you submitting?</Typography>
      {loadingWorksheets && <LinearProgress aria-label="Loading assigned worksheets" sx={{ mb: 2 }} />}
      {worksheetError && <Box role="alert" sx={{ color: "#B4573F", mb: 2 }}><Typography>{worksheetError}</Typography></Box>}
      {!loadingWorksheets && !worksheetError && worksheets.length === 0 && <Typography role="status" sx={{ color: "#4A443D", mb: 2 }}>You do not have any worksheets ready to submit.</Typography>}
      {!loadingWorksheets && worksheetError && <Button variant="outlined" sx={secondary} onClick={() => { setLoadingWorksheets(true); setWorksheetError(null); setRetryCount((count) => count + 1); }}>Try again</Button>}
      <Stack gap={1.25} sx={{ mt: worksheetError ? 2 : 0 }}>{worksheets.map((worksheet) => <Card component="button" key={worksheet.id} onClick={() => { setSelectedId(worksheet.id); setWorksheetError(null); }} aria-pressed={selectedId === worksheet.id} variant="outlined" sx={{ textAlign: "left", p: 2, borderColor: selectedId === worksheet.id ? "#9E3A24" : "#EBE4D9", bgcolor: "#FFFDFA" }}><Typography sx={{ fontWeight: 700 }}>{worksheet.title}</Typography><Typography sx={{ fontSize: 12, color: "#6F675E" }}>{worksheet.topics.map((topic) => topic.name).join(", ") || "No topic specified"}</Typography></Card>)}</Stack>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}><Button onClick={() => setStep(2)} disabled={!hasValidSelection || loadingWorksheets} endIcon={<ArrowForwardIcon />} sx={primary}>Continue</Button></Stack></>}
    {step === 2 && <><Typography component="h1" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 31 }}>Upload your pages</Typography><Typography sx={{ mb: 2, color: "#4A443D" }}>For {selected?.title}. Add JPG, PNG, or PDF files. You can add multiple photos.</Typography><Box onDragOver={(event) => { event.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(event) => { event.preventDefault(); setDragOver(false); add(Array.from(event.dataTransfer.files)); }} sx={{ border: "2px dashed", borderColor: dragOver ? "#9E3A24" : "#DCCFBE", borderRadius: 2, p: 4, textAlign: "center", bgcolor: "#FFFDFA" }}><UploadFileIcon /><Typography sx={{ fontWeight: 700 }}>Drag and drop files here</Typography><Stack direction="row" justifyContent="center" gap={1} sx={{ mt: 2 }}><Button component="label" variant="outlined" sx={secondary}>Choose files<input hidden type="file" multiple accept="image/jpeg,image/png,application/pdf" onChange={(event) => { add(Array.from(event.currentTarget.files || [])); event.currentTarget.value = ""; }} /></Button><Button component="label" variant="outlined" startIcon={<CameraAltOutlinedIcon />} sx={secondary}>Take photo<input hidden type="file" accept="image/*" capture="environment" onChange={(event) => { add(Array.from(event.currentTarget.files || [])); event.currentTarget.value = ""; }} /></Button></Stack><Typography sx={{ fontSize: 12, color: "#6F675E", mt: 2 }}>Up to 20 MB per file</Typography></Box>{errors.length > 0 && <Box role="alert" sx={{ color: "#B4573F", mt: 2 }}>{errors.map((error) => <Typography key={error}>{error}</Typography>)}</Box>}<Typography sx={{ mt: 2, fontSize: 12, letterSpacing: ".1em" }}>{pages.length} PAGE{pages.length === 1 ? "" : "S"} DETECTED</Typography>{pages.length > 0 && <PageReview pages={pages} onMove={move} onRotate={(id) => setPages((current) => current.map((page) => page.id === id ? { ...page, rotation: ((page.rotation + 90) % 360) as UploadPage["rotation"] } : page))} onRemove={remove} onReplace={replace} />}<Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}><Button onClick={() => setStep(1)} variant="outlined" sx={secondary}>Back</Button><Button onClick={() => pages.length ? setStep(3) : setErrors(["Add at least one page before reviewing your submission."])} sx={primary}>Review submission</Button></Stack></>}
    {step === 3 && <><Typography component="h1" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 31 }}>Ready to submit?</Typography><Card variant="outlined" sx={{ p: 2, my: 2, bgcolor: "#FFFDFA" }}><Typography sx={{ fontWeight: 700 }}>{selected?.title}</Typography><Typography>{pages.length} page{pages.length === 1 ? "" : "s"} ready for AI marking</Typography></Card>{errors.length > 0 && <Typography role="alert" sx={{ color: "#B4573F" }}>{errors[0]}</Typography>}{uploading && <><Typography sx={{ mt: 2 }}>Uploading {Math.ceil(progress / 100 * pages.length) || 1} of {pages.length} pages…</Typography><LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} /></>}<Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}><Button onClick={() => setStep(2)} disabled={uploading} variant="outlined" sx={secondary}>Back</Button><Button onClick={() => void submit()} disabled={uploading || !hasValidSelection} sx={primary}>{uploading ? "Uploading…" : "Submit for AI Marking"}</Button></Stack></>}
    {step === 4 && <Box sx={{ py: 2 }}><OcrReview pages={ocrPages} onCorrect={async (id, text) => { const updated = await correctOcrExtraction(id, text); setOcrPages((current) => current.map((page) => page.extractionId === id ? { ...page, ...updated, pageId: page.pageId } : page)); }} /><Stack direction="row" justifyContent="flex-end"><Button onClick={() => router.push("/worksheets")} sx={primary}>Confirm submission</Button></Stack></Box>}
  </Box></Box>;
}

export default function Page() { return <React.Suspense fallback={null}><UploadWizard /></React.Suspense>; }
