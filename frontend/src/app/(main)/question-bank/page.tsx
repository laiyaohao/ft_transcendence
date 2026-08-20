"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FilterChip from "@/components/filter-chip";
import { useRouter } from "next/navigation";
import { scienceQuestions, mathsQuestions, DIFFICULTY_STYLE, BankQuestion } from "@/data/worksheets-data";
import { useToast } from "@/providers/toast-provider";

const ALL_QUESTIONS: BankQuestion[] = [...scienceQuestions, ...mathsQuestions];
const TOPIC_FILTERS = ["All topics", "Adaptation", "Energy", "Water Cycle", "Ratio", "OEQ only"];

export default function QuestionBankPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [filter, setFilter] = React.useState("All topics");

  const rows = ALL_QUESTIONS.filter((q) => {
    if (filter === "All topics") return true;
    if (filter === "OEQ only") return q.type === "OEQ";
    return q.topic.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <Box sx={{ backgroundColor: "#F7F4EF", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1140, mx: "auto" }}>
        <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em", mb: 1 }}>
          Question Bank
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: "#8B837A", mb: 3 }}>
          {ALL_QUESTIONS.length} questions · tagged by topic, type and difficulty
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 2.25 }}>
          {TOPIC_FILTERS.map((label) => (
            <FilterChip key={label} label={label} active={filter === label} onClick={() => setFilter(label)} />
          ))}
        </Stack>

        <Stack spacing={1.375}>
          {rows.length === 0 && (
            <Typography sx={{ fontSize: 12.5, color: "#8B837A" }}>No questions match this filter.</Typography>
          )}
          {rows.map((q, i) => {
            const diffStyle = DIFFICULTY_STYLE[q.difficulty];
            return (
              <Stack
                key={`${q.text}-${i}`}
                direction="row"
                spacing={2}
                sx={{
                  backgroundColor: "#FFFDFA",
                  border: "1px solid #EBE4D9",
                  borderRadius: "12px",
                  p: "16px 18px",
                  alignItems: "flex-start",
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.875} sx={{ flexWrap: "wrap", gap: 0.875, mb: 1.125 }}>
                    <Typography
                      component="span"
                      sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, px: 1.125, py: 0.5, borderRadius: "20px", backgroundColor: "#F0EAE0", color: "#6F675E" }}
                    >
                      {q.type}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, px: 1.125, py: 0.5, borderRadius: "20px", backgroundColor: diffStyle.bg, color: diffStyle.color }}
                    >
                      {q.difficulty}
                    </Typography>
                    <Typography component="span" sx={{ fontSize: 11, color: "#A09488" }}>
                      {q.topic} · {q.marks} mark{q.marks > 1 ? "s" : ""}
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 13.5, lineHeight: 1.6 }}>{q.text}</Typography>
                </Box>
                <ButtonBase
                  onClick={() => {
                    showToast("Added to the worksheet draft — continue in the generator.");
                    router.push("/worksheets/generate");
                  }}
                  sx={{
                    backgroundColor: "#FBF9F5",
                    border: "1px solid #E4DCD0",
                    borderRadius: "8px",
                    px: 1.75,
                    py: 1.125,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#2A2622",
                    flex: "0 0 auto",
                    "&:hover": { backgroundColor: "#F4EFE6" },
                  }}
                >
                  Add
                </ButtonBase>
              </Stack>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
