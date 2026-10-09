import { useRef, useState, type DragEvent } from "react";

// Formats the ingestion pipeline is meant to handle (see CLAUDE.md).
export const ACCEPTED_TYPES = ".pdf,.docx,.txt,.md,.xlsx,.csv,.eml";

interface Props {
  isUploading: boolean;
  onUpload: (files: File[], employeeName: string, projectNo: string) => Promise<boolean>;
}

export function DocumentUpload({ isUploading, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [projectNo, setProjectNo] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleFiles = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length) setFiles((current) => [...current, ...files]);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (!isUploading) handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      className={`upload${isDragging ? " upload--dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="upload__icon" aria-hidden="true">↑</div>
      <strong>Add source documents</strong>
      <p>Drag files here, or select them from your computer.</p>
      <button type="button" disabled={isUploading} onClick={() => inputRef.current?.click()}>
        {isUploading ? "Uploading…" : "Choose files"}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={ACCEPTED_TYPES}
        aria-label="Upload documents"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="upload__hint">PDF, Word, text, Markdown, Excel, CSV, or email · up to 25 MB each</p>
      {files.length > 0 && (
        <div className="upload__details">
          <p>{files.map((file) => file.name).join(", ")}</p>
          <div className="upload__fields">
            <label>Employee<input value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} placeholder="Employee name" /></label>
            <label>Project <span>(optional)</span><input value={projectNo} onChange={(event) => setProjectNo(event.target.value)} placeholder="Project number" /></label>
          </div>
          <button type="button" disabled={isUploading || !employeeName.trim()} onClick={async () => { if (await onUpload(files, employeeName.trim(), projectNo.trim())) setFiles([]); }}>
            {isUploading ? "Uploading…" : `Upload ${files.length} ${files.length === 1 ? "file" : "files"}`}
          </button>
        </div>
      )}
    </div>
  );
}
