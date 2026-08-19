"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import OutlinedFlagIcon from "@mui/icons-material/OutlinedFlag";
import WaterDropOutlinedIcon from "@mui/icons-material/WaterDropOutlined";
import FlashOnOutlinedIcon from "@mui/icons-material/FlashOnOutlined";
import ParkOutlinedIcon from "@mui/icons-material/ParkOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DescriptionIcon from "@mui/icons-material/Description";

// ---- Static content driving the profile. Swap these for real data later. ----

const student = {
  name: "Bella Tan",
  grade: "P5",
  subject: "Science",
  status: "Needs Practice",
};

const stats = [
  {
    label: "Mastery Score",
    value: "68%",
    icon: TrendingUpIcon,
    progress: 68,
  },
  {
    label: "Recent Improvement",
    value: "+12%",
    caption: "vs last month",
    icon: TrendingUpIcon,
  },
  {
    label: "Current Weak Area",
    value: "Living Things",
    caption: "Requires focus",
    icon: HelpOutlineIcon,
  },
  {
    label: "Worksheets Completed",
    value: "24",
    caption: "This term",
    icon: DescriptionOutlinedIcon,
  },
];

const strengths = [
  "Strong grasp of conceptual facts, especially in Physical Sciences.",
  "Excellent retention of visual information and diagrams.",
  "Consistently completes assigned homework on time.",
];

const areasForGrowth = [
  "Struggles to articulate answers using precise scientific vocabulary.",
  "Needs practice linking multiple concepts in open-ended questions.",
];

const topicMastery = [
  {
    topic: "Cycles in Matter & Water",
    value: 75,
    icon: WaterDropOutlinedIcon,
    focus: false,
  },
  {
    topic: "Energy Forms & Uses",
    value: 72,
    icon: FlashOnOutlinedIcon,
    focus: false,
  },
  {
    topic: "Living Things & Environment",
    value: 45,
    icon: ParkOutlinedIcon,
    focus: true,
  },
];

const aiInsight =
  '"Bella understands the core concept well, but frequently loses marks because she needs help expressing her answers using standard exam keywords, particularly in Open-Ended Questions (OEQs)."';

const suggestedActions = ["Generate Keyword Drill", "Review Past OEQ Errors"];

// ---- Small presentational helpers ----

function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  progress,
}: {
  label: string;
  value: string;
  caption?: string;
  icon: React.ElementType;
  progress?: number;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        borderColor: "rgba(0,0,0,0.08)",
        backgroundColor: "#fff",
        boxShadow: "none",
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
          {label}
        </Typography>
        <Icon fontSize="small" sx={{ color: "text.secondary" }} />
      </Stack>
      <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: "Georgia, serif", color: "#1a1a1a" }}>
        {value}
      </Typography>
      {caption && (
        <Typography
          variant="body2"
          sx={{ color: label === "Current Weak Area" ? "#b3261e" : "text.secondary", mt: 0.5 }}
        >
          {caption}
        </Typography>
      )}
      {typeof progress === "number" && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mt: 1.5,
            height: 6,
            borderRadius: 3,
            backgroundColor: "rgba(0,0,0,0.08)",
            "& .MuiLinearProgress-bar": { backgroundColor: "#b3261e", borderRadius: 3 },
          }}
        />
      )}
    </Card>
  );
}

function TopicMasteryRow({
  topic,
  value,
  icon: Icon,
  focus,
}: {
  topic: string;
  value: number;
  icon: React.ElementType;
  focus: boolean;
}) {
  const barColor = focus ? "#b3261e" : "#1a1a1a";
  return (
    <Card
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        borderColor: focus ? "rgba(179,38,30,0.3)" : "rgba(0,0,0,0.08)",
        backgroundColor: "#fff",
        boxShadow: "none",
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography sx={{ fontWeight: 700, minWidth: 40 }}>{value}%</Typography>
          <Typography sx={{ fontWeight: 500 }}>{topic}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {focus && (
            <Chip
              label="Focus Area"
              size="small"
              sx={{ fontWeight: 600, backgroundColor: "#f8ded6", color: "#b3261e" }}
            />
          )}
          <Icon fontSize="small" sx={{ color: "text.secondary" }} />
        </Stack>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: "rgba(0,0,0,0.08)",
          "& .MuiLinearProgress-bar": { backgroundColor: barColor, borderRadius: 3 },
        }}
      />
    </Card>
  );
}

export default function Page() {
  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <Box
      sx={{
        backgroundColor: "#f7f5f0",
        minHeight: "100vh",
        py: 5,
        px: { xs: 2, sm: 4, md: 6 },
      }}
    >
      <Box sx={{ maxWidth: 1140, mx: "auto" }}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            mb: 4,
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: "#d9714e", fontFamily: "Georgia, serif", fontSize: 24 }}>
              {initials}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontFamily: "Georgia, serif", fontWeight: 700, color: "#1a1a1a" }}>
                {student.name}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip
                  label={`${student.grade} · ${student.subject}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 500, borderColor: "rgba(0,0,0,0.15)" }}
                />
                <Chip
                  label={`● ${student.status}`}
                  size="small"
                  sx={{ fontWeight: 600, backgroundColor: "#f8ded6", color: "#b3261e" }}
                />
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
            <Button
              variant="contained"
              startIcon={<DescriptionIcon />}
              sx={{
                backgroundColor: "#d9714e",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: "none",
                "&:hover": { backgroundColor: "#c25f3f", boxShadow: "none" },
              }}
            >
              Generate Worksheet
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              sx={{
                color: "#1a1a1a",
                borderColor: "rgba(0,0,0,0.2)",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                "&:hover": { borderColor: "rgba(0,0,0,0.4)", backgroundColor: "transparent" },
              }}
            >
              Upload Completed Worksheet
            </Button>
            <Button
              variant="outlined"
              sx={{
                color: "#1a1a1a",
                borderColor: "rgba(0,0,0,0.2)",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                "&:hover": { borderColor: "rgba(0,0,0,0.4)", backgroundColor: "transparent" },
              }}
            >
              Create Parent Report
            </Button>
          </Stack>
        </Stack>

        {/* Stat cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {stats.map((s) => (
            <Grid size={{ xs: 6, md: 3 }} key={s.label}>
              <StatCard {...s} />
            </Grid>
          ))}
        </Grid>

        {/* Main content */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Learning Profile */}
            <Card
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 3,
                borderColor: "rgba(0,0,0,0.08)",
                backgroundColor: "#fff",
                boxShadow: "none",
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: "Georgia, serif", fontWeight: 700, mb: 2 }}>
                Learning Profile
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
                    <CheckCircleOutlineIcon fontSize="small" sx={{ color: "#3f7a34" }} />
                    <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                      Strengths
                    </Typography>
                  </Stack>
                  <Stack spacing={1.5}>
                    {strengths.map((item) => (
                      <Typography key={item} variant="body2" sx={{ color: "text.secondary" }}>
                        • {item}
                      </Typography>
                    ))}
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
                    <OutlinedFlagIcon fontSize="small" sx={{ color: "#b3261e" }} />
                    <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                      Areas for Growth
                    </Typography>
                  </Stack>
                  <Stack spacing={1.5}>
                    {areasForGrowth.map((item) => (
                      <Typography key={item} variant="body2" sx={{ color: "text.secondary" }}>
                        • {item}
                      </Typography>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </Card>

            {/* Topic Mastery Map */}
            <Typography variant="h5" sx={{ fontFamily: "Georgia, serif", fontWeight: 700, mb: 1.5 }}>
              Topic Mastery Map
            </Typography>
            <Divider sx={{ mb: 2, borderColor: "rgba(0,0,0,0.1)" }} />
            <Stack spacing={2}>
              {topicMastery.map((t) => (
                <TopicMasteryRow key={t.topic} {...t} />
              ))}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            {/* AI Insight */}
            <Card
              sx={{
                backgroundColor: "#1a1a1a",
                color: "#fff",
                borderRadius: 3,
                p: 3,
                boxShadow: "none",
              }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", mb: 2 }}>
                <Avatar sx={{ bgcolor: "#d9714e", width: 36, height: 36 }}>
                  <AutoAwesomeIcon fontSize="small" />
                </Avatar>
                <Typography variant="h6" sx={{ fontFamily: "Georgia, serif", fontWeight: 700 }}>
                  AI Insight
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mb: 3, fontStyle: "italic" }}>
                {aiInsight}
              </Typography>

              <Typography
                variant="overline"
                sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: 1 }}
              >
                Suggested Actions
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                {suggestedActions.map((action) => (
                  <Button
                    key={action}
                    fullWidth
                    endIcon={<ArrowForwardIcon fontSize="small" />}
                    sx={{
                      justifyContent: "space-between",
                      color: "#fff",
                      backgroundColor: "rgba(255,255,255,0.08)",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      py: 1.2,
                      px: 2,
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" },
                    }}
                  >
                    {action}
                  </Button>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

