#!/usr/bin/env bash
# Generate remaining Layer 1 chapters (ch07..ch12). ch01-ch06 already done & validated.
# Usage: gen-layer1-remaining.sh [provider/model]
set -uo pipefail

ROOT="/home/jojan/AppsDesktop/forensic-vn"
MODEL="${1:-opencode/deepseek-v4-flash-free}"

declare -a CH=(
  "ch07|1|7|Advanced text processing with sed and awk: filtering, substituting and reshaping evidence data"
  "ch08|1|8|Finding files across a system: find and locate by name, modification time, size, type and permissions"
  "ch09|1|9|Archives and raw copies: tar, gzip, zip and an introduction to dd for byte-for-byte copies"
  "ch10|1|10|Processes and jobs: ps, top, kill, and foreground/background jobs; spotting suspicious processes"
  "ch11|1|11|Permissions in depth: chmod octal and symbolic modes, chown, and the setuid/setgid/sticky bits"
  "ch12|1|12|Shell scripting basics: variables, conditionals, loops and functions to automate repetitive forensic tasks"
)

fail=0
for entry in "${CH[@]}"; do
  IFS='|' read -r id layer order topic <<< "$entry"
  echo "==================== $id ===================="
  bash "$ROOT/.tools/gen-chapter.sh" "$id" "$layer" "$order" "$topic" "$MODEL"
  if node "$ROOT/.tools/validate-content.mjs" "$id"; then
    echo "OK: $id"
  else
    echo "VALIDATION FAILED: $id — stopping batch."
    fail=1
    break
  fi
  echo ""
done

if [ "$fail" -eq 0 ]; then echo "REMAINING BATCH COMPLETE ✅"; else echo "BATCH STOPPED on a failure ❌"; fi
