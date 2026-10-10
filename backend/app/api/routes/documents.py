"""Browse and upload the original employee files stored by the ingestion pipeline."""

from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Annotated

import psycopg
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.services.archive import MAX_ARCHIVE_BYTES, ArchiveValidationError, extract_documents
from app.services.document_processing import ALLOWED_EXTENSIONS
from scripts.ingest_documents import ingest_one

router = APIRouter(prefix="/api/documents", tags=["documents"])
MAX_UPLOAD_BYTES = 25 * 1024 * 1024


def _row(row: tuple) -> dict:
    document_id, filename, status, uploaded_at, error, employee_id, employee, project, raw_path = (
        row
    )
    path = Path(raw_path)
    return {
        "id": str(document_id),
        "filename": filename,
        "size_bytes": path.stat().st_size if path.is_file() else 0,
        "status": status,
        "uploaded_at": uploaded_at.isoformat(),
        "error": error,
        "employee_id": str(employee_id),
        "employee": employee,
        "project": project,
    }


def _document_query() -> str:
    return """SELECT d.id, d.filename, d.status, d.uploaded_at, d.error,
                     e.id, e.full_name, d.project_no, d.raw_path
              FROM documents d JOIN employees e ON e.id = d.employee_id"""


@router.get("")
def list_documents(employee: str | None = None, project: str | None = None) -> list[dict]:
    clauses = []
    params = []
    if employee:
        clauses.append("e.full_name = %s")
        params.append(employee)
    if project:
        clauses.append("d.project_no = %s")
        params.append(project)
    where = " WHERE " + " AND ".join(clauses) if clauses else ""
    with psycopg.connect(get_settings().database_url) as conn:
        rows = conn.execute(
            _document_query() + where + " ORDER BY d.uploaded_at DESC, d.id DESC", params
        ).fetchall()
    return [_row(row) for row in rows]


@router.post("", status_code=201)
def upload_document(
    file: Annotated[UploadFile, File()],
    employee_name: Annotated[str, Form()],
    project_no: Annotated[str, Form()] = "",
) -> dict:
    name = Path(file.filename or "").name
    employee_name = employee_name.strip()
    project_no = project_no.strip()
    if not employee_name:
        raise HTTPException(422, "Employee name is required")
    if not name or Path(name).suffix.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(415, "Unsupported file type")
    try:
        with TemporaryDirectory() as directory:
            named = Path(directory) / name
            with named.open("wb") as output:
                size = 0
                while chunk := file.file.read(1024 * 1024):
                    size += len(chunk)
                    if size > MAX_UPLOAD_BYTES:
                        raise HTTPException(413, "Files must be 25 MB or smaller")
                    output.write(chunk)
            if size == 0:
                raise HTTPException(422, "File is empty")
            settings = get_settings()
            with psycopg.connect(settings.database_url, autocommit=True) as conn:
                with conn.transaction():
                    employee = conn.execute(
                        "SELECT id FROM employees WHERE full_name = %s ORDER BY id LIMIT 1",
                        (employee_name,),
                    ).fetchone()
                    employee_id = (
                        employee[0]
                        if employee
                        else conn.execute(
                            "INSERT INTO employees (full_name) VALUES (%s) RETURNING id",
                            (employee_name,),
                        ).fetchone()[0]
                    )
                document_id, _ = ingest_one(
                    conn,
                    named,
                    employee_id=employee_id,
                    project_no=project_no or None,
                    storage_root=Path(settings.storage_root).resolve(),
                )
                row = conn.execute(
                    _document_query() + " WHERE d.id = %s", (document_id,)
                ).fetchone()
        return _row(row)
    finally:
        file.file.close()


@router.post("/archive", status_code=201)
def upload_archive(
    file: Annotated[UploadFile, File()],
    employee_name: Annotated[str, Form()],
    project_no: Annotated[str, Form()] = "",
) -> dict:
    employee_name = employee_name.strip()
    if not employee_name:
        raise HTTPException(422, "Employee name is required")
    if Path(file.filename or "").suffix.lower() != ".zip":
        raise HTTPException(415, "Upload a ZIP file")
    try:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            archive = root / "upload.zip"
            size = 0
            with archive.open("wb") as output:
                while chunk := file.file.read(1024 * 1024):
                    size += len(chunk)
                    if size > MAX_ARCHIVE_BYTES:
                        raise HTTPException(413, "ZIP files must be 100 MB or smaller")
                    output.write(chunk)
            if size == 0:
                raise HTTPException(422, "ZIP file is empty")
            try:
                documents, skipped = extract_documents(archive, root / "documents")
            except ArchiveValidationError as error:
                raise HTTPException(error.status_code, str(error)) from error

            settings = get_settings()
            records = []
            with psycopg.connect(settings.database_url, autocommit=True) as conn:
                with conn.transaction():
                    employee = conn.execute(
                        "SELECT id FROM employees WHERE full_name = %s ORDER BY id LIMIT 1",
                        (employee_name,),
                    ).fetchone()
                    employee_id = (
                        employee[0]
                        if employee
                        else conn.execute(
                            "INSERT INTO employees (full_name) VALUES (%s) RETURNING id",
                            (employee_name,),
                        ).fetchone()[0]
                    )
                for document in documents:
                    document_id, _ = ingest_one(
                        conn,
                        document,
                        employee_id=employee_id,
                        project_no=project_no.strip() or None,
                        storage_root=Path(settings.storage_root).resolve(),
                    )
                    row = conn.execute(
                        _document_query() + " WHERE d.id = %s", (document_id,)
                    ).fetchone()
                    records.append(_row(row))
        return {"documents": records, "skipped": skipped}
    finally:
        file.file.close()


@router.get("/{document_id}/download")
def download_document(document_id: int) -> FileResponse:
    with psycopg.connect(get_settings().database_url) as conn:
        row = conn.execute(
            "SELECT filename, raw_path FROM documents WHERE id = %s", (document_id,)
        ).fetchone()
    if row is None:
        raise HTTPException(404, "Document not found")
    path = Path(row[1])
    if not path.is_file():
        raise HTTPException(404, "Original file is missing")
    return FileResponse(path, filename=row[0], media_type="application/octet-stream")


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: int) -> None:
    with psycopg.connect(get_settings().database_url) as conn:
        row = conn.execute(
            "DELETE FROM documents WHERE id = %s RETURNING id", (document_id,)
        ).fetchone()
    if row is None:
        raise HTTPException(404, "Document not found")
