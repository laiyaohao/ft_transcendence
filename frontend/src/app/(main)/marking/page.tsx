"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ReplayIcon from "@mui/icons-material/Replay";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { useRouter } from "next/navigation";
import { MARKING_QUESTIONS } from "@/data/marking-data";
import { useToast } from "@/providers/toast-provider";

type Decision = { score: string; feedback: string };

export default function MarkingReviewPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [index, setIndex] = React.useState(0);
  const [decisions, setDecisions] = React.useState<Record<string, Decision>>({});
  const [scoreDraft, setScoreDraft] = React.useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = React.useState<string | null>(null);

  const q = MARKING_QUESTIONS[index];
  const decision = decisions[q.id];
  const score = scoreDraft ?? decision?.score ?? String(q.aiScore);
  const feedback = feedbackDraft ?? decision?.feedback ?? q.aiFeedback;

  const approvedCount = MARKING_QUESTIONS.filter((mq) => decisions[mq.id]).length;
  const allApproved = approvedCount === MARKING_QUESTIONS.length;

  const scoreSteps: number[] = [];
  for (let v = 0; v <= q.max; v += q.max >= 3 ? 1 : 0.5) scoreSteps.push(v);
  if (scoreSteps[scoreSteps.length - 1] !== q.max) scoreSteps.push(q.max);

  const jumpTo = (i: number) => {
    setIndex(i);
    setScoreDraft(null);
    setFeedbackDraft(null);
  };

  const resetToAI = () => {
    setScoreDraft(q.aiScore.toFixed(1));
    setFeedbackDraft(q.aiFeedback);
    showToast("Reset to the AI suggestion.");
  };

  const approveNext = () => {
    const next = { ...decisions, [q.id]: { score, feedback } };
    const isLast = index >= MARKING_QUESTIONS.length - 1;
    setDecisions(next);
    setScoreDraft(null);
    setFeedbackDraft(null);
    if (!isLast) setIndex(index + 1);
    showToast(
      isLast
        ? "All questions approved — save to update the learning profile."
        : `Question ${index + 1} approved at ${score}/${q.max.toFixed(1)}.`
    );
  };

  const saveProfile = () => {
    if (!allApproved) {
      showToast("Approve every question before saving to the profile.");
      return;
    }
    showToast("Learning profile updated — mastery, topic map and weak areas recalculated.");
    router.push("/students/s1");
  };

  return (
    <Box sx={{ backgroundColor: "#F7F4EF", minHeight: "100vh", py: 5, px: { xs: 2, sm: 4, md: 6 } }}>
      <Box sx={{ maxWidth: 1280, mx: "auto" }}>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", alignItems: "center", mb: 1.5, gap: 1.5 }}>
          <Stack
            direction="row"
            spacing={0.875}
            sx={{ alignItems: "center", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em", px: 1.375, py: 0.625, borderRadius: "20px", backgroundColor: "#F7E3DC", color: "#9E3A24" }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 13 }} />
            AI REVIEW REQUIRED
          </Stack>
          <Typography sx={{ fontSize: 12.5, color: "#6F675E" }}>P5 Science — Adaptation Mini Test</Typography>
          <Typography sx={{ color: "#CFC4B4" }}>·</Typography>
          <ButtonBase onClick={() => router.push("/students/s1")} sx={{ fontSize: 12.5, fontWeight: 500, color: "#B4573F" }}>
            Student: Bella Tan
          </ButtonBase>
        </Stack>

        <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 31, fontWeight: 500, letterSpacing: "-0.02em", mb: 2.25 }}>
          Review AI Marking Suggestions
        </Typography>

        <Stack
          direction="row"
          spacing={1.625}
          sx={{ alignItems: "flex-start", backgroundColor: "#F6EFE6", borderLeft: "3px solid #B4573F", borderRadius: "0 10px 10px 0", p: "15px 20px", mb: 3 }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 17, color: "#B4573F", mt: 0.125 }} />
          <Typography sx={{ fontSize: 13, lineHeight: 1.65, color: "#5A544C" }}>
            AI suggestions require tutor approval before they affect the student profile. Nothing below is saved to Bella&apos;s mastery scores until you approve it.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.125} sx={{ alignItems: "center", flexWrap: "wrap", mb: 2.25, gap: 1.125 }}>
          {MARKING_QUESTIONS.map((mq, i) => {
            const done = !!decisions[mq.id];
            const now = i === index;
            return (
              <ButtonBase
                key={mq.id}
                onClick={() => jumpTo(i)}
                sx={{
                  gap: 1,
                  backgroundColor: now ? "#F4E4DE" : done ? "#E9EEE8" : "#FFFDFA",
                  border: `1px solid ${now ? "#E0B9AC" : done ? "#D5E0D5" : "#EBE4D9"}`,
                  color: now ? "#9E3A24" : done ? "#4A6B50" : "#6F675E",
                  borderRadius: "20px",
                  pl: 0.75,
                  pr: 1.625,
                  py: 0.75,
                }}
              >
                <Box
                  sx={{
                    width: 19,
                    height: 19,
                    borderRadius: "50%",
                    backgroundColor: done ? "#5C7A63" : now ? "#9E3A24" : "#F0EAE0",
                    color: done || now ? "#FBF9F5" : "#A09488",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    flex: "0 0 auto",
                  }}
                >
                  {done ? "✓" : i + 1}
                </Box>
                <Typography sx={{ fontSize: 11.5, fontWeight: 500 }}>Q{i + 1}</Typography>
              </ButtonBase>
            );
          })}
          <Typography sx={{ fontSize: 11.5, color: "#A09488", ml: 0.5 }}>
            {approvedCount} of {MARKING_QUESTIONS.length} approved
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} sx={{ alignItems: "flex-start" }}>
          <Stack sx={{ flex: "1 1 520px", width: "100%", gap: 2 }}>
            <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", p: "22px 24px" }}>
              <Stack direction="row" spacing={2.5} sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 10.5, letterSpacing: "0.13em", fontWeight: 600, color: "#A09488", mb: 1.125 }}>
                    QUESTION {index + 1} · {q.type}
                  </Typography>
                  <Typography sx={{ fontSize: 16, lineHeight: 1.6, color: "#2A2622" }}>{q.text}</Typography>
                </Box>
                <Box sx={{ textAlign: "right", flex: "0 0 auto" }}>
                  <Typography sx={{ fontSize: 10, color: "#A09488", lineHeight: 1.3, mb: 0.375 }}>
                    Max
                    <br />
                    Score
                  </Typography>
                  <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 600 }}>{q.max}</Typography>
                </Box>
              </Stack>
              <Typography sx={{ fontSize: 11.5, color: "#A09488", mb: 2.75 }}>Topic: {q.topic}</Typography>
              <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap", borderTop: "1px solid #F0EAE0", pt: 2.5, gap: 3 }}>
                <Box sx={{ flex: "1 1 220px" }}>
                  <Stack direction="row" spacing={0.875} sx={{ alignItems: "center", fontSize: 11.5, fontWeight: 600, color: "#6F675E", mb: 1.5 }}>
                    <PersonOutlineIcon sx={{ fontSize: 16, color: "#A09488" }} />
                    Student Answer
                  </Stack>
                  <Box sx={{ backgroundColor: "#FBF9F5", border: "1px solid #EFE8DE", borderRadius: "9px", p: "14px 16px", fontSize: 13.5, lineHeight: 1.7, color: "#4A443D" }}>
                    {q.answer}
                  </Box>
                </Box>
                <Box sx={{ flex: "1 1 220px" }}>
                  <Stack direction="row" spacing={0.875} sx={{ alignItems: "center", fontSize: 11.5, fontWeight: 600, color: "#6F675E", mb: 1.5 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 16, color: "#A09488" }} />
                    Model Answer Elements
                  </Stack>
                  <Stack spacing={1.375}>
                    {q.model.map((m) => (
                      <Stack key={m.text} direction="row" spacing={1.125} sx={{ alignItems: "flex-start", fontSize: 12.5, lineHeight: 1.6, color: "#4A443D" }}>
                        <CheckIcon sx={{ fontSize: 15, mt: 0.25, color: m.matched ? "#5C7A63" : "#CFC4B4", flex: "0 0 auto" }} />
                        <span>{m.text}</span>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ backgroundColor: "#1B1917", borderRadius: "14px", p: "22px 24px" }}>
              <Stack direction="row" spacing={1.125} sx={{ alignItems: "center", mb: 2.5 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: "#E08A72", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                  <AutoAwesomeIcon sx={{ fontSize: 11, color: "#1B1917" }} />
                </Box>
                <Typography sx={{ fontSize: 10.5, letterSpacing: "0.13em", fontWeight: 600, color: "#A09488" }}>AI MARKING ANALYSIS</Typography>
                <Typography sx={{ fontSize: 10, color: "#6E665D", ml: "auto" }}>Suggestion only — not saved</Typography>
              </Stack>
              <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap", gap: 3 }}>
                <Box sx={{ flex: "0 0 auto" }}>
                  <Typography sx={{ fontSize: 11, color: "#8F877D", mb: 0.875 }}>Suggested Score</Typography>
                  <Stack direction="row" spacing={0.375} sx={{ alignItems: "baseline" }}>
                    <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 44, fontWeight: 600, color: "#E08A72", lineHeight: 1 }}>
                      {q.aiScore}
                    </Typography>
                    <Typography sx={{ fontSize: 15, color: "#6E665D" }}>/{q.max}</Typography>
                  </Stack>
                </Box>
                <Box sx={{ flex: "1 1 260px" }}>
                  <Typography sx={{ fontSize: 11, color: "#8F877D", mb: 1.125 }}>AI Feedback</Typography>
                  <Typography sx={{ fontSize: 13, lineHeight: 1.7, color: "#B5ADA2" }}>{q.aiFeedback}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.75} sx={{ flexWrap: "wrap", borderTop: "1px solid #2C2925", mt: 2.5, pt: 2.25, gap: 1.75 }}>
                <Box sx={{ flex: "1 1 210px" }}>
                  <Typography sx={{ fontSize: 10, letterSpacing: "0.1em", fontWeight: 600, color: "#6E665D", mb: 1.25 }}>MISSING CONCEPTS</Typography>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75 }}>
                    {q.missing.map((m) => (
                      <Typography key={m} component="span" sx={{ fontSize: 11.5, backgroundColor: "#3A2119", color: "#E0A692", borderRadius: "20px", px: 1.375, py: 0.625 }}>
                        {m}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
                <Box sx={{ flex: "1 1 210px" }}>
                  <Typography sx={{ fontSize: 10, letterSpacing: "0.1em", fontWeight: 600, color: "#6E665D", mb: 1.25 }}>KEYWORD ISSUE</Typography>
                  <Typography sx={{ fontSize: 12, lineHeight: 1.6, color: "#8F877D" }}>{q.keywordIssue}</Typography>
                </Box>
                <Box sx={{ flex: "1 1 210px" }}>
                  <Typography sx={{ fontSize: 10, letterSpacing: "0.1em", fontWeight: 600, color: "#6E665D", mb: 1.25 }}>REASONING</Typography>
                  <Typography sx={{ fontSize: 12, lineHeight: 1.6, color: "#8F877D" }}>{q.reasoning}</Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>

          <Stack sx={{ flex: "0 1 330px", width: "100%", gap: 1.75 }}>
            <Box sx={{ backgroundColor: "#FFFDFA", border: "1px solid #EBE4D9", borderRadius: "14px", p: 2.75 }}>
              <Typography sx={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 500, mb: 2.5 }}>Tutor Decision</Typography>
              <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#6F675E", mb: 1.125 }}>Final Score</Typography>
              <Stack direction="row" spacing={1.375} sx={{ alignItems: "center", mb: 1.5 }}>
                <InputBase
                  value={score}
                  onChange={(e) => setScoreDraft(e.target.value)}
                  sx={{ width: 78, backgroundColor: "#FBF9F5", border: "1px solid #E4DCD0", borderRadius: "8px", px: 1.625, py: 1.375, fontSize: 16, fontWeight: 600, color: "#2A2622", textAlign: "center" }}
                  inputProps={{ style: { textAlign: "center" } }}
                />
                <Typography sx={{ fontSize: 13, color: "#8B837A" }}>out of {q.max}</Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} sx={{ mb: 2.5 }}>
                {scoreSteps.map((v) => {
                  const active = Number(score) === v;
                  return (
                    <ButtonBase
                      key={v}
                      onClick={() => setScoreDraft(v.toFixed(1))}
                      sx={{
                        flex: 1,
                        backgroundColor: active ? "#F4E4DE" : "#FBF9F5",
                        border: `1px solid ${active ? "#E0B9AC" : "#E4DCD0"}`,
                        color: active ? "#9E3A24" : "#5A544C",
                        borderRadius: "7px",
                        py: 0.875,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {v.toFixed(1)}
                    </ButtonBase>
                  );
                })}
              </Stack>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.125 }}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#6F675E" }}>Final Feedback to Student</Typography>
                <ButtonBase onClick={resetToAI} sx={{ gap: 0.625, fontSize: 11, color: "#B4573F" }}>
                  <ReplayIcon sx={{ fontSize: 13 }} />
                  Reset to AI
                </ButtonBase>
              </Stack>
              <InputBase
                value={feedback}
                onChange={(e) => setFeedbackDraft(e.target.value)}
                multiline
                minRows={6}
                sx={{ width: "100%", backgroundColor: "#FBF9F5", border: "1px solid #E4DCD0", borderRadius: "9px", px: 1.75, py: 1.5, fontSize: 12.5, lineHeight: 1.7, color: "#4A443D", mb: 2.25 }}
              />
              <ButtonBase
                onClick={approveNext}
                sx={{ width: "100%", backgroundColor: "#9E3A24", color: "#FBF9F5", borderRadius: "10px", py: 1.75, fontSize: 13.5, fontWeight: 500, gap: 1.125, mb: 1.125, "&:hover": { backgroundColor: "#8A3120" } }}
              >
                <CheckCircleOutlineIcon sx={{ fontSize: 17 }} />
                {index < MARKING_QUESTIONS.length - 1 ? "Approve & Next Question" : "Approve Final Question"}
              </ButtonBase>
              <ButtonBase
                onClick={() => showToast("Flagged. It stays in Pending Review until you come back.")}
                sx={{ width: "100%", backgroundColor: "#FBF9F5", border: "1px solid #E4DCD0", borderRadius: "10px", py: 1.625, fontSize: 13, fontWeight: 500, color: "#2A2622", gap: 1.125, "&:hover": { backgroundColor: "#F4EFE6" } }}
              >
                <BookmarkBorderIcon sx={{ fontSize: 16 }} />
                Flag for Later
              </ButtonBase>
            </Box>

            <Box sx={{ backgroundColor: allApproved ? "#1B1917" : "#FBF9F5", border: `1px solid ${allApproved ? "#1B1917" : "#EBE4D9"}`, borderRadius: "14px", p: 2.5 }}>
              <Typography sx={{ fontSize: 12, lineHeight: 1.6, color: allApproved ? "#A8A096" : "#8B837A", mb: 1.75 }}>
                {allApproved
                  ? `All ${MARKING_QUESTIONS.length} questions approved. Saving writes these scores to Bella's mastery, topic map, weak areas and future worksheet recommendations.`
                  : `Approve all ${MARKING_QUESTIONS.length} questions to unlock. ${approvedCount} of ${MARKING_QUESTIONS.length} done — nothing has been written to the profile yet.`}
              </Typography>
              <ButtonBase
                onClick={saveProfile}
                sx={{
                  width: "100%",
                  backgroundColor: allApproved ? "#E08A72" : "#EDE6DB",
                  color: allApproved ? "#1B1917" : "#B5AA9C",
                  borderRadius: "10px",
                  py: 1.75,
                  fontSize: 13.5,
                  fontWeight: 600,
                  gap: 1.125,
                  cursor: allApproved ? "pointer" : "not-allowed",
                }}
              >
                <SaveOutlinedIcon sx={{ fontSize: 17 }} />
                Save &amp; Update Learning Profile
              </ButtonBase>
            </Box>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
