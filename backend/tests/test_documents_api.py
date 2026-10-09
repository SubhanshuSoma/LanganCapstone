from datetime import datetime, timezone
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app


class FakeConnection:
    def __init__(self, rows):
        self.rows = rows
        self.query = ""
        self.params = []

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return None

    def execute(self, query, params=()):
        self.query = query
        self.params = params
        return self

    def fetchall(self):
        return self.rows


def test_document_list_and_filters(monkeypatch, tmp_path: Path):
    source = tmp_path / "report.txt"
    source.write_text("Synthetic report")
    connection = FakeConnection([(
        7, "report.txt", "indexed", datetime(2026, 10, 1, tzinfo=timezone.utc),
        None, 2, "Morgan Lee", "P-12", str(source),
    )])
    monkeypatch.setattr("app.api.routes.documents.psycopg.connect", lambda *_: connection)
    response = TestClient(app).get("/api/documents?employee=Morgan%20Lee&project=P-12")
    assert response.status_code == 200
    assert response.json()[0]["size_bytes"] == len("Synthetic report")
    assert response.json()[0]["employee"] == "Morgan Lee"
    assert connection.params == ["Morgan Lee", "P-12"]


def test_rejects_unsupported_upload():
    response = TestClient(app).post(
        "/api/documents",
        data={"employee_name": "Morgan Lee"},
        files={"file": ("drawing.dwg", b"data")},
    )
    assert response.status_code == 415
