"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { useRouter } from "next/navigation";
import ClassCard from "@/components/class-card";
import { classes, studentsInClass } from "@/data/academic-data";
import { useToast } from "@/providers/toast-provider";

export default function Page() {
  const router = useRouter();
  const { showToast } = useToast();

  const totalStudents = classes.reduce((sum, c) => sum + c.count, 0);

  return (
    <Box
      sx={{
        backgroundColor: "#F7F4EF",
        minHeight: "100vh",
        py: 5,
        px: { xs: 2, sm: 4, md: 6 },
      }}
    >
      <Box sx={{ maxWidth: 1140, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "flex-start", sm: "flex-end" }, justifyContent: "space-between", mb: 3.25 }}
        >
          <Box>
            <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em", mb: 0.75 }}>
              My Classes
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: "#8B837A" }}>
              {classes.length} active classes · {totalStudents} students · Term 4, 2026
            </Typography>
          </Box>
          <Button
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => showToast("Creating new classes is coming soon.")}
            sx={{
              backgroundColor: "#FFFDFA",
              border: "1px solid #E4DCD0",
              borderRadius: "9px",
              color: "#2A2622",
              textTransform: "none",
              fontWeight: 500,
              fontSize: 13,
              px: 2,
              py: 1.1,
              "&:hover": { backgroundColor: "#F4EFE6" },
            }}
          >
            New Class
          </Button>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 2,
          }}
        >
          {classes.map((c) => (
            <ClassCard
              key={c.id}
              schoolClass={c}
              needsAttention={studentsInClass(c.id).filter((s) => s.mastery < 55).length}
              onClick={() => router.push(`/classes/${c.id}`)}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
