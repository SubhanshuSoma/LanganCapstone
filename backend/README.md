# persona bot api (backend)

fastapi backend for the langan persona bot capstone.

## run locally

needs [uv](https://docs.astral.sh/uv/)

```bash
cd backend
cp .env.example .env
uv sync
uv run fastapi dev app/main.py
```

- api: http://127.0.0.1:8000
- api docs (scalar): http://127.0.0.1:8000/scalar
- health check: http://127.0.0.1:8000/api/health

## tests and lint

```bash
uv run pytest
uv run ruff check .
uv run ruff format .
```

## conventions

- routes go in `app/api/routes/<feature>.py` and get registered in `app/api/router.py`
- the `/api` prefix is set once in `main.py`, don't add it on individual routers
- new settings go in `app/core/config.py` plus a line in `.env.example`
- db access goes through sqlalchemy
