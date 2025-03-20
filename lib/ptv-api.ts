import axios from 'axios';
import crypto from 'crypto';

// For browser compatibility
let cryptoJsImported = false;
let CryptoJS: any = null;

// Function to dynamically import crypto-js in browser environments
async function importCryptoJS() {
  if (typeof window !== 'undefined' && !cryptoJsImported) {
    try {
      // This is a placeholder - in a real implementation, you would need to install crypto-js
      // and import it properly. This is just to illustrate the concept.
      console.log('Would import crypto-js here in a real implementation');
      cryptoJsImported = true;
    } catch (error) {
      console.error('Failed to import crypto-js:', error);
    }
  }
}

// PTV API configuration
const PTV_BASE_URL = 'https://timetableapi.ptv.vic.gov.au';
const DEV_ID = process.env.NEXT_PUBLIC_PTV_DEV_ID;
// Use NEXT_PUBLIC_PTV_API_KEY if available, otherwise fall back to PTV_API_KEY
const API_KEY = process.env.NEXT_PUBLIC_PTV_API_KEY || process.env.PTV_API_KEY;

// For debugging
console.log('PTV API Configuration:');
console.log('DEV_ID:', DEV_ID);
console.log('API_KEY exists:', !!API_KEY);

// Error handling
class PTVApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'PTVApiError';
    this.status = status;
  }
}

/**
 * Generate the HMAC signature required for PTV API authentication
 * @param request The API request path including query parameters
 * @returns The HMAC signature
 */
async function generateSignature(request: string): Promise<string> {
  console.log('Generating signature for request:', request);
  
  if (!API_KEY) {
    console.error('API Key is not defined');
    throw new Error('PTV API key is not defined');
  }
  
  if (!DEV_ID) {
    console.error('Developer ID is not defined');
    throw new Error('PTV Developer ID is not defined');
  }
  
  // Create the request with devid parameter
  let requestWithDevId: string;
  
  // Check if the request already has the devid parameter
  if (request.includes('devid=')) {
    console.log('Request already has devid parameter, using as is');
    requestWithDevId = request;
  } else {
    // Add the devid parameter if it's not already there
    requestWithDevId = request + (request.includes('?') ? '&' : '?') + 'devid=' + DEV_ID;
  }
  
  console.log('Request with DevID:', requestWithDevId);
  
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      console.log('Running in browser environment');
      
      // Use SubtleCrypto API which is available in modern browsers
      try {
        console.log('Attempting to use SubtleCrypto API');
        
        // Convert API key to ArrayBuffer
        const encoder = new TextEncoder();
        const keyData = encoder.encode(API_KEY);
        const messageData = encoder.encode(requestWithDevId);
        
        // Import the key
        const cryptoKey = await window.crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-1' },
          false,
          ['sign']
        );
        
        // Sign the message
        const signature = await window.crypto.subtle.sign(
          'HMAC',
          cryptoKey,
          messageData
        );
        
        // Convert to hex string
        const hashArray = Array.from(new Uint8Array(signature));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const finalSignature = hashHex.toUpperCase();
        console.log('Generated signature using SubtleCrypto:', finalSignature.substring(0, 6) + '...');
        return finalSignature;
      } catch (browserError) {
        console.error('SubtleCrypto failed:', browserError);
        console.log('Falling back to server-side implementation');
        // Fall back to server-side implementation
      }
    }
    
    // Server-side implementation using Node.js crypto
    const key = Buffer.from(API_KEY, 'utf-8');
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(requestWithDevId);
    const signature = hmac.digest('hex').toUpperCase();
    console.log('Generated signature using Node.js crypto:', signature.substring(0, 6) + '...');
    return signature;
  } catch (error) {
    console.error('Error generating signature:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw new Error(`Failed to generate signature: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Make a request to the PTV API
 * @param endpoint The API endpoint to call
 * @param params Optional query parameters
 * @returns The API response data
 */
export async function ptvApiRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  console.log(`PTV API Request - Endpoint: ${endpoint}`);
  
  if (!DEV_ID) {
    console.error('PTV API Error: Developer ID is not defined');
    throw new Error('PTV Developer ID is not defined');
  }
  
  // Build the query string from params
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, String(value));
  });
  
  // Build the request path without adding devid yet
  // We'll add it in the generateSignature function to avoid duplication
  const requestPath = endpoint + (Object.keys(params).length > 0 ? '?' + queryParams.toString() : '');
  console.log(`Request Path (before devid): ${requestPath}`);
  console.log(`Using Developer ID: ${DEV_ID.substring(0, 3)}...`); // Log partial ID for debugging
  
  try {
    // Generate signature - now awaiting the async function
    const signature = await generateSignature(requestPath);
    console.log(`Generated Signature: ${signature.substring(0, 6)}...`); // Log partial signature
    
    // Add devid and signature to query params
    queryParams.append('devid', DEV_ID);
    queryParams.append('signature', signature);
    
    // Build the full URL
    const url = `${PTV_BASE_URL}${endpoint}?${queryParams.toString()}`;
    console.log(`Full API URL: ${url}`);
    
    console.log('Sending API request...');
    const response = await axios.get<T>(url);
    console.log('API Response received:', {
      status: response.status,
      statusText: response.statusText,
      dataSize: JSON.stringify(response.data).length
    });
    
    return response.data;
  } catch (error) {
    console.error('PTV API Request failed:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('Axios Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      if (error.response) {
        throw new PTVApiError(
          `PTV API error: ${error.response.status} ${error.response.statusText}`,
          error.response.status
        );
      }
    }
    
    throw new Error(`PTV API request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// API endpoints

/**
 * Get all route types (train, tram, bus, etc.)
 */
export async function getRouteTypes() {
  return ptvApiRequest('/v3/route_types');
}

/**
 * Get all routes for a specific route type
 * @param routeType The route type ID
 */
export async function getRoutesByType(routeType: number) {
  return ptvApiRequest('/v3/routes', { route_types: routeType });
}

/**
 * Get directions for a specific route
 * @param routeId The route ID
 */
export async function getRouteDirections(routeId: number) {
  return ptvApiRequest(`/v3/directions/route/${routeId}`);
}

/**
 * Get stops for a specific route and route type
 * @param routeId The route ID
 * @param routeType The route type ID
 * @param directionId Optional direction ID
 */
export async function getRouteStops(routeId: number, routeType: number, directionId?: number) {
  const params: Record<string, string | number> = {};
  if (directionId !== undefined) {
    params.direction_id = directionId;
  }
  
  return ptvApiRequest(`/v3/stops/route/${routeId}/route_type/${routeType}`, params);
}

/**
 * Get details for a specific stop
 * @param stopId The stop ID
 * @param routeType The route type ID
 */
export async function getStopDetails(stopId: number, routeType: number) {
  return ptvApiRequest(`/v3/stops/${stopId}/route_type/${routeType}`, {
    stop_location: "true",
    stop_amenities: "true",
    stop_accessibility: "true"
  });
}

/**
 * Get departures for a specific stop
 * @param stopId The stop ID
 * @param routeType The route type ID
 * @param routeId Optional route ID
 * @param directionId Optional direction ID
 * @param maxResults Optional maximum number of results
 */
export async function getDepartures(
  stopId: number,
  routeType: number,
  routeId?: number,
  directionId?: number,
  maxResults?: number
) {
  const params: Record<string, string | number> = {};
  
  if (directionId !== undefined) {
    params.direction_id = directionId;
  }
  
  if (maxResults !== undefined) {
    params.max_results = maxResults;
  }
  
  // Include expanded data
  params.expand = 'All';
  
  const endpoint = routeId
    ? `/v3/departures/route_type/${routeType}/stop/${stopId}/route/${routeId}`
    : `/v3/departures/route_type/${routeType}/stop/${stopId}`;
  
  return ptvApiRequest(endpoint, params);
}
