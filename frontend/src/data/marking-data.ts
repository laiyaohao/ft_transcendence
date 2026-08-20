// Mock data for the AI marking review and OCR review demo flow.

export type ModelAnswerElement = {
  text: string;
  matched: boolean;
};

export type MarkingQuestion = {
  id: string;
  max: number;
  type: string;
  topic: string;
  text: string;
  answer: string;
  model: ModelAnswerElement[];
  aiScore: number;
  aiFeedback: string;
  missing: string[];
  keywordIssue: string;
  reasoning: string;
};

export const MARKING_QUESTIONS: MarkingQuestion[] = [
  {
    id: "m1",
    max: 2,
    type: "OEQ · Booklet B",
    topic: "Interactions & Adaptation",
    text: "The Arctic fox has a thick layer of fat under its skin. Explain how this helps it to survive in a cold environment.",
    answer: "The fat keeps the Arctic fox warm because the Arctic is very cold, so it will not freeze.",
    model: [
      { text: "Fat is a poor conductor of heat.", matched: false },
      { text: "It reduces heat loss from the body to the surroundings.", matched: false },
      { text: "The fox can maintain its body temperature in the cold.", matched: true },
    ],
    aiScore: 1,
    aiFeedback:
      "You correctly identified that the fat keeps the fox warm. To gain full marks, state that fat is a poor conductor of heat and that this reduces heat loss from the body to the surroundings.",
    missing: ["poor conductor of heat", "reduces heat loss"],
    keywordIssue:
      '"Keeps warm" used in place of the mark-scheme keyword "reduces heat loss". This phrasing has cost marks in 3 of the last 5 papers.',
    reasoning:
      "One of three model elements present. The answer states the effect but not the mechanism, which the mark scheme requires for the second mark.",
  },
  {
    id: "m2",
    max: 3,
    type: "OEQ · Booklet B",
    topic: "Plant Transport System",
    text: "A potted plant was left in a dark cupboard for one week. Explain why its leaves turned yellow.",
    answer: "There was no sunlight in the cupboard so the plant could not make food, and the leaves lost their green colour.",
    model: [
      { text: "Without light, photosynthesis cannot take place.", matched: true },
      { text: "The plant cannot make food (glucose) for growth.", matched: true },
      { text: "Chlorophyll breaks down, so the leaves lose their green colour.", matched: false },
    ],
    aiScore: 2,
    aiFeedback:
      "Two of the three marking points are clearly present. Name the process — photosynthesis — and the substance chlorophyll to secure the third mark.",
    missing: ["photosynthesis (named)", "chlorophyll"],
    keywordIssue: "The process and the substance are described in everyday language rather than named. Naming is required at P5 level.",
    reasoning:
      "Marks awarded for absence of light and inability to make food. The third mark requires naming chlorophyll breakdown as the cause of the colour change.",
  },
  {
    id: "m3",
    max: 2,
    type: "Structured · Booklet A",
    topic: "Cycles in Matter & Water",
    text: "The graph shows the volume of water left in four identical beakers after six hours at different temperatures. State one conclusion about the rate of evaporation.",
    answer: "The hotter the water the faster it evaporate.",
    model: [
      { text: "A higher temperature increases the rate of evaporation.", matched: true },
      { text: "Conclusion refers to the data (volume of water lost).", matched: false },
    ],
    aiScore: 1,
    aiFeedback:
      "The relationship is correct. Refer to the data — that the beaker at the highest temperature lost the most water — to gain the second mark.",
    missing: ["reference to the data"],
    keywordIssue: 'A conclusion from a graph must cite the evidence. "Faster" alone is a prediction, not a conclusion.',
    reasoning: "Correct relationship identified for the first mark. The second mark requires evidence quoted from the graph.",
  },
];

export type OcrItem = {
  id: string;
  confidence: number;
  question: string;
  answer: string;
  warning: string;
};

export const OCR_ITEMS: OcrItem[] = [
  {
    id: "o1",
    confidence: 96,
    question: "The Arctic fox has a thick layer of fat under its skin. Explain how this helps it to survive in a cold environment.",
    answer: "The fat keeps the Arctic fox warm because the Arctic is very cold, so it will not freeze.",
    warning: "",
  },
  {
    id: "o2",
    confidence: 68,
    question: "A potted plant was left in a dark cupboard for one week. Explain why its leaves turned yellow.",
    answer: "There was no sunlight in the cupboard so the plant could not make food, and the leaves lost their green colour.",
    warning: 'Confidence 68% — the word after "green" is ambiguous ("colour" or "color"). Check the highlighted region on the scan.',
  },
  {
    id: "o3",
    confidence: 74,
    question: "State one conclusion about the rate of evaporation from the graph.",
    answer: "The hotter the water the faster it evaporate.",
    warning: "Confidence 74% — handwriting overlaps the ruled line. Verify the final word before marking.",
  },
];
