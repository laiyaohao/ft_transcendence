const API = process.env.NEXT_PUBLIC_LEARNING_API_URL || "http://localhost:8083";
export type AlertType = "WEAK_TOPIC" | "REPEATED_MISTAKE" | "PENDING_REVIEW" | "REPORT_READY";
export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";
export interface TutorAlert { id: number; studentId: number; studentName: string; type: AlertType; severity: AlertSeverity; status: AlertStatus; title: string; message: string; createdAt: string; }

export class AlertApiError extends Error { constructor(message: string, readonly status: number) { super(message); this.name = "AlertApiError"; } }
const positive = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const types: AlertType[] = ["WEAK_TOPIC", "REPEATED_MISTAKE", "PENDING_REVIEW", "REPORT_READY"];
const severities: AlertSeverity[] = ["INFO", "WARNING", "CRITICAL"];
const statuses: AlertStatus[] = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "DISMISSED"];

export function parseTutorAlerts(value: unknown): TutorAlert[] {
  if (!Array.isArray(value)) throw new AlertApiError("The alerts response is invalid.", 0);
  return value.map((entry) => {
    if (!entry || typeof entry !== "object") throw new AlertApiError("The alerts response is invalid.", 0);
    const alert = entry as Record<string, unknown>;
    if (!positive(alert.id) || !positive(alert.studentId) || !text(alert.studentName) || !types.includes(alert.type as AlertType)
      || !severities.includes(alert.severity as AlertSeverity) || !statuses.includes(alert.status as AlertStatus)
      || !text(alert.title) || !text(alert.message) || !text(alert.createdAt)) throw new AlertApiError("The alerts response is invalid.", 0);
    return alert as unknown as TutorAlert;
  });
}
function headers(): HeadersInit { const token = typeof window === "undefined" ? null : localStorage.getItem("jwt_token"); return { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }; }
async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${API}/api/learning/tutor/alerts${path}`, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) } });
  if (!response.ok) { const body = await response.json().catch(() => null) as { message?: unknown } | null; throw new AlertApiError(body && text(body.message) ? body.message : "Alerts could not be updated.", response.status); }
  return response.json();
}
export async function fetchTutorAlerts(): Promise<TutorAlert[]> { return parseTutorAlerts(await request("")); }
async function action(id: number, operation: "resolve" | "dismiss"): Promise<TutorAlert> { if (!positive(id)) throw new AlertApiError("The alert reference is invalid.", 400); const body = await request(`/${id}/${operation}`, { method: "POST" }); return parseTutorAlerts([body])[0]; }
export const resolveTutorAlert = (id: number) => action(id, "resolve");
export const dismissTutorAlert = (id: number) => action(id, "dismiss");
