"""Local PDF -> Markdown extractor (zero LLM tokens).

Usage: python extract.py <input.pdf> <output.md>

Output is an INTERNAL working artifact used only to map coverage and feed the
chapter generator. It is gitignored and never shipped (book text is copyrighted).
"""

import sys
import pathlib
import pymupdf4llm


def main() -> None:
    if len(sys.argv) != 3:
        print("usage: extract.py <input.pdf> <output.md>")
        sys.exit(2)
    src, dst = sys.argv[1], sys.argv[2]
    md = pymupdf4llm.to_markdown(src)
    out = pathlib.Path(dst)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(md, encoding="utf-8")
    print(f"OK: {len(md):,} chars -> {dst}")


if __name__ == "__main__":
    main()
