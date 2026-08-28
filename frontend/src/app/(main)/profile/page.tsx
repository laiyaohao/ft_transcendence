"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import Link from "next/link";
import { accent, student, initialsOf } from "@/lib/student-mock-data";

const INK = "rgb(24,21,18)";
const MUTED = "rgb(126,117,111)";
const BORDER = "rgb(232,226,217)";
const CARD_BG = "rgb(250,247,242)";

function DetailRow({ label, value, last, mono }: { label: string; value: string; last?: boolean; mono?: boolean }) {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: "center", justifyContent: "space-between", px: 2.75, py: 2, borderBottom: last ? "none" : `1px solid ${BORDER}` }}
    >
      <Typography sx={{ fontSize: 14, color: MUTED }}>{label}</Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 500, color: INK, fontFamily: mono ? "'Roboto Mono', monospace" : undefined }}>
        {value}
      </Typography>
    </Stack>
  );
}

export default function Page() {
  return (
    <Box sx={{ backgroundColor: "rgb(253,251,247)", minHeight: "100%", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 760, mx: "auto" }}>
        <Typography sx={{ fontFamily: "'EB Garamond', serif", fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.8px", color: INK, mb: 3.5 }}>
          My Profile
        </Typography>

        <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", p: 3.5, display: "flex", alignItems: "center", gap: 2.5, mb: 3 }}>
          <Box sx={{ width: 72, height: 72, borderRadius: "50%", flexShrink: 0, backgroundColor: "rgb(221,217,216)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 600, color: "rgb(77,69,64)", fontFamily: "'EB Garamond', serif" }}>
            {initialsOf(student.name)}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 28, lineHeight: 1.1, color: INK }}>{student.name}</Typography>
            <Typography sx={{ fontSize: 14, color: "rgb(77,69,64)", mt: 0.25 }}>Primary 5 · Lumina Academy</Typography>
          </Box>
          <Button variant="outlined" sx={{ borderColor: "rgb(45,41,38)", color: "rgb(45,41,38)", textTransform: "none", fontWeight: 600, borderRadius: 2, px: 2, "&:hover": { backgroundColor: INK, color: "#fff" } }}>
            Edit
          </Button>
        </Card>

        <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", overflow: "hidden", mb: 3 }}>
          <Typography sx={{ px: 2.75, py: 2, borderBottom: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "rgb(77,69,64)" }}>
            Account details
          </Typography>
          <DetailRow label="Full name" value={student.name} />
          <DetailRow label="Level / grade" value="Primary 5" />
          <DetailRow label="Student ID" value="LUM-2026-0148" mono last />
        </Card>

        <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", overflow: "hidden", mb: 3 }}>
          <Typography sx={{ px: 2.75, py: 2, borderBottom: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "rgb(77,69,64)" }}>
            Enrolled subjects
          </Typography>
          <Stack
            component={Link}
            href="/subject-profile"
            direction="row"
            sx={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2.75,
              py: 2,
              borderBottom: `1px solid ${BORDER}`,
              textDecoration: "none",
              color: "inherit",
              "&:hover": { backgroundColor: "rgb(253,248,247)" },
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 36, height: 36, borderRadius: "9px", backgroundColor: "rgb(233,238,233)", color: "rgb(70,92,70)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SchoolOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: INK }}>Science</Typography>
                <Typography sx={{ fontSize: 13, color: MUTED }}>Primary 5 · Prof. E. Vance</Typography>
              </Box>
            </Stack>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "rgb(155,68,48)" }}>View profile →</Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", px: 2.75, py: 2, opacity: 0.6 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: "9px", backgroundColor: "rgb(236,231,224)", color: MUTED, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CalculateOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: INK }}>Mathematics</Typography>
              <Typography sx={{ fontSize: 13, color: MUTED }}>Enrolling next term</Typography>
            </Box>
          </Stack>
        </Card>

        <Card variant="outlined" sx={{ borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 3.5, boxShadow: "none", overflow: "hidden" }}>
          <Typography sx={{ px: 2.75, py: 2, borderBottom: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "rgb(77,69,64)" }}>
            Password &amp; security
          </Typography>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 2.75, py: 2, borderBottom: `1px solid ${BORDER}` }}>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: INK }}>Password</Typography>
              <Typography sx={{ fontSize: 13, color: MUTED, mt: 0.25 }}>Last changed 2 months ago</Typography>
            </Box>
            <Button variant="outlined" sx={{ borderColor: "rgb(207,196,189)", color: "rgb(77,69,64)", textTransform: "none", fontWeight: 600, fontSize: 13, borderRadius: 2, "&:hover": { backgroundColor: "rgb(247,243,241)" } }}>
              Change
            </Button>
          </Stack>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 2.75, py: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: INK }}>Notifications</Typography>
              <Typography sx={{ fontSize: 13, color: MUTED, mt: 0.25 }}>Get told when marking &amp; tutor replies are ready</Typography>
            </Box>
            <Box sx={{ width: 42, height: 24, borderRadius: 9999, backgroundColor: accent, position: "relative", flexShrink: 0 }}>
              <Box sx={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: "50%", backgroundColor: "#fff" }} />
            </Box>
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}
