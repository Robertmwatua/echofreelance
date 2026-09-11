#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGDATA="$ROOT/.pgdata"
PG_BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)"

if [[ -z "${PG_BIN:-}" ]]; then
  echo "PostgreSQL binaries not found under /usr/lib/postgresql"
  exit 1
fi

mkdir -p "$PGDATA"
if [[ ! -f "$PGDATA/PG_VERSION" ]]; then
  "$PG_BIN/initdb" -D "$PGDATA" -U postgres --auth=trust
fi

if ! pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
  "$PG_BIN/pg_ctl" -D "$PGDATA" -l "$PGDATA/logfile" start -o "-p 5432 -h 127.0.0.1 -k /tmp"
fi

"$PG_BIN/createdb" -h 127.0.0.1 -p 5432 -U postgres echofreelance_dev 2>/dev/null || true
echo "Postgres ready on 127.0.0.1:5432 (db: echofreelance_dev)"
