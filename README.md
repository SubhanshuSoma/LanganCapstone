# Langan Knowledge Bot

A chatbot that helps Langan staff find knowledge from the documents retired employees produced over their careers. It uses retrieval-augmented generation (RAG): documents are indexed, the most relevant passages are retrieved for each question, and a local model answers from those passages with citations. The model itself is not trained on the documents.

- **Backend:** Python + FastAPI (`backend/`)
- **Frontend:** React + Vite + TypeScript (`frontend/`)
- **Model:** runs locally with [Ollama](https://ollama.com), so documents never leave the machine

## Setup

Prerequisites: Python 3.11+, [uv](https://docs.astral.sh/uv/), Node 20.19+, and Ollama.

```bash
# 1. Model (once)
brew install ollama          # or download from ollama.com
ollama serve                 # leave running
ollama pull llama3.1:8b

# 2. Backend  → http://localhost:8000  (API docs at /docs)
cd backend
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload

# 3. Frontend → http://localhost:5173
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Tests

```bash
cd backend && uv run pytest          # no Ollama needed; the model is faked
cd frontend && npm test
```

## Import local retiree documents

The Python ingestion command accepts a supported file or a directory (searched recursively):
PDF, DOCX, TXT, Markdown, XLSX, CSV, and EML. It copies originals to
`backend/data/bronze/{employee_id}/`, writes cleaned block JSON to
`backend/data/silver/{employee_id}/`, and inserts sections and chunks into the
existing PostgreSQL schema. Sample employees can be imported regardless of the
`consent` flag.

Start the database from `database/` with `docker compose up -d`. Create a
sample employee, for example:

```bash
cd database
docker compose exec postgres psql -U langan -d langan_test -c \
  "INSERT INTO employees (full_name) VALUES ('Synthetic Retiree') RETURNING id;"
```

Then run from `backend/`, replacing `1` with the returned employee ID and the
path with your local source file or directory:

```bash
cd backend
uv sync
uv run python scripts/ingest_documents.py /path/to/documents --employee-id 1
```

Use `--database-url` if the database is not at the local default. Optional
flags include `--project-no`, `--confidentiality`, `--storage-root`, and the
chunk size settings shown by `--help`. Reimporting the same file for the same
employee reports it as a duplicate.
The command exits nonzero if any file fails; failed extraction is recorded on
the document row, and rerunning the same file retries a failed document.
Stored vectors are deterministic fake embeddings for local
pipeline testing and do not provide meaningful semantic search.

## Status

Milestone 1 (chat skeleton with streaming) is done. Next up: document ingestion (PDF, Word), retrieval, and answers with citations. Excel/CSV, email, PowerPoint and AutoCAD DWG follow. Use only synthetic data in `sample-data/synthetic/`. Real company documents stay out of the repo.
