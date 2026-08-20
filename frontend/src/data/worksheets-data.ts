// Mock worksheet/question-bank data. Swap for real API calls once the backend is wired up.

export type WorksheetStatus = "Generated" | "Assigned" | "Submitted" | "Marked";

export type WorksheetAction = "Review marking" | "Upload" | "View" | "Edit" | "Export";

export type Worksheet = {
  title: string;
  meta: string;
  className: string;
  date: string;
  status: WorksheetStatus;
  actions: WorksheetAction[];
};

export const WORKSHEET_STATUS_STYLE: Record<WorksheetStatus, { bg: string; color: string }> = {
  Marked: { bg: "#E4EDE4", color: "#4A6B50" },
  Submitted: { bg: "#F7E3DC", color: "#9E3A24" },
  Assigned: { bg: "#F3EBDD", color: "#7A6238" },
  Generated: { bg: "#F0EAE0", color: "#6F675E" },
};

export const worksheets: Worksheet[] = [
  { title: "P5 Science — Adaptation Mini Test", meta: "20 questions · 28 marks", className: "P5 Science", date: "Oct 12", status: "Submitted", actions: ["Review marking", "View"] },
  { title: "P5 Maths — Rate & Speed Problem Sums", meta: "15 questions · 40 marks", className: "P5 Maths", date: "Oct 11", status: "Submitted", actions: ["Upload", "View"] },
  { title: "Plant Transport Revision Exercise", meta: "18 questions · 24 marks", className: "P5 Science", date: "Oct 05", status: "Marked", actions: ["View", "Export"] },
  { title: "Ratio Heuristics Practice", meta: "12 questions · 32 marks", className: "P5 Maths", date: "Oct 04", status: "Marked", actions: ["View", "Export"] },
  { title: "Water Cycle Keyword Drill", meta: "10 questions · 10 marks", className: "P5 Science", date: "Sep 28", status: "Marked", actions: ["View", "Export"] },
  { title: "Bella Tan — Adaptation Keyword Drill", meta: "12 questions · personalised", className: "P5 Science", date: "Oct 13", status: "Assigned", actions: ["Upload", "Edit"] },
  { title: "P6 Science — Booklet B Technique", meta: "8 questions · 30 marks", className: "P6 Science", date: "Oct 10", status: "Generated", actions: ["Edit", "Export"] },
];

export type QuestionType = "MCQ" | "OEQ" | "Structured" | "Keyword Drill";
export type QuestionDifficulty = "Foundation" | "Application" | "Challenge";

export type BankQuestion = {
  text: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  topic: string;
  marks: number;
  targets: string;
};

export const DIFFICULTY_STYLE: Record<QuestionDifficulty, { bg: string; color: string }> = {
  Challenge: { bg: "#F7E3DC", color: "#9E3A24" },
  Application: { bg: "#F3EBDD", color: "#7A6238" },
  Foundation: { bg: "#E9EEE8", color: "#4A6B50" },
};

export const scienceQuestions: BankQuestion[] = [
  { text: "The desert fox has large ears. Explain how this feature helps it survive in a hot, dry habitat.", type: "OEQ", difficulty: "Application", topic: "Interactions & Adaptation", marks: 2, targets: "structure → survival advantage" },
  { text: "Which of the following is a structural adaptation of a cactus? (A) It grows slowly (B) It has spines instead of leaves (C) It flowers once a year (D) It grows in sandy soil", type: "MCQ", difficulty: "Foundation", topic: "Interactions & Adaptation", marks: 1, targets: "structural vs behavioural" },
  { text: 'A polar bear has a thick layer of blubber. Using the words "poor conductor" and "heat loss", explain how blubber helps it survive.', type: "Keyword Drill", difficulty: "Foundation", topic: "Interactions & Adaptation", marks: 2, targets: "mark-scheme keywords" },
  { text: "Water in an open dish disappears after three days. Name the process and state one factor that would make it happen faster.", type: "Structured", difficulty: "Foundation", topic: "Cycles in Matter & Water", marks: 2, targets: "evaporation vocabulary" },
  { text: "Explain why water droplets form on the outside of a cold glass on a humid day.", type: "OEQ", difficulty: "Application", topic: "Cycles in Matter & Water", marks: 3, targets: "condensation mechanism" },
  { text: "A plant is placed in a dark cupboard for five days. Predict what happens to its leaves and explain why.", type: "OEQ", difficulty: "Challenge", topic: "Plant Transport System", marks: 3, targets: "linking two concepts" },
  { text: "Label the parts of the plant that transport water and food, and state the direction of flow in each.", type: "Structured", difficulty: "Foundation", topic: "Plant Transport System", marks: 2, targets: "diagram recall" },
  { text: "A torch converts electrical energy into two forms of energy. Name both and state which is the useful output.", type: "Structured", difficulty: "Foundation", topic: "Energy Forms & Uses", marks: 2, targets: "light vs heat energy" },
  { text: "Two identical plants are given the same water but one is kept in a sealed box. Explain which grows better and why.", type: "OEQ", difficulty: "Challenge", topic: "Living Things & Environment", marks: 3, targets: "fair-test reasoning" },
  { text: "Give one reason why a food chain in a pond would be affected if all the water plants died.", type: "OEQ", difficulty: "Application", topic: "Living Things & Environment", marks: 2, targets: "cause and effect chains" },
];

export const mathsQuestions: BankQuestion[] = [
  { text: "A car travels 180 km in 2 h 30 min. Find its average speed in km/h.", type: "Structured", difficulty: "Foundation", topic: "Rate & Speed", marks: 2, targets: "unit conversion" },
  { text: "Ali cycles at 12 km/h for 45 minutes, then walks 3 km in 30 minutes. Find his average speed for the whole journey.", type: "OEQ", difficulty: "Challenge", topic: "Rate & Speed", marks: 4, targets: "multi-stage journeys" },
  { text: "The ratio of red to blue beads is 3 : 5. If there are 24 red beads, how many beads are there altogether?", type: "Structured", difficulty: "Foundation", topic: "Ratio & Proportion", marks: 2, targets: "part-to-whole conversion" },
  { text: "A sum of money is shared between two children in the ratio 4 : 7. The difference in their shares is $36. Find the total sum.", type: "OEQ", difficulty: "Challenge", topic: "Ratio & Proportion", marks: 4, targets: "difference-unit method" },
  { text: "Find the volume of a rectangular tank 30 cm long, 20 cm wide and filled with water to a height of 15 cm.", type: "Structured", difficulty: "Foundation", topic: "Area, Perimeter & Volume", marks: 2, targets: "formula recall with units" },
  { text: "Express 3/8 as a decimal and as a percentage.", type: "MCQ", difficulty: "Foundation", topic: "Decimals & Percentage", marks: 1, targets: "fraction–decimal fluency" },
  { text: "5/6 of a number is 45. Find 2/3 of the same number.", type: "OEQ", difficulty: "Application", topic: "Fractions & Operations", marks: 3, targets: "unit-fraction reasoning" },
  { text: "A tap fills a tank at 8 litres per minute. How long, in minutes and seconds, to fill a 34-litre tank?", type: "OEQ", difficulty: "Application", topic: "Rate & Speed", marks: 3, targets: "rate with remainder" },
];
