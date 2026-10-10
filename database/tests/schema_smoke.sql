\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
    employee_key bigint;
    document_key bigint;
    section_key bigint;
    chunk_key bigint;
BEGIN
    INSERT INTO employees (full_name, discipline)
    VALUES ('Synthetic Retiree', 'Geotechnical')
    RETURNING id INTO employee_key;

    INSERT INTO documents (employee_id, filename, title, project_no,
                           source_system, raw_path, status)
    VALUES (employee_key, 'synthetic.pdf', 'Synthetic Foundation Report',
            'TEST-140023', 'test fixture', 'synthetic/synthetic.pdf', 'indexed')
    RETURNING id INTO document_key;

    INSERT INTO sections (document_id, ordinal, heading, page_start,
                          page_end, content)
    VALUES (document_key, 0, '4.2 Pile Installation', 14, 17,
            'The full synthetic section explains the pile installation.')
    RETURNING id INTO section_key;

    INSERT INTO chunks (section_id, ordinal, page_start, page_end,
                        context_header, content, embedding)
    VALUES (section_key, 0, 14, 14,
            'Synthetic Retiree | TEST-140023 | 4.2',
            'Piles were driven to refusal at 62 ft.', '[1,2,3]')
    RETURNING id INTO chunk_key;

    IF NOT EXISTS (
        SELECT 1 FROM searchable_chunks
        WHERE chunk_id = chunk_key
          AND employee_id = employee_key
          AND document_id = document_key
          AND section_id = section_key
          AND section_page_start = 14
          AND section_content LIKE '%full synthetic section%'
          AND tsv @@ plainto_tsquery('english', 'piles')
          AND (embedding <=> '[1,2,3]'::vector) = 0
    ) THEN
        RAISE EXCEPTION 'Indexed sample document was not searchable';
    END IF;

    UPDATE documents SET status = 'processing' WHERE id = document_key;

    IF EXISTS (SELECT 1 FROM searchable_chunks WHERE chunk_id = chunk_key) THEN
        RAISE EXCEPTION 'Unindexed document was searchable';
    END IF;
END;
$$;

ROLLBACK;
