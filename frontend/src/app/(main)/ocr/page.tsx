"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckIcon from "@mui/icons-material/Check";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useRouter } from "next/navigation";
import { OCR_ITEMS } from "@/data/marking-data";
import { useToast } from "@/providers/toast-provider";

export default function OcrReviewPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [edits, setEdits] = React.useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = React.useState<string[]>([]);
  const [zoom, setZoom] = React.useState(100);
  const [page, setPage] = React.useState(1);

  const items = OCR_ITEMS.map((o, i) => {
    const isConfirmed = confirmed.includes(o.id);
    const ok = o.confidence >= 90 || isConfirmed;
    return {
      ...o,
      n: i + 1,
      answer: edits[o.id] ?? o.answer,
      ok,
      warning: ok ? "" : o.warning,
    };
  });

  const needsReview = items.filter((o) => o.warning).length;

  const confirmOcr = () => {
    if (needsReview > 0) {
      showToast(`${needsReview} answer${needsReview > 1 ? "s" : ""} still need verifying — tick each one to confirm.`);
      return;
    }
    router.push("/marking");
    showToast("OCR confirmed. AI marking runs on your verified text.");
  };

  return (
    <Box sx={{ backgroundColor: "#F7F4EF", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1280, mx: "auto" }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", mb: 2.5, gap: 2 }}>
          <Stack direction="row" spacing={1.75} sx={{ alignItems: "center" }}>
            <ButtonBase
              onClick={() => router.push("/upload")}
              sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "9px", width: 32, height: 32, display: "grid", placeItems: "center", color: "#6F675E", "&:hover": { backgroundColor: "#F4EFE6" } }}
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} />
            </ButtonBase>
            <Box>
              <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 25, fontWeight: 500, mb: 0.5 }}>OCR Review</Typography>
              <Typography sx={{ fontSize: 12.5, color: "#8B837A" }}>Bella Tan · Adaptation Mini Test · 3 pages</Typography>
            </Box>
          </Stack>
          {needsReview > 0 && (
            <Stack
              direction="row"
              spacing={0.875}
              sx={{ alignItems: "center", backgroundColor: "#F7E3DC", color: "#9E3A24", fontSize: 11.5, fontWeight: 600, px: 1.625, py: 0.875, borderRadius: "20px" }}
            >
              <WarningAmberIcon sx={{ fontSize: 15 }} />
              {needsReview} need review
            </Stack>
          )}
        </Stack>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ alignItems: "flex-start" }}>
          <Box sx={{ flex: "1 1 400px", width: "100%", backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", overflow: "hidden" }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 2.25, py: 1.75, borderBottom: "1px solid #EFE8DE" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Original Scanned Worksheet</Typography>
              <Stack direction="row" spacing={0.625}>
                <ButtonBase onClick={() => setZoom((z) => Math.max(60, z - 20))} sx={{ backgroundColor: "#FBF9F5", border: "1px solid #EBE4D9", borderRadius: "7px", width: 28, height: 28, display: "grid", placeItems: "center", color: "#6F675E" }}>
                  <ZoomOutIcon sx={{ fontSize: 15 }} />
                </ButtonBase>
                <ButtonBase onClick={() => setZoom((z) => Math.min(160, z + 20))} sx={{ backgroundColor: "#FBF9F5", border: "1px solid #EBE4D9", borderRadius: "7px", width: 28, height: 28, display: "grid", placeItems: "center", color: "#6F675E" }}>
                  <ZoomInIcon sx={{ fontSize: 15 }} />
                </ButtonBase>
                <Typography sx={{ fontSize: 11, color: "#A09488", display: "grid", placeItems: "center", px: 0.75, minWidth: 46 }}>{zoom}%</Typography>
              </Stack>
            </Stack>

            <Box sx={{ backgroundColor: "#F0EBE3", p: 2.75, display: "grid", placeItems: "center", minHeight: 440, overflow: "auto" }}>
              <Box
                sx={{
                  width: `${Math.round((330 * zoom) / 100)}px`,
                  maxWidth: "100%",
                  backgroundColor: "#FDFAF4",
                  boxShadow: "0 4px 16px rgba(42,38,34,.13)",
                  borderRadius: "3px",
                  p: "26px 24px",
                  position: "relative",
                  fontFamily: "Caveat, cursive",
                  color: "#3A4A6B",
                  transition: "width .25s",
                }}
              >
                <Box sx={{ position: "absolute", left: 44, top: 0, bottom: 0, width: "1px", backgroundColor: "#EBC9C4" }} />
                <Typography sx={{ fontFamily: "DM Sans, sans-serif", fontSize: 9, letterSpacing: "0.1em", color: "#A09488", mb: 2, textAlign: "right" }}>
                  P5 SCIENCE · ADAPTATION MINI TEST · BOOKLET B
                </Typography>
                {items.map((o, i) => {
                  const flagged = !o.ok;
                  return (
                    <Box
                      key={o.id}
                      sx={{
                        position: "relative",
                        mb: 2,
                        backgroundColor: flagged ? "rgba(180,87,63,.09)" : "rgba(147,168,150,.10)",
                        border: `1px solid ${flagged ? "rgba(180,87,63,.35)" : "rgba(147,168,150,.3)"}`,
                        borderRadius: "5px",
                        p: "7px 9px 7px 34px",
                      }}
                    >
                      <Typography sx={{ fontFamily: "DM Sans, sans-serif", fontSize: 9.5, fontWeight: 600, color: "#6F675E", mb: 0.625 }}>
                        Q{i + 1}
                      </Typography>
                      <Typography sx={{ fontSize: 16, lineHeight: 1.5, color: "#3A4A6B" }}>{o.answer}</Typography>
                      {flagged && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: -8,
                            right: 8,
                            backgroundColor: "#B4573F",
                            color: "#FDFAF4",
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: 8.5,
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            px: 0.875,
                            py: 0.25,
                            borderRadius: "20px",
                          }}
                        >
                          LOW CONFIDENCE
                        </Box>
                      )}
                    </Box>
                  );
                })}
                <Box sx={{ height: "1px", backgroundColor: "#F2ECE1", my: 2.5 }} />
                <Typography sx={{ fontFamily: "DM Sans, sans-serif", fontSize: 9.5, color: "#BCB1A3", textAlign: "center" }}>
                  Page {page} of 3
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1.125} sx={{ alignItems: "center", justifyContent: "center", py: 1.625, borderTop: "1px solid #EFE8DE" }}>
              <ButtonBase onClick={() => setPage((p) => Math.max(1, p - 1))} sx={{ backgroundColor: "#FBF9F5", border: "1px solid #EBE4D9", borderRadius: "7px", px: 1.375, py: 0.75, fontSize: 11.5, color: "#6F675E" }}>
                Prev
              </ButtonBase>
              {[1, 2, 3].map((n) => (
                <ButtonBase
                  key={n}
                  onClick={() => setPage(n)}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "6px",
                    border: `1px solid ${page === n ? "#9E3A24" : "#EBE4D9"}`,
                    backgroundColor: page === n ? "#9E3A24" : "#FBF9F5",
                    color: page === n ? "#FBF9F5" : "#6F675E",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {n}
                </ButtonBase>
              ))}
              <ButtonBase onClick={() => setPage((p) => Math.min(3, p + 1))} sx={{ backgroundColor: "#FBF9F5", border: "1px solid #EBE4D9", borderRadius: "7px", px: 1.375, py: 0.75, fontSize: 11.5, color: "#6F675E" }}>
                Next
              </ButtonBase>
            </Stack>
          </Box>

          <Box sx={{ flex: "1 1 400px", width: "100%", backgroundColor: "#1B1917", borderRadius: "14px", overflow: "hidden" }}>
            <Box sx={{ px: 2.75, py: 2.5, borderBottom: "1px solid #2C2925" }}>
              <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 500, color: "#FBF9F5", mb: 0.625 }}>
                Extracted Data
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#8F877D" }}>
                Correct anything the AI read wrongly. Marking runs on your confirmed text.
              </Typography>
            </Box>

            <Stack spacing={1.5} sx={{ p: 2.25, maxHeight: 640, overflowY: "auto" }}>
              {items.map((o) => {
                const isConfirmed = confirmed.includes(o.id);
                return (
                  <Box
                    key={o.id}
                    sx={{
                      backgroundColor: "#232120",
                      border: `1px solid ${o.ok ? "#2F2C28" : "#4A2C21"}`,
                      borderLeft: `3px solid ${o.ok ? "#5C7A63" : "#B4573F"}`,
                      borderRadius: "10px",
                      p: "15px 17px",
                    }}
                  >
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.625 }}>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#E8E2D9" }}>Question {o.n}</Typography>
                      <Stack
                        direction="row"
                        spacing={0.75}
                        sx={{
                          alignItems: "center",
                          fontSize: 9.5,
                          fontWeight: 700,
                          letterSpacing: "0.04em",
                          px: 1.125,
                          py: 0.5,
                          borderRadius: "20px",
                          backgroundColor: o.ok ? "#22301F" : "#3A2119",
                          color: o.ok ? "#9FC0A2" : "#E0A692",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {o.ok ? "High Confidence" : "Needs Review"} · {o.confidence}%
                      </Stack>
                    </Stack>
                    <Typography sx={{ fontSize: 10, letterSpacing: "0.1em", fontWeight: 600, color: "#6E665D", mb: 0.875 }}>
                      EXTRACTED QUESTION
                    </Typography>
                    <Box sx={{ backgroundColor: "#2C2926", borderRadius: "7px", p: "10px 12px", fontSize: 12.5, lineHeight: 1.6, color: "#B5ADA2", mb: 1.75 }}>
                      {o.question}
                    </Box>
                    <Typography sx={{ fontSize: 10, letterSpacing: "0.1em", fontWeight: 600, color: "#6E665D", mb: 0.875 }}>
                      {o.ok ? "STUDENT ANSWER" : "STUDENT ANSWER (MANUAL CORRECTION REQUIRED)"}
                    </Typography>
                    <Stack direction="row" spacing={1.125} sx={{ alignItems: "flex-start" }}>
                      <InputBase
                        value={o.answer}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [o.id]: e.target.value }))}
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          backgroundColor: o.ok ? "#2C2926" : "#332420",
                          border: `1px solid ${o.ok ? "#3A362F" : "#7A4232"}`,
                          borderRadius: "7px",
                          px: 1.625,
                          py: 1.375,
                          fontSize: 13.5,
                          color: "#F4EFE6",
                        }}
                      />
                      <ButtonBase
                        onClick={() => {
                          if (isConfirmed) return;
                          setConfirmed((prev) => [...prev, o.id]);
                          showToast(`Question ${o.n} marked as verified.`);
                        }}
                        sx={{
                          backgroundColor: isConfirmed ? "#22301F" : "#2C2926",
                          border: `1px solid ${isConfirmed ? "#3E5540" : "#3A362F"}`,
                          borderRadius: "7px",
                          width: 38,
                          height: 38,
                          display: "grid",
                          placeItems: "center",
                          color: isConfirmed ? "#9FC0A2" : "#6E665D",
                          flex: "0 0 auto",
                        }}
                      >
                        <CheckIcon sx={{ fontSize: 17 }} />
                      </ButtonBase>
                    </Stack>
                    {o.warning && (
                      <Stack direction="row" spacing={0.875} sx={{ alignItems: "flex-start", fontSize: 11, lineHeight: 1.55, color: "#D89B87", mt: 1.25 }}>
                        <WarningAmberIcon sx={{ fontSize: 14, mt: 0.25, flex: "0 0 auto" }} />
                        {o.warning}
                      </Stack>
                    )}
                  </Box>
                );
              })}
            </Stack>

            <Stack direction="row" spacing={1.25} sx={{ px: 2.25, py: 2, borderTop: "1px solid #2C2925" }}>
              <ButtonBase
                onClick={() => router.push("/upload")}
                sx={{ backgroundColor: "transparent", border: "1px solid #3A362F", borderRadius: "9px", px: 2.25, py: 1.5, fontSize: 13, fontWeight: 500, color: "#A8A096", "&:hover": { backgroundColor: "#282522" } }}
              >
                Cancel
              </ButtonBase>
              <ButtonBase
                onClick={confirmOcr}
                sx={{
                  flex: 1,
                  backgroundColor: "#E08A72",
                  color: "#1B1917",
                  borderRadius: "9px",
                  py: 1.5,
                  fontSize: 13.5,
                  fontWeight: 600,
                  gap: 1.125,
                  "&:hover": { backgroundColor: "#EC9A82" },
                }}
              >
                Confirm OCR Results
                <ArrowForwardIcon sx={{ fontSize: 16 }} />
              </ButtonBase>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
