import type { DocumentRecord } from "../types";
import { API_URL } from "./client";

async function check(resp: Response): Promise<Response> {
  if (!resp.ok) {
    let detail = `The server returned ${resp.status}.`;
    try {
      const body = await resp.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // Keep the status-based message when the body is not JSON.
    }
    throw new Error(detail);
  }
  return resp;
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const resp = await check(await fetch(`${API_URL}/api/documents`));
  return resp.json();
}

export async function uploadDocument(file: File, employeeName: string, projectNo: string): Promise<DocumentRecord> {
  const form = new FormData();
  form.append("file", file);
  form.append("employee_name", employeeName);
  form.append("project_no", projectNo);
  const resp = await check(await fetch(`${API_URL}/api/documents`, { method: "POST", body: form }));
  return resp.json();
}

export interface ArchiveUploadResult {
  documents: DocumentRecord[];
  skipped: string[];
}

export async function uploadArchive(file: File, employeeName: string, projectNo: string): Promise<ArchiveUploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("employee_name", employeeName);
  form.append("project_no", projectNo);
  const resp = await check(await fetch(`${API_URL}/api/documents/archive`, { method: "POST", body: form }));
  return resp.json();
}

export function documentDownloadUrl(id: string): string {
  return `${API_URL}/api/documents/${encodeURIComponent(id)}/download`;
}

export async function deleteDocument(id: string): Promise<void> {
  await check(await fetch(`${API_URL}/api/documents/${encodeURIComponent(id)}`, { method: "DELETE" }));
}
