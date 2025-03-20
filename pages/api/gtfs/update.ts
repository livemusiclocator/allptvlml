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
  
  console.log(`Executing GTFS update script: ${scriptPath}`);
  
  exec(`node ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`GTFS update error: ${error.message}`);
      return res.status(500).json({ 
        error: error.message, 
        stdout, 
        stderr 
      });
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