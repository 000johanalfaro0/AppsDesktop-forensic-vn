import sys
import pathlib
import pymupdf4llm

def main() -> None:
    if len(sys.argv) != 5:
        print("usage: extract_pages.py <pdf_path> <start_page> <end_page> <output_path>")
        sys.exit(2)
        
    pdf_path = sys.argv[1]
    try:
        start_page = int(sys.argv[2])
        end_page = int(sys.argv[3])
    except ValueError:
        print("Error: start_page and end_page must be integers")
        sys.exit(2)
        
    output_path = sys.argv[4]
    
    # Page numbers in pymupdf4llm are 0-indexed.
    # User input is typically 1-indexed and inclusive, e.g. pages 10 to 12.
    pages = list(range(start_page - 1, end_page))
    
    if not pages or any(p < 0 for p in pages):
        print("Error: invalid page range")
        sys.exit(2)
        
    print(f"Extracting pages {start_page} to {end_page} from {pdf_path}...")
    md = pymupdf4llm.to_markdown(pdf_path, pages=pages)
    
    out = pathlib.Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(md, encoding="utf-8")
    print(f"Successfully extracted {len(md):,} characters -> {output_path}")

if __name__ == "__main__":
    main()
