"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Link from "next/link";
import { accent, worksheets, skillProfile, mistakeTypeBreakdown } from "@/lib/student-mock-data";

const INK = "rgb(24,21,18)";
const MUTED = "rgb(126,117,111)";
const BORDER = "rgb(232,226,217)";
const CARD_BG = "rgb(250,247,242)";

const LEARNING_PRIORITIES = [
  "Practise writing full explanations using science keywords",
  "Nail the difference between melting and evaporation",
  "Always check units before writing an answer",
];

function bandFor(value: number) {
  if (value >= 75) return { fg: "rgb(138,154,138)", band: "Strong" };
  if (value >= 60) return { fg: "rgb(194,155,98)", band: "Developing" };
  return { fg: "rgb(155,68,48)", band: "Needs work" };
}

export default function Page() {
  const completedCount = worksheets.filter((w) => w.status === "completed").length;
  const maxMistakeCount = Math.max(...mistakeTypeBreakdown.map((m) => m.count));

  return (
    <Box sx={{ backgroundColor: "rgb(253,251,247)", minHeight: "100%", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1120, mx: "auto" }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 0.75 }}>
          <Typography sx={{ fontFamily: "'EB Garamond', serif", fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.8px" }}>
            Science Profile
          </Typography>
          <Chip label="Primary 5" size="small" sx={{ fontSize: 12, fontWeight: 600, backgroundColor: "rgb(232,226,217)", color: "rgb(77,69,64)" }} />
        </Stack>
        <Typography sx={{ fontSize: 15, color: "rgb(77,69,64)", mb: 3.5 }}>
          A snapshot of how you&apos;re doing across the whole subject, built from all your marked worksheets.
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 2.5, height: "100%" }}>
              <Typography sx={{ fontSize: 13, color: MUTED, mb: 1.25 }}>Overall mastery</Typography>
              <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 36, lineHeight: 1, color: INK }}>72%</Typography>
              <Box sx={{ mt: 1.5, height: 7, borderRadius: 9999, backgroundColor: "rgb(236,231,224)", overflow: "hidden" }}>
                <Box sx={{ height: "100%", width: "72%", backgroundColor: accent, borderRadius: 9999 }} />
              </Box>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 2.5, height: "100%" }}>
              <Typography sx={{ fontSize: 13, color: MUTED, mb: 1.25 }}>Average accuracy</Typography>
              <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 36, lineHeight: 1, color: INK }}>76%</Typography>
              <Stack direction="row" spacing={0.625} sx={{ alignItems: "center", mt: 1.5, fontSize: 13, fontWeight: 600, color: "rgb(70,92,70)" }}>
                <TrendingUpIcon sx={{ fontSize: 14 }} />
                <span>+9 this month</span>
              </Stack>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 2.5, height: "100%" }}>
              <Typography sx={{ fontSize: 13, color: MUTED, mb: 1.25 }}>Worksheets completed</Typography>
              <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 36, lineHeight: 1, color: INK }}>{completedCount}</Typography>
              <Typography sx={{ fontSize: 13, color: MUTED, mt: 1.5 }}>this term</Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 2.5, height: "100%" }}>
              <Typography sx={{ fontSize: 13, color: MUTED, mb: 1.25 }}>Performance trend</Typography>
              <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 24, lineHeight: 1.1, color: "rgb(70,92,70)" }}>Improving</Typography>
              <Typography sx={{ fontSize: 13, color: MUTED, mt: 1.5 }}>steady climb since May</Typography>
            </Card>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", border: `1px solid ${BORDER}`, borderRadius: 3, backgroundColor: "rgb(247,243,241)", px: 2.25, py: 1.75, mb: 3.5 }}>
          <InfoOutlinedIcon sx={{ fontSize: 18, color: MUTED, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 14, color: "rgb(77,69,64)" }}>
            Your profile gets more accurate every time you complete a worksheet. Keep going to sharpen the picture!
          </Typography>
        </Stack>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 3, height: "100%" }}>
              <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 22, color: INK, mb: 0.5 }}>Your skills profile</Typography>
              <Typography sx={{ fontSize: 13, color: MUTED, mb: 2.5 }}>Eight skills that make up strong Science work.</Typography>
              <Stack spacing={1.75}>
                {skillProfile.map((sk) => {
                  const { fg, band } = bandFor(sk.value);
                  return (
                    <Box key={sk.label}>
                      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                        <Typography sx={{ fontSize: 14, color: "rgb(45,41,38)" }}>{sk.label}</Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: fg }}>{band}</Typography>
                      </Stack>
                      <Box sx={{ height: 8, borderRadius: 9999, backgroundColor: "rgb(236,231,224)", overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${sk.value}%`, backgroundColor: fg, borderRadius: 9999 }} />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={2.5}>
              <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 2.75 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", color: "rgb(70,92,70)", mb: 1.5 }}>
                  Strongest topics
                </Typography>
                <Stack spacing={1.25}>
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "rgb(45,41,38)" }}>Properties of Materials</span>
                    <strong style={{ color: "rgb(70,92,70)" }}>91%</strong>
                  </Stack>
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "rgb(45,41,38)" }}>The Water Cycle</span>
                    <strong style={{ color: "rgb(70,92,70)" }}>82%</strong>
                  </Stack>
                </Stack>
              </Card>
              <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 2.75 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.4px", textTransform: "uppercase", color: "rgb(140,105,45)", mb: 1.5 }}>
                  Topics to focus on
                </Typography>
                <Stack spacing={1.25}>
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "rgb(45,41,38)" }}>Plant Systems</span>
                    <strong style={{ color: "rgb(155,68,48)" }}>61%</strong>
                  </Stack>
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "rgb(45,41,38)" }}>Forces &amp; Energy</span>
                    <strong style={{ color: "rgb(194,155,98)" }}>64%</strong>
                  </Stack>
                </Stack>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 3, height: "100%" }}>
              <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 22, color: INK, mb: 2.25 }}>Common mistake types</Typography>
              <Stack spacing={1.75}>
                {mistakeTypeBreakdown.map((m) => (
                  <Box key={m.label}>
                    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 0.75, fontSize: 14 }}>
                      <span style={{ color: "rgb(45,41,38)" }}>{m.label}</span>
                      <span style={{ color: MUTED }}>{m.count}×</span>
                    </Stack>
                    <Box sx={{ height: 8, borderRadius: 9999, backgroundColor: "rgb(236,231,224)", overflow: "hidden" }}>
                      <Box sx={{ height: "100%", width: `${Math.round((m.count / maxMistakeCount) * 100)}%`, backgroundColor: "rgb(194,155,98)", borderRadius: 9999 }} />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: "rgb(26,28,30)", color: "rgb(253,251,247)", borderRadius: 3.5, boxShadow: "none", p: 3, height: "100%" }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2 }}>
                <Box sx={{ width: 30, height: 30, borderRadius: "8px", backgroundColor: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AutoAwesomeIcon sx={{ fontSize: 17 }} />
                </Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "rgb(255,180,163)" }}>
                  Your learning priorities
                </Typography>
              </Stack>
              <Stack spacing={1.5}>
                {LEARNING_PRIORITIES.map((p) => (
                  <Stack key={p} direction="row" spacing={1.25} sx={{ alignItems: "flex-start", fontSize: 14, color: "rgb(236,231,230)", lineHeight: 1.45 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: "6px", flexShrink: 0, backgroundColor: "rgba(255,255,255,0.1)", color: "rgb(255,180,163)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ArrowForwardIcon sx={{ fontSize: 12 }} />
                    </Box>
                    <span>{p}</span>
                  </Stack>
                ))}
              </Stack>
              <Button
                component={Link}
                href="/mistakes"
                fullWidth
                sx={{ mt: 2.5, backgroundColor: accent, color: "#fff", textTransform: "none", fontWeight: 600, borderRadius: 2, py: 1.375, "&:hover": { backgroundColor: accent, filter: "brightness(0.96)" } }}
              >
                Start with my mistakes
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
