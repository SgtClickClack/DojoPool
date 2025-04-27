input_path = "Dojo_Pool.py"
output_path = "Dojo_Pool_cleaned.py"

with open(input_path, "r", encoding="utf-8") as infile:
    lines = infile.readlines()

with open(output_path, "w", encoding="utf-8") as outfile:
    for line in lines:
        outfile.write(line.rstrip() + "\n")

print(f"Trailing whitespace removed. Cleaned file written to {output_path}.")
