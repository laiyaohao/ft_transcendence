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
