-- Apply to an existing local database. Fresh databases use init/001_schema.sql.
CREATE OR REPLACE VIEW searchable_chunks AS
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
