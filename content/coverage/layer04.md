# Layer 4 — File Systems & Disk Analysis

**Status:** skeleton (0%)
**Source books:** Carrier *File System Forensic Analysis* · Altheide & Carvey *Digital
Forensics with Open Source Tools* · Sammes & Jenkinson *Forensic Computing*

Coverage checklist (TOC-derived):

- [ ] Volume analysis: partition tables (MBR, GPT), mmls
- [ ] The five-layer model: disk, volume, file, metadata, application
- [ ] FAT internals (boot sector, FAT, directory entries)
- [ ] NTFS internals (MFT, attributes, $LogFile, ADS)
- [ ] ext2/3/4 internals (superblock, inodes, journaling)
- [ ] The Sleuth Kit workflow: mmls, fsstat, fls, istat, icat
- [ ] Deleted file recovery & unallocated space
- [ ] File carving (foremost, scalpel, bulk_extractor)
- [ ] Slack space and data hiding
- [ ] Timeline generation (mactime, log2timeline/plaso)
- [ ] Keyword & hash searching across an image
