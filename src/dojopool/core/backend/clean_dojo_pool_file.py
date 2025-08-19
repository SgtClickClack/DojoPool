import codecs
import os

SRC = "Dojo_Pool.py"
DST = "Dojo_Pool_cleaned.py"

with open(SRC, "rb") as f:
    data = f.read()

# Remove BOM if present
if data.startswith(codecs.BOM_UTF8):
    data = data[len(codecs.BOM_UTF8):]

# Remove null bytes and convert line endings to LF
clean_data = data.replace(b"\x00", b"").replace(b"\r\n", b"\n").replace(b"\r", b"\n")

with open(DST, "wb") as f:
    f.write(clean_data)

print(f"Cleaned file written to {DST}. Please replace the original file if all looks good.")
