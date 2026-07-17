#!/usr/bin/env bash
# Generate ONE chapter with opencode using a surgical page range from the PDF.
# Usage: gen-chapter.sh <chId> <layer> <order> "<topic title>" <book_slug> <start_page> <end_page> [provider/model]
set -uo pipefail

ROOT="/home/jojan/AppsDesktop/forensic-vn"
ID="${1:?chapter id, e.g. ch11}"
LAYER="${2:?layer number, e.g. 1}"
ORDER="${3:?order, e.g. 11}"
TOPIC="${4:?topic title in quotes}"
BOOK_SLUG="${5:?book slug, e.g. the-linux-command-line}"
START_PAGE="${6:?start page, e.g. 113}"
END_PAGE="${7:?end page, e.g. 130}"
MODEL="${8:-opencode/deepseek-v4-flash-free}"

LNN=$(printf "%02d" "$LAYER")

# 1. Resolve PDF path from book-map.json
PDF_PATH=$(jq -r --arg slug "$BOOK_SLUG" '.[] | select(.slug == $slug) | .pdf' "$ROOT/.sources/book-map.json")
if [ ! -f "$PDF_PATH" ]; then
  echo "Error: PDF file not found at $PDF_PATH" >&2
  exit 1
fi

# 2a. Extract PDF pages to raw text (local, no AI)
echo "Extracting pages $START_PAGE to $END_PAGE from $BOOK_SLUG..."
"$ROOT/.tools/venv/bin/python" "$ROOT/.tools/extract_pages.py" "$PDF_PATH" "$START_PAGE" "$END_PAGE" "$ROOT/.sources/temp_context.md"

# 2b. Phase 1 — local ollama model processes the raw text into structured notes
echo "Running local model extraction (GPU)..."
"$ROOT/.tools/venv/bin/python" "$ROOT/.tools/extract-with-llm.py"

# 3. Resolve or initialize session ID to prevent chat pollution
SESSION_ID=$(PAGER=cat opencode session list 2>/dev/null | grep -i "ForensicVN" | head -n 1 | awk '{print $1}')
SESSION_FLAG=""
if [ -n "$SESSION_ID" ]; then
  echo "Reusing existing ForensicVN session: $SESSION_ID"
  SESSION_FLAG="-s $SESSION_ID"
else
  echo "No existing ForensicVN session found. Creating a new session..."
fi

read -r -d '' PROMPT <<EOF
You are generating ONE chapter for the ForensicVN forensics course.

STEP 1 — read and obey these repo files:
  - .tools/chapter-gen-spec.md        (the rules — obey every single one)
  - content/chapters/ch01.json        (GOLD STANDARD — match its depth, structure, tone)
  - content/coverage/layer${LNN}.md   (topic checklist for this layer)

STEP 2 — gather facts:
  The local GPU model has already extracted and structured all knowledge from the book chapter.
  Read ONLY .sources/temp_extracted.md — it contains every concept, command, example, and
  forensic warning from the source pages, pre-processed for you. Do NOT read other files.

STEP 3 — write the file:
  Create content/chapters/${ID}.json  (layer ${LAYER}, order ${ORDER}).
  Focus topic: ${TOPIC}
  100% original prose. Bilingual EN + NEUTRAL Spanish (no voseo). Glossary must cover every concept AND
  every command used. Every lineByLine token must appear in its sampleOutput.

STEP 4 — verify:
  Run: node .tools/validate-content.mjs ${ID}
  Fix whatever it reports until it PASSES. Then stop.
EOF

cd "$ROOT"
echo "Generating ${ID} (layer ${LAYER}) via opencode [$MODEL]..."
if [ -n "$SESSION_FLAG" ]; then
  opencode run $SESSION_FLAG -m "$MODEL" --dangerously-skip-permissions "$PROMPT"
else
  opencode run -m "$MODEL" --dangerously-skip-permissions "$PROMPT"
fi
