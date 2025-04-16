#!/bin/bash

# Fix imports in model files
echo "Fixing imports in model files..."
find src/models -name "*.py" -exec sed -i 's/from src\.constants/from \.\.\constants/g' {} \;

# Fix other absolute imports in model files
echo "Fixing other absolute imports..."
find src/models -name "*.py" -exec sed -i 's/from src\.models/from \./g' {} \;
find src -name "*.py" -exec sed -i 's/from src\.db/from \.db/g' {} \;
find src -name "*.py" -exec sed -i 's/from src\.constants/from \.constants/g' {} \;

echo "Done!" 