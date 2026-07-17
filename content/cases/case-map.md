# Case map — real cybercrimes mapped to skill level

Cadence: one **Caso** (milestone exam) per ~4 chapters. Supply far exceeds slots —
this lists primary picks plus alternates so we choose the best fit per level.

Status legend: `[ ]` pending · `[~]` drafting · `[x]` built + evidence + graded.

| After ch | maxLayer | Caso | Real case (public record) | Pivot chain (distinct tools) |
|---|---|---|---|---|
| `[ ]` ~ch05 | L1-2 | EXIF Hunt | **Higinio Ochoa "w0rmer"**, 2012 (Anonymous/CabinCr3w) | EXIF GPS (`exiftool`) → reused handle (`grep`/`strings`) → file masquerade (`file`/`xxd`) → known-bad hash (`sha256sum`) |
| `[ ]` ~ch10 | L2-3 | The Floppy | **Dennis Rader / BTK**, 2005 | recover deleted `.doc` → document metadata author/org → OSINT pivot → MAC-time timeline |
| `[ ]` ~ch14 | L4-5 | Insider Wipe | **Roger Duronio / UBS PaineWebber**, 2002 | filesystem timeline → deleted logic-bomb script → scheduled-task artifact |
| `[ ]` ~ch18 | L6 | The Worm in RAM | Zeus / WannaCry family (Lazarus, DOJ indictment) | memory image → malicious process → network IOC → hash to known family |
| `[ ]` ~ch22 | L7 | Botnet Takedown | **Mirai**, Jha/White/Norman, 2016 (convicted) | pcap → C2 beacon → DNS → binary strings → attribution |
| `[ ]` capstone | L8-10 | Dread Pirate | **Ross Ulbricht / Silk Road**, 2013 | forum username "altoid" → email → reused "frosty" handle → server image → laptop |

## Alternates (bench)

- **John McAfee**, 2012 — EXIF GPS in a Vice photo (reinforces EXIF Hunt).
- **Robert Tappan Morris**, 1988 — first CFAA felony; worm propagation (network/history).
- **Bitfinex / Lichtenstein & Morgan "Razzlekhan"**, 2016 hack, 2022 arrest — blockchain tracing (crypto layer).
- **Guccifer 2.0 / GRU**, 2016 — document metadata + language artifacts (attribution).
- **229 dark-web vendors**, Harvard study — EXIF at scale (reinforcement).

## Rule

Every Caso uses ONLY tools introduced in chapters with `id <= afterChapter`.
If a desired pivot needs an untaught tool, either pick a different case or move
the Caso later. The chain is the exam; the chapter is the lesson.
