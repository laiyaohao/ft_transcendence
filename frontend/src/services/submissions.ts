export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const gradingUrl = process.env.NEXT_PUBLIC_GRADING_API_URL || "http://localhost:8082";

export type UploadPage = { id: string; file: File; previewUrl: string | null; rotation: 0 | 90 | 180 | 270; warning: string | null };
export type OcrPage = { pageId: number; extractionId: number; text: string; confidence: number; status: "READY" | "REQUIRES_REVIEW" | "UNREADABLE" };
export class SubmissionApiError extends Error { constructor(message: string, readonly status = 0) { super(message); this.name = "SubmissionApiError"; } }

const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;
const id = (file: File, index: number) => `${fileKey(file)}:${index}`;
export function isAcceptedUpload(file: File) { return ACCEPTED_TYPES.has(file.type); }
export function validateUploadFiles(files: File[], existing: UploadPage[] = []): { pages: UploadPage[]; errors: string[] } {
  const seen = new Set(existing.map((page) => fileKey(page.file))); const pages: UploadPage[] = []; const errors: string[] = [];
  files.forEach((file, index) => {
    if (!isAcceptedUpload(file)) errors.push(`${file.name}: use a JPG, PNG or PDF.`);
    else if (file.size === 0) errors.push(`${file.name}: this file is empty.`);
    else if (file.size > MAX_UPLOAD_BYTES) errors.push(`${file.name}: files must be 20 MB or smaller.`);
    else if (seen.has(fileKey(file))) errors.push(`${file.name}: this page was already added.`);
    else { seen.add(fileKey(file)); pages.push({ id: id(file, index), file, previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null, rotation: 0, warning: file.type.startsWith("image/") && file.size < 12_000 ? "This image may be hard to read. Consider replacing it." : null }); }
  });
  return { pages, errors };
}
export function releasePagePreview(page: UploadPage) { if (page.previewUrl) URL.revokeObjectURL(page.previewUrl); }
function headers(): HeadersInit { const token = typeof window === "undefined" ? null : localStorage.getItem("jwt_token"); return token ? { Authorization: `Bearer ${token}` } : {}; }
export async function submitSubmission(worksheetId: string, pages: UploadPage[], onProgress: (completed: number, total: number) => void): Promise<{ pageCount: number; submittedAt: string }> {
  if (!worksheetId || pages.length === 0) throw new SubmissionApiError("Choose a worksheet and add at least one page.", 400);
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index]; const form = new FormData(); form.append("file", page.file); form.append("worksheetId", worksheetId); form.append("pageNumber", String(index + 1)); form.append("rotation", String(page.rotation));
    const response = await fetch(`${gradingUrl}/api/grading/ocr`, { method: "POST", headers: headers(), body: form });
    if (!response.ok) { const body = await response.json().catch(() => null) as { error?: string } | null; throw new SubmissionApiError(body?.error || `Page ${index + 1} could not be uploaded.`, response.status); }
    onProgress(index + 1, pages.length);
  }
  return { pageCount: pages.length, submittedAt: new Date().toISOString() };
}
export async function createOcrDocument(input:{studentId:number;worksheetId:number;worksheetQuestionId?:number;pages:UploadPage[]}):Promise<{documentId:number;pages:OcrPage[]}>{ if(!Number.isSafeInteger(input.studentId)||!Number.isSafeInteger(input.worksheetId)||!input.pages.length)throw new SubmissionApiError("Submission details are invalid.",400); const form=new FormData(); form.append("studentId",String(input.studentId)); form.append("worksheetId",String(input.worksheetId)); if(input.worksheetQuestionId)form.append("worksheetQuestionId",String(input.worksheetQuestionId)); input.pages.forEach(p=>form.append("files",p.file)); const response=await fetch(`${gradingUrl}/api/grading/submission-documents`,{method:"POST",headers:headers(),body:form}); if(!response.ok){const b=await response.json().catch(()=>null) as {error?:string}|null;throw new SubmissionApiError(b?.error||"OCR could not be started.",response.status);} const body=await response.json() as {id:number;pages:Array<{id:number;extractionId:number;text:string;confidence:number;status:OcrPage["status"]}>}; return {documentId:body.id,pages:body.pages.map(p=>({pageId:p.id,extractionId:p.extractionId,text:p.text,confidence:p.confidence,status:p.status}))}; }
export async function correctOcrExtraction(extractionId:number,correctedText:string):Promise<OcrPage>{const response=await fetch(`${gradingUrl}/api/grading/ocr-extractions/${extractionId}`,{method:"PATCH",headers:{...headers(),"Content-Type":"application/json"},body:JSON.stringify({correctedText})});if(!response.ok)throw new SubmissionApiError("OCR correction could not be saved.",response.status);const b=await response.json() as {id:number;text:string;confidence:number;status:OcrPage["status"]};return {pageId:0,extractionId:b.id,text:b.text,confidence:b.confidence,status:b.status};}

export type MarkingReviewStatus = "PENDING_REVIEW" | "FLAGGED" | "APPROVED";
export type DiagnosticCategory = "CONCEPT" | "KEYWORD" | "EXPRESSION" | "APPLICATION";
export type DiagnosticEvidence = { category: DiagnosticCategory; description: string; missingKeywords: string[] };
export type ManualResultRequest = {
  worksheetId: number;
  studentId: number;
  questionBankId: number;
  answer: string;
  marks: number;
  feedback: string;
};
export type MarkingReview = {
  id: number; studentId: number; worksheetId: number; worksheetQuestionId: number; questionBankId: number;
  extractedAnswer: string; modelAnswer: string; maxMarks: number; aiSuggestedMarks: number | null;
  aiSuggestedOutcome: string | null; aiErrorCategory: string | null; missingKeywords: string[];
  aiSuggestedFeedback: string | null; reviewStatus: MarkingReviewStatus; approvedMarks: number | null;
  approvedFeedback: string | null; reviewedByUserId: number | null; reviewedAt: string | null;
  providerResponseValid: boolean | null;
  diagnosticEvidence: DiagnosticEvidence[];
  history: Array<{ id: number; action: "APPROVED" | "REVISED" | "FLAGGED" | "RESET_TO_AI"; reviewerUserId: number; previousStatus: MarkingReviewStatus; newStatus: MarkingReviewStatus; previousMarks: number | null; newMarks: number | null; previousFeedback: string | null; newFeedback: string | null; createdAt: string }>;
};

const reviewStatuses = new Set<MarkingReviewStatus>(["PENDING_REVIEW", "FLAGGED", "APPROVED"]);
const diagnosticCategories = new Set<DiagnosticCategory>(["CONCEPT", "KEYWORD", "EXPRESSION", "APPLICATION"]);
const numberValue = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
const stringValue = (value: unknown) => typeof value === "string" ? value : null;
export function parseMarkingReview(value: unknown): MarkingReview {
  if (!value || typeof value !== "object") throw new SubmissionApiError("The marking review response is invalid.");
  const raw = value as Record<string, unknown>;
  const ids = [raw.id, raw.studentId, raw.worksheetId, raw.worksheetQuestionId, raw.questionBankId].map(numberValue);
  if (ids.some((id) => id === null || id <= 0) || !reviewStatuses.has(raw.reviewStatus as MarkingReviewStatus)
    || typeof raw.extractedAnswer !== "string" || typeof raw.modelAnswer !== "string" || numberValue(raw.maxMarks) === null
    || !Array.isArray(raw.missingKeywords) || !Array.isArray(raw.diagnosticEvidence) || !Array.isArray(raw.history)) throw new SubmissionApiError("The marking review response is invalid.");
  const diagnosticEvidence = raw.diagnosticEvidence.map((entry): DiagnosticEvidence => {
    if (!entry || typeof entry !== "object") throw new SubmissionApiError("The marking diagnostic evidence is invalid.");
    const item = entry as Record<string, unknown>;
    if (!diagnosticCategories.has(item.category as DiagnosticCategory) || typeof item.description !== "string" || !item.description.trim() || !Array.isArray(item.missingKeywords) || item.missingKeywords.some((keyword) => typeof keyword !== "string" || !keyword.trim())) throw new SubmissionApiError("The marking diagnostic evidence is invalid.");
    return { category: item.category as DiagnosticCategory, description: item.description, missingKeywords: item.missingKeywords as string[] };
  });
  return {
    id: ids[0]!, studentId: ids[1]!, worksheetId: ids[2]!, worksheetQuestionId: ids[3]!, questionBankId: ids[4]!, extractedAnswer: raw.extractedAnswer,
    modelAnswer: raw.modelAnswer, maxMarks: numberValue(raw.maxMarks)!, aiSuggestedMarks: numberValue(raw.aiSuggestedMarks), aiSuggestedOutcome: stringValue(raw.aiSuggestedOutcome), aiErrorCategory: stringValue(raw.aiErrorCategory),
    missingKeywords: raw.missingKeywords.filter((keyword): keyword is string => typeof keyword === "string"), aiSuggestedFeedback: stringValue(raw.aiSuggestedFeedback), reviewStatus: raw.reviewStatus as MarkingReviewStatus,
    approvedMarks: numberValue(raw.approvedMarks), approvedFeedback: stringValue(raw.approvedFeedback), reviewedByUserId: numberValue(raw.reviewedByUserId), reviewedAt: stringValue(raw.reviewedAt), providerResponseValid: typeof raw.providerResponseValid === "boolean" ? raw.providerResponseValid : null, diagnosticEvidence,
    history: raw.history.map((entry) => {
      if (!entry || typeof entry !== "object") throw new SubmissionApiError("The marking review history is invalid.");
      const item = entry as Record<string, unknown>; const id = numberValue(item.id); const reviewer = numberValue(item.reviewerUserId);
      if (id === null || reviewer === null || !reviewStatuses.has(item.previousStatus as MarkingReviewStatus) || !reviewStatuses.has(item.newStatus as MarkingReviewStatus) || typeof item.action !== "string" || typeof item.createdAt !== "string") throw new SubmissionApiError("The marking review history is invalid.");
      return { id, action: item.action as MarkingReview["history"][number]["action"], reviewerUserId: reviewer, previousStatus: item.previousStatus as MarkingReviewStatus, newStatus: item.newStatus as MarkingReviewStatus, previousMarks: numberValue(item.previousMarks), newMarks: numberValue(item.newMarks), previousFeedback: stringValue(item.previousFeedback), newFeedback: stringValue(item.newFeedback), createdAt: item.createdAt };
    }),
  };
}
async function reviewRequest(path: string, init?: RequestInit): Promise<MarkingReview> { const response = await fetch(`${gradingUrl}/api/grading/tutor/reviews${path}`, { ...init, headers: { ...headers(), "Content-Type": "application/json", ...(init?.headers || {}) } }); if (!response.ok) { const body = await response.json().catch(() => null) as { error?: string } | null; throw new SubmissionApiError(body?.error || "The marking review could not be updated.", response.status); } return parseMarkingReview(await response.json()); }
export function createMarkingReview(input: { submissionDocumentId: number; worksheetQuestionId: number; questionBankId: number }): Promise<MarkingReview> { if (![input.submissionDocumentId, input.worksheetQuestionId, input.questionBankId].every((id) => Number.isSafeInteger(id) && id > 0)) return Promise.reject(new SubmissionApiError("The submission review context is invalid.", 400)); return reviewRequest("", { method: "POST", body: JSON.stringify(input) }); }
/** Creates a Tutor-approved fallback result without pretending that OCR source pages exist. */
export function createManualResult(input: ManualResultRequest): Promise<MarkingReview> {
  if (![input.worksheetId, input.studentId, input.questionBankId].every((id) => Number.isSafeInteger(id) && id > 0)
    || !Number.isFinite(input.marks) || input.marks < 0 || !input.answer.trim() || !input.feedback.trim()) {
    return Promise.reject(new SubmissionApiError("Student, question, answer, marks and tutor feedback are required.", 400));
  }
  return reviewRequest("/manual", { method: "POST", body: JSON.stringify(input) });
}
export function fetchMarkingReview(submissionId: number): Promise<MarkingReview> { if (!Number.isSafeInteger(submissionId) || submissionId <= 0) return Promise.reject(new SubmissionApiError("The submission id is invalid.", 400)); return reviewRequest(`/${submissionId}`); }
export function approveMarkingReview(submissionId: number, marks: number, feedback: string, diagnosticEvidence: DiagnosticEvidence[] = []): Promise<MarkingReview> {
  if (!Number.isFinite(marks) || marks < 0 || !feedback.trim() || !Array.isArray(diagnosticEvidence) || diagnosticEvidence.some((item) => !diagnosticCategories.has(item.category) || !item.description.trim() || item.missingKeywords.some((keyword) => !keyword.trim()))) return Promise.reject(new SubmissionApiError("Marks, tutor feedback and diagnostic evidence are invalid.", 400));
  return reviewRequest(`/${submissionId}/approve`, { method: "POST", body: JSON.stringify({ marks, feedback, diagnosticEvidence }) });
}
export function flagMarkingReview(submissionId: number, reason: string): Promise<MarkingReview> { if (!reason.trim()) return Promise.reject(new SubmissionApiError("A flag reason is required.", 400)); return reviewRequest(`/${submissionId}/flag`, { method: "POST", body: JSON.stringify({ reason }) }); }
export function resetMarkingReview(submissionId: number): Promise<MarkingReview> { return reviewRequest(`/${submissionId}/reset`, { method: "POST", body: "{}" }); }
