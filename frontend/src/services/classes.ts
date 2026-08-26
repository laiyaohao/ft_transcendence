export type ClassStatus = "ACTIVE" | "INACTIVE";

export interface ClassSchedule {
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  startTime: string;
  endTime: string;
}

export interface TutorClass {
  id: number;
  tutorId: number;
  className: string;
  subject: string;
  level: string;
  status: ClassStatus;
  schedules: ClassSchedule[];
}

/** The JSON body accepted by the tutor class create and update endpoints. */
export interface ClassMutationRequest {
  className: string;
  subject: string;
  level: string;
  schedules?: ClassSchedule[];
  status?: ClassStatus;
}

export class ClassApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;

  constructor(message: string, status: number, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ClassApiError";
    this.status = status;
    this.fields = fields;
  }
}

const LEARNING_API_URL = process.env.NEXT_PUBLIC_LEARNING_API_URL || "http://localhost:8083";
const CLASS_LIST_PATH = "/api/learning/tutor/classes";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isSchedule(value: unknown): value is ClassSchedule {
  if (typeof value !== "object" || value === null) return false;
  const schedule = value as Record<string, unknown>;
  return ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].includes(schedule.dayOfWeek as string)
    && isNonEmptyString(schedule.startTime)
    && isNonEmptyString(schedule.endTime);
}

function isTutorClass(value: unknown): value is TutorClass {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return isPositiveNumber(candidate.id)
    && isPositiveNumber(candidate.tutorId)
    && isNonEmptyString(candidate.className)
    && isNonEmptyString(candidate.subject)
    && isNonEmptyString(candidate.level)
    && (candidate.status === "ACTIVE" || candidate.status === "INACTIVE")
    && Array.isArray(candidate.schedules)
    && candidate.schedules.every(isSchedule);
}

export function parseTutorClass(payload: unknown): TutorClass {
  if (!isTutorClass(payload)) {
    throw new Error("The learning service returned an invalid class. Please try again.");
  }

  return payload;
}

export function parseTutorClasses(payload: unknown): TutorClass[] {
  if (!Array.isArray(payload) || !payload.every(isTutorClass)) {
    throw new Error("The learning service returned an invalid class list. Please try again.");
  }

  return payload;
}

function errorFields(payload: Record<string, unknown>): Record<string, string> {
  if (typeof payload.fields !== "object" || payload.fields === null) return {};

  return Object.fromEntries(
    Object.entries(payload.fields).filter((entry): entry is [string, string] => isNonEmptyString(entry[1])),
  );
}

async function responseError(response: Response): Promise<ClassApiError> {
  try {
    const payload = await response.json() as unknown;
    if (typeof payload === "object" && payload !== null) {
      const record = payload as Record<string, unknown>;
      const message = record.message;
      if (isNonEmptyString(message)) return new ClassApiError(message, response.status, errorFields(record));
    }
  } catch {
    // Use the status fallback for non-JSON or empty error responses.
  }
  return new ClassApiError(`The learning service could not complete your class request (status ${response.status}).`, response.status);
}

function authHeaders(includeJsonContentType = false): HeadersInit {
  const token = typeof window === "undefined" ? null : window.localStorage.getItem("jwt_token");
  return {
    Accept: "application/json",
    ...(includeJsonContentType ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchTutorClasses(): Promise<TutorClass[]> {
  const response = await fetch(`${LEARNING_API_URL}${CLASS_LIST_PATH}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw await responseError(response);
  }

  return parseTutorClasses(await response.json());
}

async function mutateTutorClass(
  path: string,
  method: "POST" | "PUT",
  request: ClassMutationRequest,
): Promise<TutorClass> {
  const response = await fetch(`${LEARNING_API_URL}${path}`, {
    method,
    headers: authHeaders(true),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await responseError(response);
  }

  return parseTutorClass(await response.json());
}

export function createTutorClass(request: ClassMutationRequest): Promise<TutorClass> {
  return mutateTutorClass(CLASS_LIST_PATH, "POST", request);
}

export function updateTutorClass(classId: number, request: ClassMutationRequest): Promise<TutorClass> {
  return mutateTutorClass(`${CLASS_LIST_PATH}/${classId}`, "PUT", request);
}
