import type { MasteryStatus } from "@/services/mastery";

export type AssignmentType = "CLASS" | "STUDENT";

export interface StudentDashboardMetrics { overallMastery: number | null; trackedTopicCount: number; totalAttempts: number; approvedAssignmentCount: number; }
export interface StudentDashboardAssignment { worksheetId: number; assignmentType: AssignmentType; assignedAt: string; dueAt: string | null; }
export interface StudentDashboardTopic { topicId: number; topicName: string; score: number; status: MasteryStatus; attemptCount: number; calculatedAt: string | null; }
export interface StudentDashboardApprovedTopicResult { topicId: number; topicName: string; approvedMarks: number; availableMarks: number; reviewedAt: string; }
export interface StudentDashboardData {
  studentName: string; timeZone: string; today: string; metrics: StudentDashboardMetrics;
  latestAssignment: StudentDashboardAssignment | null; nextAssignment: StudentDashboardAssignment | null;
  strongestTopic: StudentDashboardTopic | null; focusTopic: StudentDashboardTopic | null;
  latestApprovedTopicResult: StudentDashboardApprovedTopicResult | null;
}

export class StudentDashboardApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "StudentDashboardApiError"; }
}

const LEARNING_API_URL = process.env.NEXT_PUBLIC_LEARNING_API_URL || "http://localhost:8083";
const STATUSES: readonly MasteryStatus[] = ["NOT_STARTED", "LEARNING", "PRACTISING", "IMPROVING", "MASTERED", "NEEDS_REVISION"];
const ASSIGNMENT_TYPES: readonly AssignmentType[] = ["CLASS", "STUDENT"];
function text(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function positive(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value > 0; }
function count(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 0; }
function percentage(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100; }
function number(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && value >= 0; }
function date(value: unknown): value is string { if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const parsed = new Date(`${value}T00:00:00.000Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; }
function dateTime(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?$/.test(value) && !Number.isNaN(new Date(`${value}Z`).getTime()); }
function nullableDateTime(value: unknown): value is string | null { return value === null || dateTime(value); }
function status(value: unknown): value is MasteryStatus { return typeof value === "string" && STATUSES.includes(value as MasteryStatus); }
function invalid(): Error { return new Error("The student dashboard response is invalid. Please try again."); }
function assignment(value: unknown): StudentDashboardAssignment {
  if (!value || typeof value !== "object") throw invalid(); const item = value as Record<string, unknown>;
  if (!positive(item.worksheetId) || typeof item.assignmentType !== "string" || !ASSIGNMENT_TYPES.includes(item.assignmentType as AssignmentType) || !dateTime(item.assignedAt) || !nullableDateTime(item.dueAt)) throw invalid();
  return item as unknown as StudentDashboardAssignment;
}
function topic(value: unknown): StudentDashboardTopic {
  if (!value || typeof value !== "object") throw invalid(); const item = value as Record<string, unknown>;
  if (!positive(item.topicId) || !text(item.topicName) || !percentage(item.score) || !status(item.status) || !count(item.attemptCount) || !nullableDateTime(item.calculatedAt)) throw invalid();
  return item as unknown as StudentDashboardTopic;
}
function approvedTopicResult(value: unknown): StudentDashboardApprovedTopicResult {
  if (!value || typeof value !== "object") throw invalid(); const item = value as Record<string, unknown>;
  if (!positive(item.topicId) || !text(item.topicName) || !number(item.approvedMarks) || !number(item.availableMarks) || item.approvedMarks > item.availableMarks || !dateTime(item.reviewedAt)) throw invalid();
  return item as unknown as StudentDashboardApprovedTopicResult;
}
function nullable<T>(value: unknown, parser: (item: unknown) => T): T | null { return value === null ? null : parser(value); }

export function parseStudentDashboard(value: unknown): StudentDashboardData {
  if (!value || typeof value !== "object") throw invalid(); const dashboard = value as Record<string, unknown>; const metrics = dashboard.metrics;
  if (!text(dashboard.studentName) || !text(dashboard.timeZone) || !date(dashboard.today) || !metrics || typeof metrics !== "object") throw invalid();
  const raw = metrics as Record<string, unknown>;
  if (!(raw.overallMastery === null || percentage(raw.overallMastery)) || !count(raw.trackedTopicCount) || !count(raw.totalAttempts) || !count(raw.approvedAssignmentCount)) throw invalid();
  return { studentName: dashboard.studentName, timeZone: dashboard.timeZone, today: dashboard.today, metrics: raw as unknown as StudentDashboardMetrics, latestAssignment: nullable(dashboard.latestAssignment, assignment), nextAssignment: nullable(dashboard.nextAssignment, assignment), strongestTopic: nullable(dashboard.strongestTopic, topic), focusTopic: nullable(dashboard.focusTopic, topic), latestApprovedTopicResult: nullable(dashboard.latestApprovedTopicResult, approvedTopicResult) };
}
function headers(): HeadersInit { const token = typeof window === "undefined" ? null : window.localStorage.getItem("jwt_token"); return { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }; }
function viewerTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
async function responseError(response: Response): Promise<StudentDashboardApiError> {
  try { const payload = await response.json() as { message?: unknown }; if (text(payload.message)) return new StudentDashboardApiError(payload.message, response.status); } catch { /* Generic fallback below. */ }
  return new StudentDashboardApiError("Dashboard data could not be loaded. Please try again.", response.status);
}
/** Server-side identity defines the Student; callers cannot select another student. */
export async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  const response = await fetch(`${LEARNING_API_URL}/api/learning/student/dashboard?${new URLSearchParams({ timeZone: viewerTimeZone() })}`, { headers: headers() });
  if (!response.ok) throw await responseError(response);
  return parseStudentDashboard(await response.json());
}
