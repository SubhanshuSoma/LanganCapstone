import type { ChatMessage, StreamEvent } from "../types";
import { parseSseBuffer } from "./sse";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function streamChat(
  messages: ChatMessage[],
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const resp = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!resp.ok || !resp.body) {
    throw new Error(`The server returned ${resp.status}.`);
  }

  const reader = resp.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const parsed = parseSseBuffer(buffer + value);
    buffer = parsed.rest;
    parsed.events.forEach(onEvent);
  }
}
