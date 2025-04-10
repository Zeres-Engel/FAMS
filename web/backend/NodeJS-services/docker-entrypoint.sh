#!/bin/sh
set -e

echo "==== FAMS BACKEND STARTUP SCRIPT ===="
echo "NOTE: This script no longer initializes the database automatically."
echo "      To initialize the database manually, run: npm run init-db"

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
MAX_RETRIES=30
COUNT=0

while [ $COUNT -lt $MAX_RETRIES ]; do
  COUNT=$((COUNT+1))
  echo "MongoDB connection attempt $COUNT of $MAX_RETRIES..."
  
  # Try to connect to MongoDB
  if node -e "
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    }).then(() => {
      console.log('Successfully connected to MongoDB');
      mongoose.connection.close();
      process.exit(0);
    }).catch(err => {
      console.error('Failed to connect to MongoDB:', err);
      process.exit(1);
    });
  "; then
    echo "MongoDB is ready!"
    break
  fi
  
  if [ $COUNT -eq $MAX_RETRIES ]; then
    echo "Could not connect to MongoDB after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  
  echo "Waiting 2 seconds before next attempt..."
  sleep 2
done

# Start the application
echo "Starting application..."
exec "$@" 