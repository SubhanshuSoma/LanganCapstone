-- Initial schema for retiree document retrieval. Run by the Postgres container
-- only when its data volume is first created.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE employees (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name text NOT NULL CHECK (btrim(full_name) <> ''),
    discipline text,
    consent boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE documents (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id bigint NOT NULL REFERENCES employees(id),
    filename text NOT NULL CHECK (btrim(filename) <> ''),
    title text NOT NULL CHECK (btrim(title) <> ''),
    project_no text,
    source_system text,
    raw_path text NOT NULL CHECK (btrim(raw_path) <> ''),
    confidentiality text NOT NULL DEFAULT 'internal',
    status text NOT NULL DEFAULT 'uploaded'
        CHECK (status IN ('uploaded', 'processing', 'indexed', 'failed')),
    uploaded_at timestamptz NOT NULL DEFAULT now(),
    indexed_at timestamptz,
    error text
);

CREATE INDEX documents_employee_id_idx ON documents(employee_id);
CREATE INDEX documents_project_no_idx ON documents(project_no);

CREATE TABLE sections (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_id bigint NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    ordinal integer NOT NULL CHECK (ordinal >= 0),
    heading text NOT NULL CHECK (btrim(heading) <> ''),
    page_start integer CHECK (page_start > 0),
    page_end integer CHECK (page_end > 0),
    content text NOT NULL CHECK (btrim(content) <> ''),
    CONSTRAINT sections_pages_ordered CHECK (
        (page_start IS NULL AND page_end IS NULL)
        OR (page_start IS NOT NULL AND page_end IS NOT NULL AND page_end >= page_start)
    ),
    UNIQUE (document_id, ordinal)
);

CREATE INDEX sections_document_id_idx ON sections(document_id);

CREATE TABLE chunks (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    section_id bigint NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    ordinal integer NOT NULL CHECK (ordinal >= 0),
    page_start integer CHECK (page_start > 0),
    page_end integer CHECK (page_end > 0),
    context_header text NOT NULL CHECK (btrim(context_header) <> ''),
    content text NOT NULL CHECK (btrim(content) <> ''),
    embedding vector,
    tsv tsvector GENERATED ALWAYS AS (
        to_tsvector('english'::regconfig, context_header || ' ' || content)
    ) STORED,
    CONSTRAINT chunks_pages_ordered CHECK (
        (page_start IS NULL AND page_end IS NULL)
        OR (page_start IS NOT NULL AND page_end IS NOT NULL AND page_end >= page_start)
    ),
    UNIQUE (section_id, ordinal)
);

CREATE INDEX chunks_section_id_idx ON chunks(section_id);
CREATE INDEX chunks_tsv_idx ON chunks USING gin(tsv);

-- Only indexed sample documents appear in this view. Application
-- authorization for confidentiality levels still needs a policy decision.
CREATE VIEW searchable_chunks AS
SELECT c.id AS chunk_id, c.section_id, s.document_id, d.employee_id,
       c.context_header, c.content AS chunk_content, c.embedding, c.tsv,
       c.page_start AS chunk_page_start, c.page_end AS chunk_page_end,
       s.heading, s.content AS section_content,
       s.page_start AS section_page_start, s.page_end AS section_page_end,
       d.title, d.project_no, d.raw_path, d.confidentiality,
       e.full_name, e.discipline
FROM chunks AS c
JOIN sections AS s ON s.id = c.section_id
JOIN documents AS d ON d.id = s.document_id
JOIN employees AS e ON e.id = d.employee_id
WHERE d.status = 'indexed';
