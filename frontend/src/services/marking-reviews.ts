const API = process.env.NEXT_PUBLIC_LEARNING_API_URL || "http://localhost:8083";

export interface PendingMarkingReview {
  submissionId: number;
  studentId: number;
  studentName: string;
  worksheetId: number;
  requestedAt: string;
}

export class MarkingReviewQueueApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "MarkingReviewQueueApiError";
  }
}

const positiveInteger = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const nonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const localDateTime = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?$/.test(value) && !Number.isNaN(new Date(`${value}Z`).getTime());

export function parsePendingMarkingReviews(value: unknown): PendingMarkingReview[] {
  if (!Array.isArray(value)) throw new MarkingReviewQueueApiError("The pending reviews response is invalid.", 0);
  return value.map((entry) => {
    if (!entry || typeof entry !== "object") throw new MarkingReviewQueueApiError("The pending reviews response is invalid.", 0);
    const review = entry as Record<string, unknown>;
    if (!positiveInteger(review.submissionId) || !positiveInteger(review.studentId) || !nonEmptyString(review.studentName)
      || !positiveInteger(review.worksheetId) || !localDateTime(review.requestedAt)) {
      throw new MarkingReviewQueueApiError("The pending reviews response is invalid.", 0);
    }
    return review as unknown as PendingMarkingReview;
  });
}

function headers(): HeadersInit {
  const token = typeof window === "undefined" ? null : window.localStorage.getItem("jwt_token");
  return { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export async function fetchPendingMarkingReviews(): Promise<PendingMarkingReview[]> {
  const response = await fetch(`${API}/api/learning/tutor/marking-reviews`, { headers: headers() });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: unknown } | null;
    throw new MarkingReviewQueueApiError(payload && nonEmptyString(payload.message) ? payload.message : "Pending reviews could not be loaded. Please try again.", response.status);
  }
  return parsePendingMarkingReviews(await response.json());
}
