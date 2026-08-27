"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ToggleSwitch from "@/components/toggle-switch";

type SettingsState = {
  requireApproval: boolean;
  autoMark: boolean;
  keywordAlerts: boolean;
  parentReports: boolean;
};

const DEFAULT_SETTINGS: SettingsState = {
  requireApproval: true,
  autoMark: true,
  keywordAlerts: true,
  parentReports: false,
};

const ROWS: { key: keyof SettingsState; label: string; detail: string }[] = [
  {
    key: "requireApproval",
    label: "Require tutor approval before profile updates",
    detail: "AI marking is never written to a student profile until you approve it. Strongly recommended.",
  },
  {
    key: "autoMark",
    label: "Run AI marking automatically after OCR",
    detail: "Saves a step. You still review every suggested score before it counts.",
  },
  {
    key: "keywordAlerts",
    label: "Alert me on repeated keyword errors",
    detail: "Flags a student when the same mark-scheme keyword is missed three times.",
  },
  {
    key: "parentReports",
    label: "Auto-draft parent reports at term end",
    detail: "Drafts only. Nothing is sent without your review.",
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<SettingsState>(DEFAULT_SETTINGS);

  return (
    <Box sx={{ backgroundColor: "#F7F4EF", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em", mb: 1 }}>
          Settings
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: "#8B837A", mb: 3 }}>How AI behaves in your account</Typography>

        <Stack spacing={1.375}>
          {ROWS.map((row) => (
            <ButtonBase
              key={row.key}
              onClick={() => setSettings((prev) => ({ ...prev, [row.key]: !prev[row.key] }))}
              sx={{
                width: "100%",
                justifyContent: "flex-start",
                textAlign: "left",
                backgroundColor: "#FFFDFA",
                border: "1px solid #EBE4D9",
                borderRadius: "12px",
                px: 2.5,
                py: 2.25,
                gap: 2.25,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 0.625 }}>{row.label}</Typography>
                <Typography sx={{ fontSize: 12.5, color: "#8B837A", lineHeight: 1.55 }}>{row.detail}</Typography>
              </Box>
              <ToggleSwitch on={settings[row.key]} />
            </ButtonBase>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
