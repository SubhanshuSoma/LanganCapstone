import type { DocumentRecord } from "../types";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

interface Props {
  documents: DocumentRecord[];
  onDelete: (id: string) => void;
}

export function DocumentTable({ documents, onDelete }: Props) {
  return (
    <table className="doc-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Size</th>
          <th>Status</th>
          <th>Uploaded</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {documents.map((doc) => (
          <tr key={doc.id}>
            <td>{doc.filename}</td>
            <td>{formatSize(doc.size_bytes)}</td>
            <td>
              <span className={`status status--${doc.status}`} title={doc.error ?? undefined}>
                {doc.status}
              </span>
            </td>
            <td>{new Date(doc.uploaded_at).toLocaleString()}</td>
            <td>
              <button type="button" className="link-button" onClick={() => onDelete(doc.id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
