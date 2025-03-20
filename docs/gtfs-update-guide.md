# GTFS Data Update Guide

This document outlines the process for keeping GTFS (General Transit Feed Specification) data up to date in the PTV-LML application.

## Overview

GTFS data is typically published by transit agencies on a regular schedule (daily, weekly, or monthly). To ensure our application has the most current transit information, we need to implement a system to regularly update our GTFS data.

## Implementation Plan

### 1. Automated Download Script

Create a script (`update-gtfs.js`) in the project root that will:

```javascript
// update-gtfs.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');

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

// Create directories if they don't exist
GTFS_SOURCES.forEach(source => {
  const dir = path.dirname(source.localPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Function to download a file
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${url} to ${destination}`);
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
    exec(`unzip -t ${filePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Validation error for ${filePath}: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`Validation stderr for ${filePath}: ${stderr}`);
        reject(new Error(stderr));
        return;
      }
      
      // Check if the required files exist in the zip
      const requiredFiles = ['routes.txt', 'stops.txt', 'trips.txt', 'stop_times.txt'];
      let allFilesExist = true;
      
      for (const file of requiredFiles) {
        if (!stdout.includes(file)) {
          console.error(`Missing required file in ${filePath}: ${file}`);
          allFilesExist = false;
        }
      }
      
      if (!allFilesExist) {
        reject(new Error(`GTFS zip file is missing required files: ${filePath}`));
        return;
      }
      
      console.log(`Validated GTFS file: ${filePath}`);
      resolve();
    });
  });
}

// Main function to update all GTFS sources
async function updateGTFSSources() {
  console.log('Starting GTFS update process...');
  
  for (const source of GTFS_SOURCES) {
    try {
      console.log(`Updating ${source.name} GTFS data...`);
      
      // Backup the existing file if it exists
      if (fs.existsSync(source.localPath)) {
        const backupPath = `${source.localPath}.backup`;
        fs.copyFileSync(source.localPath, backupPath);
        console.log(`Backed up existing file to ${backupPath}`);
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
          console.log(`Restored backup for ${source.name} due to validation failure`);
        }
        throw validationError;
      }
      
      console.log(`Successfully updated ${source.name} GTFS data`);
    } catch (error) {
      console.error(`Error updating ${source.name} GTFS data:`, error);
    }
  }
  
  console.log('GTFS update process completed');
}

// Run the update process
updateGTFSSources().catch(error => {
  console.error('GTFS update process failed:', error);
  process.exit(1);
});
```

### 2. Scheduled Updates

#### Option 1: Using cron (for Linux/macOS servers)

Add a cron job to run the update script regularly:

```bash
# Edit crontab
crontab -e

# Add a line to run the script daily at 3 AM
0 3 * * * cd /path/to/ptv-lml && node update-gtfs.js >> logs/gtfs-update.log 2>&1
```

#### Option 2: Using Windows Task Scheduler (for Windows servers)

Create a scheduled task to run the update script:

```powershell
# Create a scheduled task
schtasks /create /tn "Update GTFS Data" /tr "node C:\path\to\ptv-lml\update-gtfs.js" /sc daily /st 03:00
```

#### Option 3: Using a CI/CD pipeline

If you're using a CI/CD pipeline (e.g., GitHub Actions, GitLab CI, Jenkins), you can add a job to run the update script:

```yaml
# GitHub Actions example (.github/workflows/update-gtfs.yml)
name: Update GTFS Data

on:
  schedule:
    # Run daily at 3 AM UTC
    - cron: '0 3 * * *'
  workflow_dispatch:  # Allow manual triggering

jobs:
  update-gtfs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run GTFS update script
        run: node update-gtfs.js
        
      - name: Commit and push changes
        run: |
          git config --global user.name 'GTFS Update Bot'
          git config --global user.email 'bot@example.com'
          git add gtfs/
          git commit -m "Update GTFS data" || echo "No changes to commit"
          git push
```

### 3. Version Control and Monitoring

#### Track GTFS Data Versions

Create a JSON file to track GTFS data versions:

```javascript
// gtfs/versions.json
{
  "lastUpdated": "2023-03-20T03:00:00Z",
  "sources": [
    {
      "name": "SkyBus",
      "routeType": 5,
      "version": "2023-03-15",
      "fileSize": 1234567,
      "fileHash": "abc123def456"
    },
    {
      "name": "Night Bus",
      "routeType": 4,
      "version": "2023-03-10",
      "fileSize": 7654321,
      "fileHash": "xyz789uvw456"
    }
  ]
}
```

Update this file as part of the update process:

```javascript
// Add to update-gtfs.js
const crypto = require('crypto');

function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

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
  console.log(`Updated versions file: ${versionsPath}`);
}

// Call this function at the end of updateGTFSSources()
```

#### Monitoring and Alerts

Implement monitoring to alert when GTFS updates fail:

```javascript
// Add to update-gtfs.js
function sendAlertEmail(subject, message) {
  // This is a placeholder - implement using your preferred email service
  console.log(`ALERT: ${subject}`);
  console.log(message);
  
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

// Add error handling with alerts
async function updateGTFSSources() {
  console.log('Starting GTFS update process...');
  let hasErrors = false;
  let errorMessages = [];
  
  for (const source of GTFS_SOURCES) {
    try {
      // ... existing code ...
    } catch (error) {
      hasErrors = true;
      const errorMessage = `Error updating ${source.name} GTFS data: ${error.message}`;
      errorMessages.push(errorMessage);
      console.error(errorMessage);
    }
  }
  
  // Update versions file
  updateVersionsFile();
  
  // Send alert if there were errors
  if (hasErrors) {
    sendAlertEmail(
      'GTFS Update Errors',
      `The following errors occurred during GTFS update:\n\n${errorMessages.join('\n\n')}`
    );
  }
  
  console.log('GTFS update process completed');
}
```

### 4. API Endpoint for GTFS Status

Create an API endpoint to check GTFS data status:

```javascript
// pages/api/gtfs/status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const versionsPath = path.join(process.cwd(), 'gtfs', 'versions.json');
    
    if (!fs.existsSync(versionsPath)) {
      return res.status(404).json({ error: 'GTFS versions file not found' });
    }
    
    const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));
    
    // Add additional information
    const now = new Date();
    const lastUpdated = new Date(versions.lastUpdated);
    const daysSinceUpdate = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
    
    versions.daysSinceUpdate = daysSinceUpdate;
    versions.status = daysSinceUpdate > 7 ? 'outdated' : 'current';
    
    return res.status(200).json(versions);
  } catch (error) {
    console.error('Error getting GTFS status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 5. Admin Interface for Manual Updates

Create a simple admin interface to trigger manual updates:

```javascript
// pages/admin/gtfs.tsx
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Head from 'next/head';

export default function GTFSAdmin() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    fetchStatus();
  }, []);
  
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gtfs/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setMessage(`Error fetching GTFS status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const triggerUpdate = async () => {
    try {
      setUpdating(true);
      setMessage('Updating GTFS data...');
      
      const response = await fetch('/api/gtfs/update', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('GTFS data updated successfully');
        fetchStatus(); // Refresh status
      } else {
        setMessage(`Error updating GTFS data: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Error updating GTFS data: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };
  
  return (
    <Layout>
      <Head>
        <title>PTV-LML | GTFS Admin</title>
      </Head>
      
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">GTFS Data Management</h1>
        
        {loading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ptv-blue"></div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">GTFS Status</h2>
              
              {status && (
                <div className="bg-gray-100 p-4 rounded-md">
                  <p>Last Updated: {new Date(status.lastUpdated).toLocaleString()}</p>
                  <p>Days Since Update: {status.daysSinceUpdate}</p>
                  <p>Status: <span className={status.status === 'current' ? 'text-green-600' : 'text-red-600'}>{status.status}</span></p>
                  
                  <h3 className="text-lg font-semibold mt-4 mb-2">Sources</h3>
                  <ul className="space-y-2">
                    {status.sources.map((source) => (
                      <li key={source.name} className="bg-white p-3 rounded-md shadow-sm">
                        <p className="font-semibold">{source.name} (Route Type: {source.routeType})</p>
                        <p>Version: {source.version}</p>
                        <p>File Size: {Math.round(source.fileSize / 1024)} KB</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Manual Update</h2>
              <button
                className="bg-ptv-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                onClick={triggerUpdate}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update GTFS Data Now'}
              </button>
              
              {message && (
                <p className="mt-2 text-sm text-gray-700">{message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
```

Create the corresponding API endpoint:

```javascript
// pages/api/gtfs/update.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import path from 'path';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Execute the update script
  const scriptPath = path.join(process.cwd(), 'update-gtfs.js');
  
  exec(`node ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`GTFS update error: ${error.message}`);
      return res.status(500).json({ error: error.message, stdout, stderr });
    }
    
    if (stderr) {
      console.error(`GTFS update stderr: ${stderr}`);
    }
    
    console.log(`GTFS update stdout: ${stdout}`);
    
    return res.status(200).json({ 
      message: 'GTFS update completed successfully',
      output: stdout
    });
  });
}
```

## Best Practices for GTFS Updates

1. **Regular Schedule**: Update GTFS data on a consistent schedule, ideally daily or weekly.

2. **Validation**: Always validate GTFS data before using it in production.

3. **Backup**: Keep backups of previous GTFS data in case new data is corrupted.

4. **Versioning**: Track versions of GTFS data to identify changes.

5. **Monitoring**: Implement monitoring to detect and alert on update failures.

6. **Graceful Degradation**: If GTFS data can't be updated, fall back to the most recent valid data.

7. **Incremental Updates**: For large GTFS datasets, consider implementing incremental updates.

## Troubleshooting

### Common Issues

1. **Download Failures**: Check network connectivity and URL validity.

2. **Validation Failures**: Ensure the GTFS zip file contains all required files.

3. **Parsing Errors**: Check for malformed CSV data in the GTFS files.

4. **Memory Issues**: For large GTFS files, consider using streaming approaches.

### Debugging

1. Check the logs in `logs/gtfs-update.log`.

2. Manually run the update script with verbose logging:
   ```bash
   node update-gtfs.js --verbose
   ```

3. Inspect the GTFS zip file contents:
   ```bash
   unzip -l gtfs/5/google_transit.zip
   ```

4. Validate individual GTFS files:
   ```bash
   unzip -p gtfs/5/google_transit.zip routes.txt | head -10
   ```

## Conclusion

By implementing this GTFS update system, you'll ensure that your application always has the most current transit data available. Regular updates, combined with proper validation and monitoring, will provide a reliable foundation for your transit application.