"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import Link from "next/link";
import { accent, worksheets, type Worksheet } from "@/lib/student-mock-data";

const INK = "rgb(24,21,18)";
const MUTED = "rgb(126,117,111)";
const BORDER = "rgb(232,226,217)";
const CARD_BG = "rgb(250,247,242)";

const TOPIC_OPTIONS = ["all", ...Array.from(new Set(worksheets.map((w) => w.topic)))];

type StatusFilter = "all" | Worksheet["status"];

export default function Page() {
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [topic, setTopic] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  const filtered = worksheets.filter((w) => {
    if (status !== "all" && w.status !== status) return false;
    if (topic !== "all" && w.topic !== topic) return false;
    if (search && !w.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const clearFilters = () => {
    setStatus("all");
    setTopic("all");
    setSearch("");
  };

  return (
    <Box sx={{ backgroundColor: "rgb(253,251,247)", minHeight: "100%", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1120, mx: "auto" }}>
        <Typography sx={{ fontFamily: "'EB Garamond', serif", fontWeight: 400, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.8px", color: INK, mb: 0.75 }}>
          My Worksheets
        </Typography>
        <Typography sx={{ fontSize: 15, color: "rgb(77,69,64)", mb: 3.5 }}>
          Everything assigned to you in Science. Upload your answers to get them marked.
        </Typography>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", mb: 2.5, rowGap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              backgroundColor: CARD_BG,
              border: `1px solid ${BORDER}`,
              borderRadius: 9999,
              px: 1.75,
              py: 1,
              flexGrow: 1,
              maxWidth: 320,
            }}
          >
            <SearchIcon sx={{ fontSize: 16, color: MUTED }} />
            <InputBase
              placeholder="Search worksheets"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ fontSize: 14, width: "100%" }}
            />
          </Box>
          <Stack direction="row" spacing={0.75} sx={{ backgroundColor: "rgb(247,243,241)", border: `1px solid ${BORDER}`, borderRadius: 9999, p: 0.5 }}>
            {([
              { key: "all", label: "All" },
              { key: "incomplete", label: "To do" },
              { key: "completed", label: "Completed" },
            ] as { key: StatusFilter; label: string }[]).map((c) => (
              <Button
                key={c.key}
                onClick={() => setStatus(c.key)}
                sx={{
                  borderRadius: 9999,
                  px: 1.75,
                  py: 0.75,
                  fontSize: 13,
                  textTransform: "none",
                  minWidth: 0,
                  backgroundColor: status === c.key ? "rgb(232,226,217)" : "transparent",
                  color: status === c.key ? "rgb(155,68,48)" : "rgb(77,69,64)",
                  fontWeight: status === c.key ? 600 : 500,
                  "&:hover": { backgroundColor: "rgb(236,231,224)" },
                }}
              >
                {c.label}
              </Button>
            ))}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1, mb: 3.5 }}>
          {TOPIC_OPTIONS.map((t) => {
            const active = topic === t;
            return (
              <Chip
                key={t}
                label={t === "all" ? "All topics" : t}
                onClick={() => setTopic(t)}
                sx={{
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: active ? INK : "rgb(250,247,242)",
                  color: active ? "rgb(253,251,247)" : "rgb(77,69,64)",
                  border: `1px solid ${active ? INK : BORDER}`,
                }}
              />
            );
          })}
        </Stack>

        {filtered.length === 0 && (
          <Card
            variant="outlined"
            sx={{ border: `1px dashed rgb(207,196,189)`, borderRadius: 3.5, backgroundColor: CARD_BG, py: 7.5, px: 3, textAlign: "center", boxShadow: "none" }}
          >
            <Box sx={{ width: 56, height: 56, mx: "auto", mb: 2, borderRadius: "14px", backgroundColor: "rgb(236,231,224)", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED }}>
              <DescriptionOutlinedIcon />
            </Box>
            <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 22, color: INK, mb: 0.75 }}>
              No worksheets match those filters
            </Typography>
            <Typography sx={{ fontSize: 14, color: MUTED, mb: 2.25 }}>
              Try clearing the filters to see everything assigned to you.
            </Typography>
            <Button
              onClick={clearFilters}
              variant="outlined"
              sx={{ color: "rgb(45,41,38)", borderColor: "rgb(45,41,38)", textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { backgroundColor: INK, color: "#fff" } }}
            >
              Clear filters
            </Button>
          </Card>
        )}

        <Stack spacing={1.75}>
          {filtered.map((w) => (
            <Card
              key={w.id}
              variant="outlined"
              sx={{
                borderRadius: 3.5,
                borderColor: BORDER,
                backgroundColor: CARD_BG,
                boxShadow: "none",
                px: 3,
                py: 2.75,
                display: "flex",
                alignItems: "center",
                gap: 3,
                flexWrap: "wrap",
                "&:hover": { borderColor: "rgb(207,196,189)" },
              }}
            >
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 0.75 }}>
                  <Chip
                    label={w.status === "completed" ? "Completed" : "To do"}
                    size="small"
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: w.status === "completed" ? "rgb(233,238,233)" : "rgb(248,240,225)",
                      color: w.status === "completed" ? "rgb(70,92,70)" : "rgb(140,105,45)",
                    }}
                  />
                  <Typography sx={{ fontSize: 13, color: MUTED }}>Science · {w.topic}</Typography>
                </Stack>
                <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 22, lineHeight: 1.2, color: INK }}>
                  {w.title}
                </Typography>
                <Stack direction="row" spacing={2.25} sx={{ mt: 1, fontSize: 13, color: MUTED }}>
                  <span>Assigned {w.assigned}</span>
                  <span>Submitted {w.submitted ?? "Not submitted"}</span>
                </Stack>
              </Box>

              {w.status === "completed" ? (
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Box sx={{ textAlign: "center", px: 1 }}>
                    <Typography sx={{ fontFamily: "'EB Garamond', serif", fontSize: 30, lineHeight: 1, color: INK }}>
                      {w.score}%
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: MUTED, mt: 0.25 }}>Score</Typography>
                  </Box>
                  <Button
                    component={Link}
                    href={`/worksheets/${w.id}`}
                    sx={{ borderRadius: 2, px: 2.25, py: 1.25, fontSize: 14, fontWeight: 600, color: "#fff", backgroundColor: INK, whiteSpace: "nowrap", textTransform: "none", "&:hover": { filter: "brightness(1.3)", backgroundColor: INK } }}
                  >
                    View Results
                  </Button>
                </Stack>
              ) : (
                <Button
                  component={Link}
                  href={`/upload?ws=${w.id}`}
                  startIcon={<UploadFileIcon sx={{ fontSize: 15 }} />}
                  sx={{ borderRadius: 2, px: 2.25, py: 1.25, fontSize: 14, fontWeight: 600, color: "#fff", backgroundColor: accent, whiteSpace: "nowrap", textTransform: "none", "&:hover": { filter: "brightness(0.96)", backgroundColor: accent } }}
                >
                  Upload
                </Button>
              )}
            </Card>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
