# Layer 6 — Memory (RAM) Forensics

**Status:** skeleton (0%)
**Source books:** Ligh, Case, Levy, Walters *The Art of Memory Forensics* ·
Ostrovskaya & Skulkin *Practical Memory Forensics* · Ligh et al. *Malware Analyst's Cookbook*

> CURRENCY: the AMF book teaches Volatility 2. Write all labs against **Volatility 3**
> syntax (it replaced Vol2 in April 2025). Verify plugin names against current docs.

Coverage checklist (TOC-derived):

- [ ] Why memory matters; what lives only in RAM
- [ ] Memory acquisition (winpmem, LiME, AVML); order of volatility
- [ ] Address spaces & profiles/symbols (ISF in Vol3)
- [ ] Processes & DLLs: pslist, pstree, psscan, dlllist
- [ ] Network connections: netscan / netstat
- [ ] Code injection & hooks: malfind, ldrmodules, apihooks
- [ ] Handles, registry in memory, cmdline, environment
- [ ] Detecting rootkits & hidden processes
- [ ] Extracting artifacts: procdump, memdump, dumpfiles
- [ ] Linux & macOS memory analysis specifics
