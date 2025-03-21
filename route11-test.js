const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');

// Read environment variables from .env file
function loadEnv() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      }
    });
    
    return envVars;
  } catch (err) {
    console.error('Error loading .env file:', err.message);
    return {};
  }
}

const ENV = loadEnv();

// PTV API configuration - using environment variables from .env file
const PTV_BASE_URL = 'https://timetableapi.ptv.vic.gov.au';
const DEV_ID = ENV.NEXT_PUBLIC_PTV_DEV_ID;
const API_KEY = ENV.NEXT_PUBLIC_PTV_API_KEY;

// Route 11 specific constants
const ROUTE_ID = 3343;  // Route ID for number 11 tram
const ROUTE_TYPE = 1;   // Route type for trams
const DIRECTION_TO_DOCKLANDS = 5;  // Direction ID for "To Victoria Harbour Docklands"
const DIRECTION_TO_WEST_PRESTON = 4;  // Direction ID for "To West Preston"

/**
 * Generate the HMAC signature required for PTV API authentication
 * @param request The API request path including query parameters
 * @returns The HMAC signature
 */
function generateSignature(request) {
  if (!API_KEY || !DEV_ID) {
    throw new Error('PTV API key or Developer ID is not defined');
  }
  
  // Create the request with devid parameter
  const requestWithDevId = request + (request.includes('?') ? '&' : '?') + 'devid=' + DEV_ID;
  
  // Generate HMAC signature using Node.js crypto
  const key = Buffer.from(API_KEY, 'utf-8');
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(requestWithDevId);
  return hmac.digest('hex').toUpperCase();
}

/**
 * Make a request to the PTV API
 */
async function ptvApiRequest(endpoint, params = {}) {
  // Build the query string from params
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, String(value));
  });
  
  // Build the request path
  const requestPath = endpoint + (Object.keys(params).length > 0 ? '?' + queryParams.toString() : '');
  console.log(`Request Path: ${requestPath}`);
  
  // Generate signature
  const signature = generateSignature(requestPath);
  
  // Add devid and signature to query params
  queryParams.append('devid', DEV_ID);
  queryParams.append('signature', signature);
  
  // Build the full URL
  const url = `${PTV_BASE_URL}${endpoint}?${queryParams.toString()}`;
  console.log(`Full API URL: ${url}`);
  
  // Send the request
  const response = await axios.get(url);
  return response.data;
}

/**
 * Get all directions for route 11
 */
async function getRoute11Directions() {
  try {
    console.log('Fetching directions for route 11...');
    const response = await ptvApiRequest(`/v3/directions/route/${ROUTE_ID}`);
    
    console.log('\n=== ROUTE 11 DIRECTIONS ===');
    response.directions.forEach(dir => {
      console.log(`Direction ID: ${dir.direction_id} - Name: ${dir.direction_name}`);
    });
    
    return response.directions;
  } catch (error) {
    console.error('Error fetching directions:', error);
    throw error;
  }
}

/**
 * Get stops for route 11 in a specific direction
 */
async function getRoute11Stops(directionId) {
  try {
    const directionName = directionId === DIRECTION_TO_DOCKLANDS ? 'TO DOCKLANDS' : 'TO WEST PRESTON';
    console.log(`\nFetching stops for route 11 in direction: ${directionName} (ID: ${directionId})...`);
    
    // These are the parameters we'll use
    const params = {
      direction_id: directionId,
      include_distance: 'true',
      stop_disruptions: 'false',
      include_geopath: 'false',
      max_results: 1000
    };
    
    const response = await ptvApiRequest(`/v3/stops/route/${ROUTE_ID}/route_type/${ROUTE_TYPE}`, params);
    
    console.log(`\n=== ROUTE 11 STOPS (${directionName}) ===`);
    console.log(`Total stops found: ${response.stops.length}`);
    
    // First, log the raw stops data to see what the API is returning
    console.log('\nRAW STOP DATA (FIRST 3 STOPS):');
    response.stops.slice(0, 3).forEach(stop => {
      console.log(JSON.stringify(stop, null, 2));
    });
    
    // Process and sort stops
    console.log('\nEXTRACTING SEQUENCE INFORMATION...');
    
    const processedStops = response.stops.map(stop => {
      // Create a processed stop object with sequence information
      const processedStop = {
        stop_id: stop.stop_id,
        stop_name: stop.stop_name,
        stop_sequence: stop.stop_sequence,
        stop_latitude: stop.stop_latitude,
        stop_longitude: stop.stop_longitude
      };
      
      // Try to extract sequence from name (e.g., "#47")
      const nameMatch = stop.stop_name.match(/#(\d+)/);
      if (nameMatch) {
        processedStop.name_sequence = parseInt(nameMatch[1]);
        console.log(`Found name sequence in ${stop.stop_name}: #${processedStop.name_sequence}`);
      }
      
      return processedStop;
    });
    
    // Sort stops primarily by stop_sequence
    const sortedStops = [...processedStops].sort((a, b) => {
      // If both have valid stop_sequence, use that
      if (a.stop_sequence && b.stop_sequence) {
        return a.stop_sequence - b.stop_sequence;
      }
      
      // Fall back to name_sequence if available
      if (a.name_sequence && b.name_sequence) {
        return a.name_sequence - b.name_sequence;
      }
      
      // If only one has name_sequence, prioritize it
      if (a.name_sequence) return -1;
      if (b.name_sequence) return 1;
      
      // Default to original order
      return 0;
    });
    
    // Log the sorted stops
    console.log('\nSORTED STOPS:');
    sortedStops.forEach((stop, index) => {
      const seqInfo = [];
      if (stop.stop_sequence) seqInfo.push(`API seq: ${stop.stop_sequence}`);
      if (stop.name_sequence) seqInfo.push(`Name seq: #${stop.name_sequence}`);
      
      console.log(`${index + 1}. ${stop.stop_name} (${seqInfo.join(', ')})`);
    });
    
    return sortedStops;
  } catch (error) {
    console.error('Error fetching stops:', error);
    throw error;
  }
}

/**
 * Run the test for both directions
 */
async function runTest() {
  try {
    console.log('ROUTE 11 TRAM STOP SEQUENCE TEST');
    console.log('===============================\n');
    
    // Verify we have API credentials
    if (!API_KEY || !DEV_ID) {
      console.error('Missing PTV API credentials. Please set NEXT_PUBLIC_PTV_DEV_ID and NEXT_PUBLIC_PTV_API_KEY or PTV_API_KEY environment variables.');
      return;
    }
    
    console.log(`Using DEV_ID: ${DEV_ID}`);
    console.log(`API_KEY is ${API_KEY ? 'set' : 'NOT set'}\n`);
    
    // Get all directions for route 11
    await getRoute11Directions();
    
    // Get stops for direction 5 (To Docklands)
    await getRoute11Stops(DIRECTION_TO_DOCKLANDS);
    
    // Get stops for direction 4 (To West Preston)
    await getRoute11Stops(DIRECTION_TO_WEST_PRESTON);
    
    console.log('\nTest completed successfully.');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();
