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
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

// ---- Static content driving the dashboard. Swap these for real data later. ----

const stats = [
  { label: "Total Classes", value: "8", tone: "default" as const },
  { label: "Total Students", value: "42", tone: "default" as const },
  { label: "Pending Review", value: "12", tone: "warning" as const },
  { label: "Needs Attention", value: "5", tone: "danger" as const },
  { label: "Reports Ready", value: "3", tone: "default" as const },
];

const teachingFocus = [
  {
    time: "10:00 AM",
    title: "Advanced Calculus - Group B",
    focus: "Integration techniques",
  },
  {
    time: "1:30 PM",
    title: "Creative Writing Workshop",
    focus: "Descriptive narrative arcs",
  },
];

const recentActivity: {
  name: string;
  status: "Submitted" | "Reviewing";
}[] = [
  { name: "Emma Thompson", status: "Submitted" },
  { name: "Liam Davies", status: "Reviewing" },
  { name: "Sophia Patel", status: "Submitted" },
];

// ---- Small presentational helpers ----

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "warning" | "danger";
}) {
  const color =
    tone === "danger" ? "#b3261e" : tone === "warning" ? "#c2622a" : "#1a1a1a";

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        borderColor: "rgba(0,0,0,0.08)",
        backgroundColor: "#f7f5f0",
        boxShadow: "none",
        height: "100%",
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", fontWeight: 500, mb: 1 }}
      >
        {label}
      </Typography>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, color, fontFamily: "Georgia, serif" }}
      >
        {value}
      </Typography>
    </Card>
  );
}

function StatusChip({ status }: { status: "Submitted" | "Reviewing" }) {
  const isSubmitted = status === "Submitted";
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        fontWeight: 600,
        backgroundColor: isSubmitted ? "#e4f0e0" : "#fbe9c9",
        color: isSubmitted ? "#3f7a34" : "#9a6a12",
      }}
    />
  );
}

export default function Page() {
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
        {/* Heading */}
        <Typography
          variant="h3"
          sx={{
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            mb: 4,
            color: "#1a1a1a",
          }}
        >
          Your teaching day, clearly organised.
        </Typography>

        {/* Stat cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {stats.map((s) => (
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={s.label}>
              <StatCard label={s.label} value={s.value} tone={s.tone} />
            </Grid>
          ))}
        </Grid>

        {/* Main content: AI insight + focus list | quick actions + activity */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            {/* AI Insight */}
            <Card
              sx={{
                backgroundColor: "#1a1a1a",
                color: "#fff",
                borderRadius: 3,
                p: 3,
                mb: 4,
                boxShadow: "none",
              }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
                <Avatar sx={{ bgcolor: "#d9714e", width: 36, height: 36 }}>
                  <AutoAwesomeIcon fontSize="small" />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontFamily: "Georgia, serif", fontWeight: 700, mb: 1 }}
                  >
                    AI Insight
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mb: 2 }}>
                    AI has found 6 students who may need keyword-focused practice
                    this week.
                  </Typography>
                  <Button
                    endIcon={<ArrowForwardIcon fontSize="small" />}
                    sx={{
                      color: "#e08a5f",
                      fontWeight: 600,
                      textTransform: "none",
                      p: 0,
                      "&:hover": { backgroundColor: "transparent", opacity: 0.8 },
                    }}
                  >
                    Review Students
                  </Button>
                </Box>
              </Stack>
            </Card>

            {/* Today's Teaching Focus */}
            <Typography
              variant="h5"
              sx={{ fontFamily: "Georgia, serif", fontWeight: 700, mb: 1.5 }}
            >
              Today&apos;s Teaching Focus
            </Typography>
            <Divider sx={{ mb: 2, borderColor: "rgba(0,0,0,0.1)" }} />

            <Stack spacing={2}>
              {teachingFocus.map((item) => (
                <Card
                  key={item.title}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    borderColor: "rgba(0,0,0,0.08)",
                    backgroundColor: "#fff",
                    boxShadow: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <Box>
                    <Chip
                      label={item.time}
                      size="small"
                      sx={{
                        mb: 1,
                        backgroundColor: "#eee",
                        fontWeight: 500,
                      }}
                    />
                    <Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Focus: {item.focus}
                    </Typography>
                  </Box>
                  <IconButton size="small">
                    <ChevronRightIcon />
                  </IconButton>
                </Card>
              ))}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            {/* Quick Actions */}
            <Card
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 3,
                borderColor: "rgba(0,0,0,0.08)",
                backgroundColor: "#fff",
                boxShadow: "none",
                mb: 3,
              }}
            >
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1 }}
              >
                Quick Actions
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddCircleIcon />}
                  sx={{
                    backgroundColor: "#d9714e",
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                    py: 1.2,
                    boxShadow: "none",
                    "&:hover": { backgroundColor: "#c25f3f", boxShadow: "none" },
                  }}
                >
                  Generate Worksheet
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  sx={{
                    color: "#1a1a1a",
                    borderColor: "rgba(0,0,0,0.2)",
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                    py: 1.2,
                    "&:hover": { borderColor: "rgba(0,0,0,0.4)", backgroundColor: "transparent" },
                  }}
                >
                  Upload Completed Worksheet
                </Button>
              </Stack>
            </Card>

            {/* Recent Activity */}
            <Card
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 3,
                borderColor: "rgba(0,0,0,0.08)",
                backgroundColor: "#fff",
                boxShadow: "none",
              }}
            >
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1 }}
              >
                Recent Activity
              </Typography>
              <Stack sx={{ mt: 1 }}>
                {recentActivity.map((activity, idx) => (
                  <Box key={activity.name}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 1.5,
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        {activity.name}
                      </Typography>
                      <StatusChip status={activity.status} />
                    </Box>
                    {idx < recentActivity.length - 1 && (
                      <Divider sx={{ borderColor: "rgba(0,0,0,0.06)" }} />
                    )}
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}