"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { useParams, useRouter } from "next/navigation";
import InitialsAvatar from "@/components/initials-avatar";
import StatusChip from "@/components/status-chip";
import {
  avatarColorFor,
  classAverageMastery,
  getClassById,
  masteryColor,
  studentAvatarIndex,
  studentsInClass,
  weakestTopic,
} from "@/data/academic-data";

const INSIGHT_TAG_STYLE: Record<string, { bg: string; color: string }> = {
  high: { bg: "#5E2418", color: "#F0BCAB" },
  monitor: { bg: "#33302A", color: "#B5ADA2" },
  watch: { bg: "#2C2A26", color: "#B5ADA2" },
};

export default function ClassViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const schoolClass = getClassById(params.id);

  if (!schoolClass) {
    return (
      <Box sx={{ backgroundColor: "#F7F4EF", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
        <Box sx={{ maxWidth: 1140, mx: "auto" }}>
          <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 24 }}>
            Class not found.
          </Typography>
          <Button onClick={() => router.push("/classes")} sx={{ mt: 2, textTransform: "none" }}>
            Back to My Classes
          </Button>
        </Box>
      </Box>
    );
  }

  const mastery = classAverageMastery(schoolClass);
  const roster = studentsInClass(schoolClass.id);

  return (
    <Box sx={{ backgroundColor: "#F7F4EF", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1140, mx: "auto" }}>
        <ButtonBase
          onClick={() => router.push("/classes")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.875,
            fontSize: 10.5,
            letterSpacing: "0.13em",
            fontWeight: 600,
            color: "#A09488",
            mb: 1.5,
            "&:hover": { color: "#6F675E" },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 15 }} />
          ALL CLASSES
        </ButtonBase>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "flex-start", md: "flex-end" }, justifyContent: "space-between", mb: 3.25 }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: "Playfair Display, serif",
                fontSize: 38,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                mb: 1.25,
              }}
            >
              {schoolClass.name}
            </Typography>
            <Stack direction="row" spacing={2.5} sx={{ flexWrap: "wrap", fontSize: 13, color: "#6F675E" }}>
              <Stack direction="row" spacing={0.875} sx={{ alignItems: "center" }}>
                <PersonOutlineIcon sx={{ fontSize: 16, color: "#A09488" }} />
                Lead Instructor: {schoolClass.tutor}
              </Stack>
              <Stack direction="row" spacing={0.875} sx={{ alignItems: "center" }}>
                <GroupOutlinedIcon sx={{ fontSize: 16, color: "#A09488" }} />
                {schoolClass.count} Students
              </Stack>
              <Stack direction="row" spacing={0.875} sx={{ alignItems: "center" }}>
                <ScheduleOutlinedIcon sx={{ fontSize: 16, color: "#A09488" }} />
                Schedule: {schoolClass.schedule}
              </Stack>
            </Stack>
          </Box>
          <Button
            onClick={() => router.push("/worksheets/generate")}
            sx={{
              backgroundColor: "#E08A72",
              color: "#FFFDFA",
              borderRadius: "10px",
              px: 2.5,
              py: 1.375,
              fontSize: 13.5,
              fontWeight: 500,
              textTransform: "none",
              boxShadow: "0 1px 3px rgba(42,38,34,.12)",
              "&:hover": { backgroundColor: "#D2795F" },
            }}
          >
            Generate Worksheet
          </Button>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ mb: 2.75, alignItems: "stretch" }}>
          <Box
            sx={{
              flex: "1 1 480px",
              backgroundColor: "#FFFDFA",
              border: "1px solid #EBE4D9",
              borderRadius: "14px",
              p: 3,
            }}
          >
            <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", mb: 0.75 }}>
              <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 500 }}>
                Class Mastery Overview
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: "#A09488" }}>Avg {mastery}%</Typography>
            </Stack>
            <Typography sx={{ fontSize: 12.5, color: "#8B837A", mb: 3.25 }}>
              Average topic mastery across {schoolClass.count} students, latest assessments
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-end", height: 190, pb: 0.25 }}>
              {schoolClass.topics.map((t) => (
                <Box
                  key={t.name}
                  sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.125, height: "100%", justifyContent: "flex-end" }}
                >
                  <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#6F675E" }}>{t.mastery}%</Typography>
                  <Box
                    sx={{
                      width: "100%",
                      height: `${Math.round(t.mastery * 1.55)}px`,
                      backgroundColor: masteryColor(t.mastery),
                      borderRadius: "5px 5px 2px 2px",
                    }}
                  />
                </Box>
              ))}
            </Stack>
            <Stack direction="row" spacing={1.5} sx={{ borderTop: "1px solid #F0EAE0", pt: 1.375, mt: 1.375 }}>
              {schoolClass.topics.map((t) => (
                <Typography key={t.name} sx={{ flex: 1, textAlign: "center", fontSize: 10.5, color: "#8B837A", lineHeight: 1.35 }}>
                  {t.short}
                </Typography>
              ))}
            </Stack>
          </Box>

          <Stack sx={{ flex: "0 1 320px", gap: 1.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", fontSize: 10.5, letterSpacing: "0.13em", fontWeight: 600, color: "#A09488" }}>
              <AutoAwesomeIcon sx={{ fontSize: 15, color: "#E08A72" }} />
              AI INSIGHT
            </Stack>
            {schoolClass.insights.length === 0 && (
              <Box sx={{ backgroundColor: "#FFFDFA", border: "1px dashed #DCCFBE", borderRadius: "12px", p: 2.25 }}>
                <Typography sx={{ fontSize: 12.5, color: "#8B837A" }}>
                  No insights yet — check back after the next assessment.
                </Typography>
              </Box>
            )}
            {schoolClass.insights.map((insight) => (
              <Box key={insight.title} sx={{ backgroundColor: "#1B1917", borderRadius: "12px", p: 2.25 }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 1.125 }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#FBF9F5" }}>{insight.title}</Typography>
                  <Chip
                    label={insight.tag}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: 9.5,
                      letterSpacing: 0.5,
                      backgroundColor: INSIGHT_TAG_STYLE[insight.tone].bg,
                      color: INSIGHT_TAG_STYLE[insight.tone].color,
                      flex: "0 0 auto",
                    }}
                  />
                </Stack>
                <Typography sx={{ fontSize: 12.5, lineHeight: 1.6, color: "#A8A096", mb: 1.25 }}>{insight.body}</Typography>
                <Typography sx={{ fontSize: 11, color: "#7A7268", borderTop: "1px solid #2C2925", pt: 1.125 }}>
                  {insight.why}
                </Typography>
              </Box>
            ))}
            <ButtonBase
              onClick={() => router.push("/worksheets/generate")}
              sx={{
                backgroundColor: "#FFFDFA",
                border: "1px dashed #DCCFBE",
                borderRadius: "12px",
                p: 1.625,
                fontSize: 13,
                fontWeight: 500,
                color: "#B4573F",
                justifyContent: "center",
                "&:hover": { backgroundColor: "#F9F4EC" },
              }}
            >
              Build practice for these gaps
            </ButtonBase>
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ alignItems: "stretch" }}>
          <Box sx={{ flex: "1 1 480px", backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", overflow: "hidden" }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 3, pt: 2.5, pb: 2 }}>
              <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 500 }}>
                Student Progress
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: "#A09488" }}>Tap a student for their profile</Typography>
            </Stack>
            {roster.length === 0 ? (
              <Typography sx={{ fontSize: 12.5, color: "#8B837A", px: 3, pb: 2.5 }}>
                No students on the roster yet.
              </Typography>
            ) : (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 130px 150px 130px",
                    gap: 1.25,
                    px: 3,
                    pb: 1.125,
                    fontSize: 10.5,
                    letterSpacing: "0.09em",
                    fontWeight: 600,
                    color: "#A09488",
                    borderBottom: "1px solid #EFE8DE",
                  }}
                >
                  <Box>STUDENT</Box>
                  <Box>STATUS</Box>
                  <Box>LAST ASSESSMENT</Box>
                  <Box>WEAK TOPIC</Box>
                </Box>
                {roster.map((student) => {
                  const weak = weakestTopic(student.topics);
                  return (
                    <ButtonBase
                      key={student.id}
                      onClick={() => router.push(`/students/${student.id}`)}
                      sx={{
                        width: "100%",
                        justifyContent: "flex-start",
                        display: "grid",
                        gridTemplateColumns: "1fr 130px 150px 130px",
                        gap: 1.25,
                        alignItems: "center",
                        px: 3,
                        py: 1.625,
                        borderBottom: "1px solid #F3EDE4",
                        "&:hover": { backgroundColor: "#FBF7F1" },
                      }}
                    >
                      <Stack direction="row" spacing={1.375} sx={{ alignItems: "center", minWidth: 0 }}>
                        <InitialsAvatar
                          initials={student.initials}
                          bg={avatarColorFor(studentAvatarIndex(student))}
                          size={30}
                          fontSize={11}
                        />
                        <Typography sx={{ fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {student.name}
                        </Typography>
                      </Stack>
                      <StatusChip status={student.status} />
                      <Typography sx={{ fontSize: 13, color: "#4A443D" }}>
                        <b style={{ fontWeight: 600 }}>{student.mastery}%</b>{" "}
                        <span style={{ color: "#A09488", fontSize: 11.5 }}>{weak.short}</span>
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "#8B837A" }}>{weak.short}</Typography>
                    </ButtonBase>
                  );
                })}
                <ButtonBase
                  onClick={() => router.push(`/students?class=${schoolClass.id}`)}
                  sx={{
                    width: "100%",
                    justifyContent: "center",
                    py: 1.75,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: "#B4573F",
                    "&:hover": { backgroundColor: "#FBF7F1" },
                  }}
                >
                  View all {schoolClass.count} students
                </ButtonBase>
              </>
            )}
          </Box>

          <Stack sx={{ flex: "0 1 320px", gap: 1.5 }}>
            <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
              <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 500 }}>
                Recent Worksheets
              </Typography>
              <ButtonBase
                onClick={() => router.push("/worksheets")}
                sx={{ fontSize: 12, fontWeight: 500, color: "#B4573F" }}
              >
                View all
              </ButtonBase>
            </Stack>
            {schoolClass.worksheets.length === 0 && (
              <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "12px", p: 2.25 }}>
                <Typography sx={{ fontSize: 12.5, color: "#8B837A" }}>No worksheets assigned yet.</Typography>
              </Box>
            )}
            {schoolClass.worksheets.map((w) => (
              <Box
                key={w.title}
                sx={{
                  backgroundColor: "#FFFDFA",
                  border: "1px solid #EBE4D9",
                  borderRadius: "12px",
                  p: "14px 16px",
                  borderLeft: `3px solid ${w.state === "graded" ? "#93A896" : "#E08A72"}`,
                }}
              >
                <Typography sx={{ fontSize: 13.5, fontWeight: 500, mb: 0.875, lineHeight: 1.35 }}>{w.title}</Typography>
                <Stack direction="row" spacing={1.75} sx={{ alignItems: "center", fontSize: 11.5, color: "#8B837A" }}>
                  <span>{w.date}</span>
                  <Stack direction="row" spacing={0.625} sx={{ alignItems: "center", color: w.state === "graded" ? "#5C7A63" : "#B4573F" }}>
                    {w.status}
                  </Stack>
                </Stack>
              </Box>
            ))}
            <ButtonBase
              onClick={() => router.push("/worksheets/generate")}
              sx={{
                backgroundColor: "#FFFDFA",
                border: "1px dashed #DCCFBE",
                borderRadius: "12px",
                p: "22px 16px",
                textAlign: "center",
                flexDirection: "column",
                "&:hover": { backgroundColor: "#F9F4EC" },
              }}
            >
              <Box sx={{ display: "grid", placeItems: "center", width: 32, height: 32, borderRadius: "50%", backgroundColor: "#F4EFE6", mb: 1.25 }}>
                <AddCircleOutlineIcon sx={{ fontSize: 17, color: "#B4573F" }} />
              </Box>
              <Typography sx={{ fontSize: 13.5, fontWeight: 500, mb: 0.625 }}>Create New Material</Typography>
              <Typography sx={{ fontSize: 11.5, color: "#8B837A", lineHeight: 1.5 }}>
                Generate worksheets targeted at this class&apos;s weak areas.
              </Typography>
            </ButtonBase>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
