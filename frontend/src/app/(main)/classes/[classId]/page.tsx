import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Link from "next/link";

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const classLabel = classId.trim() || "Unknown";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F4EF", px: { xs: 2.5, sm: 3.75 }, py: 3.75, color: "#2A2622" }}>
      <Box sx={{ maxWidth: 900, mx: "auto", animation: "fadeUp .35s ease both" }}>
        <Box component={Link} href="/classes" sx={{ display: "inline-flex", alignItems: "center", gap: 0.9, color: "#A09488", fontSize: 10.5, fontWeight: 600, letterSpacing: ".13em", textDecoration: "none", mb: 2.5, "&:hover": { color: "#B4573F" }, "&:focus-visible": { outline: "3px solid #E08A72", outlineOffset: 3, borderRadius: 1 } }}>
          <ArrowBackIcon aria-hidden="true" sx={{ fontSize: 14 }} />
          ALL CLASSES
        </Box>
        <Typography sx={{ color: "#A09488", fontSize: 10.5, fontWeight: 600, letterSpacing: ".13em", mb: 0.75 }}>CLASS SUMMARY</Typography>
        <Typography component="h1" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: { xs: 32, sm: 38 }, fontWeight: 500, lineHeight: 1.1, letterSpacing: "-.02em", mb: 2 }}>Class {classLabel}</Typography>
        <Card component="section" variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: "14px", bgcolor: "#FFFDFA", borderColor: "#EBE4D9", boxShadow: "none" }}>
          <Typography component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 21, fontWeight: 500, mb: 0.75 }}>Class details</Typography>
          <Typography sx={{ color: "#5A544C", fontSize: 13.5, lineHeight: 1.65, textWrap: "pretty" }}>This summary is intentionally limited to the selected class reference. Detailed class data will appear here when a tutor-authorized class detail endpoint is available.</Typography>
        </Card>
      </Box>
    </Box>
  );
}
