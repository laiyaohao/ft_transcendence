"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MasteryBar from "./mastery-bar";
import { SchoolClass, classAverageMastery } from "@/data/academic-data";

export default function ClassCard({
  schoolClass,
  needsAttention,
  onClick,
}: {
  schoolClass: SchoolClass;
  needsAttention: number;
  onClick: () => void;
}) {
  const mastery = classAverageMastery(schoolClass);
  const isMaths = schoolClass.subject === "MATHS";

  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        textAlign: "left",
        backgroundColor: "#FFFDFA",
        border: "1px solid #EBE4D9",
        borderRadius: "14px",
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.75,
        alignItems: "stretch",
        transition: "border-color .18s, transform .18s",
        "&:hover": { borderColor: "#DCCFBE", transform: "translateY(-2px)" },
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography
            sx={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 500, mb: 0.75 }}
          >
            {schoolClass.name}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#8B837A" }}>
            {schoolClass.schedule} · {schoolClass.count} students
          </Typography>
        </Box>
        <Chip
          label={schoolClass.subject}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: 10.5,
            letterSpacing: 0.5,
            backgroundColor: isMaths ? "#E6EAEF" : "#EAEDE7",
            color: isMaths ? "#4E5C6E" : "#4A6B50",
            flex: "0 0 auto",
          }}
        />
      </Stack>

      <Box>
        <Stack direction="row" sx={{ justifyContent: "space-between", fontSize: 11.5, color: "#6F675E", mb: 0.75 }}>
          <span>Class mastery</span>
          <span style={{ fontWeight: 600, color: "#2A2622" }}>{mastery}%</span>
        </Stack>
        <MasteryBar value={mastery} />
      </Box>

      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", pt: 0.25 }}>
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: "center",
            fontSize: 12,
            color: needsAttention > 2 ? "#B4573F" : "#8B837A",
          }}
        >
          <WarningAmberIcon sx={{ fontSize: 14 }} />
          <span>{needsAttention} need attention</span>
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", fontSize: 12.5, fontWeight: 500, color: "#B4573F" }}>
          <span>Open class</span>
          <ArrowForwardIcon sx={{ fontSize: 14 }} />
        </Stack>
      </Stack>
    </ButtonBase>
  );
}
