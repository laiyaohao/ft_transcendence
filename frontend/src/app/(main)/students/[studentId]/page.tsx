"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useParams } from "next/navigation";

import StudentProfile from "@/components/students/StudentProfile";

export default function StudentProfilePage() {
  const params = useParams<{ studentId: string }>();
  return <Box sx={{ minHeight: "100vh", bgcolor: "#F7F4EF", px: { xs: 2.5, sm: 3.75 }, py: 3.75, color: "#2A2622" }}><Box sx={{ maxWidth: 1420, mx: "auto", animation: "fadeUp .35s ease both" }}><Typography sx={{ color: "#A09488", fontSize: 10.5, fontWeight: 600, letterSpacing: ".13em", mb: .75 }}>STUDENT MANAGEMENT</Typography><StudentProfile studentId={Number(params.studentId)} /></Box></Box>;
}
