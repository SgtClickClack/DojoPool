import os
import hashlib
import sys

def hash_file(path, block_size=65536):
    """
    Generates an MD5 hash for the given file.
    
    :param path: File path.
    :param block_size: Block size for reading the file.
    :return: MD5 hash string.
    """
    hasher = hashlib.md5()
    with open(path, 'rb') as file:
        buf = file.read(block_size)
        while buf:
            hasher.update(buf)
            buf = file.read(block_size)
    return hasher.hexdigest()

def find_duplicates(directory):
    """
    Traverse the directory and identify duplicate files based on content hash.
    
    :param directory: The root directory to search for duplicates.
    :return: A list of tuples (duplicate_file_path, original_file_path).
    """
    hashes = {}
    duplicates = []
    for root, _, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                file_hash = hash_file(file_path)
                if file_hash in hashes:
                    duplicates.append((file_path, hashes[file_hash]))
                else:
                    hashes[file_hash] = file_path
            except Exception as e:
                print(f"Error processing {file_path}: {e}")
    return duplicates

if __name__ == '__main__':
    if len(sys.argv) > 1:
        target_dir = sys.argv[1]
    else:
        target_dir = '.'

    duplicates = find_duplicates(target_dir)

    if duplicates:
        print("Found duplicate files:")
        for dup, original in duplicates:
            print(f"Duplicate: {dup}\n\tOriginal: {original}\n")
    else:
        print("No duplicate files found.") 
