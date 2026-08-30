"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";

import { fetchLearningProfile, type LearningProfile } from "@/services/insights";

const dimensionLabels = { CONCEPT: "Concept", KEYWORD: "Keywords", EXPRESSION: "Expression", APPLICATION: "Application" } as const;

export default function SubjectProfilePage() {
  const [profile, setProfile] = React.useState<LearningProfile | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const load = React.useCallback(async () => {
    setError(null);
    try { setProfile(await fetchLearningProfile()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Subject profile could not be loaded."); }
  }, []);
  React.useEffect(() => {
    let current = true;
    const request = async () => {
      try { const loaded = await fetchLearningProfile(); if (current) setProfile(loaded); }
      catch (reason) { if (current) setError(reason instanceof Error ? reason.message : "Subject profile could not be loaded."); }
    };
    void request();
    return () => { current = false; };
  }, []);

  return <Box sx={{ minHeight: "100vh", bgcolor: "#F7F4EF", px: { xs: 2.5, sm: 3.75 }, py: 3.75, color: "#2A2622" }}><Box sx={{ maxWidth: 1120, mx: "auto" }}>
    <Typography sx={{ color: "#A09488", fontSize: 10.5, fontWeight: 600, letterSpacing: ".13em", mb: .75 }}>SUBJECT PROFILE</Typography>
    <Typography component="h1" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: { xs: 32, sm: 40 }, fontWeight: 500, mb: .65 }}>My learning profile</Typography>
    <Typography sx={{ color: "#6F675E", fontSize: 14, mb: 2.5 }}>A factual summary of tutor-approved learning evidence.</Typography>
    {!profile && !error ? <Card aria-label="Loading subject profile" variant="outlined" sx={{ borderColor: "#EBE4D9", bgcolor: "#FFFDFA", p: 2.5 }}><Skeleton height={34} width="38%" /><Skeleton height={130} sx={{ mt: 1 }} /></Card> : null}
    {error ? <Card component="section" role="alert" variant="outlined" sx={{ borderColor: "#F0DCD4", bgcolor: "#FDF6F3", p: 2.5 }}><Typography component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, mb: .7 }}>Subject profile could not be loaded</Typography><Typography sx={{ color: "#6F675E", fontSize: 13, mb: 1.2 }}>{error}</Typography><Button onClick={() => void load()} variant="outlined" sx={{ borderColor: "#E4DCD0", color: "#2A2622", textTransform: "none" }}>Try again</Button></Card> : null}
    {profile ? <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5, alignItems: "flex-start" }}>
      <Card component="section" variant="outlined" sx={{ flex: "1 1 440px", borderColor: "#EBE4D9", bgcolor: "#FFFDFA", borderRadius: "14px", p: 2.5, boxShadow: "none" }}><Typography component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, mb: 1.25 }}>Strengths</Typography>{profile.strengths.length ? <Box sx={{ display: "grid", gap: 1 }}>{profile.strengths.map((topic) => <Box key={topic.topicId} sx={{ borderLeft: "2px solid #DCE4DC", pl: 1.25 }}><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{topic.topicName}</Typography><Typography sx={{ color: "#6F675E", fontSize: 12 }}>{Math.round(topic.score)}% mastery · {topic.attemptCount} approved attempts</Typography></Box>)}</Box> : <Typography role="status" sx={{ color: "#6F675E", fontSize: 13 }}>Strengths will appear after more approved evidence.</Typography>}</Card>
      <Card component="section" variant="outlined" sx={{ flex: "1 1 320px", borderColor: "#EBE4D9", bgcolor: "#FFFDFA", borderRadius: "14px", p: 2.5, boxShadow: "none" }}><Typography component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, mb: 1.25 }}>Topics to focus on</Typography>{profile.growthAreas.length ? <Box sx={{ display: "grid", gap: 1 }}>{profile.growthAreas.map((topic) => <Box key={topic.topicId} sx={{ borderLeft: "2px solid #EDD9D2", pl: 1.25 }}><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{topic.topicName}</Typography><Typography sx={{ color: "#9E3A24", fontSize: 12 }}>{Math.round(topic.score)}% mastery</Typography></Box>)}</Box> : <Typography role="status" sx={{ color: "#6F675E", fontSize: 13 }}>No focus topics are identified yet.</Typography>}</Card>
      <Card component="section" variant="outlined" sx={{ flex: "1 1 320px", borderColor: "#EBE4D9", bgcolor: "#FFFDFA", borderRadius: "14px", p: 2.5, boxShadow: "none" }}><Typography component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, mb: 1.25 }}>Making progress</Typography>{profile.improvements.length ? <Box sx={{ display: "grid", gap: 1 }}>{profile.improvements.map((topic) => <Box key={topic.topicId} sx={{ borderLeft: "2px solid #D8E4EF", pl: 1.25 }}><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{topic.topicName}</Typography><Typography sx={{ color: "#4B667C", fontSize: 12 }}>{Math.round(topic.score)}% mastery · {topic.attemptCount} approved attempts</Typography></Box>)}</Box> : <Typography role="status" sx={{ color: "#6F675E", fontSize: 13 }}>Improvement will appear after an approved mastery update.</Typography>}</Card>
      <Card component="section" aria-labelledby="learning-dimensions-heading" variant="outlined" sx={{ flex: "1 1 100%", borderColor: "#EBE4D9", bgcolor: "#FFFDFA", borderRadius: "14px", p: 2.5, boxShadow: "none" }}><Typography sx={{ color: "#A09488", fontSize: 10, fontWeight: 700, letterSpacing: ".11em", mb: .65 }}>TUTOR-CONFIRMED DIAGNOSTICS</Typography><Typography id="learning-dimensions-heading" component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, mb: 1.25 }}>Learning dimensions</Typography><Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 1 }}>{profile.dimensions.map((dimension) => <Box key={dimension.category} sx={{ p: 1.35, border: "1px solid #EFE8DE", borderRadius: "10px", bgcolor: "#FBF9F5" }}><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{dimensionLabels[dimension.category]}</Typography><Typography sx={{ color: "#5A544C", fontSize: 12.5, mt: .3 }}>{dimension.evidenceCount ? `${dimension.evidenceCount} tutor-confirmed diagnostic ${dimension.evidenceCount === 1 ? "record" : "records"}.` : "No tutor-confirmed diagnostic evidence yet."}</Typography>{dimension.evidence.length ? <Typography sx={{ color: "#8B837A", fontSize: 11, mt: .7 }}>Latest evidence: {dimension.evidence[0].topicName} · {dimension.evidence[0].sourceReason}</Typography> : null}</Box>)}</Box></Card>
      <Card component="section" aria-labelledby="subject-priorities-heading" variant="outlined" sx={{ flex: "1 1 100%", borderColor: "#EBE4D9", bgcolor: "#FFFDFA", borderRadius: "14px", p: 2.5, boxShadow: "none" }}><Typography sx={{ color: "#A09488", fontSize: 10, fontWeight: 700, letterSpacing: ".11em", mb: .65 }}>EVIDENCE-LED PRIORITIES</Typography><Typography id="subject-priorities-heading" component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, mb: 1.25 }}>What to practise next</Typography>{profile.findings.length ? <Box sx={{ display: "grid", gap: 1.1 }}>{profile.findings.map((finding) => <Box key={`${finding.type}-${finding.evidence[0].topicId}`} sx={{ p: 1.35, border: "1px solid #EFE8DE", borderRadius: "10px", bgcolor: "#FBF9F5" }}><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{finding.title}</Typography><Typography sx={{ color: "#5A544C", fontSize: 12.5, mt: .3 }}>{finding.summary}</Typography><Typography sx={{ color: "#9E3A24", fontSize: 12, fontWeight: 600, mt: .6 }}>{finding.suggestedAction}</Typography><Typography sx={{ color: "#8B837A", fontSize: 10.5, mt: .75 }}>Evidence: {finding.evidence.map((item) => `${item.topicName} · ${Math.round(item.score)}%`).join("; ")}</Typography></Box>)}</Box> : <Typography role="status" sx={{ color: "#6F675E", fontSize: 13 }}>No approved evidence is available for learning priorities yet.</Typography>}</Card>
    </Box> : null}
  </Box></Box>;
}
