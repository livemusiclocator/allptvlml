#!/bin/bash

# PTV-LML Deployment Script
# This script builds and deploys the application to GitHub Pages

echo "Deploying PTV-LML to GitHub Pages..."

# Build the application
echo "Building the application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "Error: Build failed."
  exit 1
fi

echo "Build completed successfully."

# Export the application as static HTML
echo "Exporting as static HTML..."
npm run export

# Check if export was successful
if [ $? -ne 0 ]; then
  echo "Error: Export failed."
  exit 1
fi

echo "Export completed successfully."

# Create .nojekyll file to disable Jekyll processing
echo "Creating .nojekyll file..."
touch out/.nojekyll

# Deploy to GitHub Pages
echo "Deploying to GitHub Pages..."
npx gh-pages -d out

# Check if deployment was successful
if [ $? -ne 0 ]; then
  echo "Error: Deployment failed."
  exit 1
fi

echo "Deployment completed successfully."
echo "Your application should be available at https://yourusername.github.io/ptv-lml/"
echo "Note: Replace 'yourusername' with your actual GitHub username."
