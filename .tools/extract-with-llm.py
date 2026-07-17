#!/usr/bin/env python3
"""
Phase 1 of the chapter generation pipeline.
Reads .sources/temp_context.md (raw PDF text from extract_pages.py),
runs it through the local ollama model, and writes structured extraction
notes to .sources/temp_extracted.md for opencode to consume in Phase 2.
"""
import sys, json, urllib.request, pathlib, subprocess, time

ROOT   = pathlib.Path(__file__).parent.parent
INPUT  = ROOT / ".sources" / "temp_context.md"
OUTPUT = ROOT / ".sources" / "temp_extracted.md"

MODEL      = "huihui_ai/qwen3-abliterated:8b"
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

SYSTEM = (
    "You are a digital forensics knowledge extractor. "
    "Your only job is to read raw book text and re-express EVERY piece of knowledge "
    "faithfully in original English prose — never summarizing, never omitting.\n\n"
    "MANDATORY RULES:\n"
    "1. Extract EVERY concept, technique, command, flag, example, output, and warning. "
    "Nothing is too minor.\n"
    "2. NEVER summarize. Re-express in your own original words — do not paraphrase whole "
    "paragraphs, but also do not copy sentences verbatim.\n"
    "3. Commands must appear with exact syntax, all flags shown, and a realistic example "
    "terminal output (1-5 lines).\n"
    "4. For every concept include: (a) what it is, (b) how it works mechanically, "
    "(c) why it matters in a forensic investigation.\n"
    "5. Include gotchas, edge cases, and forensic dangers — especially anything that "
    "could contaminate or alter evidence.\n"
    "6. Do NOT add information not present in the source text.\n"
    "7. Write in English. Be exhaustive. Depth over brevity.\n\n"
    "OUTPUT FORMAT (use these exact headings):\n"
    "## Core Concepts\n"
    "## Commands and Syntax\n"
    "## Worked Examples\n"
    "## Forensic Warnings\n"
    "## Connections to Other Topics\n"
)

def ensure_ollama_running() -> bool:
    try:
        urllib.request.urlopen("http://127.0.0.1:11434/api/tags", timeout=3)
        return True
    except Exception:
        print("ollama not running — attempting to start it...")
        subprocess.Popen(
            ["bash", "-c", "env HSA_OVERRIDE_GFX_VERSION=10.3.0 OLLAMA_VULKAN=1 ollama serve"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        for _ in range(10):
            time.sleep(2)
            try:
                urllib.request.urlopen("http://127.0.0.1:11434/api/tags", timeout=2)
                print("ollama started.")
                return True
            except Exception:
                pass
        return False

def extract(text: str) -> str:
    prompt = (
        "Extract ALL forensic knowledge from the book chapter text below. "
        "Follow every rule in the system prompt.\n\n"
        f"--- BEGIN SOURCE TEXT ---\n{text}\n--- END SOURCE TEXT ---"
    )
    body = json.dumps({
        "model": MODEL,
        "prompt": prompt,
        "system": SYSTEM,
        "stream": False,
        "options": {"num_ctx": 6144, "temperature": 0.1, "num_gpu": 99}
    }).encode()
    req = urllib.request.Request(
        OLLAMA_URL, data=body, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=600) as r:
        data = json.loads(r.read())
        elapsed = data.get("total_duration", 0) / 1e9
        toks    = data.get("eval_count", 0)
        speed   = toks / elapsed if elapsed > 0 else 0
        print(f"  {toks} tokens in {elapsed:.1f}s ({speed:.1f} tok/s)")
        return data["response"]

def main() -> None:
    if not INPUT.exists():
        print(f"Error: {INPUT} not found. Run extract_pages.py first.", file=sys.stderr)
        sys.exit(1)

    if not ensure_ollama_running():
        print("Error: could not start ollama.", file=sys.stderr)
        sys.exit(1)

    text = INPUT.read_text()
    chars = len(text)
    print(f"Extracting {chars:,} chars from {INPUT.name} using {MODEL}...")
    result = extract(text)
    OUTPUT.write_text(result)
    print(f"Done → {OUTPUT} ({len(result):,} chars)")

if __name__ == "__main__":
    main()
