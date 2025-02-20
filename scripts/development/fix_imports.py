import os
import re

def fix_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the incorrect import
    content = re.sub(
        r'from flask_caching import cached',
        'from flask_caching import Cache',
        content
    )
    
    # Replace any @cached decorators with @cache.cached()
    content = re.sub(
        r'@cached\(',
        '@cache.cached(',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def walk_and_fix(start_path):
    for root, dirs, files in os.walk(start_path):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        if 'from flask_caching import cached' in f.read():
                            print(f"Fixing imports in {file_path}")
                            fix_imports(file_path)
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    src_path = os.path.join(os.path.dirname(__file__), 'src', 'dojopool')
    walk_and_fix(src_path)
    print("Import fixes completed") 