"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import { useParams, useRouter } from "next/navigation";
import InitialsAvatar from "@/components/initials-avatar";
import StatusChip from "@/components/status-chip";
import MasteryBar from "@/components/mastery-bar";
import {
  avatarColorFor,
  getClassById,
  getStudentById,
  masteryColor,
  studentAvatarIndex,
} from "@/data/academic-data";
export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const student = getStudentById(params.id);

  if (!student) {
    return (
      <Box sx={{ backgroundColor: "#F7F4EF", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
        <Box sx={{ maxWidth: 1140, mx: "auto" }}>
          <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 24 }}>
            Student not found.
          </Typography>
          <Button onClick={() => router.push("/students")} sx={{ mt: 2, textTransform: "none" }}>
            Back to Students
          </Button>
        </Box>
      </Box>
    );
  }

  const schoolClass = getClassById(student.classId);
  const weak = student.topics.slice().sort((a, b) => a.pct - b.pct)[0];
  const improvementIsNegative = student.improvement.startsWith("-") || student.improvement.startsWith("−");

  return (
    <Box sx={{ backgroundColor: "#F7F4EF", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1140, mx: "auto" }}>
        {schoolClass && (
          <ButtonBase
            onClick={() => router.push(`/classes/${schoolClass.id}`)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.875,
              fontSize: 10.5,
              letterSpacing: "0.13em",
              fontWeight: 600,
              color: "#A09488",
              mb: 1.75,
              "&:hover": { color: "#6F675E" },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 15 }} />
            {schoolClass.name.toUpperCase()}
          </ButtonBase>
        )}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2.5}
          sx={{ alignItems: { xs: "flex-start", sm: "flex-start" }, justifyContent: "space-between", mb: 3 }}
        >
          <Stack direction="row" spacing={2.25} sx={{ alignItems: "center" }}>
            <InitialsAvatar
              initials={student.initials}
              bg={avatarColorFor(studentAvatarIndex(student))}
              size={66}
              fontSize={24}
            />
            <Box>
              <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em", mb: 1.125, lineHeight: 1 }}>
                {student.name}
              </Typography>
              <Stack direction="row" spacing={1.125} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                {schoolClass && (
                  <Typography sx={{ fontSize: 11.5, color: "#6F675E", backgroundColor: "#F4EFE6", px: 1.25, py: 0.5, borderRadius: "20px" }}>
                    {schoolClass.name}
                  </Typography>
                )}
                <StatusChip status={student.status} />
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.125} sx={{ flexWrap: "wrap" }}>
            <Button
              onClick={() => router.push("/worksheets/generate")}
              sx={{
                backgroundColor: "#9E3A24",
                color: "#FBF9F5",
                borderRadius: "9px",
                px: 2.125,
                py: 1.375,
                fontSize: 13,
                fontWeight: 500,
                textTransform: "none",
                "&:hover": { backgroundColor: "#8A3120" },
              }}
            >
              Generate Worksheet
            </Button>
            <Button
              onClick={() => router.push("/upload")}
              sx={{
                backgroundColor: "#FFFDFA",
                border: "1px solid #E4DCD0",
                color: "#2A2622",
                borderRadius: "9px",
                px: 2.125,
                py: 1.375,
                fontSize: 13,
                fontWeight: 500,
                textTransform: "none",
                "&:hover": { backgroundColor: "#F4EFE6" },
              }}
            >
              Upload Completed Worksheet
            </Button>
            <Button
              onClick={() => router.push("/reports")}
              sx={{
                backgroundColor: "#FFFDFA",
                border: "1px solid #E4DCD0",
                color: "#2A2622",
                borderRadius: "9px",
                px: 2.125,
                py: 1.375,
                fontSize: 13,
                fontWeight: 500,
                textTransform: "none",
                "&:hover": { backgroundColor: "#F4EFE6" },
              }}
            >
              Create Report
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 1.75, mb: 2.75 }}>
          <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "12px", p: "17px 19px" }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: "#6F675E" }}>Mastery Score</Typography>
              <TrendingUpIcon sx={{ fontSize: 15, color: "#BCB1A3" }} />
            </Stack>
            <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 33, fontWeight: 500, lineHeight: 1, mb: 1.5 }}>
              {student.mastery}%
            </Typography>
            <MasteryBar value={student.mastery} color="#B4573F" />
          </Box>

          <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "12px", p: "17px 19px" }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: "#6F675E" }}>Recent Improvement</Typography>
              <TrendingUpIcon sx={{ fontSize: 15, color: "#7E9A83" }} />
            </Stack>
            <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 33, fontWeight: 500, lineHeight: 1, color: improvementIsNegative ? "#B4573F" : "#5C7A63" }}>
              {student.improvement}
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#A09488", mt: 1.5 }}>vs last month</Typography>
          </Box>

          <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "12px", p: "17px 19px" }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: "#6F675E" }}>Current Weak Area</Typography>
              <ErrorOutlineIcon sx={{ fontSize: 15, color: "#C68A78" }} />
            </Stack>
            <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 21, fontWeight: 500, lineHeight: 1.15 }}>
              {weak.name}
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#B4573F", mt: 1.375, fontWeight: 500 }}>Requires focus</Typography>
          </Box>

          <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "12px", p: "17px 19px" }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: "#6F675E" }}>Worksheets Completed</Typography>
              <DescriptionOutlinedIcon sx={{ fontSize: 15, color: "#BCB1A3" }} />
            </Stack>
            <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 33, fontWeight: 500, lineHeight: 1 }}>
              {student.completed}
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#A09488", mt: 1.5 }}>This term</Typography>
          </Box>
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ mb: 2.75, alignItems: "stretch" }}>
          <Box sx={{ flex: "1 1 460px", backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", p: "22px 24px" }}>
            <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 500, mb: 2.5 }}>
              Learning Profile
            </Typography>
            <Stack direction="row" spacing={3.25} sx={{ flexWrap: "wrap" }}>
              <Box sx={{ flex: "1 1 200px" }}>
                <Stack direction="row" spacing={0.875} sx={{ alignItems: "center", fontSize: 10.5, letterSpacing: "0.11em", fontWeight: 600, color: "#5C7A63", mb: 1.75 }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />
                  STRENGTHS
                </Stack>
                <Stack spacing={1.5}>
                  {student.strengths.map((item) => (
                    <Typography key={item} sx={{ fontSize: 13, lineHeight: 1.6, color: "#4A443D", pl: 1.75, borderLeft: "2px solid #DCE4DC" }}>
                      {item}
                    </Typography>
                  ))}
                </Stack>
              </Box>
              <Box sx={{ flex: "1 1 200px" }}>
                <Stack direction="row" spacing={0.875} sx={{ alignItems: "center", fontSize: 10.5, letterSpacing: "0.11em", fontWeight: 600, color: "#B4573F", mb: 1.75 }}>
                  <ErrorOutlineIcon sx={{ fontSize: 14 }} />
                  AREAS FOR GROWTH
                </Stack>
                <Stack spacing={1.5}>
                  {student.growth.map((item) => (
                    <Typography key={item} sx={{ fontSize: 13, lineHeight: 1.6, color: "#4A443D", pl: 1.75, borderLeft: "2px solid #EDD9D2" }}>
                      {item}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ flex: "0 1 320px", backgroundColor: "#1B1917", borderRadius: "14px", p: 2.75, display: "flex", flexDirection: "column" }}>
            <Stack direction="row" spacing={1.125} sx={{ alignItems: "center", mb: 1.75 }}>
              <Box sx={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: "#E08A72", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                <AutoAwesomeIcon sx={{ fontSize: 11, color: "#1B1917" }} />
              </Box>
              <Typography sx={{ fontSize: 10.5, letterSpacing: "0.13em", fontWeight: 600, color: "#A09488" }}>AI INSIGHT</Typography>
            </Stack>
            <Typography sx={{ fontSize: 13.5, lineHeight: 1.7, color: "#CFC7BC", mb: 2.5, flex: 1 }}>{student.insight}</Typography>
            <Typography sx={{ fontSize: 10.5, letterSpacing: "0.11em", fontWeight: 600, color: "#7A7268", mb: 1.375 }}>
              SUGGESTED ACTIONS
            </Typography>
            <Stack spacing={1}>
              {[
                { label: "Generate Keyword Drill", href: "/worksheets/generate" },
                { label: "Review Past OEQ Errors", href: "/marking" },
              ].map(({ label, href }) => (
                <ButtonBase
                  key={label}
                  onClick={() => router.push(href)}
                  sx={{
                    justifyContent: "space-between",
                    width: "100%",
                    backgroundColor: "#282522",
                    border: "1px solid #35312C",
                    borderRadius: "9px",
                    px: 1.75,
                    py: 1.375,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: "#E8E2D9",
                    "&:hover": { backgroundColor: "#332F2A" },
                  }}
                >
                  {label}
                  <ArrowForwardIcon sx={{ fontSize: 14, color: "#E08A72" }} />
                </ButtonBase>
              ))}
            </Stack>
          </Box>
        </Stack>

        <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", p: "22px 24px" }}>
          <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", mb: 0.75 }}>
            <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 500 }}>
              Topic Mastery Map
            </Typography>
            {schoolClass && (
              <Typography sx={{ fontSize: 11.5, color: "#A09488" }}>
                {schoolClass.subject === "MATHS" ? "P5 Maths syllabus" : "P5 Science syllabus"}
              </Typography>
            )}
          </Stack>
          <Typography sx={{ fontSize: 12.5, color: "#8B837A", mb: 2.5 }}>
            Updated from tutor-approved marking
          </Typography>
          <Stack spacing={1.375}>
            {student.topics.map((topic) => {
              const focus = topic.pct < 55;
              return (
                <Stack
                  key={topic.name}
                  direction="row"
                  spacing={2}
                  sx={{
                    alignItems: "center",
                    border: `1px solid ${focus ? "#F0DCD4" : "#EFE8DE"}`,
                    backgroundColor: focus ? "#FDF6F3" : "#FFFDFA",
                    borderRadius: "10px",
                    p: "13px 16px",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: focus ? "#9E3A24" : "#4A443D",
                      width: 44,
                      flex: "0 0 auto",
                    }}
                  >
                    {topic.pct}%
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1.125} sx={{ alignItems: "center", mb: 0.875 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{topic.name}</Typography>
                      {focus && (
                        <Typography
                          sx={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            px: 1,
                            py: 0.375,
                            borderRadius: "20px",
                            backgroundColor: "#F1D9D1",
                            color: "#9E3A24",
                          }}
                        >
                          FOCUS AREA
                        </Typography>
                      )}
                    </Stack>
                    <MasteryBar value={topic.pct} color={masteryColor(topic.pct)} height={4} />
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
