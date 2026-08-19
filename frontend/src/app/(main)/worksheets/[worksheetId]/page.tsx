"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckIcon from "@mui/icons-material/Check";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import Link from "next/link";
import {
  accent,
  worksheets,
  questions,
  statusMeta,
  student,
  understandingOptions,
  understandingMeta,
  understandingLabel,
  type QuestionStatus,
} from "@/lib/student-mock-data";

const INK = "rgb(24,21,18)";
const MUTED = "rgb(126,117,111)";
const BORDER = "rgb(232,226,217)";
const CARD_BG = "rgb(250,247,242)";

type ResultFilter = "all" | "issues" | QuestionStatus;

const FILTER_CHIPS: { key: ResultFilter; label: string }[] = [
  { key: "all", label: "All (6)" },
  { key: "issues", label: "To review (3)" },
  { key: "incorrect", label: "Incorrect (2)" },
  { key: "partial", label: "Partial (1)" },
  { key: "tutor", label: "Tutor (1)" },
];

export default function Page({ params }: { params: Promise<{ worksheetId: string }> }) {
  const { worksheetId } = React.use(params);
  const worksheet = worksheets.find((w) => w.id === worksheetId) ?? worksheets.find((w) => w.id === "ws1")!;

  const [filter, setFilter] = React.useState<ResultFilter>("all");
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [understanding, setUnderstanding] = React.useState<Record<string, string>>({});

  const filtered = questions.filter((q) => {
    if (filter === "all") return true;
    if (filter === "issues") return q.status === "incorrect" || q.status === "partial";
    return q.status === filter;
  });

  return (
    <Box sx={{ backgroundColor: "rgb(253,251,247)", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
        <Button
          component={Link}
          href="/worksheets"
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          sx={{ color: "rgb(77,69,64)", textTransform: "none", fontSize: 14, mb: 2, p: 0, minWidth: 0, "&:hover": { backgroundColor: "transparent", color: INK } }}
        >
          Back to Worksheets
        </Button>

        <Stack direction={{ xs: "column", md: "row" }} spacing={3.5} sx={{ alignItems: "stretch", mb: 4 }}>
          <Box sx={{ flexGrow: 1, minWidth: 280 }}>
            <Typography sx={{ fontSize: 13, color: MUTED, mb: 0.5 }}>
              Science · {worksheet.topic} · Completed {worksheet.submitted}
            </Typography>
            <Typography sx={{ fontFamily: "'EB Garamond', serif", fontWeight: 400, fontSize: 38, lineHeight: 1.1, letterSpacing: "-0.8px", color: INK, mb: 2.25 }}>
              {worksheet.title}
            </Typography>
            <Box sx={{ borderLeft: "3px solid rgb(138,154,138)", backgroundColor: "rgb(233,238,233)", borderRadius: "0 10px 10px 0", px: 2.25, py: 1.75, fontSize: 14, color: "rgb(50,66,50)", lineHeight: 1.5 }}>
              <strong>Well done, {student.name}!</strong> You&apos;ve got a strong grasp of the water cycle. Focus your
              revision on the difference between <em>melting</em> and <em>evaporation</em>, and on choosing the right units.
            </Box>
          </Box>
          <Card variant="outlined" sx={{ width: { xs: "100%", md: 240 }, flexShrink: 0, borderRadius: 3.5, borderColor: BORDER, backgroundColor: CARD_BG, boxShadow: "none", p: 2.5, textAlign: "center" }}>
            <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 54, lineHeight: 1, color: INK }}>{worksheet.score}%</Typography>
            <Typography sx={{ fontSize: 13, color: MUTED, my: 1 }}>Overall score</Typography>
            <Stack spacing={1} sx={{ textAlign: "left" }}>
              {[
                { label: "Correct", value: 9, color: "rgb(138,154,138)" },
                { label: "Partially correct", value: 1, color: "rgb(194,155,98)" },
                { label: "Incorrect", value: 2, color: "rgb(155,68,48)" },
                { label: "Tutor review", value: 1, color: "rgb(126,117,111)" },
              ].map((row) => (
                <Stack key={row.label} direction="row" sx={{ alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                  <Stack direction="row" spacing={0.875} sx={{ alignItems: "center", color: "rgb(77,69,64)" }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: row.color }} />
                    <span>{row.label}</span>
                  </Stack>
                  <strong>{row.value}</strong>
                </Stack>
              ))}
            </Stack>
          </Card>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1, mb: 2.5 }}>
          <Typography sx={{ fontSize: 13, color: MUTED, mr: 0.5 }}>Filter:</Typography>
          {FILTER_CHIPS.map((c) => {
            const active = filter === c.key;
            return (
              <Chip
                key={c.key}
                label={c.label}
                onClick={() => setFilter(c.key)}
                sx={{
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: active ? INK : "transparent",
                  color: active ? "rgb(253,251,247)" : "rgb(77,69,64)",
                  border: `1px solid ${active ? INK : "rgb(207,196,189)"}`,
                }}
              />
            );
          })}
        </Stack>

        <Stack spacing={2}>
          {filtered.map((q) => {
            const meta = statusMeta[q.status];
            const isExpanded = !!expanded[q.id];
            const canExpand = q.status !== "correct";
            const uKey = understanding[q.id];
            const uMeta = understandingMeta(uKey);

            return (
              <Card key={q.id} variant="outlined" sx={{ borderRadius: 3.5, borderColor: BORDER, backgroundColor: CARD_BG, boxShadow: "none", overflow: "hidden" }}>
                <Box sx={{ p: 3 }}>
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap", gap: 1.5 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: MUTED }}>
                        Question {q.n}
                      </Typography>
                      <Chip
                        icon={<Box sx={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: meta.dot, ml: "8px !important" }} />}
                        label={meta.label}
                        size="small"
                        sx={{ fontSize: 12, fontWeight: 600, backgroundColor: meta.bg, color: meta.fg }}
                      />
                    </Stack>
                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: INK, whiteSpace: "nowrap" }}>
                      {q.mark != null ? `${q.mark} / ${q.max}` : `— / ${q.max}`}
                    </Typography>
                  </Stack>

                  <Typography sx={{ fontSize: 16, color: INK, lineHeight: 1.45, mb: 1.75 }}>{q.question}</Typography>

                  <Stack direction="row" spacing={1.5} sx={{ mb: 1.75 }}>
                    <Box sx={{ flex: 1, backgroundColor: "rgb(247,243,241)", border: `1px solid ${BORDER}`, borderRadius: 2.5, p: 1.75 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: MUTED, mb: 0.625 }}>
                        Your answer
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: "rgb(45,41,38)", lineHeight: 1.4 }}>{q.student}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, backgroundColor: "rgb(247,243,241)", border: `1px solid ${BORDER}`, borderRadius: 2.5, p: 1.75 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: MUTED, mb: 0.625 }}>
                        Model answer
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: "rgb(45,41,38)", lineHeight: 1.4 }}>{q.correct}</Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1.25} sx={{ p: 1.75, backgroundColor: "rgb(26,28,30)", borderRadius: 2.5, alignItems: "flex-start" }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: "6px", flexShrink: 0, backgroundColor: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AutoAwesomeIcon sx={{ fontSize: 13 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "rgb(255,180,163)", mb: 0.25 }}>
                        AI Feedback
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: "rgb(236,231,230)", lineHeight: 1.4 }}>{q.summary}</Typography>
                    </Box>
                  </Stack>

                  {q.tags.length > 0 && (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1, mt: 1.5 }}>
                      {q.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{ fontSize: 12, fontWeight: 500, backgroundColor: "rgb(248,232,226)", color: "rgb(155,68,48)", border: "1px solid rgb(238,210,201)" }}
                        />
                      ))}
                    </Stack>
                  )}

                  {canExpand && (
                    <Button
                      onClick={() => setExpanded((s) => ({ ...s, [q.id]: !s[q.id] }))}
                      endIcon={<ExpandMoreIcon sx={{ fontSize: 15, transform: isExpanded ? "rotate(180deg)" : "none" }} />}
                      sx={{ mt: 1.75, p: 0, minWidth: 0, fontSize: 14, fontWeight: 600, color: "rgb(155,68,48)", textTransform: "none", "&:hover": { backgroundColor: "transparent", color: accent } }}
                    >
                      {isExpanded ? "Hide explanation" : "Read explanation"}
                    </Button>
                  )}
                </Box>

                {isExpanded && (
                  <Box sx={{ borderTop: `1px solid ${BORDER}`, backgroundColor: "rgb(253,248,247)", p: 3 }}>
                    <Stack sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", color: "rgb(155,68,48)", mb: 0.625 }}>What you did</Typography>
                        <Typography sx={{ fontSize: 14, color: "rgb(45,41,38)", lineHeight: 1.5 }}>{q.what}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", color: "rgb(155,68,48)", mb: 0.625 }}>Why it needs work</Typography>
                        <Typography sx={{ fontSize: 14, color: "rgb(45,41,38)", lineHeight: 1.5 }}>{q.why}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", color: "rgb(155,68,48)", mb: 0.625 }}>How to correct it</Typography>
                        <Typography sx={{ fontSize: 14, color: "rgb(45,41,38)", lineHeight: 1.5 }}>{q.how}</Typography>
                      </Box>
                      <Box sx={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 2.5, p: 1.75 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", color: "rgb(140,105,45)", mb: 0.625 }}>Remember</Typography>
                        <Typography sx={{ fontSize: 14, color: "rgb(45,41,38)", lineHeight: 1.5 }}>{q.remember}</Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 2.25, p: 1.75, borderRadius: 2.5, backgroundColor: "rgb(247,243,241)", border: `1px solid ${BORDER}` }}>
                      <LightbulbOutlinedIcon sx={{ fontSize: 16, color: "rgb(70,92,70)", flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 14, color: "rgb(45,41,38)" }}>
                        <strong>Next step:</strong> {q.next}
                      </Typography>
                    </Stack>

                    <Box sx={{ mt: 2.25 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", color: "rgb(77,69,64)", mb: 1 }}>
                        How are you feeling about this one?
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                        {understandingOptions.map((o) => {
                          const active = uKey === o.key;
                          return (
                            <Chip
                              key={o.key}
                              label={o.label}
                              onClick={() => setUnderstanding((s) => ({ ...s, [q.id]: o.key }))}
                              sx={{
                                fontSize: 13,
                                fontWeight: 500,
                                borderRadius: 2,
                                backgroundColor: active ? INK : "transparent",
                                color: active ? "rgb(253,251,247)" : "rgb(77,69,64)",
                                border: `1px solid ${active ? "transparent" : "rgb(207,196,189)"}`,
                              }}
                            />
                          );
                        })}
                      </Stack>
                      <Stack direction="row" spacing={1.25} sx={{ mt: 2 }}>
                        <Button
                          startIcon={<ForumOutlinedIcon sx={{ fontSize: 14 }} />}
                          variant="outlined"
                          sx={{ borderColor: "rgb(45,41,38)", color: "rgb(45,41,38)", textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: 2, "&:hover": { backgroundColor: INK, color: "#fff" } }}
                        >
                          Ask my tutor
                        </Button>
                        <Button
                          onClick={() => setUnderstanding((s) => ({ ...s, [q.id]: "understood" }))}
                          startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
                          sx={{ backgroundColor: "rgb(138,154,138)", color: "#fff", textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: 2, "&:hover": { backgroundColor: "rgb(138,154,138)", filter: "brightness(0.95)" } }}
                        >
                          I understand now
                        </Button>
                      </Stack>
                      {uKey && (
                        <Chip
                          label={understandingLabel(uKey)}
                          size="small"
                          sx={{ mt: 1.5, fontSize: 12, fontWeight: 600, backgroundColor: uMeta.bg, color: uMeta.fg }}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </Card>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
