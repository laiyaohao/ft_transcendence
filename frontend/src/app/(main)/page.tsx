"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useRouter } from "next/navigation";
import InitialsAvatar from "@/components/initials-avatar";
import {
  classes,
  students,
  getStudentById,
  avatarColorFor,
  studentAvatarIndex,
} from "@/data/academic-data";

const PENDING_REVIEW = 12;
const REPORTS_READY = 3;

const TODAY_FOCUS = [
  { time: "4:00 PM", classId: "c1", focus: "Adaptation — structure to survival advantage" },
  { time: "5:30 PM", classId: "c2", focus: "Rate & speed word problems" },
  { time: "7:00 PM", classId: "c4", focus: "Booklet B answering technique" },
];

const RECENT_ACTIVITY = [
  { studentId: "s1", detail: "Adaptation Mini Test", tag: "AI marked", tagBg: "#F7E3DC", tagColor: "#9E3A24" },
  { studentId: "s2", detail: "Adaptation Mini Test", tag: "Approved", tagBg: "#E4EDE4", tagColor: "#4A6B50" },
  { studentId: "s3", detail: "Water Cycle Drill", tag: "Submitted", tagBg: "#F0EAE0", tagColor: "#6F675E" },
  { studentId: "s7", detail: "Rate & Speed Sums", tag: "AI marked", tagBg: "#F7E3DC", tagColor: "#9E3A24" },
  { studentId: "s5", detail: "Plant Transport Revision", tag: "Approved", tagBg: "#E4EDE4", tagColor: "#4A6B50" },
];

export default function Page() {
  const router = useRouter();

  const totalStudents = classes.reduce((sum, c) => sum + c.count, 0);
  const needsAttention = students.filter((s) => s.mastery < 55).length;

  const metrics = [
    { label: "Total Classes", value: classes.length, sub: "Term 4, 2026", color: "#2A2622", onClick: () => router.push("/classes") },
    { label: "Total Students", value: totalStudents, sub: `Across ${classes.length} classes`, color: "#2A2622", onClick: () => router.push("/classes") },
    { label: "Pending Review", value: PENDING_REVIEW, sub: "AI marking awaiting you", color: "#B4573F", onClick: () => router.push("/marking") },
    { label: "Needs Attention", value: needsAttention, sub: "Mastery below 55%", color: "#B4573F", onClick: () => router.push("/students") },
    { label: "Reports Ready", value: REPORTS_READY, sub: "Ready to send", color: "#2A2622", onClick: () => router.push("/reports") },
  ];

  return (
    <Box sx={{ backgroundColor: "#F7F4EF", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1140, mx: "auto" }}>
        <Typography sx={{ fontSize: 11, letterSpacing: "0.13em", color: "#A09488", fontWeight: 500, mb: 1 }}>
          MONDAY, 12 OCTOBER
        </Typography>
        <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 38, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.1, mb: 3 }}>
          Your teaching day, clearly organised.
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(168px, 1fr))", gap: 1.75, mb: 2.5 }}>
          {metrics.map((m) => (
            <ButtonBase
              key={m.label}
              onClick={m.onClick}
              sx={{
                textAlign: "left",
                flexDirection: "column",
                alignItems: "flex-start",
                backgroundColor: "#FFFDFA",
                border: "1px solid #EBE4D9",
                borderRadius: "12px",
                px: 2.25,
                pt: 2,
                pb: 2.25,
                transition: "border-color .18s, transform .18s",
                "&:hover": { borderColor: "#DCCFBE", transform: "translateY(-2px)" },
              }}
            >
              <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: "#6F675E", mb: 1.25 }}>{m.label}</Typography>
              <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 34, fontWeight: 500, lineHeight: 1, color: m.color }}>
                {m.value}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "#A09488", mt: 1 }}>{m.sub}</Typography>
            </ButtonBase>
          ))}
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ mb: 3.25, alignItems: "stretch" }}>
          <Box sx={{ flex: "1 1 460px", backgroundColor: "#1B1917", borderRadius: "14px", p: "24px 26px", color: "#E8E2D9" }}>
            <Stack direction="row" spacing={1.125} sx={{ alignItems: "center", mb: 1.75 }}>
              <Box sx={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: "#E08A72", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                <AutoAwesomeIcon sx={{ fontSize: 11, color: "#1B1917" }} />
              </Box>
              <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 19, fontWeight: 500, color: "#FBF9F5" }}>
                AI Insight
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: 14.5, lineHeight: 1.65, color: "#CFC7BC", maxWidth: "52ch", mb: 1 }}>
              Six students across Primary 5 Science may need keyword-focused practice this week. All six lose marks on open-ended questions while scoring well on MCQ.
            </Typography>
            <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: "#8F877D", maxWidth: "52ch", mb: 2.25 }}>
              Adaptation and Energy Conversion are the two topics driving it. A 12-question keyword drill would cover both.
            </Typography>
            <ButtonBase
              onClick={() => router.push("/classes/c1")}
              sx={{ color: "#E08A72", fontSize: 13.5, fontWeight: 500, gap: 0.875, "&:hover": { gap: 1.375 } }}
            >
              Review these students
              <ArrowForwardIcon sx={{ fontSize: 15 }} />
            </ButtonBase>
          </Box>

          <Box sx={{ flex: "0 1 300px", backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", p: 2.5 }}>
            <Typography sx={{ fontSize: 10.5, letterSpacing: "0.13em", color: "#A09488", fontWeight: 600, mb: 1.75 }}>
              QUICK ACTIONS
            </Typography>
            <Stack spacing={1.25}>
              <ButtonBase
                onClick={() => router.push("/worksheets/generate")}
                sx={{
                  width: "100%",
                  justifyContent: "flex-start",
                  gap: 1.125,
                  backgroundColor: "#E08A72",
                  color: "#FFFDFA",
                  borderRadius: "10px",
                  px: 1.75,
                  py: 1.5,
                  fontSize: 13.5,
                  fontWeight: 500,
                  "&:hover": { backgroundColor: "#D2795F" },
                }}
              >
                <AddCircleOutlineIcon sx={{ fontSize: 18 }} />
                Generate Worksheet
              </ButtonBase>
              <ButtonBase
                onClick={() => router.push("/upload")}
                sx={{
                  width: "100%",
                  justifyContent: "flex-start",
                  gap: 1.125,
                  backgroundColor: "#FBF9F5",
                  color: "#2A2622",
                  border: "1px solid #E4DCD0",
                  borderRadius: "10px",
                  px: 1.75,
                  py: 1.5,
                  fontSize: 13.5,
                  fontWeight: 500,
                  "&:hover": { backgroundColor: "#F4EFE6" },
                }}
              >
                <UploadFileIcon sx={{ fontSize: 18 }} />
                Upload Completed Worksheet
              </ButtonBase>
              <ButtonBase
                onClick={() => router.push("/marking")}
                sx={{
                  width: "100%",
                  justifyContent: "flex-start",
                  gap: 1.125,
                  backgroundColor: "#FBF9F5",
                  color: "#2A2622",
                  border: "1px solid #E4DCD0",
                  borderRadius: "10px",
                  px: 1.75,
                  py: 1.5,
                  fontSize: 13.5,
                  fontWeight: 500,
                  "&:hover": { backgroundColor: "#F4EFE6" },
                }}
              >
                <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                <Box component="span" sx={{ flex: 1 }}>Review AI Marking</Box>
                <Chip
                  label={PENDING_REVIEW}
                  size="small"
                  sx={{ height: 20, fontSize: 10.5, fontWeight: 700, backgroundColor: "#F1D9D1", color: "#9E3A24" }}
                />
              </ButtonBase>
            </Stack>
          </Box>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ alignItems: "stretch" }}>
          <Box sx={{ flex: "1 1 460px" }}>
            <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid #E7DFD3", pb: 1.375, mb: 1.75 }}>
              <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 21, fontWeight: 500 }}>
                Today&apos;s Teaching Focus
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#A09488" }}>{TODAY_FOCUS.length} sessions</Typography>
            </Stack>
            <Stack spacing={1.25}>
              {TODAY_FOCUS.map((item) => {
                const schoolClass = classes.find((c) => c.id === item.classId);
                if (!schoolClass) return null;
                return (
                  <ButtonBase
                    key={item.classId}
                    onClick={() => router.push(`/classes/${item.classId}`)}
                    sx={{
                      width: "100%",
                      justifyContent: "flex-start",
                      gap: 2,
                      backgroundColor: "#FFFDFA",
                      border: "1px solid #EBE4D9",
                      borderRadius: "12px",
                      px: 2.25,
                      py: 1.875,
                      "&:hover": { borderColor: "#DCCFBE" },
                    }}
                  >
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6F675E", backgroundColor: "#F4EFE6", borderRadius: "6px", px: 1, py: 0.625, flex: "0 0 auto" }}>
                      {item.time}
                    </Typography>
                    <Box sx={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <Typography sx={{ fontSize: 14.5, fontWeight: 500, mb: 0.5 }}>{schoolClass.name}</Typography>
                      <Typography sx={{ fontSize: 12.5, color: "#8B837A" }}>Focus: {item.focus}</Typography>
                    </Box>
                    <ChevronRightIcon sx={{ fontSize: 18, color: "#BCB1A3", flex: "0 0 auto" }} />
                  </ButtonBase>
                );
              })}
            </Stack>
          </Box>

          <Box sx={{ flex: "0 1 300px" }}>
            <Typography sx={{ fontSize: 10.5, letterSpacing: "0.13em", color: "#A09488", fontWeight: 600, mb: 1.75, pb: 1.375, borderBottom: "1px solid #E7DFD3" }}>
              RECENT ACTIVITY
            </Typography>
            <Stack>
              {RECENT_ACTIVITY.map((activity) => {
                const student = getStudentById(activity.studentId);
                if (!student) return null;
                return (
                  <ButtonBase
                    key={activity.studentId}
                    onClick={() => router.push(`/students/${student.id}`)}
                    sx={{
                      width: "100%",
                      justifyContent: "flex-start",
                      gap: 1.375,
                      py: 1.375,
                      px: 0.5,
                      borderBottom: "1px solid #F0EAE0",
                      "&:hover": { backgroundColor: "#FBF7F1" },
                    }}
                  >
                    <InitialsAvatar initials={student.initials} bg={avatarColorFor(studentAvatarIndex(student))} size={28} fontSize={10.5} />
                    <Box sx={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {student.name}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: "#A09488" }}>{activity.detail}</Typography>
                    </Box>
                    <Chip
                      label={activity.tag}
                      size="small"
                      sx={{ height: 20, fontSize: 10.5, fontWeight: 600, backgroundColor: activity.tagBg, color: activity.tagColor, flex: "0 0 auto" }}
                    />
                  </ButtonBase>
                );
              })}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
