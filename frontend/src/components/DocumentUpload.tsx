import { useRef, useState, type DragEvent } from "react";

// Formats the ingestion pipeline is meant to handle (see CLAUDE.md).
export const ACCEPTED_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.eml,.msg,.ppt,.pptx,.dwg";

interface Props {
  isUploading: boolean;
  onUpload: (files: File[]) => void;
}

export function DocumentUpload({ isUploading, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length) onUpload(files);
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
      <p>Drag files here, or</p>
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
      <p className="upload__hint">PDF, Word, Excel/CSV, email, PowerPoint, DWG</p>
    </div>
  );
}
