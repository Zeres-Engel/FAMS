#!/usr/bin/env python3
"""
Script to fix the invalid import statements in model files
"""
import os

def fix_imports(directory):
    """Fix the imports in all Python files in the directory"""
    for filename in os.listdir(directory):
        if filename.endswith(".py"):
            filepath = os.path.join(directory, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Replace the problematic import
            fixed_content = content.replace("from ..nstants import", "from ..constants import")
            
            # Write the fixed content back to the file
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(fixed_content)
            
            print(f"Fixed {filepath}")

if __name__ == "__main__":
    models_dir = "src/models"
    fix_imports(models_dir)
    print("Done!") 