#!/bin/bash

# Fix the invalid import statements in all model files
find src/models/ -name "*.py" -exec sed -i 's/from \.\.\nstants import COLLECTIONS/from ..constants import COLLECTIONS/g' {} \;

echo "Fixed import statements in model files." 