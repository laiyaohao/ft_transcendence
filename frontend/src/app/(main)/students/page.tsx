"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter, useSearchParams } from "next/navigation";
import InitialsAvatar from "@/components/initials-avatar";
import StatusChip from "@/components/status-chip";
import MasteryBar from "@/components/mastery-bar";
import {
  classes,
  students,
  avatarColorFor,
  studentAvatarIndex,
  weakestTopic,
  masteryColor,
  Student,
} from "@/data/academic-data";
import { useToast } from "@/providers/toast-provider";

type SortKey = "name" | "mastery" | "change";

const ALL_STUDENTS = "All students";

function changeValue(improvement: string): number {
  const isNegative = improvement.startsWith("-") || improvement.startsWith("−");
  const num = Number(improvement.replace(/[^0-9.]/g, ""));
  return isNegative ? -num : num;
}

function isNegativeChange(improvement: string): boolean {
  return improvement.startsWith("-") || improvement.startsWith("−");
}

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const classFilterFromUrl = classes.find((c) => c.id === searchParams.get("class"))?.name;

  const [filter, setFilter] = React.useState<string>(classFilterFromUrl ?? ALL_STUDENTS);
  const [sort, setSort] = React.useState<SortKey>("name");

  const classesWithStudents = classes.filter((c) => students.some((s) => s.classId === c.id));
  const filters = [ALL_STUDENTS, ...classesWithStudents.map((c) => c.name)];
  const sorts: { id: SortKey; label: string }[] = [
    { id: "name", label: "Name" },
    { id: "mastery", label: "Lowest mastery" },
    { id: "change", label: "Biggest change" },
  ];

  const needAttention = students.filter((s) => s.mastery < 55).length;

  const rows = React.useMemo(() => {
    let list = students.slice();
    if (filter !== ALL_STUDENTS) {
      const classId = classes.find((c) => c.name === filter)?.id;
      list = list.filter((s) => s.classId === classId);
    }
    if (sort === "mastery") {
      list.sort((a, b) => a.mastery - b.mastery);
    } else if (sort === "change") {
      list.sort((a, b) => changeValue(b.improvement) - changeValue(a.improvement));
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [filter, sort]);

  const classNameFor = (student: Student) => classes.find((c) => c.id === student.classId)?.name ?? "";

  return (
    <Box sx={{ backgroundColor: "#F7F4EF", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1140, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "flex-start", sm: "flex-end" }, justifyContent: "space-between", mb: 2.75 }}
        >
          <Box>
            <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em", mb: 0.875 }}>
              Students
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: "#8B837A" }}>
              {students.length} students on your roster · {needAttention} below 55% mastery
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.125} sx={{ alignItems: "center" }}>
            <Typography sx={{ fontSize: 11.5, color: "#A09488" }}>Sort</Typography>
            <Stack direction="row" spacing={0.75}>
              {sorts.map((s) => {
                const active = sort === s.id;
                return (
                  <ButtonBase
                    key={s.id}
                    onClick={() => setSort(s.id)}
                    sx={{
                      backgroundColor: active ? "#F4E4DE" : "#FBF9F5",
                      border: `1px solid ${active ? "#E0B9AC" : "#E4DCD0"}`,
                      color: active ? "#9E3A24" : "#5A544C",
                      borderRadius: "8px",
                      px: 1.625,
                      py: 1,
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {s.label}
                  </ButtonBase>
                );
              })}
            </Stack>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 2, gap: 1 }}>
          {filters.map((label) => {
            const active = filter === label;
            return (
              <ButtonBase
                key={label}
                onClick={() => setFilter(label)}
                sx={{
                  backgroundColor: active ? "#F4E4DE" : "#FBF9F5",
                  border: `1px solid ${active ? "#E0B9AC" : "#E4DCD0"}`,
                  color: active ? "#9E3A24" : "#5A544C",
                  borderRadius: "20px",
                  px: 1.875,
                  py: 1,
                  fontSize: 12.5,
                  fontWeight: 500,
                }}
              >
                {label}
              </ButtonBase>
            );
          })}
        </Stack>

        <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", overflow: "hidden" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "minmax(150px,1fr) 116px 118px", md: "minmax(210px,1fr) 130px 140px 92px 118px 112px" },
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
            <Box>STUDENT</Box>
            <Box>STATUS</Box>
            <Box>MASTERY</Box>
            <Box sx={{ display: { xs: "none", md: "block" } }}>CHANGE</Box>
            <Box sx={{ display: { xs: "none", md: "block" } }}>WEAK TOPIC</Box>
            <Box sx={{ display: { xs: "none", md: "block" } }} />
          </Box>

          {rows.length === 0 && (
            <Typography sx={{ fontSize: 12.5, color: "#8B837A", px: 2.75, py: 2.5 }}>
              No students match this filter.
            </Typography>
          )}

          {rows.map((student) => {
            const weak = weakestTopic(student.topics);
            const negative = isNegativeChange(student.improvement);
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
                  gridTemplateColumns: { xs: "minmax(150px,1fr) 116px 118px", md: "minmax(210px,1fr) 130px 140px 92px 118px 112px" },
                  gap: 1.5,
                  alignItems: "center",
                  px: { xs: 2, md: 2.75 },
                  py: 1.625,
                  borderBottom: "1px solid #F3EDE4",
                  "&:hover": { backgroundColor: "#FBF7F1" },
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
                  <InitialsAvatar initials={student.initials} bg={avatarColorFor(studentAvatarIndex(student))} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 500, mb: 0.375, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {student.name}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "#A09488", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {classNameFor(student)} · {student.completed} sheets
                    </Typography>
                  </Box>
                </Stack>

                <Box>
                  <StatusChip status={student.status} />
                </Box>

                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: student.mastery < 55 ? "#B4573F" : "#2A2622",
                      width: 32,
                      flex: "0 0 auto",
                    }}
                  >
                    {student.mastery}%
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <MasteryBar value={student.mastery} color={masteryColor(student.mastery)} />
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{
                    display: { xs: "none", md: "flex" },
                    alignItems: "center",
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: negative ? "#B4573F" : "#5C7A63",
                  }}
                >
                  {student.improvement}
                </Stack>

                <Typography
                  sx={{
                    display: { xs: "none", md: "block" },
                    fontSize: 12,
                    color: "#8B837A",
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {weak.short} <span style={{ color: "#BCB1A3" }}>{weak.pct}%</span>
                </Typography>

                <Stack sx={{ display: { xs: "none", md: "flex" }, alignItems: "flex-end" }}>
                  <ButtonBase
                    onClick={(e) => {
                      e.stopPropagation();
                      showToast(`Worksheet generator coming soon for ${student.name}.`);
                    }}
                    sx={{
                      backgroundColor: "#FBF9F5",
                      border: "1px solid #E4DCD0",
                      borderRadius: "7px",
                      px: 1.5,
                      py: 0.875,
                      fontSize: 11.5,
                      fontWeight: 500,
                      color: "#5A544C",
                      whiteSpace: "nowrap",
                      "&:hover": { backgroundColor: "#F4E4DE", borderColor: "#E0B9AC", color: "#9E3A24" },
                    }}
                  >
                    Worksheet
                  </ButtonBase>
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
