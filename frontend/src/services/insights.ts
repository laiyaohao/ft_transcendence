import type { MasteryStatus } from "@/services/mastery";

export type LearningFindingType = "CONCEPT_WEAKNESS" | "KEYWORD_WEAKNESS" | "EXPRESSION_WEAKNESS" | "APPLICATION_WEAKNESS" | "REPEATED_WEAKNESS" | "REGRESSED" | "MASTERY_GAP";
export type LearningDimensionCategory = "CONCEPT" | "KEYWORD" | "EXPRESSION" | "APPLICATION";
export interface LearningTopicSummary { topicId: number; topicName: string; score: number; status: MasteryStatus; attemptCount: number; }
export interface LearningEvidence extends LearningTopicSummary { sourceReason: string | null; occurredAt: string | null; }
export interface LearningFinding { type: LearningFindingType; title: string; summary: string; suggestedAction: string; evidence: LearningEvidence[]; }
/** The four categories are derived only from tutor-confirmed diagnostic evidence. */
export interface LearningDimension { category: LearningDimensionCategory; evidenceCount: number; evidence: LearningEvidence[]; }
export interface LearningProfile { studentId: number; strengths: LearningTopicSummary[]; growthAreas: LearningTopicSummary[]; improvements: LearningTopicSummary[]; dimensions: LearningDimension[]; findings: LearningFinding[]; dataAsOf: string | null; source: "DETERMINISTIC"; }

const API = process.env.NEXT_PUBLIC_LEARNING_API_URL || "http://localhost:8083";
const statuses: readonly MasteryStatus[] = ["NOT_STARTED", "LEARNING", "PRACTISING", "IMPROVING", "MASTERED", "NEEDS_REVISION"];
const types: readonly LearningFindingType[] = ["CONCEPT_WEAKNESS", "KEYWORD_WEAKNESS", "EXPRESSION_WEAKNESS", "APPLICATION_WEAKNESS", "REPEATED_WEAKNESS", "REGRESSED", "MASTERY_GAP"];
const dimensionCategories: readonly LearningDimensionCategory[] = ["CONCEPT", "KEYWORD", "EXPRESSION", "APPLICATION"];

function positive(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value > 0; }
function count(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 0; }
function percent(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100; }
function text(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function optionalDate(value: unknown): value is string | null { return value === null || text(value); }
function status(value: unknown): value is MasteryStatus { return typeof value === "string" && statuses.includes(value as MasteryStatus); }

function summary(value: unknown): LearningTopicSummary {
  if (!value || typeof value !== "object") throw new Error("The learning profile response is invalid.");
  const item = value as Record<string, unknown>;
  if (!positive(item.topicId) || !text(item.topicName) || !percent(item.score) || !status(item.status) || !count(item.attemptCount)) throw new Error("The learning profile response is invalid.");
  return item as unknown as LearningTopicSummary;
}

function evidence(value: unknown): LearningEvidence {
  const item = summary(value) as LearningEvidence;
  const raw = value as Record<string, unknown>;
  if (!(raw.sourceReason === null || text(raw.sourceReason)) || !optionalDate(raw.occurredAt)) throw new Error("The learning profile response is invalid.");
  return item;
}

function dimension(value: unknown): LearningDimension {
  if (!value || typeof value !== "object") throw new Error("The learning profile response is invalid.");
  const item = value as Record<string, unknown>;
  if (typeof item.category !== "string" || !dimensionCategories.includes(item.category as LearningDimensionCategory)
    || !count(item.evidenceCount) || !Array.isArray(item.evidence)) throw new Error("The learning profile response is invalid.");
  const items = item.evidence.map(evidence);
  if (items.length !== item.evidenceCount) throw new Error("The learning profile response is invalid.");
  return { category: item.category as LearningDimensionCategory, evidenceCount: item.evidenceCount, evidence: items };
}

export function parseLearningProfile(value: unknown): LearningProfile {
  if (!value || typeof value !== "object") throw new Error("The learning profile response is invalid.");
  const profile = value as Record<string, unknown>;
  if (!positive(profile.studentId) || !Array.isArray(profile.strengths) || !Array.isArray(profile.growthAreas) || !Array.isArray(profile.improvements)
    || !Array.isArray(profile.dimensions)
    || !Array.isArray(profile.findings) || !optionalDate(profile.dataAsOf) || profile.source !== "DETERMINISTIC") throw new Error("The learning profile response is invalid.");
  const findings = profile.findings.map((value) => {
    if (!value || typeof value !== "object") throw new Error("The learning profile response is invalid.");
    const item = value as Record<string, unknown>;
    if (typeof item.type !== "string" || !types.includes(item.type as LearningFindingType) || !text(item.title) || !text(item.summary)
      || !text(item.suggestedAction) || !Array.isArray(item.evidence) || item.evidence.length === 0) throw new Error("The learning profile response is invalid.");
    return { type: item.type as LearningFindingType, title: item.title, summary: item.summary, suggestedAction: item.suggestedAction, evidence: item.evidence.map(evidence) };
  });
  const dimensions = profile.dimensions.map(dimension);
  if (dimensions.length !== dimensionCategories.length || dimensions.some((item, index) => item.category !== dimensionCategories[index])) throw new Error("The learning profile response is invalid.");
  return { studentId: profile.studentId, strengths: profile.strengths.map(summary), growthAreas: profile.growthAreas.map(summary), improvements: profile.improvements.map(summary), dimensions, findings, dataAsOf: profile.dataAsOf, source: "DETERMINISTIC" };
}

function headers(): HeadersInit {
  const token = typeof window === "undefined" ? null : localStorage.getItem("jwt_token");
  return { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function load(path: string): Promise<LearningProfile> {
  const response = await fetch(`${API}${path}`, { headers: headers() });
  if (!response.ok) {
    let message = "Learning insights could not be loaded.";
    try { const error = await response.json() as { message?: unknown }; if (text(error.message)) message = error.message; } catch { /* generic error remains safe */ }
    throw new Error(message);
  }
  return parseLearningProfile(await response.json());
}

export async function fetchLearningProfile(studentId?: number): Promise<LearningProfile> {
  if (studentId !== undefined && !positive(studentId)) throw new Error("Student reference is invalid.");
  return load(studentId === undefined ? "/api/learning/student/learning-profile" : `/api/learning/tutor/students/${studentId}/learning-profile`);
}
