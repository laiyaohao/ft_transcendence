"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useRouter, useSearchParams } from "next/navigation";
import FilterChip from "@/components/filter-chip";
import { worksheets, WORKSHEET_STATUS_STYLE, WorksheetStatus, Worksheet } from "@/data/worksheets-data";
import { useToast } from "@/providers/toast-provider";

const STATUS_FILTERS: ("All" | WorksheetStatus)[] = ["All", "Generated", "Assigned", "Submitted", "Marked"];
const DECORATIVE_SELECTS = ["All classes", "All topics", "Term 4"];

export default function WorksheetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [filter, setFilter] = React.useState<"All" | WorksheetStatus>("All");
  const [query, setQuery] = React.useState(searchParams.get("q") ?? "");

  const rows = worksheets.filter((w) => {
    if (filter !== "All" && w.status !== filter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return w.title.toLowerCase().includes(q) || w.className.toLowerCase().includes(q);
  });

  const handleAction = (action: Worksheet["actions"][number], worksheet: Worksheet) => {
    if (action === "Review marking") {
      router.push("/marking");
    } else if (action === "Upload") {
      router.push("/upload");
    } else {
      showToast(`${action} — ${worksheet.title}`);
    }
  };

  return (
    <Box sx={{ backgroundColor: "#F7F4EF", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1140, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "flex-start", sm: "flex-end" }, justifyContent: "space-between", mb: 2.5 }}
        >
          <Box>
            <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em", mb: 1 }}>
              Worksheets
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: "#8B837A" }}>
              {worksheets.length} worksheets across 6 classes
            </Typography>
          </Box>
          <ButtonBase
            onClick={() => router.push("/worksheets/generate")}
            sx={{
              backgroundColor: "#E08A72",
              color: "#FFFDFA",
              borderRadius: "9px",
              px: 2.25,
              py: 1.375,
              fontSize: 13,
              fontWeight: 500,
              gap: 1,
              "&:hover": { backgroundColor: "#D2795F" },
            }}
          >
            Generate Worksheet
          </ButtonBase>
        </Stack>

        {query && (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
            <Typography sx={{ fontSize: 12.5, color: "#8B837A" }}>
              Filtered by &ldquo;{query}&rdquo;
            </Typography>
            <ButtonBase onClick={() => setQuery("")} sx={{ fontSize: 12.5, fontWeight: 500, color: "#B4573F" }}>
              Clear
            </ButtonBase>
          </Stack>
        )}

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 2, alignItems: "center" }}>
          {STATUS_FILTERS.map((label) => (
            <FilterChip key={label} label={label} active={filter === label} onClick={() => setFilter(label)} />
          ))}
          <Box sx={{ flex: 1 }} />
          {DECORATIVE_SELECTS.map((label) => (
            <ButtonBase
              key={label}
              onClick={() => showToast(`Filter menu — narrows the list by ${label.toLowerCase()}.`)}
              sx={{
                backgroundColor: "#FFFDFA",
                border: "1px solid #EBE4D9",
                borderRadius: "8px",
                px: 1.625,
                py: 1,
                fontSize: 12.5,
                color: "#4A443D",
                gap: 1,
              }}
            >
              {label}
              <KeyboardArrowDownIcon sx={{ fontSize: 15, color: "#A09488" }} />
            </ButtonBase>
          ))}
        </Stack>

        <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", overflow: "hidden" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 90px", md: "1fr 130px 110px 120px 190px" },
              gap: 1.5,
              px: { xs: 2, md: 2.75 },
              pt: 2,
              pb: 1.5,
              fontSize: 10.5,
              letterSpacing: "0.09em",
              fontWeight: 600,
              color: "#A09488",
              borderBottom: "1px solid #EFE8DE",
            }}
          >
            <Box>WORKSHEET</Box>
            <Box sx={{ display: { xs: "none", md: "block" } }}>CLASS</Box>
            <Box sx={{ display: { xs: "none", md: "block" } }}>DATE</Box>
            <Box>STATUS</Box>
            <Box sx={{ display: { xs: "none", md: "block" } }}>ACTIONS</Box>
          </Box>

          {rows.length === 0 && (
            <Typography sx={{ fontSize: 12.5, color: "#8B837A", px: 2.75, py: 2.5 }}>
              No worksheets match this filter.
            </Typography>
          )}

          {rows.map((w) => {
            const statusStyle = WORKSHEET_STATUS_STYLE[w.status];
            return (
              <Box
                key={w.title}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr 90px", md: "1fr 130px 110px 120px 190px" },
                  gap: 1.5,
                  alignItems: "center",
                  px: { xs: 2, md: 2.75 },
                  py: 1.625,
                  borderBottom: "1px solid #F3EDE4",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 500, mb: 0.375, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {w.title}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "#A09488" }}>{w.meta}</Typography>
                </Box>
                <Typography sx={{ display: { xs: "none", md: "block" }, fontSize: 12, color: "#6F675E" }}>{w.className}</Typography>
                <Typography sx={{ display: { xs: "none", md: "block" }, fontSize: 12, color: "#8B837A" }}>{w.date}</Typography>
                <Box>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      px: 1.125,
                      py: 0.5,
                      borderRadius: "20px",
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {w.status.toUpperCase()}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.875} sx={{ display: { xs: "none", md: "flex" } }}>
                  {w.actions.map((action) => {
                    const emphasized = action === "Review marking" || action === "Upload";
                    return (
                      <ButtonBase
                        key={action}
                        onClick={() => handleAction(action, w)}
                        sx={{
                          backgroundColor: emphasized ? "#F4E4DE" : "#FBF9F5",
                          border: `1px solid ${emphasized ? "#E0B9AC" : "#E4DCD0"}`,
                          color: emphasized ? "#9E3A24" : "#5A544C",
                          borderRadius: "7px",
                          px: 1.375,
                          py: 0.75,
                          fontSize: 11.5,
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {action}
                      </ButtonBase>
                    );
                  })}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
