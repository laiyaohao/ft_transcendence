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
export type SubmissionDocument = {
  id: number; classId: number | null; studentId: number; worksheetId: number;
  uploadedByTutorId: number | null; status: "UPLOADING" | "READY" | "SUBMITTED_FOR_REVIEW"; createdAt: string;
  pages: OcrPage[];
};

function parseSubmissionDocument(value: unknown): SubmissionDocument {
  if (!value || typeof value !== "object") throw new SubmissionApiError("The submission document response is invalid.");
  const raw = value as Record<string, unknown>;
  if (!Number.isSafeInteger(raw.id) || (raw.id as number) <= 0
    || !Number.isSafeInteger(raw.studentId) || (raw.studentId as number) <= 0
    || !Number.isSafeInteger(raw.worksheetId) || (raw.worksheetId as number) <= 0
    || (raw.classId !== null && (!Number.isSafeInteger(raw.classId) || (raw.classId as number) <= 0))
    || (raw.uploadedByTutorId !== null && (!Number.isSafeInteger(raw.uploadedByTutorId) || (raw.uploadedByTutorId as number) <= 0))
    || (raw.status !== "UPLOADING" && raw.status !== "READY" && raw.status !== "SUBMITTED_FOR_REVIEW") || typeof raw.createdAt !== "string" || !Array.isArray(raw.pages)) {
    throw new SubmissionApiError("The submission document response is invalid.");
  }
  const pageIds = new Set<number>();
  const pages = raw.pages.map((value): OcrPage => {
    if (!value || typeof value !== "object") throw new SubmissionApiError("The submission document response is invalid.");
    const page = value as Record<string, unknown>;
    if (!Number.isSafeInteger(page.id) || (page.id as number) <= 0 || pageIds.has(page.id as number)
      || !Number.isSafeInteger(page.extractionId) || (page.extractionId as number) <= 0
      || typeof page.text !== "string" || typeof page.confidence !== "number"
      || (page.status !== "READY" && page.status !== "REQUIRES_REVIEW" && page.status !== "UNREADABLE")) {
      throw new SubmissionApiError("The submission document response is invalid.");
    }
    pageIds.add(page.id as number);
    return { pageId: page.id as number, extractionId: page.extractionId as number, text: page.text, confidence: page.confidence, status: page.status };
  });
  return { id: raw.id as number, classId: raw.classId as number | null, studentId: raw.studentId as number, worksheetId: raw.worksheetId as number, uploadedByTutorId: raw.uploadedByTutorId as number | null, status: raw.status, createdAt: raw.createdAt, pages };
}

export async function createOcrDocument(input:{classId?:number;studentId:number;worksheetId:number;worksheetQuestionId?:number;pages:UploadPage[]}):Promise<SubmissionDocument>{
  if ((input.classId !== undefined && (!Number.isSafeInteger(input.classId) || input.classId <= 0)) || !Number.isSafeInteger(input.studentId) || input.studentId <= 0 || !Number.isSafeInteger(input.worksheetId) || input.worksheetId <= 0 || !input.pages.length) throw new SubmissionApiError("Submission details are invalid.",400);
  const form=new FormData(); form.append("studentId",String(input.studentId)); form.append("worksheetId",String(input.worksheetId)); if(input.classId !== undefined)form.append("classId",String(input.classId)); if(input.worksheetQuestionId)form.append("worksheetQuestionId",String(input.worksheetQuestionId)); input.pages.forEach(p=>form.append("files",p.file));
  const response=await fetch(`${gradingUrl}/api/grading/submission-documents`,{method:"POST",headers:headers(),body:form}); if(!response.ok){const b=await response.json().catch(()=>null) as {error?:string}|null;throw new SubmissionApiError(b?.error||"OCR could not be started.",response.status);}
  return parseSubmissionDocument(await response.json());
}

export async function fetchSubmissionDocument(documentId: number): Promise<SubmissionDocument> {
  if (!Number.isSafeInteger(documentId) || documentId <= 0) throw new SubmissionApiError("The submission ID is invalid.", 400);
  const response = await fetch(`${gradingUrl}/api/grading/submission-documents/${documentId}`, { headers: headers() });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new SubmissionApiError(body?.error || "Submission document could not be loaded.", response.status);
  }
  return parseSubmissionDocument(await response.json());
}
export async function correctOcrExtraction(extractionId:number,correctedText:string):Promise<OcrPage>{const response=await fetch(`${gradingUrl}/api/grading/ocr-extractions/${extractionId}`,{method:"PATCH",headers:{...headers(),"Content-Type":"application/json"},body:JSON.stringify({correctedText})});if(!response.ok)throw new SubmissionApiError("OCR correction could not be saved.",response.status);const b=await response.json() as {id:number;text:string;confidence:number;status:OcrPage["status"]};return {pageId:0,extractionId:b.id,text:b.text,confidence:b.confidence,status:b.status};}

export type OcrAnswerMapping = { extractionId: number; questionBankId: number };
export type SubmissionForTutorReview = { submissionDocumentId: number; submissionIds: number[]; status: "PENDING_REVIEW" };
export async function submitOcrForTutorReview(documentId: number, answers: OcrAnswerMapping[]): Promise<SubmissionForTutorReview> {
  if (!Number.isSafeInteger(documentId) || documentId <= 0 || !answers.length || answers.some((answer) => !Number.isSafeInteger(answer.extractionId) || answer.extractionId <= 0 || !Number.isSafeInteger(answer.questionBankId) || answer.questionBankId <= 0)) {
    throw new SubmissionApiError("OCR submission details are invalid.", 400);
  }
  const response = await fetch(`${gradingUrl}/api/grading/submission-documents/${documentId}/submit-for-review`, {
    method: "POST", headers: { ...headers(), "Content-Type": "application/json" }, body: JSON.stringify({ answers }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new SubmissionApiError(body?.error || "The OCR submission could not be sent for Tutor review.", response.status);
  }
  const body = await response.json() as Record<string, unknown>;
  if (!Number.isSafeInteger(body.submissionDocumentId) || body.submissionDocumentId !== documentId || body.status !== "PENDING_REVIEW"
    || !Array.isArray(body.submissionIds) || !body.submissionIds.length || body.submissionIds.some((id) => !Number.isSafeInteger(id) || (id as number) <= 0)) {
    throw new SubmissionApiError("The OCR submission response is invalid.");
  }
  return { submissionDocumentId: body.submissionDocumentId as number, submissionIds: body.submissionIds as number[], status: "PENDING_REVIEW" };
}

/** OCR and typed answers are persisted through the same canonical submission records. */
export type ManualAnswerEntry = { questionBankId: number; answer: string };
export type ManualAnswerSubmission = {
  studentId: number;
  worksheetId: number;
  classId?: number;
  answers: ManualAnswerEntry[];
  submit: boolean;
};
export type ManualAnswerResponse = {
  submissionDocumentId: number;
  submissionIds: number[];
  status: "DRAFT" | "PENDING_REVIEW";
  inputMethod: "MANUAL";
};
export type ManualAnswerDraft = {
  submissionDocumentId: number | null;
  answers: ManualAnswerEntry[];
  status: "DRAFT" | "PENDING_REVIEW";
  inputMethod: "MANUAL";
};
function parseManualAnswerDraft(value: unknown): ManualAnswerDraft {
  if (!value || typeof value !== "object") throw new SubmissionApiError("The manual answer response is invalid.");
  const body = value as Record<string, unknown>;
  const validId = (item: unknown) => Number.isSafeInteger(item) && (item as number) > 0;
  if (!(body.submissionDocumentId === null || validId(body.submissionDocumentId))
    || !Array.isArray(body.answers)
    || body.answers.some((item) => !item || typeof item !== "object" || !validId((item as Record<string, unknown>).questionBankId) || typeof (item as Record<string, unknown>).answer !== "string")
    || body.inputMethod !== "MANUAL"
    || (body.status !== "DRAFT" && body.status !== "PENDING_REVIEW")) {
    throw new SubmissionApiError("The manual answer response is invalid.");
  }
  return {
    submissionDocumentId: body.submissionDocumentId as number | null,
    answers: body.answers.map((item) => ({ questionBankId: (item as Record<string, unknown>).questionBankId as number, answer: (item as Record<string, unknown>).answer as string })),
    status: body.status,
    inputMethod: "MANUAL",
  };
}
export async function fetchManualAnswerDraft(input: Pick<ManualAnswerSubmission, "studentId" | "worksheetId" | "classId">): Promise<ManualAnswerDraft> {
  const validId = (value: unknown) => Number.isSafeInteger(value) && (value as number) > 0;
  if (!validId(input.studentId) || !validId(input.worksheetId) || (input.classId !== undefined && !validId(input.classId))) {
    throw new SubmissionApiError("Manual answer details are invalid.", 400);
  }
  const query = new URLSearchParams({ studentId: String(input.studentId), worksheetId: String(input.worksheetId) });
  if (input.classId !== undefined) query.set("classId", String(input.classId));
  const response = await fetch(`${gradingUrl}/api/grading/submission-documents/manual-answers?${query.toString()}`, { headers: headers() });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new SubmissionApiError(body?.error || "Your answers could not be loaded. Please try again.", response.status);
  }
  return parseManualAnswerDraft(await response.json());
}
export async function saveManualAnswers(input: ManualAnswerSubmission): Promise<ManualAnswerResponse> {
  const validId = (value: unknown) => Number.isSafeInteger(value) && (value as number) > 0;
  if (!validId(input.studentId) || !validId(input.worksheetId)
    || (input.classId !== undefined && !validId(input.classId))
    || !Array.isArray(input.answers) || input.answers.length === 0
    || input.answers.some((entry) => !validId(entry.questionBankId) || typeof entry.answer !== "string")
    || new Set(input.answers.map((entry) => entry.questionBankId)).size !== input.answers.length) {
    throw new SubmissionApiError("Manual answer details are invalid.", 400);
  }
  const response = await fetch(`${gradingUrl}/api/grading/submission-documents/manual-answers`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new SubmissionApiError(body?.error || "Your answers could not be saved. Please try again.", response.status);
  }
  const body = await response.json() as Record<string, unknown>;
  if (!validId(body.submissionDocumentId)
    || !Array.isArray(body.submissionIds)
    || body.submissionIds.some((value) => !validId(value))
    || body.inputMethod !== "MANUAL"
    || (body.status !== "DRAFT" && body.status !== "PENDING_REVIEW")) {
    throw new SubmissionApiError("The manual answer response is invalid.");
  }
  return {
    submissionDocumentId: body.submissionDocumentId as number,
    submissionIds: body.submissionIds as number[],
    status: body.status as ManualAnswerResponse["status"],
    inputMethod: "MANUAL",
  };
}

export type MarkingReviewStatus = "PENDING_REVIEW" | "FLAGGED" | "APPROVED";
export type DiagnosticCategory = "CONCEPT" | "KEYWORD" | "EXPRESSION" | "APPLICATION";
export type MistakeType = "CONCEPT_MISUNDERSTANDING" | "CALCULATION_ERROR" | "MISREAD_QUESTION" | "INCOMPLETE_WORKING" | "INCORRECT_FORMULA" | "CARELESS_MISTAKE" | "WEAK_EXPLANATION" | "MISSING_KEY_POINT" | "WRONG_UNITS" | "ANSWER_FORMAT_ISSUE";
export type DiagnosticEvidence = { mistakeType: MistakeType; category: DiagnosticCategory; description: string; missingKeywords: string[] };
export type DiagnosticEvidenceInput = Pick<DiagnosticEvidence, "mistakeType" | "description" | "missingKeywords">;
export type ManualResultRequest = {
  worksheetId: number;
  studentId: number;
  questionBankId: number;
  answer: string;
  marks: number;
  feedback: string;
};
export type ManualResultEntry = {
  questionBankId: number;
  answer: string;
  marks: number;
  feedback: string;
};
export type ManualResultBatchRequest = {
  worksheetId: number;
  studentId: number;
  entries: ManualResultEntry[];
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
export type ManualResultStudentProgress = {
  studentId: number;
  completedQuestions: number;
  results: MarkingReview[];
};
export type ManualResultsResponse = {
  worksheetId: number;
  students: ManualResultStudentProgress[];
};

/** A Student-visible marking result.  Final marks and feedback are supplied only after Tutor approval. */
export type StudentWorksheetResultOutcome = "CORRECT" | "PARTIAL" | "INCORRECT" | "REVIEW_NEEDED";
export type StudentWorksheetResult = {
  submissionId: number;
  worksheetQuestionId: number;
  questionBankId: number;
  answer: string;
  modelAnswer: string | null;
  maximumMarks: number;
  reviewStatus: MarkingReviewStatus;
  outcome: StudentWorksheetResultOutcome;
  awardedMarks: number | null;
  explanation: string | null;
  reviewedAt: string | null;
};
export type StudentWorksheetResultsResponse = { worksheetId: number; results: StudentWorksheetResult[] };

/** A Tutor-confirmed diagnostic item shown in the authenticated Student's review history. */
export type StudentMistakeReview = {
  id: number;
  worksheetId: number;
  worksheetQuestionId: number;
  questionBankId: number;
  syllabusTopicId: number | null;
  syllabusTopicCode: string | null;
  mistakeType: MistakeType;
  mistakeLabel: string;
  description: string;
  recordedAt: string;
  subjectId: number | null;
  subjectName: string | null;
  topicName: string | null;
  occurrenceCount: number;
  status: "CONFIRMED";
};
export type StudentMistakeFilters = {
  subjectId?: number;
  topicId?: number;
  mistakeType?: MistakeType;
  worksheetId?: number;
  from?: string;
  to?: string;
};

const reviewStatuses = new Set<MarkingReviewStatus>(["PENDING_REVIEW", "FLAGGED", "APPROVED"]);
const studentResultOutcomes = new Set<StudentWorksheetResultOutcome>(["CORRECT", "PARTIAL", "INCORRECT", "REVIEW_NEEDED"]);
const diagnosticCategories = new Set<DiagnosticCategory>(["CONCEPT", "KEYWORD", "EXPRESSION", "APPLICATION"]);
const mistakeTypes = new Set<MistakeType>(["CONCEPT_MISUNDERSTANDING", "CALCULATION_ERROR", "MISREAD_QUESTION", "INCOMPLETE_WORKING", "INCORRECT_FORMULA", "CARELESS_MISTAKE", "WEAK_EXPLANATION", "MISSING_KEY_POINT", "WRONG_UNITS", "ANSWER_FORMAT_ISSUE"]);
const numberValue = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
const stringValue = (value: unknown) => typeof value === "string" ? value : null;
const nonNegativeNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
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
    if (!mistakeTypes.has(item.mistakeType as MistakeType) || !diagnosticCategories.has(item.category as DiagnosticCategory) || typeof item.description !== "string" || !item.description.trim() || !Array.isArray(item.missingKeywords) || item.missingKeywords.some((keyword) => typeof keyword !== "string" || !keyword.trim())) throw new SubmissionApiError("The marking diagnostic evidence is invalid.");
    return { mistakeType: item.mistakeType as MistakeType, category: item.category as DiagnosticCategory, description: item.description, missingKeywords: item.missingKeywords as string[] };
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
export function parseManualResultsResponse(value: unknown): ManualResultsResponse {
  if (!value || typeof value !== "object") throw new SubmissionApiError("The manual result response is invalid.");
  const raw = value as Record<string, unknown>;
  if (!Number.isSafeInteger(raw.worksheetId) || (raw.worksheetId as number) <= 0 || !Array.isArray(raw.students)) {
    throw new SubmissionApiError("The manual result response is invalid.");
  }
  const ids = new Set<number>();
  const students = raw.students.map((entry): ManualResultStudentProgress => {
    if (!entry || typeof entry !== "object") throw new SubmissionApiError("The manual result response is invalid.");
    const progress = entry as Record<string, unknown>;
    if (!Number.isSafeInteger(progress.studentId) || (progress.studentId as number) <= 0 || !Number.isSafeInteger(progress.completedQuestions)
      || (progress.completedQuestions as number) < 0 || !Array.isArray(progress.results) || ids.has(progress.studentId as number)) {
      throw new SubmissionApiError("The manual result response is invalid.");
    }
    ids.add(progress.studentId as number);
    const results = progress.results.map(parseMarkingReview);
    if (results.length !== progress.completedQuestions || results.some((result) => result.studentId !== progress.studentId || result.worksheetId !== raw.worksheetId)) {
      throw new SubmissionApiError("The manual result response is invalid.");
    }
    return { studentId: progress.studentId as number, completedQuestions: progress.completedQuestions as number, results };
  });
  return { worksheetId: raw.worksheetId as number, students };
}
export function parseStudentWorksheetResultsResponse(value: unknown): StudentWorksheetResultsResponse {
  if (!value || typeof value !== "object") throw new SubmissionApiError("The student worksheet results response is invalid.");
  const raw = value as Record<string, unknown>;
  if (!Number.isSafeInteger(raw.worksheetId) || (raw.worksheetId as number) <= 0 || !Array.isArray(raw.results)) {
    throw new SubmissionApiError("The student worksheet results response is invalid.");
  }
  const seenSubmissionIds = new Set<number>();
  const results = raw.results.map((entry): StudentWorksheetResult => {
    if (!entry || typeof entry !== "object") throw new SubmissionApiError("The student worksheet results response is invalid.");
    const result = entry as Record<string, unknown>;
    const ids = [result.submissionId, result.worksheetQuestionId, result.questionBankId];
    if (!ids.every((id) => Number.isSafeInteger(id) && (id as number) > 0)
      || seenSubmissionIds.has(result.submissionId as number)
      || typeof result.answer !== "string"
      || (result.modelAnswer !== null && typeof result.modelAnswer !== "string")
      || !nonNegativeNumber(result.maximumMarks)
      || !reviewStatuses.has(result.reviewStatus as MarkingReviewStatus)
      || !studentResultOutcomes.has(result.outcome as StudentWorksheetResultOutcome)
      || (result.awardedMarks !== null && (!nonNegativeNumber(result.awardedMarks) || (result.awardedMarks as number) > (result.maximumMarks as number)))
      || (result.explanation !== null && typeof result.explanation !== "string")
      || (result.reviewedAt !== null && typeof result.reviewedAt !== "string")) {
      throw new SubmissionApiError("The student worksheet results response is invalid.");
    }
    const approved = result.reviewStatus === "APPROVED";
    if ((approved && (result.awardedMarks === null || result.explanation === null))
      || (!approved && (result.awardedMarks !== null || result.explanation !== null || result.modelAnswer !== null))) {
      throw new SubmissionApiError("The student worksheet results response is invalid.");
    }
    seenSubmissionIds.add(result.submissionId as number);
    return {
      submissionId: result.submissionId as number,
      worksheetQuestionId: result.worksheetQuestionId as number,
      questionBankId: result.questionBankId as number,
      answer: result.answer,
      modelAnswer: result.modelAnswer as string | null,
      maximumMarks: result.maximumMarks as number,
      reviewStatus: result.reviewStatus as MarkingReviewStatus,
      outcome: result.outcome as StudentWorksheetResultOutcome,
      awardedMarks: result.awardedMarks as number | null,
      explanation: result.explanation as string | null,
      reviewedAt: result.reviewedAt as string | null,
    };
  });
  return { worksheetId: raw.worksheetId as number, results };
}
function nullablePositiveInteger(value: unknown): number | null {
  return value === null ? null : (Number.isSafeInteger(value) && (value as number) > 0 ? value as number : null);
}
function nullableNonBlankText(value: unknown): string | null {
  return value === null ? null : (typeof value === "string" && value.trim() ? value : null);
}
/** Strictly validates the Student mistake-history contract before it reaches the UI. */
export function parseStudentMistakeReviews(value: unknown): StudentMistakeReview[] {
  if (!Array.isArray(value)) throw new SubmissionApiError("The mistake review response is invalid.");
  return value.map((entry) => {
    if (!entry || typeof entry !== "object") throw new SubmissionApiError("The mistake review response is invalid.");
    const record = entry as Record<string, unknown>;
    const id = nullablePositiveInteger(record.id);
    const worksheetId = nullablePositiveInteger(record.worksheetId);
    const worksheetQuestionId = nullablePositiveInteger(record.worksheetQuestionId);
    const questionBankId = nullablePositiveInteger(record.questionBankId);
    const syllabusTopicId = nullablePositiveInteger(record.syllabusTopicId);
    const subjectId = nullablePositiveInteger(record.subjectId);
    const occurrenceCount = record.occurrenceCount;
    const status = record.status;
    if (id === null || worksheetId === null || worksheetQuestionId === null || questionBankId === null
      || !mistakeTypes.has(record.mistakeType as MistakeType)
      || typeof record.mistakeLabel !== "string" || !record.mistakeLabel.trim()
      || typeof record.description !== "string" || !record.description.trim()
      || typeof record.recordedAt !== "string" || !record.recordedAt.trim()
      || !Number.isSafeInteger(occurrenceCount) || (occurrenceCount as number) < 1
      || status !== "CONFIRMED"
      || (record.syllabusTopicId !== null && syllabusTopicId === null)
      || (record.subjectId !== null && subjectId === null)
      || (record.syllabusTopicCode !== null && nullableNonBlankText(record.syllabusTopicCode) === null)
      || (record.subjectName !== null && nullableNonBlankText(record.subjectName) === null)
      || (record.topicName !== null && nullableNonBlankText(record.topicName) === null)) {
      throw new SubmissionApiError("The mistake review response is invalid.");
    }
    return {
      id, worksheetId, worksheetQuestionId, questionBankId, syllabusTopicId,
      syllabusTopicCode: nullableNonBlankText(record.syllabusTopicCode),
      mistakeType: record.mistakeType as MistakeType, mistakeLabel: record.mistakeLabel,
      description: record.description, recordedAt: record.recordedAt, subjectId,
      subjectName: nullableNonBlankText(record.subjectName), topicName: nullableNonBlankText(record.topicName),
      occurrenceCount: occurrenceCount as number, status,
    };
  });
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
/** Saves all entered question marks for one assigned Student atomically. */
export async function createManualResults(input: ManualResultBatchRequest): Promise<MarkingReview[]> {
  const validEntry = (entry: ManualResultEntry) => Number.isSafeInteger(entry.questionBankId) && entry.questionBankId > 0
    && Number.isFinite(entry.marks) && entry.marks >= 0 && Boolean(entry.answer.trim()) && Boolean(entry.feedback.trim());
  if (!Number.isSafeInteger(input.worksheetId) || input.worksheetId <= 0 || !Number.isSafeInteger(input.studentId) || input.studentId <= 0
    || !Array.isArray(input.entries) || input.entries.length === 0 || !input.entries.every(validEntry)
    || new Set(input.entries.map((entry) => entry.questionBankId)).size !== input.entries.length) {
    return Promise.reject(new SubmissionApiError("Every entered question needs an answer, valid marks and tutor feedback.", 400));
  }
  const response = await fetch(`${gradingUrl}/api/grading/tutor/reviews/manual/batch`, {
    method: "POST", headers: { ...headers(), "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new SubmissionApiError(body?.error || "The manual results could not be saved.", response.status);
  }
  const payload = await response.json();
  if (!Array.isArray(payload)) throw new SubmissionApiError("The manual result response is invalid.");
  return payload.map(parseMarkingReview);
}
/** Returns only the current Tutor's manual results, after Learning has owner-scoped the worksheet. */
export async function fetchManualResults(worksheetId: number): Promise<ManualResultsResponse> {
  if (!Number.isSafeInteger(worksheetId) || worksheetId <= 0) {
    throw new SubmissionApiError("The worksheet id is invalid.", 400);
  }
  const response = await fetch(`${gradingUrl}/api/grading/tutor/reviews/manual/worksheets/${worksheetId}`, { headers: headers() });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new SubmissionApiError(body?.error || "The manual results could not be loaded.", response.status);
  }
  return parseManualResultsResponse(await response.json());
}
/** Loads the authenticated Student's worksheet results; no student id is ever accepted from the browser. */
export async function fetchStudentWorksheetResults(worksheetId: number): Promise<StudentWorksheetResultsResponse> {
  if (!Number.isSafeInteger(worksheetId) || worksheetId <= 0) {
    throw new SubmissionApiError("The worksheet id is invalid.", 400);
  }
  const response = await fetch(`${gradingUrl}/api/grading/student/worksheets/${worksheetId}/results`, { headers: headers() });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new SubmissionApiError(body?.error || "The worksheet results could not be loaded.", response.status);
  }
  return parseStudentWorksheetResultsResponse(await response.json());
}
/** Loads the signed-in Student's persisted, Tutor-confirmed mistake history with server-side filters. */
export async function fetchStudentMistakes(filters: StudentMistakeFilters = {}): Promise<StudentMistakeReview[]> {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    if (value === undefined || value === "") continue;
    if ((name === "subjectId" || name === "topicId" || name === "worksheetId")
      && (!Number.isSafeInteger(value) || (value as number) <= 0)) {
      throw new SubmissionApiError(`The ${name} filter is invalid.`, 400);
    }
    if (name === "mistakeType" && !mistakeTypes.has(value as MistakeType)) {
      throw new SubmissionApiError("The mistake type filter is invalid.", 400);
    }
    query.set(name, String(value));
  }
  const response = await fetch(`${gradingUrl}/api/grading/student/mistakes${query.size ? `?${query}` : ""}`, { headers: headers() });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new SubmissionApiError(body?.error || "Mistake history could not be loaded.", response.status);
  }
  return parseStudentMistakeReviews(await response.json());
}
export function fetchMarkingReview(submissionId: number): Promise<MarkingReview> { if (!Number.isSafeInteger(submissionId) || submissionId <= 0) return Promise.reject(new SubmissionApiError("The submission id is invalid.", 400)); return reviewRequest(`/${submissionId}`); }
export function approveMarkingReview(submissionId: number, marks: number, feedback: string, diagnosticEvidence: DiagnosticEvidenceInput[] = []): Promise<MarkingReview> {
  if (!Number.isFinite(marks) || marks < 0 || !feedback.trim() || !Array.isArray(diagnosticEvidence) || diagnosticEvidence.some((item) => !mistakeTypes.has(item.mistakeType) || !item.description.trim() || item.missingKeywords.some((keyword) => !keyword.trim()))) return Promise.reject(new SubmissionApiError("Marks, tutor feedback and diagnostic evidence are invalid.", 400));
  return reviewRequest(`/${submissionId}/approve`, { method: "POST", body: JSON.stringify({ marks, feedback, diagnosticEvidence }) });
}
export function flagMarkingReview(submissionId: number, reason: string): Promise<MarkingReview> { if (!reason.trim()) return Promise.reject(new SubmissionApiError("A flag reason is required.", 400)); return reviewRequest(`/${submissionId}/flag`, { method: "POST", body: JSON.stringify({ reason }) }); }
export function resetMarkingReview(submissionId: number): Promise<MarkingReview> { return reviewRequest(`/${submissionId}/reset`, { method: "POST", body: "{}" }); }
