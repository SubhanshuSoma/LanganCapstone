import { DocumentTable } from "../components/DocumentTable";
import { DocumentUpload } from "../components/DocumentUpload";
import { useDocuments } from "../hooks/useDocuments";

export function DocumentsPage() {
  const { documents, isLoading, isUploading, error, uploadSummary, refresh, upload, remove } = useDocuments();
  const [query, setQuery] = useState("");
  const [employee, setEmployee] = useState("");
  const [project, setProject] = useState("");
  const employees = useMemo(() => [...new Set(documents.map((doc) => doc.employee).filter(Boolean))].sort() as string[], [documents]);
  const projects = useMemo(() => [...new Set(documents.map((doc) => doc.project).filter(Boolean))].sort() as string[], [documents]);
  const visible = documents.filter((doc) =>
    (!employee || doc.employee === employee) &&
    (!project || doc.project === project) &&
    (!query || doc.filename.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <main className="page documents-page">
      <header className="page__header">
        <div className="eyebrow">KNOWLEDGE BASE / SOURCE FILES</div>
        <h1>Employee files</h1>
        <p>Browse and download original documents by employee or project.</p>
      </header>

      <DocumentUpload isUploading={isUploading} onUpload={upload} />

      {uploadSummary && <p className="page__muted" role="status">{uploadSummary}</p>}

      {error && (
        <p className="page__error" role="alert">
          {error}
        </p>
      )}

      <section className="library">
        <div className="section-header">
          <div><h2>File library</h2><p>{visible.length} of {documents.length} files</p></div>
          <button type="button" className="link-button" onClick={refresh} disabled={isLoading}>
            Refresh
          </button>
        </div>
        <div className="filters">
          <label className="search-field"><span className="sr-only">Search filenames</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search filenames…" /></label>
          <label><span className="sr-only">Filter by employee</span><select value={employee} onChange={(event) => setEmployee(event.target.value)}><option value="">All employees</option>{employees.map((name) => <option key={name}>{name}</option>)}</select></label>
          <label><span className="sr-only">Filter by project</span><select value={project} onChange={(event) => setProject(event.target.value)}><option value="">All projects</option>{projects.map((name) => <option key={name}>{name}</option>)}</select></label>
        </div>
        {isLoading ? (
          <p className="page__muted library__empty">Loading files…</p>
        ) : documents.length === 0 ? (
          <p className="page__muted library__empty">No documents yet. Upload a file above to get started.</p>
        ) : visible.length === 0 ? (
          <p className="page__muted library__empty">No files match these filters.</p>
        ) : (
          <DocumentTable documents={visible} onDelete={remove} />
        )}
      </section>
    </main>
  );
}
import { useMemo, useState } from "react";
