"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Link from "next/link";
import { accent, worksheets, topics, masteryMeta } from "@/lib/student-mock-data";

const INK = "rgb(24,21,18)";
const MUTED = "rgb(126,117,111)";
const BORDER = "rgb(232,226,217)";
const CARD_BG = "rgb(250,247,242)";

const SCORE_TREND = [
  { label: "Materials", score: 91 },
  { label: "Water Cycle", score: 82 },
  { label: "Plant Sys.", score: 68 },
  { label: "Forces", score: 64 },
].map((d) => ({ ...d, fg: d.score >= 80 ? "rgb(138,154,138)" : d.score >= 65 ? "rgb(194,155,98)" : "rgb(155,68,48)" }));

const STRENGTHS = ["Comparing material properties", "Naming water-cycle stages", "Identifying pushes and pulls"];
const IMPROVED_RECENTLY = ["Water-cycle diagrams", "Reading measurements"];
const GROWTH_AREAS = ["The photosynthesis equation", "Melting vs. evaporation", "Telling mass and weight apart"];

const FILTERS = ["all", "The Water Cycle", "Forces & Energy", "Plant Systems", "Materials"];

export default function Page() {
  const [filter, setFilter] = React.useState("all");

  const completedWs = worksheets.filter((w) => w.status === "completed");
  const avgScore = Math.round(completedWs.reduce((a, w) => a + (w.score ?? 0), 0) / completedWs.length);
  const unlockedTopics = topics.filter((t) => !t.locked);
  const overallMastery = Math.round(unlockedTopics.reduce((a, t) => a + t.completion, 0) / unlockedTopics.length);
  const masteredCount = topics.filter((t) => t.status === "mastered").length;
  const inProgressCount = topics.filter((t) => ["learning", "practising", "improving"].includes(t.status)).length;
  const attentionCount = topics.filter((t) => t.status === "needs_revision").length;

  return (
    <Box sx={{ backgroundColor: "rgb(253,251,247)", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1120, mx: "auto" }}>
        <Typography sx={{ fontFamily: "'EB Garamond', serif", fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.8px", color: INK, mb: 0.75 }}>
          My Progress
        </Typography>
        <Typography sx={{ fontSize: 15, color: "rgb(77,69,64)", mb: 3.5 }}>
          A picture of how your Science learning is going. Keep completing worksheets to fill it in.
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: "rgb(26,28,30)", color: "rgb(253,251,247)", borderRadius: 3.5, boxShadow: "none", p: 2.75, height: "100%" }}>
              <Typography sx={{ fontSize: 13, color: "rgb(205,197,192)", mb: 1.25 }}>Overall mastery</Typography>
              <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 44, lineHeight: 1 }}>{overallMastery}%</Typography>
              <Box sx={{ mt: 1.75, height: 8, borderRadius: 9999, backgroundColor: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
                <Box sx={{ height: "100%", width: `${overallMastery}%`, backgroundColor: accent, borderRadius: 9999 }} />
              </Box>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 2.75, height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.25 }}>
              <Box>
                <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 34, lineHeight: 1, color: INK }}>{completedWs.length}</Typography>
                <Typography sx={{ fontSize: 13, color: MUTED, mt: 0.5 }}>Worksheets completed</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 34, lineHeight: 1, color: INK }}>{avgScore}%</Typography>
                <Typography sx={{ fontSize: 13, color: MUTED, mt: 0.5 }}>Average score</Typography>
              </Box>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 2.75, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 1.25 }}>
              {[
                { label: "Topics mastered", value: masteredCount, dot: "rgb(138,154,138)" },
                { label: "In progress", value: inProgressCount, dot: "rgb(194,155,98)" },
                { label: "Needs attention", value: attentionCount, dot: "rgb(155,68,48)" },
              ].map((row) => (
                <Stack key={row.label} direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", fontSize: 14, color: "rgb(77,69,64)" }}>
                    <Box sx={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: row.dot }} />
                    <span>{row.label}</span>
                  </Stack>
                  <strong>{row.value}</strong>
                </Stack>
              ))}
            </Card>
          </Grid>
        </Grid>

        <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 3, mb: 4 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
            <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 22, color: INK }}>Scores over time</Typography>
            <Typography sx={{ fontSize: 13, color: MUTED }}>Last 4 worksheets</Typography>
          </Stack>
          <Stack direction="row" spacing={3.5} sx={{ alignItems: "flex-end", height: 180, px: 1 }}>
            {SCORE_TREND.map((d) => (
              <Box key={d.label} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, height: "100%", justifyContent: "flex-end" }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: INK }}>{d.score}%</Typography>
                <Box sx={{ width: "100%", maxWidth: 64, borderRadius: "8px 8px 0 0", backgroundColor: d.fg, height: `${d.score}%` }} />
                <Typography sx={{ fontSize: 12, color: MUTED, whiteSpace: "nowrap" }}>{d.label}</Typography>
              </Box>
            ))}
          </Stack>
        </Card>

        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", rowGap: 1.5 }}>
          <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 26 }}>Topic progress</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <Chip
                  key={f}
                  label={f === "all" ? "All topics" : f}
                  onClick={() => setFilter(f)}
                  sx={{ fontSize: 13, fontWeight: 500, backgroundColor: active ? INK : "transparent", color: active ? "rgb(253,251,247)" : "rgb(77,69,64)", border: `1px solid ${active ? INK : "rgb(207,196,189)"}` }}
                />
              );
            })}
          </Stack>
        </Stack>

        <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", overflow: "hidden", mb: 4 }}>
          {unlockedTopics.map((t, i) => {
            const meta = masteryMeta[t.status];
            return (
              <Box
                key={t.id}
                component={Link}
                href={`/topics/${t.id}`}
                sx={{
                  width: "100%",
                  textAlign: "left",
                  borderBottom: i < unlockedTopics.length - 1 ? `1px solid ${BORDER}` : "none",
                  backgroundColor: "transparent",
                  px: 3,
                  py: 2.25,
                  display: "flex",
                  alignItems: "center",
                  gap: 2.5,
                  textDecoration: "none",
                  color: "inherit",
                  "&:hover": { backgroundColor: "rgb(253,248,247)" },
                }}
              >
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: INK }}>{t.name}</Typography>
                    <Chip
                      icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: meta.dot, ml: "9px !important" }} />}
                      label={meta.label}
                      size="small"
                      sx={{ fontSize: 11, fontWeight: 600, backgroundColor: meta.bg, color: meta.fg }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mt: 1.25 }}>
                    <Box sx={{ flexGrow: 1, maxWidth: 260, height: 7, borderRadius: 9999, backgroundColor: "rgb(236,231,224)", overflow: "hidden" }}>
                      <Box sx={{ height: "100%", width: `${t.completion}%`, backgroundColor: meta.bar, borderRadius: 9999 }} />
                    </Box>
                    <Typography sx={{ fontSize: 13, color: MUTED }}>{t.completion}% complete</Typography>
                  </Stack>
                </Box>
                <Box sx={{ textAlign: "center", width: 76, flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: INK }}>{t.accuracy != null ? `${t.accuracy}%` : "—"}</Typography>
                  <Typography sx={{ fontSize: 11, color: MUTED }}>Accuracy</Typography>
                </Box>
                <Box sx={{ textAlign: "right", width: 120, flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "rgb(155,68,48)" }}>
                    {t.status === "not_started" ? "Start topic" : t.status === "mastered" ? "Keep it sharp" : "Practise this"}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: MUTED }}>Last: {t.lastPractised}</Typography>
                </Box>
                <ChevronRightIcon sx={{ color: MUTED, flexShrink: 0 }} />
              </Box>
            );
          })}
        </Card>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 3, height: "100%" }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2 }}>
                <Box sx={{ width: 34, height: 34, borderRadius: "9px", backgroundColor: "rgb(233,238,233)", color: "rgb(70,92,70)", display: "flex", alignItems: "center", justifyContent: "center" }}>✓</Box>
                <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 20, color: INK }}>What you&apos;re great at</Typography>
              </Stack>
              <Stack spacing={1.25}>
                {STRENGTHS.map((s) => (
                  <Stack key={s} direction="row" spacing={1.25} sx={{ alignItems: "center", fontSize: 14, color: "rgb(45,41,38)" }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "rgb(138,154,138)", flexShrink: 0 }} />
                    <span>{s}</span>
                  </Stack>
                ))}
              </Stack>
              <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${BORDER}` }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", color: "rgb(70,92,70)", mb: 1 }}>
                  Recently improved
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                  {IMPROVED_RECENTLY.map((s) => (
                    <Chip key={s} label={s} size="small" sx={{ fontSize: 12, fontWeight: 500, backgroundColor: "rgb(233,238,233)", color: "rgb(70,92,70)" }} />
                  ))}
                </Stack>
              </Box>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 3, height: "100%" }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2 }}>
                <Box sx={{ width: 34, height: 34, borderRadius: "9px", backgroundColor: "rgb(248,240,225)", color: "rgb(140,105,45)", display: "flex", alignItems: "center", justifyContent: "center" }}>◎</Box>
                <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 20, color: INK }}>Let&apos;s practise these next</Typography>
              </Stack>
              <Stack spacing={1.25}>
                {GROWTH_AREAS.map((g) => (
                  <Stack key={g} direction="row" spacing={1.25} sx={{ alignItems: "center", fontSize: 14, color: "rgb(45,41,38)" }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "rgb(194,155,98)", flexShrink: 0 }} />
                    <span>{g}</span>
                  </Stack>
                ))}
              </Stack>
              <Button
                component={Link}
                href="/mistakes"
                fullWidth
                sx={{ mt: 2.25, border: `1px solid rgb(207,196,189)`, borderRadius: 2, py: 1.25, color: "rgb(155,68,48)", fontWeight: 600, textTransform: "none", "&:hover": { backgroundColor: "rgb(253,248,247)" } }}
              >
                Review these in the Mistake Centre →
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
