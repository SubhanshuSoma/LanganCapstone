"""Ingest local retiree documents into the current PostgreSQL retrieval schema.

Run from backend/: uv run python scripts/ingest_documents.py INPUT --employee-id ID
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import math
import os
import random
import shutil
import sys
from pathlib import Path

import psycopg
from pgvector import Vector
from pgvector.psycopg import register_vector

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.document_processing import (  # noqa: E402
    ALLOWED_EXTENSIONS,
    clean,
    extract,
    make_chunks,
    make_sections,
    serialize_blocks,
)

LOG = logging.getLogger("ingest")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def fake_embedding(text: str, dim: int) -> list[float]:
    """Stable local placeholder vector; real retrieval needs a chosen provider."""
    generator = random.Random(int.from_bytes(hashlib.sha256(text.encode()).digest(), "big"))
    values = [generator.uniform(-1, 1) for _ in range(dim)]
    norm = math.sqrt(sum(value * value for value in values))
    return [value / norm for value in values]


def _copy_once(source: Path, destination: Path) -> bool:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        return False
    temporary = destination.with_name(destination.name + f".{os.getpid()}.tmp")
    try:
        shutil.copyfile(source, temporary)
        os.replace(temporary, destination)
        return True
    finally:
        temporary.unlink(missing_ok=True)


def _save_json(destination: Path, data: dict) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + f".{os.getpid()}.tmp")
    try:
        temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(temporary, destination)
    finally:
        temporary.unlink(missing_ok=True)


def ingest_one(
    conn: psycopg.Connection,
    source: Path,
    *,
    employee_id: int,
    storage_root: Path,
    project_no: str | None = None,
    confidentiality: str = "internal",
    embedding_dim: int = 1536,
    chunk_tokens: int = 300,
    chunk_overlap_tokens: int = 50,
    section_max_tokens: int = 1500,
) -> tuple[int, str]:
    if not source.is_file():
        raise ValueError(f"Not a file: {source}")
    ext = source.suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {ext}")
    if source.stat().st_size == 0:
        raise ValueError(f"Empty file: {source}")
    if confidentiality not in {"public", "internal", "confidential", "restricted"}:
        raise ValueError(f"Invalid confidentiality: {confidentiality}")
    digest = sha256_file(source)
    bronze = storage_root / "bronze" / str(employee_id) / f"{digest}{ext}"
    # The existing schema has no checksum field. The stored path serves as the
    # duplicate key; an advisory lock protects concurrent imports.
    created_bronze = False
    try:
        with conn.transaction():
            conn.execute("SELECT pg_advisory_xact_lock(%s)", (int(digest[:15], 16),))
            employee = conn.execute(
                "SELECT full_name FROM employees WHERE id = %s FOR SHARE", (employee_id,)
            ).fetchone()
            if employee is None:
                raise ValueError(f"Unknown employee: {employee_id}")
            existing = conn.execute(
                "SELECT id, status FROM documents WHERE employee_id = %s AND raw_path = %s ORDER BY id LIMIT 1",
                (employee_id, str(bronze)),
            ).fetchone()
            if existing:
                if existing[1] != "failed":
                    return existing[0], f"duplicate ({existing[1]})"
                document_id = existing[0]
                conn.execute("DELETE FROM sections WHERE document_id = %s", (document_id,))
                conn.execute("UPDATE documents SET status = 'processing', error = NULL WHERE id = %s", (document_id,))
            else:
                created_bronze = _copy_once(source, bronze)
                document_id = conn.execute(
                    """INSERT INTO documents
                       (employee_id, filename, title, project_no, source_system, raw_path,
                        confidentiality, status)
                       VALUES (%s, %s, %s, %s, 'local import', %s, %s, 'processing')
                       RETURNING id""",
                    (employee_id, source.name, source.stem, project_no, str(bronze), confidentiality),
                ).fetchone()[0]
    except Exception:
        if created_bronze:
            bronze.unlink(missing_ok=True)
        raise

    try:
        extracted = extract(bronze)
        LOG.info("document=%s extracted blocks=%s", document_id, len(extracted.blocks))
        cleaned = clean(extracted, is_pdf=ext == ".pdf")
        if not cleaned.blocks:
            raise ValueError("No extractable text found")
        silver = storage_root / "silver" / str(employee_id) / f"{document_id}.json"
        _save_json(silver, {
            "document_id": document_id,
            "employee_id": employee_id,
            "title": source.stem,
            "source_sha256": digest,
            "metadata": cleaned.metadata,
            "blocks": serialize_blocks(cleaned.blocks),
        })
        LOG.info("document=%s cleaned blocks=%s", document_id, len(cleaned.blocks))
        sections = make_sections(cleaned.blocks, section_max_tokens)
        if not sections:
            raise ValueError("No sections generated")
        with conn.transaction():
            for section_ordinal, section in enumerate(sections):
                section_id = conn.execute(
                    """INSERT INTO sections
                       (document_id, ordinal, heading, page_start, page_end, content)
                       VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
                    (document_id, section_ordinal, section.heading, section.page_start,
                     section.page_end, section.content),
                ).fetchone()[0]
                for chunk_ordinal, chunk in enumerate(make_chunks(section, chunk_tokens, chunk_overlap_tokens)):
                    header_parts = [f"Retiree: {employee[0]}", source.stem]
                    if project_no:
                        header_parts.append(project_no)
                    if section.heading != "Document":
                        header_parts.append(section.heading)
                    context_header = " · ".join(header_parts)
                    vector = fake_embedding(context_header + "\n\n" + chunk.content, embedding_dim)
                    conn.execute(
                        """INSERT INTO chunks
                           (section_id, ordinal, page_start, page_end, context_header, content, embedding)
                           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                        (section_id, chunk_ordinal, chunk.page_start, chunk.page_end,
                         context_header, chunk.content, Vector(vector)),
                    )
            conn.execute(
                "UPDATE documents SET status = 'indexed', indexed_at = now(), error = NULL WHERE id = %s",
                (document_id,),
            )
        LOG.info("document=%s indexed sections=%s", document_id, len(sections))
        return document_id, "indexed"
    except Exception as exc:
        with conn.transaction():
            conn.execute(
                "UPDATE documents SET status = 'failed', error = %s WHERE id = %s",
                (f"{type(exc).__name__}: {exc}"[:2000], document_id),
            )
        LOG.exception("document=%s failed", document_id)
        return document_id, "failed"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="A file or directory of supported documents")
    parser.add_argument("--employee-id", type=int, required=True)
    parser.add_argument("--project-no")
    parser.add_argument("--confidentiality", choices=["public", "internal", "confidential", "restricted"], default="internal")
    parser.add_argument("--storage-root", type=Path, default=Path("data"))
    parser.add_argument("--database-url", default=os.environ.get("DATABASE_URL", "postgresql://langan:langan_local_only@localhost:5432/langan_test"))
    parser.add_argument("--embedding-dim", type=int, default=1536)
    parser.add_argument("--chunk-tokens", type=int, default=300)
    parser.add_argument("--chunk-overlap-tokens", type=int, default=50)
    parser.add_argument("--section-max-tokens", type=int, default=1500)
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    if not args.input.exists():
        parser.error(f"Input does not exist: {args.input}")
    if args.embedding_dim < 1 or args.section_max_tokens < 1 or args.chunk_tokens < 1 or not 0 <= args.chunk_overlap_tokens < args.chunk_tokens:
        parser.error("Token limits and embedding dimension must be positive; overlap must be smaller than chunk size")
    sources = [args.input] if args.input.is_file() else sorted(path for path in args.input.rglob("*") if path.is_file() and path.suffix.lower() in ALLOWED_EXTENSIONS)
    if not sources:
        parser.error("No supported files found")
    failed = 0
    with psycopg.connect(args.database_url, autocommit=True) as conn:
        register_vector(conn)
        for source in sources:
            try:
                document_id, status = ingest_one(
                    conn, source, employee_id=args.employee_id, storage_root=args.storage_root.resolve(),
                    project_no=args.project_no, confidentiality=args.confidentiality,
                    embedding_dim=args.embedding_dim, chunk_tokens=args.chunk_tokens,
                    chunk_overlap_tokens=args.chunk_overlap_tokens, section_max_tokens=args.section_max_tokens,
                )
                print(f"{source}: document {document_id}: {status}")
                failed += status == "failed"
            except (ValueError, psycopg.Error) as exc:
                LOG.error("%s: %s", source, exc)
                failed += 1
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
