#!/bin/bash

# PTV-LML Setup Script
# This script installs dependencies and starts the development server

echo "Setting up PTV-LML..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to install dependencies."
  exit 1
fi

echo "Dependencies installed successfully."

# Start the development server
echo "Starting development server..."
echo "The application will be available at http://localhost:3000"
npm run dev
