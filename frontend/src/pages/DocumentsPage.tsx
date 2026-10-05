import { DocumentTable } from "../components/DocumentTable";
import { DocumentUpload } from "../components/DocumentUpload";
import { useDocuments } from "../hooks/useDocuments";

export function DocumentsPage() {
  const { documents, isLoading, isUploading, error, refresh, upload, remove } = useDocuments();

  return (
    <main className="page">
      <header className="page__header">
        <h1>Documents</h1>
        <p>Upload project files so the assistant can search and cite them.</p>
      </header>

      <DocumentUpload isUploading={isUploading} onUpload={upload} />

      {error && (
        <p className="page__error" role="alert">
          {error}
        </p>
      )}

      <section>
        <div className="section-header">
          <h2>Library</h2>
          <button type="button" className="link-button" onClick={refresh} disabled={isLoading}>
            Refresh
          </button>
        </div>
        {isLoading ? (
          <p className="page__muted">Loading…</p>
        ) : documents.length === 0 ? (
          <p className="page__muted">No documents yet.</p>
        ) : (
          <DocumentTable documents={documents} onDelete={remove} />
        )}
      </section>
    </main>
  );
}
