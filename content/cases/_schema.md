# ForensicVN — Case ("Caso") model: chained real-case reconstructions

A **Caso** is a milestone exam placed every ~4 chapters. It reconstructs a REAL,
publicly documented cybercrime as a **chain of investigative pivots** that the
student solves using ONLY the tools taught up to that point.

## Principles

- **Real case = narrative skeleton + lesson + reveal.** We use the public record
  (perpetrator name, technique, outcome) as the story and the teaching goal.
- **Synthetic evidence = real, inert files we author** that reproduce the case's
  technique. Real tools produce real output (e.g. `exiftool` reads GPS we planted
  the way the real device wrote it). Only the case *identity* is reconstructed —
  never the forensic skill, which transfers 100%. Industry standard: NIST CFReDS,
  Digital Corpora (M57), DFIR CTFs.
- **Level-gated:** `requiredSkills` ⊆ tools taught so far. No memory-forensics APT
  in chapter 1.
- **Chain of pivots (investigative pivoting):** each step's finding unlocks the
  next; each step uses a *different* tool. The 4-chapter cadence yields ~4 tools =
  a ~4-link chain.
- **Gradable:** each step has an expected finding the app verifies.
- **Manga synergy:** each solved step reveals the next manga panel (reuses the
  existing single-panel-replace engine).

## Schema — `content/cases/casoNN.json`

```jsonc
{
  "id": "caso01",
  "order": 1,
  "afterChapter": "ch05",        // milestone placement
  "maxLayer": 2,                  // gating ceiling
  "title":  { "en": "", "es": "" },
  "brief":  { "en": "", "es": "" },   // the scenario hook (no spoilers)
  "realCase": {                        // the truth — used only in the reveal
    "name": "", "year": 0,
    "summary": { "en": "", "es": "" },
    "sources": ["https://..."]         // public record, mandatory
  },
  "requiredSkills": ["ch01","ch02","ch03","ch04"],
  "evidenceDir": "evidence/caso01/",   // synthetic, inert files
  "steps": [
    {
      "n": 1,
      "objective": { "en": "", "es": "" },
      "tool": "exiftool",              // must be taught <= maxLayer
      "evidenceFile": "leak.jpg",
      "expectedFinding": "",           // for grading
      "pivot": { "en": "", "es": "" }, // how this finding opens step 2
      "hint":  { "en": "", "es": "" },
      "mangaPanel": "p1"
    }
  ],
  "reveal":  { "en": "", "es": "" },    // who/what/outcome + source link
  "debrief": { "en": "", "es": "" }     // techniques used, real-world tie-in
}
```

## Legal / ethical (non-negotiable)

- Public record only: convictions, indictments, reputable press. Cite sources.
- No victim PII. No working malware/exploit. Evidence files are inert.
- We reconstruct the **investigation**, never the crime.
