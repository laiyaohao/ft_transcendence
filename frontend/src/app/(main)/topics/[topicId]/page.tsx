"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import Link from "next/link";
import { notFound } from "next/navigation";
import { accent, topics, masteryMeta } from "@/lib/student-mock-data";

const INK = "rgb(24,21,18)";
const MUTED = "rgb(126,117,111)";
const BORDER = "rgb(232,226,217)";
const CARD_BG = "rgb(250,247,242)";

export default function Page({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = React.use(params);
  const topic = topics.find((t) => t.id === topicId);
  if (!topic) notFound();

  const meta = masteryMeta[topic.status];
  const trendMax = Math.max(100, ...topic.trend);
  const trendBars = topic.trend.map((v, i) => ({ v, h: Math.round((v / trendMax) * 100), label: `WS${i + 1}` }));

  return (
    <Box sx={{ backgroundColor: "rgb(253,251,247)", minHeight: "100%", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
        <Button
          component={Link}
          href="/topics"
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          sx={{ color: "rgb(77,69,64)", textTransform: "none", fontSize: 14, mb: 2, p: 0, minWidth: 0, "&:hover": { backgroundColor: "transparent", color: INK } }}
        >
          All topics
        </Button>

        <Stack direction="row" spacing={1.75} sx={{ alignItems: "flex-start", mb: 1 }}>
          <Typography sx={{ fontFamily: "'EB Garamond', serif", fontWeight: 400, fontSize: 38, lineHeight: 1.1, letterSpacing: "-0.8px" }}>
            {topic.name}
          </Typography>
          <Chip label={meta.label} size="small" sx={{ mt: 1.25, whiteSpace: "nowrap", fontSize: 12, fontWeight: 600, backgroundColor: meta.bg, color: meta.fg }} />
        </Stack>
        <Typography sx={{ fontSize: 16, color: "rgb(77,69,64)", lineHeight: 1.5, mb: 3.5 }}>{topic.desc}</Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={2.5}>
              <Grid container spacing={1.5}>
                {[
                  { label: "Complete", value: `${topic.completion}%` },
                  { label: "Latest score", value: topic.latestScore != null ? `${topic.latestScore}%` : "Not attempted" },
                  { label: "Accuracy", value: topic.accuracy != null ? `${topic.accuracy}%` : "—" },
                  { label: "Attempts", value: topic.attempts },
                ].map((s) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={s.label}>
                    <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3, boxShadow: "none", p: 2 }}>
                      <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 26, color: INK }}>{s.value}</Typography>
                      <Typography sx={{ fontSize: 12, color: MUTED, mt: 0.25 }}>{s.label}</Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {trendBars.length > 0 && (
                <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 2.75 }}>
                  <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 19, color: INK, mb: 2 }}>Progress trend</Typography>
                  <Stack direction="row" spacing={2.5} sx={{ alignItems: "flex-end", height: 120 }}>
                    {trendBars.map((b) => (
                      <Box key={b.label} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75, height: "100%", justifyContent: "flex-end" }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "rgb(45,41,38)" }}>{b.v}%</Typography>
                        <Box sx={{ width: "100%", maxWidth: 48, borderRadius: "6px 6px 0 0", backgroundColor: meta.bar, height: `${b.h}%` }} />
                        <Typography sx={{ fontSize: 11, color: MUTED }}>{b.label}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Card>
              )}

              <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 2.75 }}>
                <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 19, color: INK, mb: 1.75 }}>Skills in this topic</Typography>
                <Stack spacing={1.25}>
                  {topic.skills.map((sk) => (
                    <Stack key={sk} direction="row" spacing={1.25} sx={{ alignItems: "center", fontSize: 14, color: "rgb(45,41,38)" }}>
                      <Box sx={{ width: 22, height: 22, borderRadius: "6px", backgroundColor: "rgb(236,231,224)", color: MUTED, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CheckBoxOutlineBlankIcon sx={{ fontSize: 13 }} />
                      </Box>
                      <span>{sk}</span>
                    </Stack>
                  ))}
                </Stack>
              </Card>

              <Grid container spacing={2}>
                {topic.understood.length > 0 && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ borderLeft: "3px solid rgb(138,154,138)", backgroundColor: "rgb(233,238,233)", borderRadius: "0 10px 10px 0", p: 2.25, height: "100%" }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", color: "rgb(50,66,50)", mb: 1 }}>
                        You&apos;ve got this
                      </Typography>
                      {topic.understood.map((u) => (
                        <Typography key={u} sx={{ fontSize: 14, color: "rgb(45,41,38)", mb: 0.625 }}>• {u}</Typography>
                      ))}
                    </Box>
                  </Grid>
                )}
                {topic.practice.length > 0 && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ borderLeft: "3px solid rgb(194,155,98)", backgroundColor: "rgb(248,240,225)", borderRadius: "0 10px 10px 0", p: 2.25, height: "100%" }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", color: "rgb(120,88,35)", mb: 1 }}>
                        Worth practising
                      </Typography>
                      {topic.practice.map((p) => (
                        <Typography key={p} sx={{ fontSize: 14, color: "rgb(45,41,38)", mb: 0.625 }}>• {p}</Typography>
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={2}>
              <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: "rgb(26,28,30)", color: "rgb(253,251,247)", borderRadius: 3.5, boxShadow: "none", p: 2.75 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "rgb(255,180,163)", mb: 1 }}>
                  Recommended next
                </Typography>
                <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 20, lineHeight: 1.2, mb: 2 }}>{topic.recWs}</Typography>
                <Button
                  component={Link}
                  href={topic.recWsId ? `/std_upload?ws=${topic.recWsId}` : "/std_worksheets"}
                  fullWidth
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                  sx={{ backgroundColor: accent, color: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, py: 1.375, "&:hover": { backgroundColor: accent, filter: "brightness(0.96)" } }}
                >
                  Open worksheet
                </Button>
              </Card>

              {topic.teacher && (
                <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 2.5 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.25 }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgb(221,217,216)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "rgb(77,69,64)" }}>
                      EV
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: INK }}>From your tutor</Typography>
                      <Typography sx={{ fontSize: 11, color: MUTED }}>Prof. E. Vance</Typography>
                    </Box>
                  </Stack>
                  <Typography sx={{ fontSize: 14, color: "rgb(45,41,38)", lineHeight: 1.5, fontStyle: "italic" }}>
                    &ldquo;{topic.teacher}&rdquo;
                  </Typography>
                </Card>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
