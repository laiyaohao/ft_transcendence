"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Stack from "@/components/lumina-stack";

const stats = [
  { label: "Total classes", value: "8", context: "Active this term", tone: "#2A2622" },
  { label: "Total students", value: "42", context: "Across all classes", tone: "#2A2622" },
  { label: "Pending review", value: "12", context: "Submitted worksheets", tone: "#B4573F" },
  { label: "Needs attention", value: "5", context: "Students below 55%", tone: "#B4573F" },
  { label: "Reports ready", value: "3", context: "Tutor-approved summaries", tone: "#2A2622" },
];

const teachingFocus = [
  { time: "10:00 AM", title: "Advanced Calculus — Group B", focus: "Integration techniques" },
  { time: "1:30 PM", title: "Creative Writing Workshop", focus: "Descriptive narrative arcs" },
];

const recentActivity = [
  { name: "Emma Thompson", status: "SUBMITTED", colors: { bg: "#F7E3DC", text: "#9E3A24" }, initials: "ET" },
  { name: "Liam Davies", status: "ASSIGNED", colors: { bg: "#F3EBDD", text: "#7A6238" }, initials: "LD" },
  { name: "Sophia Patel", status: "SUBMITTED", colors: { bg: "#F7E3DC", text: "#9E3A24" }, initials: "SP" },
];

const buttonBase = {
  minHeight: 40,
  textTransform: "none",
  fontSize: 13.5,
  fontWeight: 500,
  borderRadius: "10px",
  "&:focus-visible": { outline: "3px solid #E08A72", outlineOffset: 2 },
};

function StatusBadge({ label, bg, text }: { label: string; bg: string; text: string }) {
  return <Chip label={label} size="small" sx={{ height: 24, fontSize: 9.5, letterSpacing: ".05em", fontWeight: 700, bgcolor: bg, color: text, borderRadius: 20, ".MuiChip-label": { px: 1.1 } }} />;
}

export default function Page() {
  const [message, setMessage] = React.useState("");
  const announce = (next: string) => setMessage(next);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F4EF", px: { xs: 2.5, sm: 3.75 }, py: 3.75, color: "#2A2622" }}>
      <Box sx={{ maxWidth: 1420, mx: "auto", animation: "fadeUp .35s ease both" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "flex-end" }} gap={2} sx={{ mb: 3 }}>
          <Box>
            <Typography sx={{ color: "#A09488", fontSize: 10.5, fontWeight: 600, letterSpacing: ".13em", mb: .75 }}>TEACHING OVERVIEW</Typography>
            <Typography component="h1" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: { xs: 32, sm: 38 }, fontWeight: 500, lineHeight: 1.1, letterSpacing: "-.02em", textWrap: "pretty" }}>Your teaching day, clearly organised.</Typography>
          </Box>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Button onClick={() => announce("Worksheet generation is ready to configure.")} startIcon={<AddCircleIcon />} sx={{ ...buttonBase, bgcolor: "#E08A72", color: "#1B1917", px: 2.2, "&:hover": { bgcolor: "#D2795F" } }}>Generate Worksheet</Button>
            <Button onClick={() => announce("Upload flow is ready for a completed worksheet.")} startIcon={<UploadFileIcon />} variant="outlined" sx={{ ...buttonBase, borderColor: "#E4DCD0", color: "#2A2622", px: 2.2, bgcolor: "#FFFDFA", "&:hover": { bgcolor: "#F4EFE6", borderColor: "#DCCFBE" } }}>Upload worksheet</Button>
          </Stack>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(168px, 1fr))", gap: 1.75, mb: 2.75 }}>
          {stats.map((stat) => (
            <Card key={stat.label} component="button" onClick={() => announce(`${stat.label}: ${stat.value}. ${stat.context}.`)} variant="outlined" sx={{ textAlign: "left", cursor: "pointer", p: "16px 18px 18px", minHeight: 138, bgcolor: "#FFFDFA", borderColor: "#EBE4D9", borderRadius: "14px", boxShadow: "none", transition: "border-color .18s, transform .18s", "&:hover": { borderColor: "#DCCFBE", transform: "translateY(-2px)" }, "&:focus-visible": { outline: "3px solid #E08A72", outlineOffset: 2 } }}>
              <Typography sx={{ fontSize: 11.5, color: "#6F675E", fontWeight: 500, mb: 1.25 }}>{stat.label}</Typography>
              <Typography sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 34, lineHeight: 1, fontWeight: 500, color: stat.tone, fontVariantNumeric: "tabular-nums" }}>{stat.value}</Typography>
              <Typography sx={{ fontSize: 11, color: "#A09488", mt: 1 }}>{stat.context}</Typography>
            </Card>
          ))}
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5 }}>
          <Box sx={{ flex: "1 1 460px", minWidth: 0 }}>
            <Card component="section" aria-labelledby="ai-insight-title" sx={{ bgcolor: "#1B1917", color: "#FBF9F5", p: { xs: 2.5, sm: 3.25 }, borderRadius: "14px", boxShadow: "none", mb: 2.75 }}>
              <Stack direction="row" gap={1.25} alignItems="center" sx={{ mb: 1.75 }}>
                <Box aria-hidden="true" sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: "#E08A72", color: "#1B1917", display: "grid", placeItems: "center" }}><AutoAwesomeIcon sx={{ fontSize: 14 }} /></Box>
                <Typography id="ai-insight-title" component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 500 }}>AI Insight</Typography>
              </Stack>
              <Typography sx={{ maxWidth: "52ch", fontSize: 14.5, lineHeight: 1.65, color: "#CFC7BC", mb: 1 }}>Six students may need keyword-focused practice this week.</Typography>
              <Typography sx={{ maxWidth: "52ch", fontSize: 13, lineHeight: 1.6, color: "#8F877D", mb: 2 }}>Recent submissions point to the same missed terminology. Use the review list to decide who needs targeted practice.</Typography>
              <Typography sx={{ fontSize: 10.5, color: "#6E665D", mb: 1.25 }}>SUGGESTION ONLY — NOT SAVED</Typography>
              <Button onClick={() => announce("Student review list selected.")} endIcon={<ArrowForwardIcon />} sx={{ ...buttonBase, minHeight: 34, p: 0, color: "#E08A72", "&:hover": { bgcolor: "transparent", color: "#EC9A82" } }}>Review these students</Button>
            </Card>

            <Typography component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 21, fontWeight: 500, mb: 1.25 }}>Today&apos;s Teaching Focus</Typography>
            <Stack gap={1.5}>
              {teachingFocus.map((item) => (
                <Card key={item.title} component="button" onClick={() => announce(`${item.title} selected.`)} variant="outlined" sx={{ width: "100%", cursor: "pointer", textAlign: "left", p: 2.25, bgcolor: "#FFFDFA", borderColor: "#EBE4D9", borderRadius: "14px", boxShadow: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, transition: "border-color .18s, transform .18s", "&:hover": { borderColor: "#DCCFBE", transform: "translateY(-2px)" }, "&:focus-visible": { outline: "3px solid #E08A72", outlineOffset: 2 } }}>
                  <Box sx={{ minWidth: 0 }}><Chip label={item.time} size="small" sx={{ bgcolor: "#F4EFE6", color: "#6F675E", fontSize: 11.5, fontWeight: 500, height: 25, mb: 1 }} /><Typography sx={{ fontSize: 14.5, fontWeight: 600, color: "#2A2622" }}>{item.title}</Typography><Typography sx={{ fontSize: 12.5, color: "#8B837A", mt: .4 }}>Focus: {item.focus}</Typography></Box>
                  <ArrowForwardIcon aria-hidden="true" sx={{ color: "#B4573F", flex: "0 0 auto" }} />
                </Card>
              ))}
            </Stack>
          </Box>

          <Box sx={{ flex: "0 1 320px", minWidth: 280 }}>
            <Card component="section" aria-labelledby="quick-actions-title" variant="outlined" sx={{ p: 2.5, bgcolor: "#FFFDFA", borderColor: "#EBE4D9", borderRadius: "14px", boxShadow: "none", mb: 2.5 }}>
              <Typography id="quick-actions-title" sx={{ color: "#A09488", fontSize: 10.5, fontWeight: 600, letterSpacing: ".13em", mb: 1.5 }}>QUICK ACTIONS</Typography>
              <Stack gap={1.25}><Button onClick={() => announce("Worksheet generator selected.")} sx={{ ...buttonBase, bgcolor: "#9E3A24", color: "#FBF9F5", justifyContent: "flex-start", px: 2, "&:hover": { bgcolor: "#8A3120" } }}>Generate Worksheet</Button><Button onClick={() => announce("Upload completed worksheet selected.")} variant="outlined" sx={{ ...buttonBase, borderColor: "#E4DCD0", color: "#2A2622", justifyContent: "flex-start", px: 2, "&:hover": { bgcolor: "#F4EFE6" } }}>Upload Completed Worksheet</Button></Stack>
            </Card>
            <Card component="section" aria-labelledby="activity-title" variant="outlined" sx={{ p: 2.5, bgcolor: "#FFFDFA", borderColor: "#EBE4D9", borderRadius: "14px", boxShadow: "none" }}>
              <Typography id="activity-title" sx={{ color: "#A09488", fontSize: 10.5, fontWeight: 600, letterSpacing: ".13em", mb: 1 }}>RECENT ACTIVITY</Typography>
              {recentActivity.map((activity, index) => <Box key={activity.name} sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 1.25, borderBottom: index < recentActivity.length - 1 ? "1px solid #F0EAE0" : 0 }}><Avatar sx={{ width: 28, height: 28, bgcolor: ["#D8B384", "#C6D0C4", "#E3C3B4"][index], color: "#3A332C", fontSize: 10.5, fontWeight: 700 }}>{activity.initials}</Avatar><Typography sx={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activity.name}</Typography><StatusBadge label={activity.status} {...activity.colors} /></Box>)}
            </Card>
          </Box>
        </Box>
        <Box role="status" aria-live="polite" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{message}</Box>
      </Box>
    </Box>
  );
}
