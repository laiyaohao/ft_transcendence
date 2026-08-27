import type { QuestionType } from "./questions";

export type WorksheetTargetMode = "CLASS" | "STUDENTS";
export type WorksheetStatus = "DRAFT" | "APPROVED" | "ARCHIVED";

export interface WorksheetQuestion {
  id: number;
  code: string;
  prompt: string;
  totalMarks: number;
  questionType: QuestionType;
  topicName: string;
}

export interface WorksheetAssignment {
  id: number;
  assignmentType: "CLASS" | "STUDENT";
  classId: number | null;
  studentProfileId: number | null;
  assignedAt: string | null;
  dueAt: string | null;
}

export interface TutorWorksheet {
  id: number;
  code: string;
  title: string;
  instructions: string | null;
  targetMode: WorksheetTargetMode;
  status: WorksheetStatus;
  generationRequestId: number | null;
  dueAt: string | null;
  questions: WorksheetQuestion[];
  assignments: WorksheetAssignment[];
}

export interface WorksheetGenerationRequest {
  id: number;
  classId: number;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  worksheet: TutorWorksheet | null;
  message: string;
}

export interface GenerateWorksheetRequest {
  targetMode: WorksheetTargetMode;
  studentIds?: number[];
  topicIds: number[];
  questionCount: number;
  questionType?: QuestionType;
  dueAt?: string;
  title?: string;
  instructions?: string;
}

export interface UpdateWorksheetRequest {
  title: string;
  instructions: string | null;
  questionIds: number[];
}

export class WorksheetApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "WorksheetApiError";
  }
}

const base = process.env.NEXT_PUBLIC_LEARNING_API_URL || "http://localhost:8083";
const questionTypes: readonly QuestionType[] = ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_THE_BLANK", "SHORT_ANSWER", "OPEN_ENDED", "CALCULATION", "DIAGRAM"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function positiveId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function stringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isQuestionType(value: unknown): value is QuestionType {
  return typeof value === "string" && questionTypes.includes(value as QuestionType);
}

function isWorksheetStatus(value: unknown): value is WorksheetStatus {
  return value === "DRAFT" || value === "APPROVED" || value === "ARCHIVED";
}

function headers(): HeadersInit {
  const token = typeof window === "undefined" ? null : localStorage.getItem("jwt_token");
  return { Accept: "application/json", "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function json(response: Response): Promise<unknown> {
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw new WorksheetApiError(body?.message || `Worksheet request failed (${response.status}).`, response.status);
  }
  return response.json();
}

function parseQuestion(payload: unknown): WorksheetQuestion {
  if (!isRecord(payload) || !positiveId(payload.id) || !nonEmpty(payload.code) || !nonEmpty(payload.prompt)
    || typeof payload.totalMarks !== "number" || !Number.isFinite(payload.totalMarks) || payload.totalMarks <= 0
    || !isQuestionType(payload.questionType) || !nonEmpty(payload.syllabusTopicName)) {
    throw new Error("The learning service returned an invalid worksheet question.");
  }
  return { id: payload.id, code: payload.code, prompt: payload.prompt, totalMarks: payload.totalMarks, questionType: payload.questionType, topicName: payload.syllabusTopicName };
}

function parseAssignment(payload: unknown): WorksheetAssignment {
  if (!isRecord(payload) || !positiveId(payload.id) || (payload.assignmentType !== "CLASS" && payload.assignmentType !== "STUDENT")
    || !(payload.classId === null || positiveId(payload.classId)) || !(payload.studentProfileId === null || positiveId(payload.studentProfileId))
    || !stringOrNull(payload.assignedAt) || !stringOrNull(payload.dueAt)) {
    throw new Error("The learning service returned an invalid worksheet assignment.");
  }
  return { id: payload.id, assignmentType: payload.assignmentType, classId: payload.classId, studentProfileId: payload.studentProfileId, assignedAt: payload.assignedAt, dueAt: payload.dueAt };
}

/** Validates and normalises the owner-scoped worksheet detail response. */
export function parseTutorWorksheet(payload: unknown): TutorWorksheet {
  if (!isRecord(payload) || !positiveId(payload.id) || !nonEmpty(payload.code) || !nonEmpty(payload.title)
    || !stringOrNull(payload.instructions) || (payload.audienceType !== "CLASS" && payload.audienceType !== "STUDENT")
    || !isWorksheetStatus(payload.status) || !(payload.generationRequestId === null || positiveId(payload.generationRequestId))
    || !Array.isArray(payload.questions) || !Array.isArray(payload.assignments)) {
    throw new Error("The learning service returned an invalid worksheet. Please try again.");
  }
  const assignments = payload.assignments.map(parseAssignment);
  return {
    id: payload.id,
    code: payload.code,
    title: payload.title,
    instructions: payload.instructions,
    targetMode: payload.audienceType === "CLASS" ? "CLASS" : "STUDENTS",
    status: payload.status,
    generationRequestId: payload.generationRequestId,
    dueAt: assignments.find((assignment) => assignment.dueAt !== null)?.dueAt ?? null,
    questions: payload.questions.map(parseQuestion),
    assignments,
  };
}

function parseGenerationRequest(payload: unknown): WorksheetGenerationRequest {
  if (!isRecord(payload) || !positiveId(payload.id) || !positiveId(payload.classId)
    || (payload.status !== "QUEUED" && payload.status !== "RUNNING" && payload.status !== "SUCCEEDED" && payload.status !== "FAILED" && payload.status !== "CANCELLED")
    || !(payload.worksheet === null || isRecord(payload.worksheet))) {
    throw new Error("The learning service returned an invalid generation request. Please try again.");
  }
  return {
    id: payload.id,
    classId: payload.classId,
    status: payload.status,
    worksheet: payload.worksheet === null ? null : parseTutorWorksheet(payload.worksheet),
    message: typeof payload.failureMessage === "string" ? payload.failureMessage : "",
  };
}

function requireId(value: number, message: string): void {
  if (!positiveId(value)) throw new WorksheetApiError(message, 400);
}

export async function generateWorksheet(classId: number, request: GenerateWorksheetRequest, idempotencyKey: string): Promise<WorksheetGenerationRequest> {
  requireId(classId, "Class reference is invalid.");
  if (!Array.isArray(request.topicIds) || !request.topicIds.every(positiveId) || request.topicIds.length === 0
    || !Number.isSafeInteger(request.questionCount) || request.questionCount < 1 || request.questionCount > 100
    || (request.targetMode !== "CLASS" && request.targetMode !== "STUDENTS") || !nonEmpty(idempotencyKey)) {
    throw new WorksheetApiError("Worksheet configuration is invalid.", 400);
  }
  const payload = await json(await fetch(`${base}/api/learning/tutor/classes/${classId}/worksheet-generation-requests`, {
    method: "POST", headers: { ...headers(), "Idempotency-Key": idempotencyKey }, body: JSON.stringify(request),
  }));
  return parseGenerationRequest(payload);
}

export async function fetchGenerationRequest(classId: number, requestId: number): Promise<WorksheetGenerationRequest> {
  requireId(classId, "Class reference is invalid.");
  requireId(requestId, "Generation request reference is invalid.");
  return parseGenerationRequest(await json(await fetch(`${base}/api/learning/tutor/classes/${classId}/worksheet-generation-requests/${requestId}`, { headers: headers() })));
}

export async function fetchTutorWorksheet(worksheetId: number): Promise<TutorWorksheet> {
  requireId(worksheetId, "Worksheet reference is invalid.");
  return parseTutorWorksheet(await json(await fetch(`${base}/api/learning/tutor/worksheets/${worksheetId}`, { headers: headers() })));
}

/** Lists only worksheets owned by the current Tutor; class filtering is owner-scoped server-side. */
export async function fetchTutorWorksheets(classId?: number): Promise<TutorWorksheet[]> {
  if (classId !== undefined) requireId(classId, "Class reference is invalid.");
  const suffix = classId === undefined ? "" : `?classId=${classId}`;
  const payload = await json(await fetch(`${base}/api/learning/tutor/worksheets${suffix}`, { headers: headers() }));
  if (!Array.isArray(payload)) throw new Error("The learning service returned an invalid worksheet list. Please try again.");
  return payload.map(parseTutorWorksheet);
}

export async function updateWorksheet(worksheetId: number, request: UpdateWorksheetRequest): Promise<TutorWorksheet> {
  requireId(worksheetId, "Worksheet reference is invalid.");
  if (!nonEmpty(request.title) || !Array.isArray(request.questionIds) || request.questionIds.length === 0 || !request.questionIds.every(positiveId)) {
    throw new WorksheetApiError("Worksheet details are invalid.", 400);
  }
  return parseTutorWorksheet(await json(await fetch(`${base}/api/learning/tutor/worksheets/${worksheetId}`, {
    method: "PATCH", headers: headers(), body: JSON.stringify(request),
  })));
}

export async function approveWorksheet(worksheetId: number, dueAt?: string): Promise<TutorWorksheet> {
  requireId(worksheetId, "Worksheet reference is invalid.");
  return parseTutorWorksheet(await json(await fetch(`${base}/api/learning/tutor/worksheets/${worksheetId}/approve`, {
    method: "POST", headers: headers(), body: JSON.stringify({ dueAt: dueAt || null }),
  })));
}

export async function downloadWorksheetPdf(worksheetId: number): Promise<Blob> {
  requireId(worksheetId, "Worksheet reference is invalid.");
  const response = await fetch(`${base}/api/learning/tutor/worksheets/${worksheetId}/pdf`, { headers: headers() });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw new WorksheetApiError(body?.message || "Worksheet PDF could not be created.", response.status);
  }
  return response.blob();
}
