export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_THE_BLANK" | "SHORT_ANSWER" | "OPEN_ENDED" | "CALCULATION" | "DIAGRAM";
export type QuestionArchiveState = "ACTIVE" | "ARCHIVED";
export type SyllabusNodeType = "TOPIC" | "SUBTOPIC";

export interface QuestionBankFilters {
  topicId?: number;
  questionType?: QuestionType;
  archiveState?: QuestionArchiveState;
  page?: number;
  size?: number;
}

export interface QuestionBankItem {
  id: number;
  code: string;
  syllabusTopic: { id: number; code: string; name: string; nodeType: SyllabusNodeType };
  questionType: QuestionType;
  prompt: string;
  totalMarks: number;
  archiveState: QuestionArchiveState;
}

export interface QuestionBankPage {
  items: QuestionBankItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface QuestionMarkingComponent {
  position: number;
  description: string;
  marks: number;
}

/** Complete Tutor-only shape used for question creation and editing. */
export interface TutorQuestion extends QuestionBankItem {
  modelAnswer: string;
  markingComponents: QuestionMarkingComponent[];
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionMutationRequest {
  code: string;
  syllabusTopicId: number;
  questionType: QuestionType;
  prompt: string;
  totalMarks: number;
  modelAnswer: string;
  archiveState: QuestionArchiveState;
  markingComponents: Array<{ description: string; marks: number }>;
  keywords: string[];
}

export class QuestionApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;

  constructor(message: string, status: number, fields: Record<string, string> = {}) {
    super(message);
    this.name = "QuestionApiError";
    this.status = status;
    this.fields = fields;
  }
}

const LEARNING_API_URL = process.env.NEXT_PUBLIC_LEARNING_API_URL || "http://localhost:8083";
const QUESTION_BANK_PATH = "/api/learning/tutor/questions";
const QUESTION_TYPES: readonly QuestionType[] = ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_THE_BLANK", "SHORT_ANSWER", "OPEN_ENDED", "CALCULATION", "DIAGRAM"];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isQuestionType(value: unknown): value is QuestionType {
  return typeof value === "string" && QUESTION_TYPES.includes(value as QuestionType);
}

function isArchiveState(value: unknown): value is QuestionArchiveState {
  return value === "ACTIVE" || value === "ARCHIVED";
}

function isSyllabusTopic(value: unknown): value is QuestionBankItem["syllabusTopic"] {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return isPositiveId(candidate.id)
    && isNonEmptyString(candidate.code)
    && isNonEmptyString(candidate.name)
    && (candidate.nodeType === "TOPIC" || candidate.nodeType === "SUBTOPIC");
}

function isQuestionBankItem(value: unknown): value is QuestionBankItem {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return isPositiveId(candidate.id)
    && isNonEmptyString(candidate.code)
    && isSyllabusTopic(candidate.syllabusTopic)
    && isQuestionType(candidate.questionType)
    && isNonEmptyString(candidate.prompt)
    && typeof candidate.totalMarks === "number" && Number.isFinite(candidate.totalMarks) && candidate.totalMarks > 0
    && isArchiveState(candidate.archiveState);
}

function isMarkingComponent(value: unknown): value is QuestionMarkingComponent {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return isNonNegativeInteger(candidate.position)
    && isNonEmptyString(candidate.description)
    && typeof candidate.marks === "number" && Number.isFinite(candidate.marks) && candidate.marks > 0;
}

function isTutorQuestion(value: unknown): value is TutorQuestion {
  if (!isQuestionBankItem(value)) return false;
  const candidate = value as unknown as Record<string, unknown>;
  return isNonEmptyString(candidate.modelAnswer)
    && Array.isArray(candidate.markingComponents) && candidate.markingComponents.every(isMarkingComponent)
    && Array.isArray(candidate.keywords) && candidate.keywords.every(isNonEmptyString)
    && isNonEmptyString(candidate.createdAt) && isNonEmptyString(candidate.updatedAt);
}

export function parseQuestionBankPage(payload: unknown): QuestionBankPage {
  if (typeof payload !== "object" || payload === null) throw new Error("The learning service returned an invalid question page. Please try again.");
  const candidate = payload as Record<string, unknown>;
  if (!Array.isArray(candidate.items) || !candidate.items.every(isQuestionBankItem)
    || !isNonNegativeInteger(candidate.page) || !isNonNegativeInteger(candidate.size) || candidate.size < 1
    || !isNonNegativeInteger(candidate.totalElements) || !isNonNegativeInteger(candidate.totalPages)
    || typeof candidate.hasNext !== "boolean") {
    throw new Error("The learning service returned an invalid question page. Please try again.");
  }
  return candidate as unknown as QuestionBankPage;
}

export function parseTutorQuestion(payload: unknown): TutorQuestion {
  if (!isTutorQuestion(payload)) {
    throw new Error("The learning service returned an invalid question. Please try again.");
  }
  return payload;
}

function authHeaders(): HeadersInit {
  const token = typeof window === "undefined" ? null : window.localStorage.getItem("jwt_token");
  return { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function mutationHeaders(): HeadersInit {
  return { ...authHeaders(), "Content-Type": "application/json" };
}

function errorFields(payload: Record<string, unknown>): Record<string, string> {
  if (typeof payload.fields !== "object" || payload.fields === null) return {};
  return Object.fromEntries(Object.entries(payload.fields).filter((entry): entry is [string, string] => isNonEmptyString(entry[1])));
}

async function responseError(response: Response, operation = "load the question bank"): Promise<QuestionApiError> {
  try {
    const payload = await response.json() as unknown;
    if (typeof payload === "object" && payload !== null && isNonEmptyString((payload as Record<string, unknown>).message)) {
      const record = payload as Record<string, unknown>;
      return new QuestionApiError(record.message as string, response.status, errorFields(record));
    }
  } catch { /* Fallback below for a non-JSON response. */ }
  return new QuestionApiError(`The learning service could not ${operation} (status ${response.status}).`, response.status);
}

function queryString(filters: QuestionBankFilters): string {
  const page = filters.page ?? 0;
  const size = filters.size ?? 25;
  if (!isNonNegativeInteger(page) || !Number.isSafeInteger(size) || size < 1 || size > 100
    || (filters.topicId !== undefined && !isPositiveId(filters.topicId))
    || (filters.questionType !== undefined && !isQuestionType(filters.questionType))
    || (filters.archiveState !== undefined && !isArchiveState(filters.archiveState))) {
    throw new QuestionApiError("Question bank filters are invalid.", 400);
  }
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (filters.topicId !== undefined) params.set("topicId", String(filters.topicId));
  if (filters.questionType !== undefined) params.set("questionType", filters.questionType);
  if (filters.archiveState !== undefined) params.set("archiveState", filters.archiveState);
  return params.toString();
}

export async function fetchTutorQuestions(filters: QuestionBankFilters = {}): Promise<QuestionBankPage> {
  const response = await fetch(`${LEARNING_API_URL}${QUESTION_BANK_PATH}?${queryString(filters)}`, { headers: authHeaders() });
  if (!response.ok) throw await responseError(response);
  return parseQuestionBankPage(await response.json());
}

export async function fetchTutorQuestion(questionId: number): Promise<TutorQuestion> {
  if (!isPositiveId(questionId)) throw new QuestionApiError("Question reference is invalid.", 400);
  const response = await fetch(`${LEARNING_API_URL}${QUESTION_BANK_PATH}/${questionId}`, { headers: authHeaders() });
  if (!response.ok) throw await responseError(response, "load this question");
  return parseTutorQuestion(await response.json());
}

function validateMutationRequest(request: QuestionMutationRequest) {
  if (!isPositiveId(request.syllabusTopicId) || !isQuestionType(request.questionType) || !isArchiveState(request.archiveState)
    || !isNonEmptyString(request.code) || !isNonEmptyString(request.prompt) || !isNonEmptyString(request.modelAnswer)
    || !Number.isFinite(request.totalMarks) || request.totalMarks <= 0 || !Array.isArray(request.markingComponents) || request.markingComponents.length === 0
    || !request.markingComponents.every((component) => isNonEmptyString(component.description) && Number.isFinite(component.marks) && component.marks > 0)
    || !Array.isArray(request.keywords) || !request.keywords.every(isNonEmptyString)) {
    throw new QuestionApiError("Question details are invalid.", 400);
  }
}

async function saveQuestion(path: string, method: "POST" | "PUT", request: QuestionMutationRequest): Promise<TutorQuestion> {
  validateMutationRequest(request);
  const response = await fetch(`${LEARNING_API_URL}${path}`, { method, headers: mutationHeaders(), body: JSON.stringify(request) });
  if (!response.ok) throw await responseError(response, "save this question");
  return parseTutorQuestion(await response.json());
}

export function createTutorQuestion(request: QuestionMutationRequest): Promise<TutorQuestion> {
  return saveQuestion(QUESTION_BANK_PATH, "POST", request);
}

export function updateTutorQuestion(questionId: number, request: QuestionMutationRequest): Promise<TutorQuestion> {
  if (!isPositiveId(questionId)) return Promise.reject(new QuestionApiError("Question reference is invalid.", 400));
  return saveQuestion(`${QUESTION_BANK_PATH}/${questionId}`, "PUT", request);
}
