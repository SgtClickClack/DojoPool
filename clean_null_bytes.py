# Script to clean null bytes and fix encoding
with open('Dojo_Pool.py', 'rb') as f:
    data = f.read()

# Replace null bytes and attempt to decode as UTF-8, ignoring invalid characters
clean_data = data.replace(b'\x00', b'').decode('utf-8', 'ignore')

# Write the cleaned data back to the file, ensuring proper UTF-8 encoding
with open('Dojo_Pool_cleaned.py', 'w', encoding='utf-8') as f:
    f.write(clean_data)
