#!/usr/bin/env node
/**
 * GTFS Update Script
 * 
 * This script downloads and updates GTFS data for the PTV-LML application.
 * It handles downloading, validation, and versioning of GTFS data.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const crypto = require('crypto');

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');

// Configuration
const GTFS_SOURCES = [
  {
    name: 'SkyBus',
    routeType: 5,
    url: 'https://data.ptv.vic.gov.au/downloads/gtfs/SkyBus.zip',
    localPath: path.join(__dirname, 'gtfs', '5', 'google_transit.zip')
  },
  {
    name: 'Night Bus',
    routeType: 4,
    url: 'https://data.ptv.vic.gov.au/downloads/gtfs/NightBus.zip',
    localPath: path.join(__dirname, 'gtfs', '4', 'google_transit.zip')
  }
  // Add other route types as needed
];

// Create log directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  log(`Created log directory: ${logDir}`);
}

// Set up logging
const logFile = path.join(logDir, `gtfs-update-${new Date().toISOString().split('T')[0]}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Create directories if they don't exist
GTFS_SOURCES.forEach(source => {
  const dir = path.dirname(source.localPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`);
  }
});

// Function to download a file
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    log(`Downloading ${url} to ${destination}...`);
    
    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        log(`Downloaded ${url} to ${destination}`);
        resolve();
      });
    }).on('error', err => {
      fs.unlink(destination, () => {}); // Delete the file on error
      reject(err);
    });
    
    file.on('error', err => {
      fs.unlink(destination, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Function to validate a GTFS zip file
function validateGTFSFile(filePath) {
  return new Promise((resolve, reject) => {
    log(`Validating GTFS file: ${filePath}`);
    
    exec(`unzip -t ${filePath}`, (error, stdout, stderr) => {
      if (error) {
        log(`Validation error for ${filePath}: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        log(`Validation stderr for ${filePath}: ${stderr}`);
        reject(new Error(stderr));
        return;
      }
      
      if (verbose) {
        log(`Validation output for ${filePath}:\n${stdout}`);
      }
      
      // Check if the required files exist in the zip
      const requiredFiles = ['routes.txt', 'stops.txt', 'trips.txt', 'stop_times.txt'];
      let allFilesExist = true;
      
      for (const file of requiredFiles) {
        if (!stdout.includes(file)) {
          log(`Missing required file in ${filePath}: ${file}`);
          allFilesExist = false;
        }
      }
      
      if (!allFilesExist) {
        reject(new Error(`GTFS zip file is missing required files: ${filePath}`));
        return;
      }
      
      log(`Validated GTFS file: ${filePath}`);
      resolve();
    });
  });
}

// Function to get file hash
function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Function to update versions file
function updateVersionsFile() {
  const versionsPath = path.join(__dirname, 'gtfs', 'versions.json');
  let versions = {
    lastUpdated: new Date().toISOString(),
    sources: []
  };
  
  // Load existing versions file if it exists
  if (fs.existsSync(versionsPath)) {
    versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));
  }
  
  // Update the versions for each source
  for (const source of GTFS_SOURCES) {
    if (fs.existsSync(source.localPath)) {
      const stats = fs.statSync(source.localPath);
      const fileHash = getFileHash(source.localPath);
      
      // Find or create the source entry
      let sourceEntry = versions.sources.find(s => s.name === source.name);
      if (!sourceEntry) {
        sourceEntry = { name: source.name, routeType: source.routeType };
        versions.sources.push(sourceEntry);
      }
      
      // Update the source entry
      sourceEntry.version = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      sourceEntry.fileSize = stats.size;
      sourceEntry.fileHash = fileHash;
    }
  }
  
  // Save the updated versions file
  fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2));
  log(`Updated versions file: ${versionsPath}`);
  
  return versions;
}

// Function to send alert email
function sendAlertEmail(subject, message) {
  // This is a placeholder - implement using your preferred email service
  log(`ALERT: ${subject}`);
  log(message);
  
  // Example using nodemailer:
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransport({...});
  // transporter.sendMail({
  //   from: 'alerts@example.com',
  //   to: 'admin@example.com',
  //   subject,
  //   text: message
  // });
}

// Main function to update all GTFS sources
async function updateGTFSSources() {
  log('Starting GTFS update process...');
  let hasErrors = false;
  let errorMessages = [];
  
  for (const source of GTFS_SOURCES) {
    try {
      log(`Updating ${source.name} GTFS data...`);
      
      // Backup the existing file if it exists
      if (fs.existsSync(source.localPath)) {
        const backupPath = `${source.localPath}.backup`;
        fs.copyFileSync(source.localPath, backupPath);
        log(`Backed up existing file to ${backupPath}`);
      }
      
      // Download the new file
      await downloadFile(source.url, source.localPath);
      
      // Validate the downloaded file
      try {
        await validateGTFSFile(source.localPath);
      } catch (validationError) {
        // If validation fails and we have a backup, restore it
        if (fs.existsSync(`${source.localPath}.backup`)) {
          fs.copyFileSync(`${source.localPath}.backup`, source.localPath);
          log(`Restored backup for ${source.name} due to validation failure`);
        }
        throw validationError;
      }
      
      log(`Successfully updated ${source.name} GTFS data`);
    } catch (error) {
      hasErrors = true;
      const errorMessage = `Error updating ${source.name} GTFS data: ${error.message}`;
      errorMessages.push(errorMessage);
      log(errorMessage);
    }
  }
  
  // Update versions file
  const versions = updateVersionsFile();
  
  // Send alert if there were errors
  if (hasErrors) {
    sendAlertEmail(
      'GTFS Update Errors',
      `The following errors occurred during GTFS update:\n\n${errorMessages.join('\n\n')}`
    );
  }
  
  log('GTFS update process completed');
  
  return {
    success: !hasErrors,
    errors: errorMessages,
    versions
  };
}

// Run the update process
updateGTFSSources().catch(error => {
  log(`GTFS update process failed: ${error}`);
  process.exit(1);
}).finally(() => {
  // Close the log stream
  logStream.end();
});