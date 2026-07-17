#!/usr/bin/env bash
# Generate the remaining Layer 1 chapters (ch04..ch12) sequentially, validating each.
# Usage: gen-layer1.sh [provider/model]
set -uo pipefail

ROOT="/home/jojan/AppsDesktop/forensic-vn"
MODEL="${1:-opencode/deepseek-v4-flash-free}"

declare -a CH=(
  "ch04|1|4|Copying, moving and safely handling files: cp, mv, rm, mkdir, ln — and the forensic dangers of each (timestamps, overwriting, secure deletion)|the-linux-command-line|55|69"
  "ch05|1|5|Streams and redirection: stdin, stdout, stderr and the >, >>, 2>, &> operators; capturing command output to evidence notes|the-linux-command-line|81|91"
  "ch06|1|6|Transforming text: cut, sort, uniq, tr — extracting, counting and tidying fields from logs and listings|the-linux-command-line|277|299"
  "ch07|1|7|Advanced text processing with sed and awk: filtering, substituting and reshaping evidence data|the-linux-command-line|300|310"
  "ch08|1|8|Finding files across a system: find and locate by name, modification time, size, type and permissions|the-linux-command-line|227|240"
  "ch09|1|9|Archives and raw copies: tar, gzip, zip and an introduction to dd for byte-for-byte copies|the-linux-command-line|241|255"
  "ch10|1|10|Processes and jobs: ps, top, kill, and foreground/background jobs; spotting suspicious processes|the-linux-command-line|131|143"
  "ch11|1|11|Permissions in depth: chmod octal and symbolic modes, chown, and the setuid/setgid/sticky bits|the-linux-command-line|113|130"
  "ch12|1|12|Shell scripting basics: variables, conditionals, loops and functions to automate repetitive forensic tasks|the-linux-command-line|355|370"
)

fail=0
for entry in "${CH[@]}"; do
  IFS='|' read -r id layer order topic book start end <<< "$entry"
  echo "==================== $id ===================="
  
  if [ -f "$ROOT/content/chapters/${id}.json" ]; then
    echo "Skip (already exists): $id"
    continue
  fi

  bash "$ROOT/.tools/gen-chapter.sh" "$id" "$layer" "$order" "$topic" "$book" "$start" "$end" "$MODEL"
  if node "$ROOT/.tools/validate-content.mjs" "$id"; then
    echo "OK: $id"
  else
    echo "VALIDATION FAILED: $id — stopping batch."
    fail=1
    break
  fi
  echo ""
done

if [ "$fail" -eq 0 ]; then echo "LAYER 1 BATCH COMPLETE ✅"; else echo "BATCH STOPPED on a failure ❌"; fi

