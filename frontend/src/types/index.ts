export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  attachments?: string[];
}

/** Events streamed by POST /api/chat (see backend/app/services/chat.py). */
export type StreamEvent =
  | { type: "token"; content: string }
  | { type: "done" }
  | { type: "error"; message: string };

export type DocumentStatus = "uploaded" | "processing" | "indexed" | "failed";

/** A source document as returned by GET /api/documents. */
export interface DocumentRecord {
  id: string;
  filename: string;
  size_bytes: number;
  status: DocumentStatus;
  uploaded_at: string;
  error?: string | null;
  employee_id?: string;
  employee?: string;
  project?: string | null;
}
