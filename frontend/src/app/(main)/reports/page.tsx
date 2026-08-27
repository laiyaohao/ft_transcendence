"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { useRouter } from "next/navigation";
import InitialsAvatar from "@/components/initials-avatar";
import {
  classes,
  students,
  avatarColorFor,
  studentAvatarIndex,
  classAverageMastery,
  masteryColor,
  weakestTopic,
} from "@/data/academic-data";
import { useToast } from "@/providers/toast-provider";

type ReportTab = "class" | "student";

const LEGEND = [
  { label: "Secure (72%+)", color: "#93A896" },
  { label: "Developing", color: "#D8B384" },
  { label: "Needs focus (<55%)", color: "#B4573F" },
];

export default function ReportsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [tab, setTab] = React.useState<ReportTab>("class");
  const classesWithInsights = classes.filter((c) => c.insights.length > 0);
  const [classId, setClassId] = React.useState(classesWithInsights[0]?.id ?? classes[0].id);
  const schoolClass = classes.find((c) => c.id === classId) ?? classes[0];

  const mastery = classAverageMastery(schoolClass);
  const attentionCount = students.filter((s) => s.classId === schoolClass.id && s.mastery < 55).length;
  const marked = 47 - 12;

  const weaknesses = schoolClass.insights.length
    ? schoolClass.insights.map((insight, i) => ({
        name: insight.title,
        share: `${[60, 41, 33][i] ?? 25}% of class`,
        detail: insight.body,
      }))
    : [{ name: "Topic gap", share: "", detail: "No insight data for this class yet." }];

  return (
    <Box sx={{ backgroundColor: "#F7F4EF", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1140, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "flex-start", sm: "flex-end" }, justifyContent: "space-between", mb: 2.75 }}
        >
          <Box>
            <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em", mb: 1 }}>
              Reports
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: "#8B837A" }}>
              Built from tutor-approved marking only. Term 4, 2026.
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.875} sx={{ backgroundColor: "#F4EFE6", borderRadius: "9px", p: 0.5 }}>
            {(["class", "student"] as ReportTab[]).map((id) => {
              const active = tab === id;
              return (
                <ButtonBase
                  key={id}
                  onClick={() => setTab(id)}
                  sx={{
                    backgroundColor: active ? "#FFFDFA" : "transparent",
                    color: active ? "#2A2622" : "#8B837A",
                    borderRadius: "7px",
                    px: 2.25,
                    py: 1.125,
                    fontSize: 12.5,
                    fontWeight: 500,
                    boxShadow: active ? "0 1px 2px rgba(42,38,34,.08)" : "none",
                  }}
                >
                  {id === "class" ? "Class level" : "Student level"}
                </ButtonBase>
              );
            })}
          </Stack>
        </Stack>

        {tab === "class" && (
          <>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 2.5 }}>
              {classesWithInsights.map((c) => (
                <ButtonBase
                  key={c.id}
                  onClick={() => setClassId(c.id)}
                  sx={{
                    backgroundColor: c.id === classId ? "#F4E4DE" : "#FBF9F5",
                    border: `1px solid ${c.id === classId ? "#E0B9AC" : "#E4DCD0"}`,
                    color: c.id === classId ? "#9E3A24" : "#5A544C",
                    borderRadius: "20px",
                    px: 1.75,
                    py: 0.875,
                    fontSize: 12.5,
                    fontWeight: 500,
                  }}
                >
                  {c.name}
                </ButtonBase>
              ))}
            </Stack>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1.75, mb: 2.5 }}>
              {[
                { label: "Average Performance", value: `${mastery}%`, sub: "+4% vs Term 3", subColor: "#5C7A63" },
                { label: "Students Needing Attention", value: String(attentionCount), sub: "Mastery below 55%", subColor: "#A09488", valueColor: "#B4573F" },
                { label: "Worksheets Marked", value: String(marked), sub: "This term", subColor: "#A09488" },
                { label: "Submission Rate", value: "96%", sub: "15 of 15 last worksheet", subColor: "#A09488" },
              ].map((m) => (
                <Box key={m.label} sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "12px", p: "18px 20px" }}>
                  <Typography sx={{ fontSize: 11.5, color: "#6F675E", mb: 1.375 }}>{m.label}</Typography>
                  <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 31, fontWeight: 500, lineHeight: 1, color: m.valueColor ?? "#2A2622" }}>
                    {m.value}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: m.subColor, mt: 1.25 }}>{m.sub}</Typography>
                </Box>
              ))}
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ alignItems: "stretch" }}>
              <Box sx={{ flex: "1 1 460px", backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", p: "22px 24px" }}>
                <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 500, mb: 2.5 }}>
                  Topic Mastery — {schoolClass.name}
                </Typography>
                <Stack spacing={1.625}>
                  {schoolClass.topics.map((t) => (
                    <Stack key={t.name} direction="row" spacing={1.75} sx={{ alignItems: "center" }}>
                      <Typography sx={{ fontSize: 12.5, width: 96, flex: "0 0 auto", color: "#4A443D" }}>{t.name}</Typography>
                      <Box sx={{ flex: 1, height: 8, backgroundColor: "#F0EAE0", borderRadius: "20px", overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${t.mastery}%`, backgroundColor: masteryColor(t.mastery), borderRadius: "20px" }} />
                      </Box>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 600, width: 34, textAlign: "right", flex: "0 0 auto" }}>{t.mastery}%</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Stack direction="row" spacing={2.5} sx={{ borderTop: "1px solid #F0EAE0", mt: 2.5, pt: 2, flexWrap: "wrap" }}>
                  {LEGEND.map((l) => (
                    <Stack key={l.label} direction="row" spacing={0.875} sx={{ alignItems: "center", fontSize: 11.5, color: "#8B837A" }}>
                      <Box sx={{ width: 9, height: 9, borderRadius: "2px", backgroundColor: l.color }} />
                      {l.label}
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Stack sx={{ flex: "0 1 320px", gap: 1.75 }}>
                <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", p: "20px 22px" }}>
                  <Typography sx={{ fontSize: 10.5, letterSpacing: "0.13em", fontWeight: 600, color: "#A09488", mb: 1.875 }}>
                    COMMON WEAKNESSES
                  </Typography>
                  <Stack spacing={1.625}>
                    {weaknesses.map((w) => (
                      <Box key={w.name}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", fontSize: 12.5, mb: 0.625 }}>
                          <Typography sx={{ fontWeight: 500, fontSize: 12.5 }}>{w.name}</Typography>
                          {w.share && <Typography sx={{ color: "#B4573F", fontWeight: 600, fontSize: 12.5 }}>{w.share}</Typography>}
                        </Stack>
                        <Typography sx={{ fontSize: 11.5, color: "#8B837A", lineHeight: 1.55 }}>{w.detail}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
                <ButtonBase
                  onClick={() => showToast(`${schoolClass.name} report exported as PDF.`)}
                  sx={{
                    backgroundColor: "#9E3A24",
                    color: "#FBF9F5",
                    borderRadius: "10px",
                    py: 1.625,
                    fontSize: 13.5,
                    fontWeight: 500,
                    gap: 1.125,
                    "&:hover": { backgroundColor: "#8A3120" },
                  }}
                >
                  <FileDownloadOutlinedIcon sx={{ fontSize: 17 }} />
                  Export class report
                </ButtonBase>
              </Stack>
            </Stack>
          </>
        )}

        {tab === "student" && (
          <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", overflow: "hidden" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 90px 110px 130px 90px",
                gap: 1.5,
                px: 3,
                pt: 2,
                pb: 1.5,
                fontSize: 10.5,
                letterSpacing: "0.09em",
                fontWeight: 600,
                color: "#A09488",
                borderBottom: "1px solid #EFE8DE",
              }}
            >
              <Box>STUDENT</Box>
              <Box>MASTERY</Box>
              <Box>CHANGE</Box>
              <Box>FOCUS AREA</Box>
              <Box>SHEETS</Box>
            </Box>
            {students.map((student) => {
              const schoolClassName = classes.find((c) => c.id === student.classId)?.name ?? "";
              const focus = weakestTopic(student.topics);
              const negative = student.improvement.startsWith("-") || student.improvement.startsWith("−");
              return (
                <Box
                  key={student.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/students/${student.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/students/${student.id}`);
                    }
                  }}
                  sx={{
                    width: "100%",
                    cursor: "pointer",
                    display: "grid",
                    gridTemplateColumns: "1fr 90px 110px 130px 90px",
                    gap: 1.5,
                    alignItems: "center",
                    px: 3,
                    py: 1.75,
                    borderBottom: "1px solid #F3EDE4",
                    "&:hover": { backgroundColor: "#FBF7F1" },
                  }}
                >
                  <Stack direction="row" spacing={1.375} sx={{ alignItems: "center", minWidth: 0 }}>
                    <InitialsAvatar initials={student.initials} bg={avatarColorFor(studentAvatarIndex(student))} size={29} fontSize={10.5} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {student.name}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: "#A09488" }}>{schoolClassName}</Typography>
                    </Box>
                  </Stack>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: student.mastery < 55 ? "#B4573F" : "#2A2622" }}>
                    {student.mastery}%
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: negative ? "#B4573F" : "#5C7A63" }}>{student.improvement}</Typography>
                  <Typography sx={{ fontSize: 12, color: "#8B837A" }}>{focus.short}</Typography>
                  <Typography sx={{ fontSize: 12.5, color: "#6F675E" }}>{student.completed}</Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
