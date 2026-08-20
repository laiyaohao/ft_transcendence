// Mock academic data. Swap for real API calls once the backend is wired up.

export type Subject = "SCIENCE" | "MATHS";

export type ClassTopicScore = {
  name: string;
  short: string;
  mastery: number;
};

export type InsightTone = "high" | "monitor" | "watch";

export type ClassInsight = {
  title: string;
  tag: string;
  tone: InsightTone;
  body: string;
  why: string;
};

export type WorksheetState = "submitted" | "graded";

export type ClassWorksheet = {
  title: string;
  date: string;
  status: string;
  state: WorksheetState;
};

export type SchoolClass = {
  id: string;
  name: string;
  subject: Subject;
  level: string;
  tutor: string;
  schedule: string;
  count: number;
  topics: ClassTopicScore[];
  insights: ClassInsight[];
  worksheets: ClassWorksheet[];
};

export type StudentStatus = "improving" | "consistent" | "practice";

export type StudentTopicScore = {
  name: string;
  short: string;
  pct: number;
};

export type Student = {
  id: string;
  name: string;
  initials: string;
  classId: string;
  status: StudentStatus;
  mastery: number;
  improvement: string;
  completed: number;
  lastAssessment: { pct: number; topic: string };
  topics: StudentTopicScore[];
  strengths: string[];
  growth: string[];
  insight: string;
};

export const AVATAR_COLORS = [
  "#D8B384",
  "#C6D0C4",
  "#E3C3B4",
  "#CFC0D6",
  "#D9CBA8",
  "#BFD0D6",
];

export const STATUS_META: Record<
  StudentStatus,
  { label: string; bg: string; color: string }
> = {
  improving: { label: "IMPROVING", bg: "#E4EDE4", color: "#4A6B50" },
  consistent: { label: "CONSISTENT", bg: "#F0EAE0", color: "#6F675E" },
  practice: { label: "NEEDS PRACTICE", bg: "#F7E3DC", color: "#9E3A24" },
};

export function masteryColor(pct: number): string {
  if (pct < 55) return "#B4573F";
  if (pct < 72) return "#D8B384";
  return "#93A896";
}

export function avatarColorFor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export const SCI_TOPICS: { name: string; short: string }[] = [
  { name: "Cycles in Matter & Water", short: "Cycles" },
  { name: "Energy Forms & Uses", short: "Energy" },
  { name: "Living Things & Environment", short: "Living Things" },
  { name: "Plant Transport System", short: "Plant System" },
  { name: "Interactions & Adaptation", short: "Adaptation" },
];

export const MATH_TOPICS: { name: string; short: string }[] = [
  { name: "Fractions & Operations", short: "Fractions" },
  { name: "Ratio & Proportion", short: "Ratio" },
  { name: "Area, Perimeter & Volume", short: "Volume" },
  { name: "Decimals & Percentage", short: "Decimals" },
  { name: "Rate & Speed", short: "Rate" },
];

export const classes: SchoolClass[] = [
  {
    id: "c1",
    name: "Primary 5 Science",
    subject: "SCIENCE",
    level: "Primary 5",
    tutor: "Sarah Chen",
    schedule: "Mon 4:00 PM",
    count: 15,
    topics: [
      { name: "Life Cycles", short: "Life Cycles", mastery: 78 },
      { name: "Reproduction", short: "Reprod.", mastery: 71 },
      { name: "Adaptation", short: "Adaptation", mastery: 52 },
      { name: "Matter", short: "Matter", mastery: 74 },
      { name: "Water Cycle", short: "Water", mastery: 80 },
      { name: "Energy", short: "Energy", mastery: 58 },
    ],
    insights: [
      {
        title: "Adaptation Keywords",
        tag: "HIGH PRIORITY",
        tone: "high",
        body: "60% of students struggle connecting structural adaptations to survival advantage in open-ended questions.",
        why: "Worth 6-8 marks in Booklet B every paper.",
      },
      {
        title: "Energy Conversion",
        tag: "MONITOR",
        tone: "monitor",
        body: "Confusion between light and heat energy sources when reading experimental set-ups.",
        why: "Appears in 4 of the last 5 assessments.",
      },
      {
        title: "Water Cycle Terms",
        tag: "WATCH",
        tone: "watch",
        body: "Evaporation and condensation used interchangeably by 5 students.",
        why: "A single wrong term voids the mark.",
      },
    ],
    worksheets: [
      { title: "P5 Science — Adaptation Mini Test", date: "Oct 12", status: "15/15 submitted", state: "submitted" },
      { title: "Plant Transport Revision Exercise", date: "Oct 05", status: "15/15 graded", state: "graded" },
      { title: "Water Cycle Keyword Drill", date: "Sep 28", status: "15/15 graded", state: "graded" },
    ],
  },
  {
    id: "c2",
    name: "Primary 5 Maths",
    subject: "MATHS",
    level: "Primary 5",
    tutor: "Sarah Chen",
    schedule: "Wed 5:30 PM",
    count: 14,
    topics: [
      { name: "Fractions", short: "Fractions", mastery: 69 },
      { name: "Ratio", short: "Ratio", mastery: 55 },
      { name: "Area & Perimeter", short: "Area", mastery: 72 },
      { name: "Volume", short: "Volume", mastery: 63 },
      { name: "Decimals", short: "Decimals", mastery: 81 },
      { name: "Rate & Speed", short: "Rate", mastery: 48 },
    ],
    insights: [
      {
        title: "Rate & Speed Set-up",
        tag: "HIGH PRIORITY",
        tone: "high",
        body: "9 of 14 students cannot translate a word problem into a distance-time relationship before calculating.",
        why: "Blocks the 4-mark problem sums in Paper 2.",
      },
      {
        title: "Ratio to Fraction",
        tag: "MONITOR",
        tone: "monitor",
        body: "Students convert part-to-part ratios as if they were part-to-whole.",
        why: "Causes a correct method to score zero.",
      },
      {
        title: "Units in Final Answer",
        tag: "WATCH",
        tone: "watch",
        body: "Working is correct but the unit is missing from the answer statement.",
        why: "One presentation mark lost per question.",
      },
    ],
    worksheets: [
      { title: "P5 Maths — Rate & Speed Problem Sums", date: "Oct 11", status: "12/14 submitted", state: "submitted" },
      { title: "Ratio Heuristics Practice", date: "Oct 04", status: "14/14 graded", state: "graded" },
    ],
  },
  {
    id: "c3",
    name: "Primary 4 Science",
    subject: "SCIENCE",
    level: "Primary 4",
    tutor: "Sarah Chen",
    schedule: "Tue 4:00 PM",
    count: 9,
    topics: SCI_TOPICS.slice(0, 5).map((t, i) => ({ ...t, mastery: [82, 75, 66, 70, 60][i] })),
    insights: [],
    worksheets: [],
  },
  {
    id: "c4",
    name: "Primary 6 Science (PSLE Prep)",
    subject: "SCIENCE",
    level: "Primary 6",
    tutor: "Sarah Chen",
    schedule: "Sat 9:00 AM",
    count: 12,
    topics: SCI_TOPICS.slice(0, 5).map((t, i) => ({ ...t, mastery: [64, 71, 58, 68, 53][i] })),
    insights: [],
    worksheets: [],
  },
  {
    id: "c5",
    name: "Primary 4 Maths",
    subject: "MATHS",
    level: "Primary 4",
    tutor: "Wei Ming Ho",
    schedule: "Thu 4:00 PM",
    count: 11,
    topics: MATH_TOPICS.slice(0, 5).map((t, i) => ({ ...t, mastery: [77, 68, 73, 80, 61][i] })),
    insights: [],
    worksheets: [],
  },
  {
    id: "c6",
    name: "Primary 6 Maths (PSLE Prep)",
    subject: "MATHS",
    level: "Primary 6",
    tutor: "Sarah Chen",
    schedule: "Sat 11:00 AM",
    count: 10,
    topics: MATH_TOPICS.slice(0, 5).map((t, i) => ({ ...t, mastery: [59, 65, 70, 62, 54][i] })),
    insights: [],
    worksheets: [],
  },
];

function makeStudent(
  id: string,
  name: string,
  classId: string,
  status: StudentStatus,
  mastery: number,
  improvement: string,
  pcts: number[],
  extra?: Partial<Student>
): Student {
  const topicDefs = classId === "c2" ? MATH_TOPICS : SCI_TOPICS;
  const topics = topicDefs.map((t, i) => ({ ...t, pct: pcts[i] }));
  const parts = name.split(" ");
  const base: Student = {
    id,
    name,
    classId,
    status,
    mastery,
    improvement,
    topics,
    initials: (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase(),
    completed: 18,
    lastAssessment: { pct: Math.min(100, mastery + 4), topic: topics[3]?.short ?? topics[0].short },
    strengths: [
      "Strong recall of factual content, especially diagram-based questions.",
      "Reliable working shown for structured multi-step questions.",
      "Completes assigned practice on time without prompting.",
    ],
    growth: [
      "Struggles to articulate answers using precise scientific vocabulary.",
      "Needs practice linking two concepts within one open-ended question.",
      "Drops marks by not restating the question context in the answer.",
    ],
    insight:
      "Understands the underlying concept but loses marks on phrasing. Answers describe the effect without naming the mechanism, which OEQ mark schemes require.",
  };
  return { ...base, ...extra };
}

export const students: Student[] = [
  makeStudent("s1", "Bella Tan", "c1", "practice", 68, "+12%", [85, 72, 45, 79, 52], {
    completed: 24,
    strengths: [
      "Strong grasp of conceptual facts, especially in the physical sciences.",
      "Excellent retention of visual information and labelled diagrams.",
      "Consistently completes assigned homework on time.",
    ],
    growth: [
      "Struggles to articulate answers using precise scientific vocabulary.",
      "Needs practice linking multiple concepts in open-ended questions.",
      "Answers describe what happens without explaining why it happens.",
    ],
    insight:
      "Bella understands the core concept well, but frequently loses marks because she needs help expressing her answers using standard exam keywords, particularly in Open-Ended Questions (OEQs).",
  }),
  makeStudent("s2", "Jayden Lim", "c1", "improving", 81, "+7%", [88, 79, 72, 84, 76]),
  makeStudent("s3", "Chloe Tan", "c1", "practice", 49, "-3%", [58, 51, 38, 55, 42]),
  makeStudent("s4", "Sarah Lee", "c1", "consistent", 76, "+2%", [80, 74, 70, 78, 74]),
  makeStudent("s5", "Marcus Koh", "c1", "improving", 84, "+9%", [90, 82, 78, 86, 80]),
  makeStudent("s6", "Ryan Ng", "c1", "consistent", 72, "+1%", [76, 70, 66, 74, 71]),
  makeStudent("s7", "Nadia Rahman", "c2", "improving", 79, "+11%", [84, 68, 80, 88, 62]),
  makeStudent("s8", "Ethan Wong", "c2", "practice", 55, "+4%", [62, 44, 58, 70, 38]),
];

export function getClassById(id: string): SchoolClass | undefined {
  return classes.find((c) => c.id === id);
}

export function getStudentById(id: string): Student | undefined {
  return students.find((s) => s.id === id);
}

export function studentsInClass(classId: string): Student[] {
  return students.filter((s) => s.classId === classId);
}

export function classAverageMastery(schoolClass: SchoolClass): number {
  if (!schoolClass.topics.length) return 0;
  const total = schoolClass.topics.reduce((sum, t) => sum + t.mastery, 0);
  return Math.round(total / schoolClass.topics.length);
}

export function weakestTopic<T extends { pct: number } | { mastery: number }>(
  topics: T[]
): T {
  return topics
    .slice()
    .sort((a, b) => {
      const av = "pct" in a ? a.pct : a.mastery;
      const bv = "pct" in b ? b.pct : b.mastery;
      return av - bv;
    })[0];
}

export function studentAvatarIndex(student: Student): number {
  return students.indexOf(student);
}
