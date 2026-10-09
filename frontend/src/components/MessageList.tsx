import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types";

interface Props {
  messages: ChatMessage[];
}

export function MessageList({ messages }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="message-list" aria-live="polite">
      {messages.map((message, i) => (
        <div key={i} className={`message message--${message.role}`}>
          <span className="message__author">{message.role === "user" ? "You" : "Assistant"}</span>
          <div className="message__body">{message.content || <em className="message__pending">Thinking…</em>}</div>
          {!!message.attachments?.length && <div className="message__attachments">{message.attachments.map((name) => <span className="file-chip" key={name}>▤ {name}</span>)}</div>}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
