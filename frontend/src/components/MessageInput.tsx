import { useState, type FormEvent, type KeyboardEvent } from "react";

interface Props {
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

export function MessageInput({ isStreaming, onSend, onStop }: Props) {
  const [text, setText] = useState("");

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!text.trim() || isStreaming) return;
    onSend(text);
    setText("");
  };

  // Enter sends; Shift+Enter inserts a new line.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form className="message-input" onSubmit={submit}>
      <textarea
        aria-label="Your question"
        placeholder="Ask about past projects, methods or decisions…"
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {isStreaming ? (
        <button type="button" onClick={onStop}>
          Stop
        </button>
      ) : (
        <button type="submit" disabled={!text.trim()}>
          Send
        </button>
      )}
    </form>
  );
}
