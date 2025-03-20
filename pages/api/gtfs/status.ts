import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Define interface for GTFS source
interface GTFSSource {
  name: string;
  routeType: number;
  version: string;
  fileSize: number;
  fileHash: string;
  fileExists?: boolean;
}

// Define interface for GTFS versions
interface GTFSVersions {
  lastUpdated: string;
  sources: GTFSSource[];
  daysSinceUpdate?: number;
  status?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const versionsPath = path.join(process.cwd(), 'gtfs', 'versions.json');
    
    if (!fs.existsSync(versionsPath)) {
      return res.status(404).json({ 
        error: 'GTFS versions file not found',
        message: 'GTFS data has not been initialized yet. Run the update script to initialize GTFS data.'
      });
    }
    
    const versions: GTFSVersions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));
    
    // Add additional information
    const now = new Date();
    const lastUpdated = new Date(versions.lastUpdated);
    const daysSinceUpdate = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
    
    versions.daysSinceUpdate = daysSinceUpdate;
    versions.status = daysSinceUpdate > 7 ? 'outdated' : 'current';
    
    // Check if GTFS files exist
    versions.sources = versions.sources.map((source: GTFSSource) => {
      const routeType = source.routeType;
      const filePath = path.join(process.cwd(), 'gtfs', String(routeType), 'google_transit.zip');
      const fileExists = fs.existsSync(filePath);
      
      return {
        ...source,
        fileExists
      };
    });
    
    return res.status(200).json(versions);
  } catch (error) {
    console.error('Error getting GTFS status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}