# ForensicVN — Master Coverage Map

This is the curriculum spine: the union of the tables of contents of the canonical
books, organized into 11 layers. It is the contract that guarantees **nothing the
literature teaches gets skipped**, and it makes progress **measurable** (% covered).

> Content prose is written 100% original (commercial / copyright wall). The books
> define WHAT to cover and at what depth — never the wording. See plan §"Entrega de
> contenido y anti-piratería".

## How to read this

Each `layerNN.md` lists topics derived from the books' TOCs. Each topic becomes one
or more chapters (`chNN.json`). Status legend per topic:

- `[ ]` pending — not written yet
- `[~]` partial — a chapter touches it but depth not complete
- `[x]` done — written, bilingual, with labs + exercises

## Layers

| Layer | Theme | Status |
|------:|-------|--------|
| 0 | Foundations (OS, Linux internals, networking) | skeleton |
| 1 | Command line & shell | partial (ch01) |
| 2 | Forensic fundamentals, evidence, legal | partial (ch01) |
| 3 | Acquisition & forensic imaging | skeleton |
| 4 | File systems & disk analysis | skeleton |
| 5 | OS forensics / artifacts | skeleton |
| 6 | Memory (RAM) forensics | skeleton |
| 7 | Network forensics | skeleton |
| 8 | Malware analysis & reverse engineering | skeleton |
| 9 | Mobile forensics | skeleton |
| 10 | Advanced / cross-cutting (IR, reporting, anti-forensics, cloud) | skeleton |

## Currency rule

Concepts age well; tool SYNTAX does not. When writing any lab, verify commands/flags
against the tool's current official docs (e.g. Volatility 3 replaced Volatility 2 in
April 2025; *The Art of Memory Forensics* teaches Vol2 syntax).
