"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import type { MasteryMapData, MasteryNode, MasteryStatus } from "@/services/mastery";

const statusLabel: Record<MasteryStatus, string> = {
  NOT_STARTED: "Not started",
  LEARNING: "Learning",
  PRACTISING: "Practising",
  IMPROVING: "Improving",
  MASTERED: "Mastered",
  NEEDS_REVISION: "Needs revision",
};

function masteryColour(score: number) {
  return score < 55 ? "#B4573F" : score < 72 ? "#D8B384" : "#93A896";
}

function statusStyle(status: MasteryStatus) {
  if (status === "MASTERED" || status === "IMPROVING") return { bgcolor: "#E4EDE4", color: "#4A6B50" };
  if (status === "NEEDS_REVISION" || status === "LEARNING") return { bgcolor: "#F7E3DC", color: "#9E3A24" };
  return { bgcolor: "#F0EAE0", color: "#6F675E" };
}

interface MasteryBranch {
  node: MasteryNode;
  children: MasteryBranch[];
}

function masteryForest(nodes: MasteryNode[]): MasteryBranch[] {
  const branches = new Map(nodes.map((node) => [node.topicId, { node, children: [] as MasteryBranch[] }]));
  const roots: MasteryBranch[] = [];
  for (const node of nodes) {
    const branch = branches.get(node.topicId)!;
    const parent = node.parentTopicId === null ? undefined : branches.get(node.parentTopicId);
    if (parent) parent.children.push(branch);
    else roots.push(branch);
  }
  return roots;
}

export interface MasteryMapProps {
  data: MasteryMapData;
  /** A tutor link carries the viewed student ID; a student link remains self-scoped. */
  studentId?: number;
  heading?: string;
}

export default function MasteryMap({ data, studentId, heading = "Topic mastery" }: MasteryMapProps) {
  const forest = masteryForest(data.nodes);
  const overall = data.overallScore === null ? "Not calculated" : `${Math.round(data.overallScore)}%`;

  return <Card component="section" aria-labelledby="mastery-map-heading" variant="outlined" sx={{ borderColor: "#EBE4D9", bgcolor: "#FFFDFA", borderRadius: "14px", p: { xs: 2, sm: 2.5 }, boxShadow: "none" }}>
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 1, mb: 1.75 }}>
      <Box>
        <Typography id="mastery-map-heading" component="h2" sx={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 500 }}>{heading}</Typography>
        <Typography sx={{ color: "#6F675E", fontSize: 12.5, mt: .4 }}>Approved learning evidence is shown for every active syllabus topic.</Typography>
      </Box>
      <Typography aria-label={`Overall mastery: ${overall}`} sx={{ color: "#4A443D", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>Overall {overall}</Typography>
    </Box>
    {!forest.length ? <Box role="status" sx={{ p: 2, border: "1px dashed #DCCFBE", borderRadius: "10px", bgcolor: "#FBF9F5" }}><Typography sx={{ color: "#6F675E", fontSize: 13 }}>No active syllabus topics are available yet.</Typography></Box> : <Box sx={{ display: "grid", gap: 1.5 }}>
      {forest.map((branch) => <MasteryBranchView branch={branch} key={branch.node.topicId} studentId={studentId} />)}
    </Box>}
  </Card>;
}

function MasteryBranchView({ branch, studentId }: { branch: MasteryBranch; studentId?: number }) {
  const { node, children } = branch;
  const isLearningNode = node.nodeType === "TOPIC" || node.nodeType === "SUBTOPIC";
  if (!isLearningNode) {
    return <Box component="section" aria-label={`${node.nodeType.toLowerCase()} ${node.topicName}`} sx={{ display: "grid", gap: 1, pl: Math.min(node.depth, 2) * 1.25 }}>
      <Typography component={node.depth === 0 ? "h3" : "h4"} sx={{ color: node.depth === 0 ? "#2A2622" : "#5A544C", fontSize: node.depth === 0 ? 16 : 13, fontWeight: node.depth === 0 ? 700 : 600, letterSpacing: node.depth === 0 ? ".02em" : 0 }}>{node.topicName}</Typography>
      <Box sx={{ display: "grid", gap: 1 }}>{children.map((child) => <MasteryBranchView branch={child} key={child.node.topicId} studentId={studentId} />)}</Box>
    </Box>;
  }
  const focus = node.score < 55 && node.status !== "NOT_STARTED";
  const href = studentId ? `/topics/${node.topicId}?studentId=${studentId}` : `/topics/${node.topicId}`;
  const attempts = node.attemptCount === 1 ? "1 approved attempt" : `${node.attemptCount} approved attempts`;
  return <Box sx={{ display: "grid", gap: 1, pl: Math.max(0, node.depth - 2) * 1.25 }}>
    <Card component={Link} href={href} variant="outlined" aria-label={`${node.topicName}: ${statusLabel[node.status]}, ${Math.round(node.score)}% mastery. Open topic details.`} sx={{ display: "flex", alignItems: "center", gap: { xs: 1.25, sm: 2 }, p: { xs: 1.35, sm: "13px 16px" }, textDecoration: "none", color: "inherit", borderColor: focus ? "#F0DCD4" : "#EFE8DE", bgcolor: focus ? "#FDF6F3" : "#FFFDFA", borderRadius: "10px", "&:focus-visible": { outline: "3px solid #9E3A24", outlineOffset: 2 }, "&:hover": { bgcolor: focus ? "#FBEDE8" : "#FBF7F1" } }}>
      <Typography sx={{ width: 44, flex: "0 0 auto", color: focus ? "#9E3A24" : "#4A443D", fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{Math.round(node.score)}%</Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: .75, mb: .65 }}>
          <Typography sx={{ minWidth: 0, fontSize: 13, fontWeight: 600 }}>{node.topicName}</Typography>
          {focus ? <Chip label="FOCUS AREA" size="small" sx={{ height: 21, bgcolor: "#F1D9D1", color: "#9E3A24", fontSize: 9.5, fontWeight: 700, letterSpacing: ".05em" }} /> : null}
        </Box>
        <LinearProgress aria-label={`${node.topicName} mastery ${Math.round(node.score)}%`} variant="determinate" value={node.score} sx={{ height: 5, borderRadius: 20, bgcolor: "#F0EAE0", ".MuiLinearProgress-bar": { bgcolor: masteryColour(node.score), borderRadius: 20 } }} />
      </Box>
      <Box sx={{ display: "grid", justifyItems: "end", gap: .45, flex: "0 0 auto" }}>
        <Chip label={statusLabel[node.status]} size="small" sx={{ height: 22, fontSize: 9.5, fontWeight: 700, letterSpacing: ".04em", ...statusStyle(node.status) }} />
        <Typography sx={{ color: "#8B837A", fontSize: 10.5 }}>{attempts}</Typography>
      </Box>
    </Card>
    {children.map((child) => <MasteryBranchView branch={child} key={child.node.topicId} studentId={studentId} />)}
  </Box>;
}
