"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import Link from "next/link";
import { accent, mistakes, understandingOptions } from "@/lib/student-mock-data";

const INK = "rgb(24,21,18)";
const MUTED = "rgb(126,117,111)";
const BORDER = "rgb(232,226,217)";
const CARD_BG = "rgb(250,247,242)";

const CATEGORIES = ["all", ...Array.from(new Set(mistakes.map((m) => m.cat)))];
const STATUS_FILTERS = [
  { key: "all", label: "Any status" },
  { key: "not_reviewed", label: "To review" },
  { key: "help", label: "Still need help" },
  { key: "understood", label: "Understood" },
];

const STATS = [
  { label: "To review", value: 3, fg: "rgb(155,68,48)" },
  { label: "Repeated", value: 2, fg: "rgb(140,105,45)" },
  { label: "Recently improved", value: 4, fg: "rgb(70,92,70)" },
  { label: "Corrections done", value: 6, fg: "rgb(70,92,70)" },
  { label: "Topics to practise", value: 2, fg: "rgb(77,69,64)" },
];

export default function Page() {
  const [category, setCategory] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [statusByMistake, setStatusByMistake] = React.useState<Record<string, string>>(
    Object.fromEntries(mistakes.map((m) => [m.id, m.statusKey])),
  );

  const filtered = mistakes.filter((m) => {
    if (category !== "all" && m.cat !== category) return false;
    const mStatus = statusByMistake[m.id];
    if (status !== "all" && mStatus !== status) return false;
    return true;
  });

  const clearFilters = () => {
    setCategory("all");
    setStatus("all");
  };

  const statusMeta = (key: string) => {
    if (key === "understood") return { bg: "rgb(233,238,233)", fg: "rgb(70,92,70)" };
    if (key === "help") return { bg: "rgb(248,232,226)", fg: "rgb(155,68,48)" };
    return { bg: "rgb(232,226,217)", fg: "rgb(77,69,64)" };
  };

  return (
    <Box sx={{ backgroundColor: "rgb(253,251,247)", minHeight: "100%", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
        <Typography sx={{ fontFamily: "'EB Garamond', serif", fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.8px", color: INK, mb: 0.75 }}>
          Mistake Review Centre
        </Typography>
        <Typography sx={{ fontSize: 15, color: "rgb(77,69,64)", mb: 3.5 }}>
          Every mistake is a chance to learn. Work through these and mark how you&apos;re feeling about each one.
        </Typography>

        <Grid container spacing={1.5} sx={{ mb: 3.5 }}>
          {STATS.map((s) => (
            <Grid size={{ xs: 6, sm: 2.4 }} key={s.label}>
              <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3, boxShadow: "none", p: 2 }}>
                <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 28, lineHeight: 1, color: s.fg }}>{s.value}</Typography>
                <Typography sx={{ fontSize: 12, color: MUTED, mt: 0.75 }}>{s.label}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", border: "1px solid rgb(238,210,201)", borderRadius: 3.5, backgroundColor: "rgb(253,248,247)", px: 2.75, py: 2.25, mb: 3 }}
        >
          <Box sx={{ width: 38, height: 38, borderRadius: "10px", flexShrink: 0, backgroundColor: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AutoAwesomeIcon sx={{ fontSize: 19 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: INK }}>
              You keep slipping on units and the photosynthesis equation
            </Typography>
            <Typography sx={{ fontSize: 13, color: "rgb(77,69,64)", mt: 0.25 }}>
              We&apos;ve picked a short follow-up worksheet to help these stick.
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/worksheets"
            sx={{ backgroundColor: INK, color: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, px: 2.25, py: 1.25, whiteSpace: "nowrap", "&:hover": { backgroundColor: INK, filter: "brightness(1.3)" } }}
          >
            Start practice
          </Button>
        </Stack>

        <Stack spacing={1.25} sx={{ mb: 3.5 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <Chip
                  key={c}
                  label={c === "all" ? "All types" : c}
                  onClick={() => setCategory(c)}
                  sx={{ fontSize: 13, fontWeight: 500, backgroundColor: active ? INK : "transparent", color: active ? "rgb(253,251,247)" : "rgb(77,69,64)", border: `1px solid ${active ? INK : "rgb(207,196,189)"}` }}
                />
              );
            })}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            {STATUS_FILTERS.map((c) => {
              const active = status === c.key;
              return (
                <Chip
                  key={c.key}
                  label={c.label}
                  onClick={() => setStatus(c.key)}
                  sx={{ fontSize: 13, fontWeight: 500, backgroundColor: active ? "rgb(155,68,48)" : "transparent", color: active ? "rgb(253,251,247)" : "rgb(77,69,64)", border: `1px solid ${active ? "rgb(155,68,48)" : "rgb(207,196,189)"}` }}
                />
              );
            })}
          </Stack>
        </Stack>

        {filtered.length === 0 && (
          <Card variant="outlined" sx={{ border: "1px dashed rgb(207,196,189)", borderRadius: 3.5, backgroundColor: CARD_BG, py: 7, px: 3, textAlign: "center", boxShadow: "none" }}>
            <Box sx={{ width: 56, height: 56, mx: "auto", mb: 2, borderRadius: "14px", backgroundColor: "rgb(233,238,233)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgb(70,92,70)" }}>
              <CheckCircleOutlineIcon />
            </Box>
            <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 22, color: INK, mb: 0.75 }}>
              Nothing here — nice work!
            </Typography>
            <Typography sx={{ fontSize: 14, color: MUTED, mb: 2.25 }}>
              No mistakes match these filters. Try widening them to see more.
            </Typography>
            <Button onClick={clearFilters} variant="outlined" sx={{ color: "rgb(45,41,38)", borderColor: "rgb(45,41,38)", textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { backgroundColor: INK, color: "#fff" } }}>
              Clear filters
            </Button>
          </Card>
        )}

        <Stack spacing={2}>
          {filtered.map((m) => {
            const mStatus = statusByMistake[m.id];
            const meta = statusMeta(mStatus);
            const statusLabel = understandingOptions.find((o) => o.key === mStatus)?.label ?? "Not Reviewed";

            return (
              <Card key={m.id} variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", px: 3, py: 2.75 }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1, mb: 1.5 }}>
                  <Chip label={m.cat} size="small" sx={{ fontSize: 12, fontWeight: 500, backgroundColor: "rgb(248,232,226)", color: "rgb(155,68,48)", border: "1px solid rgb(238,210,201)" }} />
                  <Typography sx={{ fontSize: 13, color: MUTED }}>{m.topic}</Typography>
                  <Typography sx={{ fontSize: 13, color: "rgb(150,144,139)" }}>· {m.date}</Typography>
                  {m.repeated && (
                    <Chip
                      icon={<HistoryIcon sx={{ fontSize: "11px !important", ml: "9px !important" }} />}
                      label="Seen before"
                      size="small"
                      sx={{ fontSize: 11, fontWeight: 600, backgroundColor: "rgb(248,240,225)", color: "rgb(140,105,45)" }}
                    />
                  )}
                  <Chip label={statusLabel} size="small" sx={{ ml: "auto", fontSize: 11, fontWeight: 600, backgroundColor: meta.bg, color: meta.fg }} />
                </Stack>

                <Typography sx={{ fontSize: 16, color: INK, lineHeight: 1.45, mb: 1.75 }}>{m.question}</Typography>

                <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                  <Box sx={{ flex: 1, backgroundColor: "rgb(247,243,241)", border: `1px solid ${BORDER}`, borderRadius: 2.5, p: 1.75 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: MUTED, mb: 0.625 }}>Your answer</Typography>
                    <Typography sx={{ fontSize: 14, color: "rgb(45,41,38)", lineHeight: 1.4 }}>{m.student}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, backgroundColor: "rgb(247,243,241)", border: `1px solid ${BORDER}`, borderRadius: 2.5, p: 1.75 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "rgb(70,92,70)", mb: 0.625 }}>Correct answer</Typography>
                    <Typography sx={{ fontSize: 14, color: "rgb(45,41,38)", lineHeight: 1.4 }}>{m.correct}</Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.25} sx={{ p: 1.75, backgroundColor: "rgb(26,28,30)", borderRadius: 2.5, mb: 2, alignItems: "flex-start" }}>
                  <Box sx={{ width: 22, height: 22, borderRadius: "6px", flexShrink: 0, backgroundColor: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AutoAwesomeIcon sx={{ fontSize: 13 }} />
                  </Box>
                  <Typography sx={{ fontSize: 14, color: "rgb(236,231,230)", lineHeight: 1.45 }}>{m.explanation}</Typography>
                </Stack>

                <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", color: "rgb(77,69,64)", mb: 1 }}>
                  How are you feeling about this one?
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                  {understandingOptions.map((o) => {
                    const active = mStatus === o.key;
                    return (
                      <Chip
                        key={o.key}
                        label={o.label}
                        onClick={() => setStatusByMistake((s) => ({ ...s, [m.id]: o.key }))}
                        sx={{ fontSize: 13, fontWeight: 500, borderRadius: 2, backgroundColor: active ? INK : "transparent", color: active ? "rgb(253,251,247)" : "rgb(77,69,64)", border: `1px solid ${active ? "transparent" : "rgb(207,196,189)"}` }}
                      />
                    );
                  })}
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
