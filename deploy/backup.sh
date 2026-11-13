#!/bin/sh
# Dumps the app database to $BACKUP_DIR and keeps the newest $BACKUP_KEEP_DAYS daily dumps.
# Uses standard libpq env vars: PGHOST, PGUSER, PGPASSWORD, PGDATABASE.
# Restore: gunzip -c <file>.sql.gz | psql -h <host> -U app app
set -eu
dir="${BACKUP_DIR:-/backups}"
keep="${BACKUP_KEEP_DAYS:-7}"
mkdir -p "$dir"
file="$dir/${PGDATABASE:-app}-$(date +%Y%m%d-%H%M%S).sql.gz"
# No pipe: a failing pg_dump must fail the script, never leave a broken "backup".
tmp="$dir/.in-progress.sql"
trap 'rm -f "$tmp" "$tmp.gz"' EXIT
pg_dump --no-owner --clean --if-exists > "$tmp"
gzip "$tmp"
mv "$tmp.gz" "$file"
echo "backup written: $file ($(du -h "$file" | cut -f1))"
# Keep only the newest $keep dumps.
ls -1t "$dir"/*.sql.gz 2>/dev/null | tail -n +"$((keep + 1))" | xargs -r rm -f
