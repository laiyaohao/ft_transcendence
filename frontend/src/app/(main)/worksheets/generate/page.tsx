"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import CheckIcon from "@mui/icons-material/Check";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import { useRouter } from "next/navigation";
import WizardStepper from "@/components/wizard-stepper";
import FilterChip from "@/components/filter-chip";
import ToggleSwitch from "@/components/toggle-switch";
import InitialsAvatar from "@/components/initials-avatar";
import {
  classes,
  students,
  avatarColorFor,
  studentAvatarIndex,
  weakestTopic,
  SCI_TOPICS,
  MATH_TOPICS,
} from "@/data/academic-data";
import { scienceQuestions, mathsQuestions, DIFFICULTY_STYLE, BankQuestion } from "@/data/worksheets-data";
import { useToast } from "@/providers/toast-provider";

const STEP_LABELS = ["Select", "Configure", "AI Preview", "Edit", "Export"];
const COUNT_OPTIONS = [10, 15, 20, 25];
const BOOKLET_OPTIONS = ["Booklet A + B", "Booklet B only"];
const TYPE_OPTIONS = ["MCQ", "Open-Ended (OEQ)", "Structured", "Keyword Drill"];
const LEVEL_OPTIONS = ["Primary 4", "Primary 5", "Primary 6"];
const COMPOSITION_DOTS = ["#B4573F", "#D8B384", "#93A896", "#8F9DB0"];

type Subject = "Science" | "Maths";
type Target = "class" | "student";
type GeneratedQuestion = BankQuestion & { id: string; aiAdded?: boolean };

type GenConfig = {
  target: Target;
  targetId: string;
  subject: Subject;
  level: string;
  topics: string[];
  count: number;
  booklet: string;
  types: string[];
  useAI: boolean;
};

function topicListFor(subject: Subject) {
  return subject === "Maths" ? MATH_TOPICS : SCI_TOPICS;
}

function questionPoolFor(subject: Subject) {
  return subject === "Maths" ? mathsQuestions : scienceQuestions;
}

function buildQuestions(config: GenConfig): GeneratedQuestion[] {
  const pool = questionPoolFor(config.subject);
  const matching = pool.filter((q) => config.topics.includes(q.topic));
  const source = matching.length ? matching : pool;
  const picked: GeneratedQuestion[] = [];
  for (let i = 0; i < config.count; i++) {
    const q = source[i % source.length];
    picked.push({ ...q, id: `g${i}-${q.text.slice(0, 8)}` });
  }
  return picked;
}

const initialClass = classes[0];

const DEFAULT_CONFIG: GenConfig = {
  target: "class",
  targetId: initialClass.id,
  subject: initialClass.subject === "MATHS" ? "Maths" : "Science",
  level: initialClass.level,
  topics: initialClass.topics
    .slice()
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 2)
    .map((t) => t.name),
  count: 20,
  booklet: "Booklet A + B",
  types: ["MCQ", "Open-Ended (OEQ)"],
  useAI: true,
};

export default function WorksheetGeneratorPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = React.useState(0);
  const [config, setConfig] = React.useState<GenConfig>(DEFAULT_CONFIG);
  const [questions, setQuestions] = React.useState<GeneratedQuestion[] | null>(null);

  const targetIsStudent = config.target === "student";
  const classTarget = !targetIsStudent ? classes.find((c) => c.id === config.targetId) : undefined;
  const studentTarget = targetIsStudent ? students.find((s) => s.id === config.targetId) : undefined;
  const targetName = targetIsStudent ? studentTarget?.name ?? "" : classTarget?.name ?? "";

  const goStep = (next: number) => {
    if (next <= step) setStep(next);
  };

  const selectTarget = (t: Target) => {
    if (t === "class") {
      const c = classes[0];
      setConfig((prev) => ({
        ...prev,
        target: t,
        targetId: c.id,
        subject: c.subject === "MATHS" ? "Maths" : "Science",
        level: c.level,
        topics: c.topics.slice().sort((a, b) => a.mastery - b.mastery).slice(0, 2).map((x) => x.name),
      }));
    } else {
      const s = students[0];
      const sc = classes.find((c) => c.id === s.classId);
      setConfig((prev) => ({
        ...prev,
        target: t,
        targetId: s.id,
        subject: sc?.subject === "MATHS" ? "Maths" : "Science",
        topics: s.topics.slice().sort((a, b) => a.pct - b.pct).slice(0, 2).map((x) => x.name),
      }));
    }
    setQuestions(null);
  };

  const pickClass = (c: (typeof classes)[number]) => {
    setConfig((prev) => ({
      ...prev,
      targetId: c.id,
      subject: c.subject === "MATHS" ? "Maths" : "Science",
      level: c.level,
      topics: c.topics.slice().sort((a, b) => a.mastery - b.mastery).slice(0, 2).map((x) => x.name),
    }));
    setQuestions(null);
  };

  const pickStudent = (s: (typeof students)[number]) => {
    const sc = classes.find((c) => c.id === s.classId);
    setConfig((prev) => ({
      ...prev,
      targetId: s.id,
      subject: sc?.subject === "MATHS" ? "Maths" : "Science",
      topics: s.topics.slice().sort((a, b) => a.pct - b.pct).slice(0, 2).map((x) => x.name),
    }));
    setQuestions(null);
  };

  const toggleTopic = (name: string) => {
    setConfig((prev) => ({
      ...prev,
      topics: prev.topics.includes(name) ? prev.topics.filter((t) => t !== name) : [...prev.topics, name],
    }));
    setQuestions(null);
  };

  const toggleType = (label: string) => {
    setConfig((prev) => ({
      ...prev,
      types: prev.types.includes(label) ? prev.types.filter((t) => t !== label) : [...prev.types, label],
    }));
  };

  const perTopic = Math.max(1, Math.round(config.count / Math.max(1, config.topics.length)));
  const composition = config.topics.map((name, i) => ({
    name,
    qs: i === config.topics.length - 1 ? config.count - perTopic * (config.topics.length - 1) : perTopic,
    dot: COMPOSITION_DOTS[i % COMPOSITION_DOTS.length],
  }));

  const genQuestions = questions ?? buildQuestions(config);
  const markTotal = genQuestions.reduce((sum, q) => sum + q.marks, 0);

  const mix = targetIsStudent
    ? [
        { label: "Foundation", pct: 40, color: "#93A896" },
        { label: "Application", pct: 40, color: "#D8B384" },
        { label: "Challenge", pct: 20, color: "#B4573F" },
      ]
    : [
        { label: "Foundation", pct: 45, color: "#93A896" },
        { label: "Application", pct: 40, color: "#D8B384" },
        { label: "Challenge", pct: 15, color: "#B4573F" },
      ];

  const genReasons = studentTarget
    ? [
        {
          title: "Weak topics first",
          body: `${weakestTopic(studentTarget.topics).name} at ${weakestTopic(studentTarget.topics).pct}% — weighted heaviest in this paper.`,
        },
        { title: "Repeated errors", body: studentTarget.growth[0] },
        { title: "Learning profile", body: "Strong on recall, weak on phrasing — so OEQs outnumber MCQs 2:1." },
      ]
    : classTarget
      ? [
          {
            title: "Shared class gap",
            body: classTarget.insights.length ? classTarget.insights[0].body : "Weakest two topics selected from the class mastery chart.",
          },
          { title: "Previous performance", body: "Last worksheet averaged 61%. Foundation questions increased to rebuild confidence." },
          { title: "Class mastery", body: "Topics above 78% excluded to keep the paper focused." },
        ]
      : [];

  const exportName = `${config.subject === "Maths" ? "P5 Maths" : "P5 Science"} — ${
    composition[0] ? composition[0].name.split(" &")[0] : "Mixed"
  } Practice`;

  return (
    <Box sx={{ backgroundColor: "#F7F4EF", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1120, mx: "auto" }}>
        <WizardStepper labels={STEP_LABELS} active={step} onJump={goStep} />

        {step === 0 && (
          <Box>
            <Box sx={{ textAlign: "center", mb: 3.75 }}>
              <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 31, fontWeight: 500, letterSpacing: "-0.02em", mb: 1.125 }}>
                Who is this worksheet for?
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: "#8B837A" }}>
                AI recommendations differ: a class worksheet targets shared gaps, a student worksheet targets their own profile.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3.25 }}>
              <ButtonBase
                onClick={() => selectTarget("class")}
                sx={{
                  flex: "1 1 300px",
                  flexDirection: "column",
                  alignItems: "stretch",
                  textAlign: "left",
                  backgroundColor: !targetIsStudent ? "#FDF6F3" : "#FFFDFA",
                  border: `1.5px solid ${!targetIsStudent ? "#9E3A24" : "#EBE4D9"}`,
                  borderRadius: "14px",
                  p: 2.75,
                }}
              >
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.625 }}>
                  <GroupOutlinedIcon sx={{ fontSize: 22, color: "#9E3A24" }} />
                  <Box sx={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${!targetIsStudent ? "#9E3A24" : "#EBE4D9"}`, backgroundColor: !targetIsStudent ? "#9E3A24" : "transparent" }} />
                </Stack>
                <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 19, fontWeight: 500, mb: 0.75 }}>A whole class</Typography>
                <Typography sx={{ fontSize: 12.5, color: "#8B837A", lineHeight: 1.6 }}>
                  Built around topics the class collectively struggles with. Same paper for everyone.
                </Typography>
              </ButtonBase>

              <ButtonBase
                onClick={() => selectTarget("student")}
                sx={{
                  flex: "1 1 300px",
                  flexDirection: "column",
                  alignItems: "stretch",
                  textAlign: "left",
                  backgroundColor: targetIsStudent ? "#FDF6F3" : "#FFFDFA",
                  border: `1.5px solid ${targetIsStudent ? "#9E3A24" : "#EBE4D9"}`,
                  borderRadius: "14px",
                  p: 2.75,
                }}
              >
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.625 }}>
                  <PersonOutlineIcon sx={{ fontSize: 22, color: "#9E3A24" }} />
                  <Box sx={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${targetIsStudent ? "#9E3A24" : "#EBE4D9"}`, backgroundColor: targetIsStudent ? "#9E3A24" : "transparent" }} />
                </Stack>
                <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 19, fontWeight: 500, mb: 0.75 }}>One student</Typography>
                <Typography sx={{ fontSize: 12.5, color: "#8B837A", lineHeight: 1.6 }}>
                  Personalised from their weak topics, repeated mistakes and answering habits.
                </Typography>
              </ButtonBase>
            </Stack>

            <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", p: "20px 22px", mb: 3 }}>
              <Typography sx={{ fontSize: 10.5, letterSpacing: "0.13em", fontWeight: 600, color: "#A09488", mb: 1.875 }}>
                {targetIsStudent ? "SELECT A STUDENT" : "SELECT A CLASS"}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(215px, 1fr))", gap: 1.25 }}>
                {targetIsStudent
                  ? students.map((s) => {
                      const sc = classes.find((c) => c.id === s.classId);
                      const selected = s.id === config.targetId;
                      return (
                        <ButtonBase
                          key={s.id}
                          onClick={() => pickStudent(s)}
                          sx={{
                            justifyContent: "flex-start",
                            gap: 1.375,
                            textAlign: "left",
                            backgroundColor: selected ? "#FDF6F3" : "#FBF9F5",
                            border: `1.5px solid ${selected ? "#9E3A24" : "#EFE8DE"}`,
                            borderRadius: "10px",
                            px: 1.875,
                            py: 1.625,
                          }}
                        >
                          <InitialsAvatar initials={s.initials} bg={avatarColorFor(studentAvatarIndex(s))} size={30} fontSize={10.5} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {s.name}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: "#A09488" }}>
                              {sc?.name} · {s.mastery}%
                            </Typography>
                          </Box>
                        </ButtonBase>
                      );
                    })
                  : classes.map((c) => {
                      const selected = c.id === config.targetId;
                      return (
                        <ButtonBase
                          key={c.id}
                          onClick={() => pickClass(c)}
                          sx={{
                            justifyContent: "flex-start",
                            gap: 1.375,
                            textAlign: "left",
                            backgroundColor: selected ? "#FDF6F3" : "#FBF9F5",
                            border: `1.5px solid ${selected ? "#9E3A24" : "#EFE8DE"}`,
                            borderRadius: "10px",
                            px: 1.875,
                            py: 1.625,
                          }}
                        >
                          <Box
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: "9px",
                              backgroundColor: c.subject === "MATHS" ? "#BFD0D6" : "#C6D0C4",
                              color: "#3A332C",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 10.5,
                              fontWeight: 700,
                              flex: "0 0 auto",
                            }}
                          >
                            {c.level.replace(/[^0-9]/g, "")}
                            {c.subject[0]}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {c.name}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: "#A09488" }}>
                              {c.schedule} · {c.count} students
                            </Typography>
                          </Box>
                        </ButtonBase>
                      );
                    })}
              </Box>
            </Box>

            <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
              <ButtonBase
                onClick={() => setStep(1)}
                sx={{ backgroundColor: "#9E3A24", color: "#FBF9F5", borderRadius: "10px", px: 3, py: 1.625, fontSize: 13.5, fontWeight: 500, gap: 1.125, "&:hover": { backgroundColor: "#8A3120" } }}
              >
                Configure worksheet
                <ArrowForwardIcon sx={{ fontSize: 16 }} />
              </ButtonBase>
            </Stack>
          </Box>
        )}

        {step === 1 && (
          <Box>
            <Box sx={{ mb: 3.25 }}>
              <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 31, fontWeight: 500, letterSpacing: "-0.02em", mb: 1.125 }}>
                Configure the worksheet
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: "#8B837A" }}>
                For {targetName} · AI has pre-filled the fields below from recent performance.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ mb: 3.25 }}>
              <Box sx={{ flex: "1 1 480px", backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", p: 3 }}>
                <Stack direction="row" spacing={2.25} sx={{ flexWrap: "wrap", gap: 2.25, mb: 3 }}>
                  <Box sx={{ flex: "1 1 180px" }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#6F675E", mb: 1.125 }}>Subject</Typography>
                    <Stack direction="row" spacing={0.875}>
                      {(["Science", "Maths"] as Subject[]).map((s) => (
                        <Box key={s} sx={{ flex: 1 }}>
                          <FilterChip
                            label={s}
                            active={config.subject === s}
                            square
                            onClick={() => {
                              setConfig((prev) => ({ ...prev, subject: s, topics: topicListFor(s).slice(2, 4).map((t) => t.name) }));
                              setQuestions(null);
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                  <Box sx={{ flex: "1 1 180px" }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#6F675E", mb: 1.125 }}>Level</Typography>
                    <Stack direction="row" spacing={0.875}>
                      {LEVEL_OPTIONS.map((l) => (
                        <Box key={l} sx={{ flex: 1 }}>
                          <FilterChip label={l.replace("Primary ", "P")} active={config.level === l} square onClick={() => setConfig((prev) => ({ ...prev, level: l }))} />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Stack>

                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.125 }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#6F675E" }}>Topics</Typography>
                    <Typography sx={{ fontSize: 11, color: "#A09488" }}>{config.topics.length} selected</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                    {topicListFor(config.subject).map((t) => (
                      <FilterChip key={t.name} label={t.short} active={config.topics.includes(t.name)} onClick={() => toggleTopic(t.name)} />
                    ))}
                  </Stack>
                </Box>

                <Stack direction="row" spacing={2.25} sx={{ flexWrap: "wrap", gap: 2.25, mb: 3 }}>
                  <Box sx={{ flex: "1 1 200px" }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#6F675E", mb: 1.125 }}>Number of questions</Typography>
                    <Stack direction="row" spacing={0.875}>
                      {COUNT_OPTIONS.map((v) => (
                        <Box key={v} sx={{ flex: 1 }}>
                          <FilterChip
                            label={String(v)}
                            active={config.count === v}
                            square
                            onClick={() => {
                              setConfig((prev) => ({ ...prev, count: v }));
                              setQuestions(null);
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                  <Box sx={{ flex: "1 1 200px" }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#6F675E", mb: 1.125 }}>Paper format</Typography>
                    <Stack direction="row" spacing={0.875}>
                      {BOOKLET_OPTIONS.map((v) => (
                        <Box key={v} sx={{ flex: 1 }}>
                          <FilterChip label={v} active={config.booklet === v} square onClick={() => setConfig((prev) => ({ ...prev, booklet: v }))} />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Stack>

                <Box>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#6F675E", mb: 1.125 }}>Question types</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                    {TYPE_OPTIONS.map((t) => (
                      <FilterChip key={t} label={t} active={config.types.includes(t)} onClick={() => toggleType(t)} />
                    ))}
                  </Stack>
                </Box>
              </Box>

              <Stack sx={{ flex: "0 1 320px", gap: 1.75 }}>
                <Box sx={{ backgroundColor: "#1B1917", borderRadius: "14px", p: 2.5 }}>
                  <Stack direction="row" spacing={1.125} sx={{ alignItems: "center", mb: 1.75 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: "#E08A72", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                      <AutoAwesomeIcon sx={{ fontSize: 11, color: "#1B1917" }} />
                    </Box>
                    <Typography sx={{ fontSize: 10.5, letterSpacing: "0.13em", fontWeight: 600, color: "#A09488" }}>AI RECOMMENDS</Typography>
                  </Stack>
                  <Stack spacing={1.5}>
                    {genReasons.map((r) => (
                      <Box key={r.title} sx={{ borderLeft: "2px solid #3A362F", pl: 1.5 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#E8E2D9", mb: 0.5 }}>{r.title}</Typography>
                        <Typography sx={{ fontSize: 11.5, lineHeight: 1.55, color: "#8F877D" }}>{r.body}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
                <ButtonBase
                  onClick={() => setConfig((prev) => ({ ...prev, useAI: !prev.useAI }))}
                  sx={{ justifyContent: "flex-start", gap: 1.375, backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "12px", px: 2, py: 1.75, textAlign: "left" }}
                >
                  <ToggleSwitch on={config.useAI} />
                  <Box>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 500, mb: 0.375 }}>Apply AI recommendations</Typography>
                    <Typography sx={{ fontSize: 11, color: "#8B837A", lineHeight: 1.5 }}>
                      {config.useAI ? "Topics, mix and difficulty pre-filled from performance data." : "Manual configuration only — no data-driven pre-fill."}
                    </Typography>
                  </Box>
                </ButtonBase>
              </Stack>
            </Stack>

            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <ButtonBase onClick={() => setStep(0)} sx={{ border: "1px solid #E4DCD0", borderRadius: "10px", px: 2.75, py: 1.625, fontSize: 13.5, fontWeight: 500, color: "#6F675E", "&:hover": { backgroundColor: "#F4EFE6" } }}>
                Back
              </ButtonBase>
              <ButtonBase
                onClick={() => {
                  setQuestions(buildQuestions(config));
                  setStep(2);
                }}
                sx={{ backgroundColor: "#9E3A24", color: "#FBF9F5", borderRadius: "10px", px: 3, py: 1.625, fontSize: 13.5, fontWeight: 500, gap: 1.125, "&:hover": { backgroundColor: "#8A3120" } }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                Generate with AI
              </ButtonBase>
            </Stack>
          </Box>
        )}

        {step === 2 && (
          <Box>
            <Box sx={{ textAlign: "center", mb: 3.5 }}>
              <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 31, fontWeight: 500, letterSpacing: "-0.02em", mb: 1.125 }}>
                AI Recommendation Preview
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: "#8B837A" }}>
                Review the generated structure for {targetName} before any questions are written.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ mb: 2.5 }}>
              <Stack sx={{ flex: "1 1 460px", gap: 2.5 }}>
                <Box sx={{ backgroundColor: "#1B1917", borderRadius: "14px", p: "24px 26px" }}>
                  <Stack direction="row" spacing={1.125} sx={{ alignItems: "center", mb: 1.75 }}>
                    <AutoAwesomeIcon sx={{ fontSize: 15, color: "#E08A72" }} />
                    <Typography sx={{ fontSize: 10.5, letterSpacing: "0.13em", fontWeight: 600, color: "#A09488" }}>AI INSIGHT</Typography>
                  </Stack>
                  <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 21, fontWeight: 500, lineHeight: 1.4, color: "#FBF9F5", mb: 2.25 }}>
                    This worksheet balances confidence-building with targeted challenge.
                  </Typography>
                  <Stack direction="row" spacing={1.625} sx={{ backgroundColor: "#282522", borderRadius: "10px", p: "15px 17px", alignItems: "flex-start" }}>
                    <InitialsAvatar
                      initials={studentTarget ? studentTarget.initials : targetName.replace(/[^A-Z0-9]/g, "").slice(0, 2)}
                      bg={targetIsStudent ? "#D8B384" : "#C6D0C4"}
                      size={26}
                      fontSize={10}
                    />
                    <Typography sx={{ fontSize: 12.5, lineHeight: 1.65, color: "#A8A096" }}>
                      {studentTarget
                        ? `Includes extra keyword questions selected for ${targetName} based on recent phrasing issues in past papers.`
                        : `Same paper for all ${classTarget?.count ?? ""} students, weighted to the two topics the class scores lowest on.`}
                    </Typography>
                  </Stack>
                </Box>

                <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", p: "22px 24px" }}>
                  <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 500, mb: 2.25 }}>Worksheet Composition</Typography>
                  <Typography sx={{ fontSize: 10.5, letterSpacing: "0.11em", fontWeight: 600, color: "#A09488", mb: 1.5 }}>SELECTED TOPICS</Typography>
                  <Stack>
                    {composition.map((t) => (
                      <Stack key={t.name} direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1.5, py: 1.5, borderBottom: "1px solid #F3EDE4" }}>
                        <Stack direction="row" spacing={1.125} sx={{ alignItems: "center", fontSize: 13.5 }}>
                          <Box sx={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: t.dot, flex: "0 0 auto" }} />
                          {t.name}
                        </Stack>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#6F675E" }}>{t.qs} Qs</Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", pt: 1.875 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>Total Questions</Typography>
                    <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 19, fontWeight: 600 }}>{config.count} Questions</Typography>
                  </Stack>
                </Box>
              </Stack>

              <Stack sx={{ flex: "0 1 320px", gap: 2 }}>
                <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", p: "20px 22px" }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2.25 }}>Question Mix</Typography>
                  <Stack spacing={1.875}>
                    {mix.map((m) => (
                      <Box key={m.label}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", fontSize: 12.5, mb: 0.875 }}>
                          <Typography sx={{ color: "#4A443D", fontSize: 12.5 }}>{m.label}</Typography>
                          <Typography sx={{ fontWeight: 600, fontSize: 12.5 }}>{m.pct}%</Typography>
                        </Stack>
                        <Box sx={{ height: 4, backgroundColor: "#F0EAE0", borderRadius: "20px", overflow: "hidden" }}>
                          <Box sx={{ height: "100%", width: `${m.pct}%`, backgroundColor: m.color, borderRadius: "20px" }} />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                  <Typography sx={{ fontSize: 11.5, lineHeight: 1.6, color: "#8B837A", borderTop: "1px solid #F3EDE4", mt: 2.25, pt: 1.75 }}>
                    {targetIsStudent
                      ? `Weighted towards foundation because ${targetName.split(" ")[0]} scores well on recall but loses marks on phrasing.`
                      : "Mix adjusted for the class average reading comprehension level."}
                  </Typography>
                </Box>

                <Stack sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", p: 2.25, gap: 1.125 }}>
                  <ButtonBase
                    onClick={() => setStep(4)}
                    sx={{ justifyContent: "center", gap: 1.125, backgroundColor: "#9E3A24", color: "#FBF9F5", borderRadius: "10px", py: 1.625, fontSize: 13.5, fontWeight: 500, "&:hover": { backgroundColor: "#8A3120" } }}
                  >
                    <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                    Approve Worksheet
                  </ButtonBase>
                  <Stack direction="row" spacing={1.125}>
                    <ButtonBase
                      onClick={() => {
                        setQuestions(buildQuestions(config).slice().reverse());
                        showToast("Regenerated with a different question selection.");
                      }}
                      sx={{ flex: 1, justifyContent: "center", gap: 0.875, backgroundColor: "#FBF9F5", border: "1px solid #E4DCD0", borderRadius: "10px", py: 1.375, fontSize: 12.5, fontWeight: 500, color: "#2A2622", "&:hover": { backgroundColor: "#F4EFE6" } }}
                    >
                      <RefreshIcon sx={{ fontSize: 15 }} />
                      Regenerate
                    </ButtonBase>
                    <ButtonBase
                      onClick={() => setStep(3)}
                      sx={{ flex: 1, justifyContent: "center", gap: 0.875, backgroundColor: "#FBF9F5", border: "1px solid #E4DCD0", borderRadius: "10px", py: 1.375, fontSize: 12.5, fontWeight: 500, color: "#2A2622", "&:hover": { backgroundColor: "#F4EFE6" } }}
                    >
                      <EditIcon sx={{ fontSize: 14 }} />
                      Edit Qs
                    </ButtonBase>
                  </Stack>
                  <ButtonBase onClick={() => setStep(1)} sx={{ py: 0.75, fontSize: 12, color: "#A09488" }}>
                    Change configuration
                  </ButtonBase>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        )}

        {step === 3 && (
          <Box>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ alignItems: { xs: "flex-start", sm: "flex-end" }, justifyContent: "space-between", mb: 3 }}
            >
              <Box>
                <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 31, fontWeight: 500, letterSpacing: "-0.02em", mb: 1 }}>
                  Worksheet Editor
                </Typography>
                <Typography sx={{ fontSize: 13.5, color: "#8B837A" }}>
                  {genQuestions.length} questions · {targetName} · nothing is sent until you approve.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.125} sx={{ flexWrap: "wrap", gap: 1.125 }}>
                <ButtonBase
                  onClick={() => router.push("/question-bank")}
                  sx={{ gap: 1, backgroundColor: "#FFFDFA", border: "1px solid #E4DCD0", borderRadius: "9px", px: 1.875, py: 1.25, fontSize: 12.5, fontWeight: 500, color: "#2A2622", "&:hover": { backgroundColor: "#F4EFE6" } }}
                >
                  <LibraryAddIcon sx={{ fontSize: 16 }} />
                  Add from Question Bank
                </ButtonBase>
                <ButtonBase
                  onClick={() => {
                    const pool = questionPoolFor(config.subject);
                    const alt = pool.find((q) => !genQuestions.some((existing) => existing.text === q.text));
                    if (!alt) {
                      showToast("The bank has no further questions matching this configuration.");
                      return;
                    }
                    setQuestions([...genQuestions, { ...alt, id: `ai${Date.now()}`, aiAdded: true }]);
                    showToast(`AI added one question targeting ${alt.topic}.`);
                  }}
                  sx={{ gap: 1, backgroundColor: "#FFFDFA", border: "1px solid #E4DCD0", borderRadius: "9px", px: 1.875, py: 1.25, fontSize: 12.5, fontWeight: 500, color: "#2A2622", "&:hover": { backgroundColor: "#F4EFE6" } }}
                >
                  <AutoAwesomeIcon sx={{ fontSize: 15, color: "#E08A72" }} />
                  Generate another AI question
                </ButtonBase>
              </Stack>
            </Stack>

            <Stack spacing={1.375} sx={{ mb: 3 }}>
              {genQuestions.map((q, i) => {
                const diffStyle = DIFFICULTY_STYLE[q.difficulty];
                return (
                  <Stack key={q.id} direction="row" spacing={2} sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "12px", p: "16px 18px", alignItems: "flex-start" }}>
                    <Stack sx={{ alignItems: "center", gap: 0.375, flex: "0 0 auto" }}>
                      <ButtonBase
                        onClick={() => {
                          if (!i) return;
                          const next = genQuestions.slice();
                          next.splice(i - 1, 0, next.splice(i, 1)[0]);
                          setQuestions(next);
                        }}
                        sx={{ color: "#BCB1A3", p: 0.25, "&:hover": { color: "#6F675E" } }}
                      >
                        <ArrowDropUpIcon sx={{ fontSize: 20 }} />
                      </ButtonBase>
                      <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 15, fontWeight: 600, color: "#6F675E", width: 20, textAlign: "center" }}>
                        {i + 1}
                      </Typography>
                      <ButtonBase
                        onClick={() => {
                          if (i === genQuestions.length - 1) return;
                          const next = genQuestions.slice();
                          next.splice(i + 1, 0, next.splice(i, 1)[0]);
                          setQuestions(next);
                        }}
                        sx={{ color: "#BCB1A3", p: 0.25, "&:hover": { color: "#6F675E" } }}
                      >
                        <ArrowDropDownIcon sx={{ fontSize: 20 }} />
                      </ButtonBase>
                    </Stack>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={0.875} sx={{ flexWrap: "wrap", alignItems: "center", gap: 0.875, mb: 1.125 }}>
                        <Typography component="span" sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, px: 1.125, py: 0.5, borderRadius: "20px", backgroundColor: "#F0EAE0", color: "#6F675E" }}>
                          {q.type}
                        </Typography>
                        <Typography component="span" sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, px: 1.125, py: 0.5, borderRadius: "20px", backgroundColor: diffStyle.bg, color: diffStyle.color }}>
                          {q.difficulty}
                        </Typography>
                        <Typography component="span" sx={{ fontSize: 11, color: "#A09488" }}>
                          {q.topic}
                        </Typography>
                        {q.aiAdded && (
                          <Typography component="span" sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, px: 1.125, py: 0.5, borderRadius: "20px", backgroundColor: "#F1D9D1", color: "#9E3A24" }}>
                            AI ADDED
                          </Typography>
                        )}
                      </Stack>
                      <Typography sx={{ fontSize: 13.5, lineHeight: 1.6, color: "#2A2622", mb: 0.625 }}>{q.text}</Typography>
                      <Typography sx={{ fontSize: 11.5, color: "#A09488" }}>
                        {q.marks} marks · targets {q.targets}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.625} sx={{ flex: "0 0 auto" }}>
                      <ButtonBase
                        onClick={() => showToast(`Question ${i + 1} opened for editing — text, marks and model answer.`)}
                        sx={{ backgroundColor: "#FBF9F5", border: "1px solid #EBE4D9", borderRadius: "7px", width: 30, height: 30, display: "grid", placeItems: "center", color: "#6F675E", "&:hover": { backgroundColor: "#F4EFE6" } }}
                      >
                        <EditIcon sx={{ fontSize: 15 }} />
                      </ButtonBase>
                      <ButtonBase
                        onClick={() => {
                          const pool = questionPoolFor(config.subject);
                          const alt = pool.find((x) => !genQuestions.some((y) => y.text === x.text));
                          if (!alt) {
                            showToast("No alternative questions left in this topic.");
                            return;
                          }
                          const next = genQuestions.slice();
                          next[i] = { ...alt, id: `r${i}-${Date.now()}` };
                          setQuestions(next);
                          showToast(`Question ${i + 1} replaced from the question bank.`);
                        }}
                        sx={{ backgroundColor: "#FBF9F5", border: "1px solid #EBE4D9", borderRadius: "7px", width: 30, height: 30, display: "grid", placeItems: "center", color: "#6F675E", "&:hover": { backgroundColor: "#F4EFE6" } }}
                      >
                        <RefreshIcon sx={{ fontSize: 15 }} />
                      </ButtonBase>
                      <ButtonBase
                        onClick={() => {
                          if (genQuestions.length <= 1) return;
                          setQuestions(genQuestions.filter((_, j) => j !== i));
                          showToast("Question removed.");
                        }}
                        sx={{ backgroundColor: "#FBF9F5", border: "1px solid #EBE4D9", borderRadius: "7px", width: 30, height: 30, display: "grid", placeItems: "center", color: "#B4573F", "&:hover": { backgroundColor: "#F7E3DC" } }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                      </ButtonBase>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>

            <Stack direction="row" spacing={1.25} sx={{ flexWrap: "wrap", gap: 1.25, alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "12px", p: "16px 20px" }}>
              <Typography sx={{ fontSize: 12.5, color: "#8B837A" }}>
                {genQuestions.length} questions · {markTotal} marks total
              </Typography>
              <Stack direction="row" spacing={1.25} sx={{ flexWrap: "wrap", gap: 1.25 }}>
                <ButtonBase onClick={() => setStep(2)} sx={{ border: "1px solid #E4DCD0", borderRadius: "10px", px: 2.5, py: 1.5, fontSize: 13, fontWeight: 500, color: "#6F675E", "&:hover": { backgroundColor: "#F4EFE6" } }}>
                  Back to preview
                </ButtonBase>
                <ButtonBase
                  onClick={() => {
                    setStep(4);
                    showToast("Worksheet approved and exported.");
                  }}
                  sx={{ gap: 1.125, backgroundColor: "#9E3A24", color: "#FBF9F5", borderRadius: "10px", px: 2.75, py: 1.5, fontSize: 13.5, fontWeight: 500, "&:hover": { backgroundColor: "#8A3120" } }}
                >
                  <CheckIcon sx={{ fontSize: 16 }} />
                  Approve &amp; Export Worksheet
                </ButtonBase>
              </Stack>
            </Stack>
          </Box>
        )}

        {step === 4 && (
          <Box sx={{ maxWidth: 600, mx: "auto", mt: 5, textAlign: "center" }}>
            <Box sx={{ width: 58, height: 58, borderRadius: "50%", backgroundColor: "#E4EDE4", display: "grid", placeItems: "center", mx: "auto", mb: 2.75 }}>
              <CheckIcon sx={{ fontSize: 26, color: "#4A6B50" }} />
            </Box>
            <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 31, fontWeight: 500, letterSpacing: "-0.02em", mb: 1.375 }}>
              Worksheet approved
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#8B837A", lineHeight: 1.65, mb: 3.5 }}>
              {exportName} is ready. {genQuestions.length} questions, {markTotal} marks, assigned to {targetName}.
            </Typography>

            <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", p: 2.75, textAlign: "left", mb: 2.5 }}>
              <Stack direction="row" spacing={1.75} sx={{ alignItems: "center", pb: 2, borderBottom: "1px solid #F3EDE4", mb: 2 }}>
                <Box sx={{ width: 38, height: 48, borderRadius: "5px", backgroundColor: "#F4EFE6", border: "1px solid #E4DCD0", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                  <AutoAwesomeIcon sx={{ fontSize: 17, color: "#B4573F" }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 0.5 }}>{exportName}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: "#A09488" }}>PDF · answer key included · {genQuestions.length} questions</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.125} sx={{ flexWrap: "wrap", gap: 1.125 }}>
                {[
                  { label: "Download PDF", msg: "PDF downloaded with answer key." },
                  { label: "Assign to students", msg: "Assigned. Students will see it in their portal tonight." },
                  { label: "Print", msg: "Sent to the centre printer." },
                ].map((a) => (
                  <ButtonBase
                    key={a.label}
                    onClick={() => showToast(a.msg)}
                    sx={{ flex: "1 1 150px", justifyContent: "center", backgroundColor: "#FBF9F5", border: "1px solid #E4DCD0", borderRadius: "9px", py: 1.375, fontSize: 12.5, fontWeight: 500, color: "#2A2622", "&:hover": { backgroundColor: "#F4EFE6" } }}
                  >
                    {a.label}
                  </ButtonBase>
                ))}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1.25} sx={{ flexWrap: "wrap", gap: 1.25, justifyContent: "center" }}>
              <ButtonBase
                onClick={() => router.push("/upload")}
                sx={{ gap: 1, backgroundColor: "#E08A72", color: "#FFFDFA", borderRadius: "10px", px: 2.5, py: 1.5, fontSize: 13.5, fontWeight: 500, "&:hover": { backgroundColor: "#D2795F" } }}
              >
                Upload a completed copy
              </ButtonBase>
              <ButtonBase
                onClick={() => router.push("/")}
                sx={{ border: "1px solid #E4DCD0", borderRadius: "10px", px: 2.5, py: 1.5, fontSize: 13, fontWeight: 500, color: "#6F675E", "&:hover": { backgroundColor: "#F4EFE6" } }}
              >
                Back to dashboard
              </ButtonBase>
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
}
