#!/usr/bin/env python3
import os
import re
import sys

def fix_extra_arrows_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original_content = content

    # 1. Fix function definitions with chained return annotations.
    #    Converts: def func(…):
    #    To:      def func(…) -> Type1:
    content = re.sub(
        r'(def\s+[^(]*\([^)]*\)\s*:]+(:)',
        r'\1\2',
        content
    )

    # 2. Fix "with" statements that erroneously include a return-type arrow.
    #    Converts: with something(…):
    #    To:      with something(…):
    content = re.sub(
        r'(with\s+[^(]+\([^)]*\))\s*->\s*[^:]+(:)',
        r'\1\2',
        content
    )

    # 3. Fix "except" clauses that include an illegal arrow.
    #    Converts: except SomeError as e :
    #    To:      except SomeError as e:
    content = re.sub(
        r'(except\s+[^:]+)\s*->\s*[^:]+:',
        r'\1:',
        content
    )

    # 4. Fix class definitions with a trailing arrow.
    #    Converts: class MyClass:
    #    To:      class MyClass:
    content = re.sub(
        r'(class\s+\w+)\s*->\s*None(:)',
        r'\1\2',
        content
    )

    # 5. Fix dictionary key annotations where stray arrows appear.
    #    This replaces patterns like `"events":,]+',
        r'\1',
        content
    )

    # 6. Fix any odd parameter annotations that insert an arrow before a type.
    #    Example: def start_tournament(self, tournament_id: int):
    #    This pattern attempts to remove the erroneous arrow in the parameter.
    content = re.sub(
        r'(\w+)\s*->\s*None:\s*([^,),]+)',
        r'\1: \2',
        content
    )

    if content != original_content:
        print(f"Fixed file: {filepath}")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

def fix_extra_arrows_in_directory(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            # Only process .py files (modify if you need to include .pyi)
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                fix_extra_arrows_in_file(filepath)

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python scripts/fix_extra_arrows.py <directory>")
        sys.exit(1)
    target_dir = sys.argv[1]
    fix_extra_arrows_in_directory(target_dir)
    print("Extra arrow syntax fix complete!")
