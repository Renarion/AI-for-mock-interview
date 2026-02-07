#!/bin/sh
# Entrypoint for backend container: runs DB migrations, then starts FastAPI (uvicorn).
# Used by backend/Dockerfile CMD — do not remove.
set -e

echo "Running migrations..."
alembic upgrade head

echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
