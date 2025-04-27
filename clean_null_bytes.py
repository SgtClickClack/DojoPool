input_path = "src/dojopool/core/backend/Dojo_Pool.py"
output_path = "src/dojopool/core/backend/Dojo_Pool_cleaned.py"

with open(input_path, "rb") as f:
    raw = f.read()

# Aggressively remove all null bytes
raw = raw.replace(b"\x00", b"")

# Decode as UTF-8, ignore errors
text = raw.decode("utf-8", errors="ignore")
if text.startswith("\ufeff"):
    text = text.lstrip("\ufeff")  # Remove BOM if present

with open(output_path, "w", encoding="utf-8", newline='\n') as f:
    f.write(text)

print("Aggressively cleaned file written to", output_path)
