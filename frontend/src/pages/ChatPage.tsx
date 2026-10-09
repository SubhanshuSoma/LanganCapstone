import { useEffect, useRef, useState } from "react";
import { uploadDocument } from "../api/documents";
import { MessageInput } from "../components/MessageInput";
import { MessageList } from "../components/MessageList";
import { useChatStream } from "../hooks/useChatStream";

export function ChatPage({ onTitle }: { onTitle?: (title: string) => void }) {
  const { messages, isStreaming, error, send, stop } = useChatStream();
  const titleSet = useRef(false);
  useEffect(() => {
    const first = messages.find((message) => message.role === "user");
    if (first && !titleSet.current) {
      titleSet.current = true;
      onTitle?.(first.content.slice(0, 36));
    }
  }, [messages, onTitle]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const sendWithFiles = async (text: string, files: File[], employee: string, project: string) => {
    setUploadError(null);
    if (!files.length) { await send(text); return true; }
    setIsUploading(true);
    try {
      const uploaded = [];
      for (const file of files) uploaded.push(await uploadDocument(file, employee, project));
      const failed = uploaded.find((document) => document.status === "failed");
      if (failed) throw new Error(`${failed.filename} could not be processed: ${failed.error || "unknown error"}`);
      setIsUploading(false);
      await send(text, uploaded.map((document) => document.id), files.map((file) => file.name));
      return true;
    } catch (reason) {
      setUploadError(reason instanceof Error ? reason.message : String(reason));
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="chat-page">
      {messages.length === 0 ? (
        <div className="chat-page__empty"><div className="assistant-symbol">✳</div><div className="eyebrow">LANGAN KNOWLEDGE ASSISTANT</div><h1>How can I help?</h1><p>Ask a question, or attach employee documents to discuss their contents.</p><div className="prompt-suggestions"><button type="button" onClick={() => send("What can you help me with?")}>What can you help me with? <span>↗</span></button><button type="button" onClick={() => send("How can I analyze an employee file here?")}>Analyze an employee file <span>↗</span></button></div></div>
      ) : (
        <MessageList messages={messages} />
      )}

      {(error || uploadError) && (
        <p className="chat-page__error" role="alert">
          {error || uploadError}
        </p>
      )}

      <div className="composer-wrap"><MessageInput isStreaming={isStreaming} isUploading={isUploading} onSend={sendWithFiles} onStop={stop} /><p>AI answers may be inaccurate. Verify important project details in the source files.</p></div>
    </main>
  );
}
