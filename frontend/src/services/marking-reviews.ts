const LEARNING_API_URL =
  process.env.NEXT_PUBLIC_LEARNING_API_URL || "http://localhost:8083";
const PENDING_MARKING_REVIEWS_PATH = "/api/learning/tutor/marking-reviews";

export interface PendingMarkingReview {
  submissionId: number;
  studentId: number;
  studentName: string;
  worksheetId: number;
  requestedAt: string;
}

export class MarkingReviewQueueApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "MarkingReviewQueueApiError";
  }
}

function isPositiveIdentifier(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isLocalDateTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?$/.test(value) &&
    !Number.isNaN(new Date(`${value}Z`).getTime())
  );
}

function isPendingMarkingReview(value: unknown): value is PendingMarkingReview {
  if (!value || typeof value !== "object") return false;

  const review = value as Record<string, unknown>;
  return (
    isPositiveIdentifier(review.submissionId) &&
    isPositiveIdentifier(review.studentId) &&
    isNonEmptyString(review.studentName) &&
    isPositiveIdentifier(review.worksheetId) &&
    isLocalDateTime(review.requestedAt)
  );
}

export function parsePendingMarkingReviews(
  value: unknown,
): PendingMarkingReview[] {
  if (!Array.isArray(value) || !value.every(isPendingMarkingReview)) {
    throw new MarkingReviewQueueApiError(
      "The pending reviews response is invalid.",
      0,
    );
  }

  return value;
}

function markingReviewRequestHeaders(): HeadersInit {
  const token =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem("jwt_token");
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchPendingMarkingReviews(): Promise<
  PendingMarkingReview[]
> {
  const response = await fetch(
    `${LEARNING_API_URL}${PENDING_MARKING_REVIEWS_PATH}`,
    { headers: markingReviewRequestHeaders() },
  );
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: unknown;
    } | null;
    const message =
      payload && isNonEmptyString(payload.message)
        ? payload.message
        : "Pending reviews could not be loaded. Please try again.";
    throw new MarkingReviewQueueApiError(message, response.status);
  }
  return parsePendingMarkingReviews(await response.json());
}
