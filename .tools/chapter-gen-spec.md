# ForensicVN — Chapter Generation Spec (obey EXACTLY)

You generate ONE chapter JSON file for a forensics course. Output must be a single valid JSON file at
the path you are told, matching the schema below. `content/chapters/ch01.json` is the GOLD STANDARD —
match its depth, structure and tone.

## Hard rules

1. **Output**: valid JSON only, matching the schema in `src/renderer/src/content/types.ts` (Chapter).
2. **Bilingual**: every human-readable string is an object `{ "en": "...", "es": "..." }`.
3. **Spanish = NEUTRAL** (tuteo/impersonal). FORBIDDEN voseo forms: sabé, tenés, listá, identificá,
   ubicá, pasá, probá, escribí, elegí, recalculá, hacés, querés, podés, sabés, mirá, andá, tomá, sacá,
   registrá, documentá, preguntale, tomale, adquirís, analizás, cambiás, demostrá. Use: ten, tienes,
   lista, identifica, ejecuta, escribe, elige, etc.
4. **Original prose only**. Use the books for FACTS and COVERAGE — never copy or lightly paraphrase their
   sentences. The product is commercial; copied text is illegal.
5. **Sample outputs must be realistic and technically correct.** Verify command/flag syntax against the
   tool's CURRENT version (e.g. Volatility 3, current Sleuth Kit) — NOT the book's old syntax.
6. **Every `lineByLine.token` MUST appear verbatim inside that command's `sampleOutput`.**
7. **Glossary is mandatory and complete**: define EVERY term a newcomer wouldn't know (concepts) AND
   EVERY command/tool used in the chapter. Command entries use `"kind": "command"`. Concept entries omit
   `kind` (or `"kind": "concept"`). `term` is bilingual. CRITICAL: every technical term that appears in
   the objectives or theory MUST be in the glossary so it auto-highlights wherever it appears, in every
   paragraph (repeated exposure helps memory). Use the EXACT surface form as written in the prose — do
   NOT put parentheticals in `term` (write "offset", not "desplazamiento (offset)"). Assume the reader is
   an ABSOLUTE BEGINNER who knows no jargon. Foundational terms (byte, bit, stdout, stdin, log, flag,
   pipe, hexadecimal, ASCII, terminal, command, vim, O_RDONLY, patch) already live in the GLOBAL glossary
   `content/glossary.json` and apply to every chapter automatically — do NOT redefine those; only add
   chapter-specific concepts plus the chapter's commands.
8. **Exercises**: 5+, mixing types `recall` / `analyze` / `variation`. Each has `accept` (array of several
   acceptable answers, EN and ES) and a bilingual `explanation`. No two exercises may share the same
   primary expected answer — ensure genuine variety across the chapter's different commands and concepts.
9. **coverageChecklist**: cite the real books of this layer (see `.sources/book-map.json`).
10. **`mangaRevealOnComplete`**: an integer (typically 1–2).

## How to use the sources (token-aware)

- Read `.sources/book-map.json` to find which markdown files in `.sources/books_md/` belong to this layer.
- SEARCH those markdown files (grep) for the chapter's topic and read ONLY the relevant section.
  Do NOT read whole books.

## Schema (shape)

```
{
  "id": "chNN", "layer": <int>, "order": <int>,
  "title": {en,es}, "subtitle": {en,es},
  "glossary": [ { "term": {en,es}, "definition": {en,es}, "kind"?: "command" } ],
  "objectives": [ { "id": "slug", "label": {en,es} } ],
  "theory": [ { "heading": {en,es}, "body": {en,es} } ],            // ~5 blocks
  "commands": [ {
     "command": "ls -la",
     "intro": {en,es},
     "sampleOutput": "multi-line real output",
     "lineByLine": [ { "token": "exact substring of sampleOutput", "explain": {en,es} } ]
  } ],                                                               // ~4-6 commands
  "exercises": [ { "type": "recall|analyze|variation", "prompt": {en,es},
     "accept": ["...","..."], "explanation": {en,es} } ],           // 5+
  "coverageChecklist": [ "topic — Book (Author)" ],
  "mangaRevealOnComplete": 2
}
```

## Self-check before finishing

- Run `node .tools/validate-content.mjs <chId>` and fix everything it reports until it PASSES.
- Confirm: every token is found in its sampleOutput; glossary covers every command; no voseo; all
  strings bilingual.
