#!/usr/bin/env python3
"""Generate synthetic, inert evidence for Caso #1 (EXIF Hunt — inspired by the real
Higinio Ochoa 'w0rmer' case, 2012). Solvable with installed tools: strings, file,
xxd, grep, sha256sum. No real personal data; everything here is fabricated."""
import hashlib, os, struct, zlib

ROOT = os.path.join(os.path.dirname(__file__), "..", "evidence", "caso01")
os.makedirs(ROOT, exist_ok=True)


def make_png(width=320, height=200, rgb=(20, 30, 24)):
    """Build a minimal valid PNG from scratch (no external libs)."""
    def chunk(typ, data):
        c = typ + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)  # 8-bit RGB
    raw = bytearray()
    for _y in range(height):
        raw.append(0)  # filter: none
        raw += bytes(rgb) * width
    idat = zlib.compress(bytes(raw), 9)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


def write(name, data):
    p = os.path.join(ROOT, name)
    with open(p, "wb") as f:
        f.write(data)
    return p


# --- Step 1 evidence: the leaked photo with data hidden AFTER the PNG IEND end marker.
# A real iPhone wrote GPS into EXIF; here we plant a readable trailer (teaches "data after EOF").
png = make_png()
trailer = (
    b"\n--EXIF-LEAK--\n"
    b"DeviceModel=iPhone 4\n"
    b"DateTimeOriginal=2012:03:12 22:14:08\n"
    b"GPSPosition=37.8136 S, 145.2200 E\n"   # Wantirna South area, Melbourne (fabricated precision)
    b"Artist=w0rmer\n"
    b"Software=CabinCr3w\n"
    b"--END--\n"
)
write("leak.jpg", png + trailer)  # named .jpg on purpose; 'file' will say PNG (masquerade)

# --- Step 2 evidence: a handle dump linking the alias to a forum identity (the reuse pivot).
handles = (
    "# scraped account handles (OSINT dump)\n"
    "twitter:Anibalww    -> ?\n"
    "twitter:w0rmer      -> reused on irc.anonops + forum:CabinCr3w\n"
    "irc:w0rmer          -> email on file: see members.txt\n"
    "twitter:sabu        -> (unrelated)\n"
)
write("handles.txt", handles.encode())

write(
    "members.txt",
    ("# forum member export (fabricated for training)\n"
     "user=w0rmer  joined=2011  email=w0rmer.cc@example.invalid  note=poss. real name Higinio O.\n"
     "user=neuron  joined=2010  email=neuron@example.invalid\n").encode(),
)

# --- Step 3 evidence: a file masquerading by extension (file/xxd reveal the truth).
write("avatar.dat", make_png(rgb=(40, 0, 0)))  # really a PNG, not .dat

# --- Step 4 evidence: a known-bad hash list; one local file matches it (confirms the toolkit).
dropper = b"#!/bin/sh\n# defacement uploader (inert training stub)\necho CabinCr3w was here\n"
write("dropper.bin", dropper)
dropper_sha = hashlib.sha256(dropper).hexdigest()
hashes = (
    "# known-bad SHA-256 manifest (training)\n"
    f"{dropper_sha}  cabincr3w_uploader\n"
    "0000000000000000000000000000000000000000000000000000000000000000  placeholder\n"
)
write("hashes.txt", hashes.encode())

# --- Case brief shown in the terminal directory.
write(
    "BRIEF.txt",
    ("CASE 01 - EXIF HUNT\n"
     "A defacement crew taunted police on Twitter with a photo. You have the leaked\n"
     "image and some OSINT dumps. Identify the actor and where the photo was taken.\n"
     "Tools you know: strings, file, xxd, grep, sha256sum. Do NOT modify originals.\n").encode(),
)

print("Generated in", os.path.realpath(ROOT))
print("dropper.bin sha256:", dropper_sha)
for fn in sorted(os.listdir(ROOT)):
    print(" -", fn, os.path.getsize(os.path.join(ROOT, fn)), "bytes")
