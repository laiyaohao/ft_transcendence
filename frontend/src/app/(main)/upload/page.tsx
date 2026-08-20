"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useRouter } from "next/navigation";
import WizardStepper from "@/components/wizard-stepper";
import InitialsAvatar from "@/components/initials-avatar";
import { useToast } from "@/providers/toast-provider";

const STEP_LABELS = ["Upload", "OCR Review", "Confirm", "AI Marking"];
const MOCK_PAGES = ["scan_p1.jpg", "scan_p2.jpg", "scan_p3.jpg"];

export default function UploadPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [pages, setPages] = React.useState<string[]>([]);

  const attach = () => {
    setPages(MOCK_PAGES);
    showToast("3 pages attached from your scanner.");
  };

  const goOcr = () => {
    if (pages.length === 0) {
      showToast("Attach at least one page first.");
      return;
    }
    router.push("/ocr");
  };

  return (
    <Box sx={{ backgroundColor: "#F7F4EF", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
        <WizardStepper labels={STEP_LABELS} active={0} onJump={() => {}} />

        <Box sx={{ textAlign: "center", mb: 3.5 }}>
          <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 31, fontWeight: 500, letterSpacing: "-0.02em", mb: 1.125 }}>
            Upload Completed Worksheet
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: "#8B837A" }}>
            Scans or photos. Multiple pages are stitched into one submission.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ alignItems: "flex-start" }}>
          <Box sx={{ flex: "1 1 420px", width: "100%" }}>
            <ButtonBase
              onClick={attach}
              sx={{
                width: "100%",
                flexDirection: "column",
                backgroundColor: pages.length ? "#FBF9F5" : "#FFFDFA",
                border: "1.5px dashed #DCCFBE",
                borderRadius: "14px",
                py: "44px",
                px: 3,
                mb: 1.75,
                "&:hover": { backgroundColor: "#F9F4EC", borderColor: "#C9B8A2" },
              }}
            >
              <Box sx={{ display: "grid", placeItems: "center", width: 46, height: 46, borderRadius: "50%", backgroundColor: "#F4EFE6", mb: 2 }}>
                <UploadFileIcon sx={{ fontSize: 21, color: "#B4573F" }} />
              </Box>
              <Typography sx={{ fontSize: 15, fontWeight: 500, mb: 0.875 }}>Drag and drop, or click to browse</Typography>
              <Typography sx={{ fontSize: 12.5, color: "#8B837A" }}>PDF, JPG or PNG · up to 20 MB per page</Typography>
            </ButtonBase>

            {pages.length > 0 && (
              <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", p: "18px 20px" }}>
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.875 }}>
                  <Typography sx={{ fontSize: 10.5, letterSpacing: "0.13em", fontWeight: 600, color: "#A09488" }}>
                    {pages.length} PAGES ATTACHED
                  </Typography>
                  <ButtonBase onClick={() => setPages([])} sx={{ fontSize: 11.5, color: "#B4573F" }}>
                    Remove all
                  </ButtonBase>
                </Stack>
                <Stack direction="row" spacing={1.375} sx={{ flexWrap: "wrap", gap: 1.375 }}>
                  {pages.map((label, i) => (
                    <Box key={label} sx={{ width: 76 }}>
                      <Box
                        sx={{
                          height: 98,
                          borderRadius: "7px",
                          border: "1px solid #E4DCD0",
                          background: "repeating-linear-gradient(#FDFAF4 0 8px, #F2ECE1 8px 9px)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 5,
                            right: 5,
                            backgroundColor: "#1B1917",
                            color: "#F4EFE6",
                            fontSize: 8.5,
                            fontWeight: 700,
                            borderRadius: "4px",
                            px: 0.625,
                            py: 0.25,
                          }}
                        >
                          {i + 1}
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: 10.5, color: "#A09488", mt: 0.75, textAlign: "center" }}>{label}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>

          <Stack sx={{ flex: "0 1 320px", width: "100%", gap: 1.75 }}>
            <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", p: "20px 22px" }}>
              <Typography sx={{ fontSize: 10.5, letterSpacing: "0.13em", fontWeight: 600, color: "#A09488", mb: 2 }}>
                SUBMISSION DETAILS
              </Typography>
              {[
                { label: "Class", node: "Primary 5 Science" },
                {
                  label: "Student",
                  node: (
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", flex: 1 }}>
                      <InitialsAvatar initials="BT" bg="#D8B384" size={24} fontSize={9.5} />
                      <span>Bella Tan</span>
                    </Stack>
                  ),
                },
                { label: "Worksheet", node: "P5 Science — Adaptation Mini Test" },
              ].map((row) => (
                <Box key={row.label} sx={{ mb: row.label === "Worksheet" ? 0 : 1.875 }}>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#6F675E", mb: 0.875 }}>{row.label}</Typography>
                  <ButtonBase
                    onClick={() => showToast(`${row.label} picker — demo only.`)}
                    sx={{
                      width: "100%",
                      justifyContent: "space-between",
                      backgroundColor: "#FBF9F5",
                      border: "1px solid #E4DCD0",
                      borderRadius: "8px",
                      px: 1.625,
                      py: 1.125,
                      fontSize: 13,
                    }}
                  >
                    {row.node}
                    <KeyboardArrowDownIcon sx={{ fontSize: 15, color: "#A09488" }} />
                  </ButtonBase>
                </Box>
              ))}
            </Box>

            <Box sx={{ backgroundColor: "#1B1917", borderRadius: "14px", p: "18px 20px" }}>
              <Typography sx={{ fontSize: 10.5, letterSpacing: "0.13em", fontWeight: 600, color: "#A09488", mb: 1.375 }}>
                WHAT HAPPENS NEXT
              </Typography>
              <Typography sx={{ fontSize: 12.5, lineHeight: 1.65, color: "#A8A096" }}>
                Handwriting is extracted first and shown to you for correction. AI marking only runs on text you have confirmed, and never writes to the student profile without your approval.
              </Typography>
            </Box>

            <ButtonBase
              onClick={goOcr}
              sx={{
                backgroundColor: pages.length ? "#9E3A24" : "#EDE6DB",
                color: pages.length ? "#FBF9F5" : "#B5AA9C",
                borderRadius: "10px",
                py: 1.75,
                fontSize: 13.5,
                fontWeight: 500,
                gap: 1.125,
                cursor: pages.length ? "pointer" : "not-allowed",
                "&:hover": pages.length ? { backgroundColor: "#8A3120" } : undefined,
              }}
            >
              Continue to OCR Review
              <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </ButtonBase>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
