"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckIcon from "@mui/icons-material/Check";
import { useRouter, useSearchParams } from "next/navigation";
import { accent, worksheets } from "@/lib/student-mock-data";

const INK = "rgb(24,21,18)";
const MUTED = "rgb(126,117,111)";
const BORDER = "rgb(232,226,217)";
const CARD_BG = "rgb(250,247,242)";

const STEP_LABELS = [
  { n: 1, label: "Select" },
  { n: 2, label: "Upload & Review" },
  { n: 3, label: "Confirm" },
  { n: 4, label: "Done" },
];

const PAGES = [
  { id: "p1", label: "Page 1", warn: null as string | null },
  { id: "p2", label: "Page 2", warn: "Looks a little dark — check it's readable" },
];

function UploadWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const incomplete = worksheets.filter((w) => w.status === "incomplete");
  const preselected = searchParams.get("ws");

  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [selectedId, setSelectedId] = React.useState(
    preselected && incomplete.some((w) => w.id === preselected) ? preselected : incomplete[0]?.id ?? "ws2",
  );
  const [dragOver, setDragOver] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const selectedWs = worksheets.find((w) => w.id === selectedId) ?? incomplete[0];

  const next = () => setStep((s) => (Math.min(4, s + 1) as 1 | 2 | 3 | 4));
  const prev = () => setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3 | 4));

  const submit = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setStep(4);
    }, 1800);
  };

  return (
    <Box sx={{ backgroundColor: "rgb(253,251,247)", minHeight: "100%", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        <Stack direction="row" sx={{ alignItems: "center", mb: 5, flexWrap: "wrap", rowGap: 1.5 }}>
          {STEP_LABELS.map((s, i) => (
            <React.Fragment key={s.n}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    border: `1.5px solid ${step >= s.n ? accent : "rgb(207,196,189)"}`,
                    backgroundColor: step >= s.n ? accent : "rgb(247,243,241)",
                    color: step >= s.n ? "#fff" : "rgb(126,117,111)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {s.n}
                </Box>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: step >= s.n ? INK : "rgb(126,117,111)" }}>
                  {s.label}
                </Typography>
              </Stack>
              {i < STEP_LABELS.length - 1 && <Box sx={{ width: 36, height: "1.5px", backgroundColor: "rgb(207,196,189)", mx: 1.75 }} />}
            </React.Fragment>
          ))}
        </Stack>

        {step === 1 && (
          <Box>
            <Typography sx={{ fontFamily: "'EB Garamond', serif", fontWeight: 400, fontSize: 34, letterSpacing: "-0.6px", mb: 0.75 }}>
              Which worksheet are you submitting?
            </Typography>
            <Typography sx={{ fontSize: 15, color: "rgb(77,69,64)", mb: 3.5 }}>
              Choose the assigned worksheet these answers belong to.
            </Typography>
            <Stack spacing={1.5}>
              {incomplete.map((w) => {
                const active = w.id === selectedId;
                return (
                  <Card
                    key={w.id}
                    variant="outlined"
                    onClick={() => setSelectedId(w.id)}
                    sx={{
                      cursor: "pointer",
                      textAlign: "left",
                      backgroundColor: CARD_BG,
                      borderColor: active ? accent : BORDER,
                      borderWidth: "1.5px",
                      borderRadius: 3,
                      boxShadow: "none",
                      px: 2.5,
                      py: 2.25,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Box sx={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${active ? accent : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: active ? accent : "transparent" }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 19, color: INK }}>{w.title}</Typography>
                      <Typography sx={{ fontSize: 13, color: MUTED, mt: 0.25 }}>
                        Science · {w.topic} · Assigned {w.assigned}
                      </Typography>
                    </Box>
                  </Card>
                );
              })}
            </Stack>
            <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 4 }}>
              <Button
                onClick={next}
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={{ backgroundColor: accent, color: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, px: 3, py: 1.5, "&:hover": { backgroundColor: accent, filter: "brightness(0.96)" } }}
              >
                Continue
              </Button>
            </Stack>
          </Box>
        )}

        {step === 2 && (
          <Box>
            <Typography sx={{ fontFamily: "'EB Garamond', serif", fontWeight: 400, fontSize: 34, letterSpacing: "-0.6px", mb: 0.75 }}>
              Upload your pages
            </Typography>
            <Typography sx={{ fontSize: 15, color: "rgb(77,69,64)", mb: 3 }}>
              For <strong style={{ color: INK, fontWeight: 600 }}>{selectedWs?.title}</strong>. Add photos or a PDF of your
              completed worksheet.
            </Typography>

            <Box
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
              sx={{
                border: `2px dashed ${dragOver ? accent : "rgb(207,196,189)"}`,
                backgroundColor: dragOver ? "rgb(253,248,247)" : CARD_BG,
                borderRadius: 3.5,
                py: 5,
                px: 3,
                textAlign: "center",
                mb: 1.75,
              }}
            >
              <Box sx={{ width: 52, height: 52, mx: "auto", mb: 1.75, borderRadius: "14px", backgroundColor: "rgb(236,231,224)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgb(155,68,48)" }}>
                <UploadFileIcon />
              </Box>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: INK }}>Drag &amp; drop files here</Typography>
              <Typography sx={{ fontSize: 14, color: MUTED, my: 0.5 }}>or use one of the options below</Typography>
              <Stack direction="row" spacing={1.25} sx={{ justifyContent: "center", flexWrap: "wrap", rowGap: 1.25, mt: 2 }}>
                <Button
                  startIcon={<DescriptionOutlinedIcon sx={{ fontSize: 15 }} />}
                  variant="outlined"
                  sx={{ borderColor: "rgb(45,41,38)", color: "rgb(45,41,38)", backgroundColor: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { backgroundColor: INK, color: "#fff" } }}
                >
                  Choose files
                </Button>
                <Button
                  startIcon={<CameraAltOutlinedIcon sx={{ fontSize: 15 }} />}
                  variant="outlined"
                  sx={{ borderColor: "rgb(45,41,38)", color: "rgb(45,41,38)", backgroundColor: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { backgroundColor: INK, color: "#fff" } }}
                >
                  Take photo
                </Button>
              </Stack>
              <Typography sx={{ fontSize: 12, color: "rgb(150,144,139)", mt: 2 }}>
                Accepts JPG, PNG or PDF · up to 20 MB · multiple pages allowed
              </Typography>
            </Box>

            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", my: 1.75 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: "rgb(77,69,64)" }}>
                2 pages detected
              </Typography>
              <Typography sx={{ fontSize: 12, color: MUTED }}>Drag to reorder</Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.75}>
              {PAGES.map((p) => (
                <Card key={p.id} variant="outlined" sx={{ flex: 1, borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3, boxShadow: "none", p: 1.5, display: "flex", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 70,
                      height: 92,
                      borderRadius: "6px",
                      flexShrink: 0,
                      backgroundImage: "repeating-linear-gradient(180deg, rgb(247,243,241), rgb(247,243,241) 8px, rgb(241,237,236) 8px, rgb(241,237,236) 9px)",
                      border: `1px solid ${BORDER}`,
                    }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: INK }}>{p.label}</Typography>
                    {p.warn && (
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: "flex-start", mt: 0.75, fontSize: 12, color: "rgb(140,105,45)", lineHeight: 1.4 }}>
                        <WarningAmberOutlinedIcon sx={{ fontSize: 13, mt: "1px", flexShrink: 0 }} />
                        <span>{p.warn}</span>
                      </Stack>
                    )}
                  </Box>
                </Card>
              ))}
            </Stack>

            <Stack direction="row" sx={{ justifyContent: "space-between", mt: 4 }}>
              <Button onClick={prev} variant="outlined" sx={{ borderColor: "rgb(207,196,189)", color: "rgb(77,69,64)", textTransform: "none", fontWeight: 600, borderRadius: 2, px: 2.5, py: 1.5, "&:hover": { backgroundColor: "rgb(247,243,241)" } }}>
                Back
              </Button>
              <Button
                onClick={next}
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={{ backgroundColor: accent, color: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, px: 3, py: 1.5, "&:hover": { backgroundColor: accent, filter: "brightness(0.96)" } }}
              >
                Review submission
              </Button>
            </Stack>
          </Box>
        )}

        {step === 3 && (
          <Box>
            <Typography sx={{ fontFamily: "'EB Garamond', serif", fontWeight: 400, fontSize: 34, letterSpacing: "-0.6px", mb: 0.75 }}>
              Ready to submit?
            </Typography>
            <Typography sx={{ fontSize: 15, color: "rgb(77,69,64)", mb: 3.5 }}>
              Check everything looks right. Our AI will mark it and give you feedback in a moment.
            </Typography>
            <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 3, mb: 3 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", pb: 2, borderBottom: `1px solid ${BORDER}` }}>
                <Box>
                  <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 22, color: INK }}>{selectedWs?.title}</Typography>
                  <Typography sx={{ fontSize: 14, color: MUTED, mt: 0.5 }}>Science · {selectedWs?.topic}</Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={{ fontSize: 22, fontWeight: 600, color: INK }}>2</Typography>
                  <Typography sx={{ fontSize: 12, color: MUTED }}>pages</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                {PAGES.map((p) => (
                  <Box
                    key={p.id}
                    sx={{
                      width: 84,
                      height: 110,
                      borderRadius: "8px",
                      backgroundImage: "repeating-linear-gradient(180deg, rgb(247,243,241), rgb(247,243,241) 9px, rgb(241,237,236) 9px, rgb(241,237,236) 10px)",
                      border: `1px solid ${BORDER}`,
                    }}
                  />
                ))}
              </Stack>
            </Card>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Button onClick={prev} variant="outlined" sx={{ borderColor: "rgb(207,196,189)", color: "rgb(77,69,64)", textTransform: "none", fontWeight: 600, borderRadius: 2, px: 2.5, py: 1.5, "&:hover": { backgroundColor: "rgb(247,243,241)" } }}>
                Back
              </Button>
              <Button
                onClick={submit}
                startIcon={uploading ? <Box sx={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }} /> : <AutoAwesomeIcon sx={{ fontSize: 18 }} />}
                disabled={uploading}
                sx={{ backgroundColor: accent, color: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, px: 3.5, py: 1.6, "&:hover": { backgroundColor: accent, filter: "brightness(0.96)" }, "&.Mui-disabled": { backgroundColor: accent, opacity: 0.75, color: "#fff" } }}
              >
                Submit for AI Marking
              </Button>
            </Stack>
            <Typography sx={{ fontSize: 13, color: MUTED, textAlign: "center", mt: 2 }}>
              AI marking is checked by your tutor before it affects your profile.
            </Typography>
          </Box>
        )}

        {step === 4 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Box sx={{ width: 72, height: 72, mx: "auto", mb: 3, borderRadius: "50%", backgroundColor: "rgb(233,238,233)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgb(70,92,70)" }}>
              <CheckIcon sx={{ fontSize: 34 }} />
            </Box>
            <Typography sx={{ fontFamily: "'EB Garamond', serif", fontWeight: 400, fontSize: 36, letterSpacing: "-0.6px", mb: 1 }}>
              Worksheet submitted!
            </Typography>
            <Typography sx={{ fontSize: 16, color: "rgb(77,69,64)", maxWidth: 440, mx: "auto", mb: 3.5 }}>
              Great work. Our AI is marking your answers now — you&apos;ll get your results and feedback shortly.
            </Typography>
            <Card variant="outlined" sx={{ maxWidth: 420, mx: "auto", mb: 4, borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3, boxShadow: "none", p: 2.5, textAlign: "left" }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1.25 }}>
                <Typography sx={{ fontSize: 14, color: MUTED }}>Worksheet</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: INK }}>{selectedWs?.title}</Typography>
              </Stack>
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1.25 }}>
                <Typography sx={{ fontSize: 14, color: MUTED }}>Submitted</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: INK }}>23 Jul 2026</Typography>
              </Stack>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontSize: 14, color: MUTED }}>Status</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600, px: 1.25, py: 0.5, borderRadius: 9999, backgroundColor: "rgb(248,240,225)", color: "rgb(140,105,45)" }}>
                  AI marking in progress
                </Typography>
              </Stack>
            </Card>
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: "center" }}>
              <Button
                onClick={() => router.push("/worksheets")}
                variant="outlined"
                sx={{ borderColor: "rgb(45,41,38)", color: "rgb(45,41,38)", textTransform: "none", fontWeight: 600, borderRadius: 2, px: 2.75, py: 1.5, "&:hover": { backgroundColor: INK, color: "#fff" } }}
              >
                Back to Worksheets
              </Button>
              <Button
                onClick={() => router.push("/worksheets/ws1")}
                sx={{ backgroundColor: accent, color: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, px: 2.75, py: 1.5, "&:hover": { backgroundColor: accent, filter: "brightness(0.96)" } }}
              >
                View a sample result
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <UploadWizard />
    </React.Suspense>
  );
}
