#!/usr/bin/env bash
# Extract every book in book-map.json to internal markdown (zero LLM tokens).
# Skips already-extracted files. Runs nice'd to stay friendly on the machine.
set -uo pipefail

ROOT="/home/jojan/AppsDesktop/forensic-vn"
PY="$ROOT/.tools/venv/bin/python"
MAP="$ROOT/.sources/book-map.json"
OUT="$ROOT/.sources/books_md"
mkdir -p "$OUT"

jq -c '.[]' "$MAP" | while read -r row; do
  slug=$(echo "$row" | jq -r '.slug')
  pdf=$(echo "$row" | jq -r '.pdf')
  dst="$OUT/$slug.md"
  if [ -f "$dst" ]; then
    echo "skip (exists): $slug"
    continue
  fi
  if [ ! -f "$pdf" ]; then
    echo "MISSING PDF: $slug -> $pdf"
    continue
  fi
  echo "extracting: $slug ..."
  nice -n 19 "$PY" "$ROOT/.tools/extract.py" "$pdf" "$dst" \
    && echo "  done: $slug" \
    || echo "  FAILED: $slug"
done
echo "ALL DONE"
