from pathlib import Path
from zipfile import ZipFile

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.archive import ArchiveValidationError, extract_documents


def make_zip(path: Path, entries: dict[str, bytes]) -> Path:
    with ZipFile(path, "w") as archive:
        for name, data in entries.items():
            archive.writestr(name, data)
    return path


def test_extracts_supported_documents_and_reports_skipped(tmp_path: Path):
    archive = make_zip(
        tmp_path / "employees.zip",
        {
            "reports/summary.txt": b"First report",
            "notes/summary.txt": b"Second report",
            "image.png": b"not a supported document",
        },
    )

    documents, skipped = extract_documents(archive, tmp_path / "output")

    assert [document.name for document in documents] == ["summary.txt", "summary.txt"]
    assert [document.read_bytes() for document in documents] == [b"First report", b"Second report"]
    assert skipped == ["image.png"]


@pytest.mark.parametrize("name", ["../outside.txt", "/absolute.txt", "C:\\outside.txt"])
def test_rejects_unsafe_archive_paths(tmp_path: Path, name: str):
    archive = make_zip(tmp_path / "unsafe.zip", {name: b"data"})

    with pytest.raises(ArchiveValidationError, match="Unsafe path"):
        extract_documents(archive, tmp_path / "output")


def test_rejects_oversized_document(tmp_path: Path, monkeypatch):
    monkeypatch.setattr("app.services.archive.MAX_DOCUMENT_BYTES", 4)
    archive = make_zip(tmp_path / "oversize.zip", {"report.txt": b"12345"})

    with pytest.raises(ArchiveValidationError) as error:
        extract_documents(archive, tmp_path / "output")
    assert error.value.status_code == 413


def test_archive_upload_imports_each_document_under_form_employee(monkeypatch, tmp_path: Path):
    names: dict[int, str] = {}
    calls: list[tuple[str, int, str | None]] = []

    class Connection:
        def __enter__(self):
            return self

        def __exit__(self, *_):
            return None

        def transaction(self):
            return self

        def execute(self, query, params=()):
            if query.startswith("SELECT id FROM employees"):
                self.row = (7,)
            else:
                self.row = (params[0], names[params[0]])
            return self

        def fetchone(self):
            return self.row

    def ingest(_conn, path, *, employee_id, project_no, storage_root):
        document_id = len(calls) + 1
        names[document_id] = path.name
        calls.append((path.read_text(), employee_id, project_no))
        return document_id, "indexed"

    monkeypatch.setattr("app.api.routes.documents.psycopg.connect", lambda *_, **__: Connection())
    monkeypatch.setattr("app.api.routes.documents.ingest_one", ingest)
    monkeypatch.setattr(
        "app.api.routes.documents._row",
        lambda row: {"id": str(row[0]), "filename": row[1], "status": "indexed"},
    )
    archive = make_zip(
        tmp_path / "staff.zip",
        {
            "folder/one.txt": b"First",
            "folder/two.md": b"Second",
            "photo.jpg": b"ignored",
        },
    )

    response = TestClient(app).post(
        "/api/documents/archive",
        data={"employee_name": "Morgan Lee", "project_no": "P-12"},
        files={"file": ("staff.zip", archive.read_bytes(), "application/zip")},
    )

    assert response.status_code == 201
    assert [document["filename"] for document in response.json()["documents"]] == [
        "one.txt",
        "two.md",
    ]
    assert response.json()["skipped"] == ["photo.jpg"]
    assert calls == [("First", 7, "P-12"), ("Second", 7, "P-12")]


def test_archive_upload_rejects_invalid_zip():
    response = TestClient(app).post(
        "/api/documents/archive",
        data={"employee_name": "Morgan Lee"},
        files={"file": ("bad.zip", b"not a zip", "application/zip")},
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "Invalid ZIP file"
