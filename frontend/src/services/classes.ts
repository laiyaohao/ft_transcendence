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

export function parseTutorClasses(payload: unknown): TutorClass[] {
  if (!Array.isArray(payload) || !payload.every(isTutorClass)) {
    throw new Error("The learning service returned an invalid class list. Please try again.");
  }

  return payload;
}

async function responseMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json() as unknown;
    if (typeof payload === "object" && payload !== null) {
      const message = (payload as Record<string, unknown>).message;
      if (isNonEmptyString(message)) return message;
    }
  } catch {
    // Use the status fallback for non-JSON or empty error responses.
  }
  return `The learning service could not load your classes (status ${response.status}).`;
}

export async function fetchTutorClasses(): Promise<TutorClass[]> {
  const token = typeof window === "undefined" ? null : window.localStorage.getItem("jwt_token");
  const response = await fetch(`${LEARNING_API_URL}${CLASS_LIST_PATH}`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(await responseMessage(response));
  }

  return parseTutorClasses(await response.json());
}
