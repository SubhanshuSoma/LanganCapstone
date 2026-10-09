import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ACCEPTED_TYPES } from "./DocumentUpload";

interface Props {
  isStreaming: boolean;
  isUploading: boolean;
  onSend: (text: string, files: File[], employee: string, project: string) => Promise<boolean>;
  onStop: () => void;
}

export function MessageInput({ isStreaming, isUploading, onSend, onStop }: Props) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [employee, setEmployee] = useState("");
  const [project, setProject] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = isStreaming || isUploading;

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!text.trim() || busy || (files.length > 0 && !employee.trim())) return;
    if (await onSend(text.trim(), files, employee.trim(), project.trim())) {
      setText("");
      setFiles([]);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form className="message-input" onSubmit={submit}>
      {files.length > 0 && <div className="composer-attachments">
        <div className="composer-attachments__files">{files.map((file, index) => <span className="file-chip" key={`${file.name}-${index}`}>▤ {file.name}<button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}>×</button></span>)}</div>
        <div className="composer-attachments__fields">
          <label>Employee<input value={employee} onChange={(event) => setEmployee(event.target.value)} placeholder="Employee name" required /></label>
          <label>Project <span>(optional)</span><input value={project} onChange={(event) => setProject(event.target.value)} placeholder="Project number" /></label>
        </div>
      </div>}
      <textarea
        aria-label="Your question"
        placeholder="Ask anything about your team's work..."
        rows={2}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="composer-actions">
        <button className="attach-button" type="button" disabled={busy} onClick={() => fileRef.current?.click()} aria-label="Attach documents" title="Attach documents">＋ <span>Attach files</span></button>
        <input ref={fileRef} type="file" hidden multiple accept={ACCEPTED_TYPES} aria-label="Upload documents in chat" onChange={(event) => { setFiles((current) => [...current, ...Array.from(event.target.files || [])]); event.target.value = ""; }} />
        {busy ? <button type="button" className="send-button" onClick={onStop} disabled={isUploading}>{isUploading ? "Uploading…" : "Stop"}</button> : <button type="submit" className="send-button" disabled={!text.trim() || (files.length > 0 && !employee.trim())} aria-label="Send message">↑</button>}
      </div>
    </form>
  );
}
