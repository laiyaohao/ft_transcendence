import type { QuestionType } from "./questions";

export type WorksheetTargetMode = "CLASS" | "STUDENTS";
export type WorksheetStatus = "DRAFT" | "APPROVED" | "ARCHIVED";
export interface WorksheetQuestion { id: number; code: string; prompt: string; totalMarks: number; questionType: QuestionType; topicName: string; }
export interface TutorWorksheet { id: number; title: string; instructions: string | null; targetMode: WorksheetTargetMode; status: WorksheetStatus; dueAt: string | null; questions: WorksheetQuestion[]; }
export interface WorksheetGenerationRequest { id: number; status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED"; worksheet: TutorWorksheet | null; message: string; }
export interface GenerateWorksheetRequest { targetMode: WorksheetTargetMode; studentIds?: number[]; topicIds: number[]; questionCount: number; questionType?: QuestionType; dueAt?: string; title?: string; instructions?: string; }
export class WorksheetApiError extends Error { constructor(message: string, readonly status: number) { super(message); this.name = "WorksheetApiError"; } }
const base = process.env.NEXT_PUBLIC_LEARNING_API_URL || "http://localhost:8083";
const headers = () => { const token = typeof window === "undefined" ? null : localStorage.getItem("jwt_token"); return { Accept: "application/json", "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }; };
async function json(response: Response) { if (!response.ok) { const body = await response.json().catch(() => null) as { message?: string } | null; throw new WorksheetApiError(body?.message || `Worksheet request failed (${response.status}).`, response.status); } return response.json(); }
export async function generateWorksheet(classId: number, request: GenerateWorksheetRequest, idempotencyKey: string): Promise<WorksheetGenerationRequest> { if (!Number.isSafeInteger(classId) || classId < 1 || request.topicIds.length === 0 || request.questionCount < 1) throw new WorksheetApiError("Worksheet configuration is invalid.", 400); return json(await fetch(`${base}/api/learning/tutor/classes/${classId}/worksheet-generation-requests`, { method: "POST", headers: { ...headers(), "Idempotency-Key": idempotencyKey }, body: JSON.stringify(request) })); }
export async function fetchGenerationRequest(requestId: number): Promise<WorksheetGenerationRequest> { return json(await fetch(`${base}/api/learning/tutor/worksheet-generation-requests/${requestId}`, { headers: headers() })); }
export async function updateWorksheet(worksheetId: number, request: Pick<TutorWorksheet, "title" | "instructions"> & { questionIds: number[] }): Promise<TutorWorksheet> { return json(await fetch(`${base}/api/learning/tutor/worksheets/${worksheetId}`, { method: "PATCH", headers: headers(), body: JSON.stringify(request) })); }
export async function approveWorksheet(worksheetId: number, dueAt?: string): Promise<TutorWorksheet> { return json(await fetch(`${base}/api/learning/tutor/worksheets/${worksheetId}/approve`, { method: "POST", headers: headers(), body: JSON.stringify({ dueAt }) })); }
