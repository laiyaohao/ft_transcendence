import type { TutorClass } from "@/services/classes";

export interface StudentClassMembership {
  id: number;
  className: string;
  subject: string;
  level: string;
}

export interface TutorStudent {
  id: number;
  tutorId: number;
  fullName: string;
  loginUserId: number | null;
  classes: StudentClassMembership[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentMutationRequest {
  fullName: string;
  loginUserId?: number | null;
  classIds: number[];
}

export class StudentApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;

  constructor(message: string, status: number, fields: Record<string, string> = {}) {
    super(message);
    this.name = "StudentApiError";
    this.status = status;
    this.fields = fields;
  }
}

const LEARNING_API_URL = process.env.NEXT_PUBLIC_LEARNING_API_URL || "http://localhost:8083";
const STUDENT_LIST_PATH = "/api/learning/tutor/students";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isOptionalPositiveNumber(value: unknown): value is number | null {
  return value === null || isPositiveNumber(value);
}

function isDateTime(value: unknown): value is string {
  return isNonEmptyString(value);
}

function isStudentClassMembership(value: unknown): value is StudentClassMembership {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return isPositiveNumber(candidate.id)
    && isNonEmptyString(candidate.className)
    && isNonEmptyString(candidate.subject)
    && isNonEmptyString(candidate.level);
}

function isTutorStudent(value: unknown): value is TutorStudent {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return isPositiveNumber(candidate.id)
    && isPositiveNumber(candidate.tutorId)
    && isNonEmptyString(candidate.fullName)
    && isOptionalPositiveNumber(candidate.loginUserId)
    && Array.isArray(candidate.classes)
    && candidate.classes.every(isStudentClassMembership)
    && isDateTime(candidate.createdAt)
    && isDateTime(candidate.updatedAt);
}

export function parseTutorStudent(payload: unknown): TutorStudent {
  if (!isTutorStudent(payload)) {
    throw new Error("The learning service returned an invalid student. Please try again.");
  }
  return payload;
}

export function parseTutorStudents(payload: unknown): TutorStudent[] {
  if (!Array.isArray(payload) || !payload.every(isTutorStudent)) {
    throw new Error("The learning service returned an invalid student list. Please try again.");
  }
  return payload;
}

function errorFields(payload: Record<string, unknown>): Record<string, string> {
  if (typeof payload.fields !== "object" || payload.fields === null) return {};
  return Object.fromEntries(
    Object.entries(payload.fields).filter((entry): entry is [string, string] => isNonEmptyString(entry[1])),
  );
}

async function responseError(response: Response): Promise<StudentApiError> {
  try {
    const payload = await response.json() as unknown;
    if (typeof payload === "object" && payload !== null) {
      const record = payload as Record<string, unknown>;
      if (isNonEmptyString(record.message)) {
        return new StudentApiError(record.message, response.status, errorFields(record));
      }
    }
  } catch {
    // Use the status fallback for non-JSON or empty error responses.
  }
  return new StudentApiError(`The learning service could not complete your student request (status ${response.status}).`, response.status);
}

function authHeaders(includeJsonContentType = false): HeadersInit {
  const token = typeof window === "undefined" ? null : window.localStorage.getItem("jwt_token");
  return {
    Accept: "application/json",
    ...(includeJsonContentType ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchTutorStudents(classId?: number): Promise<TutorStudent[]> {
  const suffix = classId === undefined ? "" : `?classId=${classId}`;
  const response = await fetch(`${LEARNING_API_URL}${STUDENT_LIST_PATH}${suffix}`, { headers: authHeaders() });
  if (!response.ok) throw await responseError(response);
  return parseTutorStudents(await response.json());
}

export async function fetchTutorStudent(studentId: number): Promise<TutorStudent> {
  if (!Number.isSafeInteger(studentId) || studentId <= 0) {
    throw new StudentApiError("The student reference is invalid.", 400);
  }
  const response = await fetch(`${LEARNING_API_URL}${STUDENT_LIST_PATH}/${studentId}`, { headers: authHeaders() });
  if (!response.ok) throw await responseError(response);
  return parseTutorStudent(await response.json());
}

async function mutateTutorStudent(
  path: string,
  method: "POST" | "PUT",
  request: StudentMutationRequest,
): Promise<TutorStudent> {
  const response = await fetch(`${LEARNING_API_URL}${path}`, {
    method,
    headers: authHeaders(true),
    body: JSON.stringify(request),
  });
  if (!response.ok) throw await responseError(response);
  return parseTutorStudent(await response.json());
}

export function createTutorStudent(request: StudentMutationRequest): Promise<TutorStudent> {
  return mutateTutorStudent(STUDENT_LIST_PATH, "POST", request);
}

export function updateTutorStudent(studentId: number, request: StudentMutationRequest): Promise<TutorStudent> {
  if (!Number.isSafeInteger(studentId) || studentId <= 0) {
    return Promise.reject(new StudentApiError("The student reference is invalid.", 400));
  }
  return mutateTutorStudent(`${STUDENT_LIST_PATH}/${studentId}`, "PUT", request);
}

/** Convert a class response into the membership shape used by student responses. */
export function classMembershipFor(tutorClass: TutorClass): StudentClassMembership {
  return {
    id: tutorClass.id,
    className: tutorClass.className,
    subject: tutorClass.subject,
    level: tutorClass.level,
  };
}
