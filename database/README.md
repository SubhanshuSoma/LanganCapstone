# Retiree document database

This PostgreSQL database stores the retrieval structure from the data chunking
wireframe: **employees → documents → sections → chunks**. Source files stay in
external storage; `documents.raw_path` records their location. Do not put real
employee files or database dumps in this repository.

## Run locally

From this folder, run `docker compose up -d`. The container initializes the
schema from `init/001_schema.sql` on its first start. It binds to localhost on
port 5432 by default. Copy `.env.example` to `.env` to change local credentials
or the host port. The defaults are for local synthetic-data testing only.

Connect with:

```bash
docker compose exec postgres psql -U langan -d langan_test
```

Run the synthetic schema smoke test with:

```bash
docker compose exec -T postgres psql -U langan -d langan_test \
  -v ON_ERROR_STOP=1 < tests/schema_smoke.sql
```

The test rolls back its sample rows. Adjust the user and database arguments if
you changed them in `.env`.

The named `postgres_data` volume persists data across container restarts. To
rebuild the database from the initialization SQL, use
`docker compose down -v` (this deletes the local database), then
`docker compose up -d`.

For an already initialized local database, apply the sample-data view update
without deleting data:

```bash
docker compose exec -T postgres psql -U langan -d langan_test \
  -v ON_ERROR_STOP=1 < migrations/002_sample_data_without_consent.sql
```

## Data model

- `employees`: retiree identity, discipline, and a consent field retained for
  later use. Consent defaults to false and does not gate sample ingestion.
- `documents`: one row per original file, with its retiree, project number,
  source system, storage path, confidentiality label, and indexing status.
- `sections`: ordered heading-based groups with full text and optional page
  range. Pages can be null for sources such as email.
- `chunks`: ordered search units with context header, text, optional page
  range, embedding, and an automatically maintained keyword index.

The `searchable_chunks` view joins each chunk to its full section and source
metadata, and includes indexed sample documents regardless of consent. The
application still needs an authorization policy before showing documents to
users. A chunk's retiree is derived through its section and document, so it
cannot disagree with the source record.

The `embedding` column has no fixed dimension because the embedding model is
not chosen yet. pgvector can run exact nearest-neighbor searches now; add a
dimension-specific vector index once the model and dimension are fixed. The
`chunks_tsv_idx` GIN index supports keyword search immediately.

The FastAPI ingestion and retrieval paths are not yet wired to this database.
