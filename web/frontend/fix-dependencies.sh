#!/bin/sh

# Install missing dependencies for the project
echo "Installing missing dependencies..."
npm install --save react-big-calendar @types/react-big-calendar moment @mui/icons-material

# Start the development server
echo "Dependencies installed. Starting development server..."
npm start 