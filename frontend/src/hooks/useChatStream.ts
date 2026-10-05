import { useCallback, useRef, useState } from "react";
import { streamChat } from "../api/client";
import type { ChatMessage } from "../types";

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || isStreaming) return;

      const history: ChatMessage[] = [...messages, { role: "user", content: question }];
      // The empty assistant message is filled in as tokens arrive.
      setMessages([...history, { role: "assistant", content: "" }]);
      setError(null);
      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      const appendToReply = (token: string) =>
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: last.content + token }];
        });

      try {
        await streamChat(
          history,
          (event) => {
            if (event.type === "token") appendToReply(event.content);
            else if (event.type === "error") setError(event.message);
          },
          controller.signal,
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
        // Drop the placeholder if no reply text arrived.
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          return last?.role === "assistant" && !last.content ? prev.slice(0, -1) : prev;
        });
      }
    },
    [messages, isStreaming],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return { messages, isStreaming, error, send, stop };
}
