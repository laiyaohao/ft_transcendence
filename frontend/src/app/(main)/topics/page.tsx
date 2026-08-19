"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Link from "next/link";
import { topics, masteryMeta } from "@/lib/student-mock-data";

const INK = "rgb(24,21,18)";
const MUTED = "rgb(126,117,111)";
const BORDER = "rgb(232,226,217)";
const CARD_BG = "rgb(250,247,242)";

export default function Page() {
  return (
    <Box sx={{ backgroundColor: "rgb(253,251,247)", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1120, mx: "auto" }}>
        <Typography sx={{ fontFamily: "'EB Garamond', serif", fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.8px", color: INK, mb: 0.75 }}>
          Learning Journey
        </Typography>
        <Typography sx={{ fontSize: 15, color: "rgb(77,69,64)", mb: 3.5 }}>
          Your P5 Science topics. Open one to see your skills, mistakes and what to practise next.
        </Typography>

        <Grid container spacing={2.25}>
          {topics.map((t) => {
            const meta = masteryMeta[t.status];
            const recAction = t.locked ? "Locked" : t.status === "not_started" ? "Start topic" : t.status === "mastered" ? "Keep it sharp" : "Practise this";

            const cardSx = {
              borderColor: BORDER,
              backgroundColor: CARD_BG,
              borderRadius: 3.5,
              boxShadow: "none",
              p: 2.75,
              display: "flex",
              flexDirection: "column" as const,
              height: "100%",
              opacity: t.locked ? 0.6 : 1,
              cursor: t.locked ? "default" : "pointer",
              textDecoration: "none",
              color: "inherit",
              "&:hover": t.locked ? {} : { borderColor: "rgb(207,196,189)" },
            };

            const cardContent = (
              <>
                <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 1 }}>
                  <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 22, lineHeight: 1.2, color: INK }}>{t.name}</Typography>
                  <Chip
                    icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: meta.dot, ml: "9px !important" }} />}
                    label={meta.label}
                    size="small"
                    sx={{ whiteSpace: "nowrap", fontSize: 11, fontWeight: 600, backgroundColor: meta.bg, color: meta.fg }}
                  />
                </Stack>
                <Typography sx={{ fontSize: 14, color: "rgb(77,69,64)", lineHeight: 1.45, mb: 2 }}>{t.desc}</Typography>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
                  <Box sx={{ flexGrow: 1, height: 7, borderRadius: 9999, backgroundColor: "rgb(236,231,224)", overflow: "hidden" }}>
                    <Box sx={{ height: "100%", width: `${t.completion}%`, backgroundColor: meta.bar, borderRadius: 9999 }} />
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: INK }}>{t.completion}%</Typography>
                </Stack>
                <Stack direction="row" spacing={2.5} sx={{ mb: 2, fontSize: 13 }}>
                  <span><span style={{ color: MUTED }}>Latest</span> <strong style={{ color: INK }}>{t.latestScore != null ? `${t.latestScore}%` : "—"}</strong></span>
                  <span><span style={{ color: MUTED }}>Attempts</span> <strong style={{ color: INK }}>{t.attempts}</strong></span>
                  <span style={{ color: MUTED }}>{t.related} {t.related === 1 ? "worksheet" : "worksheets"}</span>
                </Stack>
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mt: "auto", pt: 1.75, borderTop: `1px solid ${BORDER}` }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: "rgb(155,68,48)" }}>{recAction}</Typography>
                  <ChevronRightIcon sx={{ fontSize: 16, color: MUTED }} />
                </Stack>
              </>
            );

            return (
              <Grid size={{ xs: 12, sm: 6 }} key={t.id}>
                {t.locked ? (
                  <Card variant="outlined" sx={cardSx}>{cardContent}</Card>
                ) : (
                  <Card component={Link} href={`/topics/${t.id}`} variant="outlined" sx={cardSx}>{cardContent}</Card>
                )}
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
}
