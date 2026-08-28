"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";
import { accent, student, worksheets } from "@/lib/student-mock-data";

const INK = "rgb(24,21,18)";
const MUTED = "rgb(126,117,111)";
const BORDER = "rgb(232,226,217)";
const CARD_BG = "rgb(250,247,242)";

function QuickActionCard({
  href,
  icon,
  iconBg,
  iconFg,
  title,
  subtitle,
  dark,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  iconFg: string;
  title: string;
  subtitle: string;
  dark?: boolean;
}) {
  return (
    <Card
      component={Link}
      href={href}
      variant="outlined"
      sx={{
        p: 2.75,
        borderRadius: 3.5,
        textDecoration: "none",
        borderColor: dark ? "transparent" : BORDER,
        backgroundColor: dark ? "rgb(26,28,30)" : CARD_BG,
        color: dark ? "rgb(253,251,247)" : INK,
        boxShadow: "none",
        display: "flex",
        flexDirection: "column",
        gap: 1.75,
        height: "100%",
        "&:hover": { borderColor: dark ? "transparent" : "rgb(207,196,189)" },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "10px",
          backgroundColor: iconBg,
          color: iconFg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{title}</Typography>
        <Typography sx={{ fontSize: 13, color: dark ? "rgb(205,197,192)" : MUTED, mt: 0.5 }}>
          {subtitle}
        </Typography>
      </Box>
    </Card>
  );
}

export default function Page() {
  const latestWorksheet = worksheets.find((w) => w.status === "incomplete") ?? worksheets[0];

  return (
    <Box
      sx={{
        backgroundColor: "rgb(253,251,247)",
        minHeight: "100%",
        py: 5,
        px: { xs: 2, sm: 4, md: 6 },
      }}
    >
      <Box sx={{ maxWidth: 1120, mx: "auto" }}>
        <Typography sx={{ fontSize: 14, color: MUTED, mb: 1 }}>Tuesday, 23 July</Typography>
        <Typography
          sx={{
            fontFamily: "'EB Garamond', serif",
            fontWeight: 400,
            fontSize: { xs: 32, sm: 44 },
            lineHeight: 1.08,
            letterSpacing: "-1px",
            color: INK,
            mb: 5,
          }}
        >
          Welcome back, {student.name}.
        </Typography>

        <Grid container spacing={2.5} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <QuickActionCard
              href="/upload"
              dark
              icon={<UploadFileIcon fontSize="small" />}
              iconBg={accent}
              iconFg="#fff"
              title="Upload Completed Worksheet"
              subtitle="Submit for instant AI marking"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <QuickActionCard
              href="/mistakes"
              icon={<WarningAmberOutlinedIcon fontSize="small" />}
              iconBg="rgb(248,232,226)"
              iconFg="rgb(155,68,48)"
              title="Review My Mistakes"
              subtitle="3 to review from last worksheet"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <QuickActionCard
              href="/progress"
              icon={<TrendingUpOutlinedIcon fontSize="small" />}
              iconBg="rgb(233,238,233)"
              iconFg="rgb(70,92,70)"
              title="View My Progress"
              subtitle="Track mastery across topics"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.7px", textTransform: "uppercase", color: "rgb(77,69,64)", mb: 1.75 }}>
              Your Latest Worksheet
            </Typography>
            <Card variant="outlined" sx={{ borderRadius: 3.5, borderColor: BORDER, backgroundColor: CARD_BG, boxShadow: "none", overflow: "hidden" }}>
              <Box sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
                  <Chip
                    label="To do"
                    size="small"
                    sx={{ fontWeight: 600, fontSize: 11, backgroundColor: "rgb(248,240,225)", color: "rgb(140,105,45)" }}
                  />
                  <Typography sx={{ fontSize: 13, color: MUTED }}>Assigned {latestWorksheet.assigned}</Typography>
                </Stack>
                <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 26, lineHeight: 1.15, color: INK }}>
                  {latestWorksheet.title}
                </Typography>
                <Stack direction="row" spacing={2.5} sx={{ mt: 1.5, fontSize: 14, color: "rgb(77,69,64)" }}>
                  <span><span style={{ color: MUTED }}>Subject</span>&nbsp; {student.subject}</span>
                  <span><span style={{ color: MUTED }}>Topic</span>&nbsp; {latestWorksheet.topic}</span>
                </Stack>
              </Box>
              <Divider sx={{ borderColor: BORDER }} />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ p: 2 }}>
                <Button
                  component={Link}
                  href="/upload"
                  fullWidth
                  variant="contained"
                  startIcon={<UploadFileIcon fontSize="small" />}
                  sx={{ backgroundColor: accent, textTransform: "none", fontWeight: 600, borderRadius: 2, boxShadow: "none", "&:hover": { backgroundColor: accent, boxShadow: "none", filter: "brightness(0.96)" } }}
                >
                  Upload Answers
                </Button>
                <Button
                  component={Link}
                  href="/worksheets"
                  variant="outlined"
                  sx={{ color: "rgb(45,41,38)", borderColor: "rgb(45,41,38)", textTransform: "none", fontWeight: 600, borderRadius: 2, whiteSpace: "nowrap", flexShrink: 0, width: { xs: "100%", sm: "auto" }, "&:hover": { backgroundColor: INK, color: "#fff", borderColor: INK } }}
                >
                  All worksheets
                </Button>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.7px", textTransform: "uppercase", color: "rgb(77,69,64)", mb: 1.75 }}>
              Recent Performance
            </Typography>
            <Card variant="outlined" sx={{ p: 3, borderRadius: 3.5, borderColor: BORDER, backgroundColor: CARD_BG, boxShadow: "none" }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "flex-end", pb: 2.25, borderBottom: `1px solid ${BORDER}` }}>
                <Box>
                  <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 48, lineHeight: 1, color: INK }}>82%</Typography>
                  <Typography sx={{ fontSize: 13, color: MUTED, mt: 0.5 }}>The Water Cycle &amp; Evaporation</Typography>
                </Box>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", fontSize: 13, fontWeight: 600, color: "rgb(70,92,70)", pb: 1 }}>
                  <TrendingUpOutlinedIcon sx={{ fontSize: 14 }} />
                  <span>+7</span>
                </Stack>
              </Stack>
              <Grid container spacing={1.75} sx={{ mt: 0.5 }}>
                <Grid size={6}>
                  <Typography sx={{ fontSize: 22, fontWeight: 600, color: "rgb(70,92,70)" }}>
                    9<Typography component="span" sx={{ fontSize: 14, color: MUTED, fontWeight: 400 }}>/12</Typography>
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: MUTED }}>Correct answers</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography sx={{ fontSize: 22, fontWeight: 600, color: "rgb(155,68,48)" }}>3</Typography>
                  <Typography sx={{ fontSize: 12, color: MUTED }}>To revise</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: INK }}>Materials</Typography>
                  <Typography sx={{ fontSize: 12, color: MUTED }}>Strongest topic</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: INK }}>Plant Systems</Typography>
                  <Typography sx={{ fontSize: 12, color: MUTED }}>Focus area</Typography>
                </Grid>
              </Grid>
              <Button
                component={Link}
                href="/worksheets/ws1"
                fullWidth
                endIcon={<ArrowForwardIcon fontSize="small" />}
                sx={{ mt: 2.25, border: `1px solid ${BORDER}`, borderRadius: 2, py: 1.1, color: "rgb(155,68,48)", fontWeight: 600, textTransform: "none", "&:hover": { backgroundColor: "rgb(253,248,247)" } }}
              >
                View full results
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
