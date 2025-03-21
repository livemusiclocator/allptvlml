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
  
  // Direction ID is REQUIRED to get the proper sequence of stops
  if (directionId !== undefined) {
    params.direction_id = directionId;
    console.log(`Getting stops for route ${routeId}, type ${routeType}, direction ${directionId}`);
  } else {
    console.log(`WARNING: No direction_id specified for route ${routeId}. Stops may not be in correct sequence.`);
    // This is problematic - without direction_id, stops won't be in proper sequence
    // but we don't throw an error to maintain compatibility with existing code
  }
  
  // Include stop distance information
  params.include_distance = "true";
  
  // For ALL routes, ensure we get as much ordering info as possible
  console.log(`Requesting stop_sequence information`);
  params.stop_disruptions = "false"; // Reduce response size
  params.include_geopath = "false"; // Reduce response size
  
  // Set max results to a high number to ensure we get all stops
  params.max_results = 1000;
  
  try {
    const response = await ptvApiRequest<{stops: any[]; status: any}>(`/v3/stops/route/${routeId}/route_type/${routeType}`, params);
    
    // Log stop sequence information for debugging
    if (response && response.stops && response.stops.length > 0) {
      const stops = response.stops;
      console.log(`Received ${stops.length} stops with sequence info:`, 
        stops.slice(0, 3).map((s: any) => ({
          id: s.stop_id,
          name: s.stop_name,
          sequence: s.stop_sequence
        }))
      );
    }
    
    return response;
  } catch (error) {
    console.error(`Error fetching stops for route ${routeId}, type ${routeType}:`, error);
    throw error;
  }
}

/**
 * Get details for a specific stop
 * @param stopId The stop ID
 * @param routeType The route type ID
 */
export async function getStopDetails(stopId: number, routeType: number): Promise<PTVStopDetails> {
  return ptvApiRequest<PTVStopDetails>(`/v3/stops/${stopId}/route_type/${routeType}`, {
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

// Define interfaces for PTV API responses
interface PTVJourney {
  journey_id: number;
  journey_name?: string;
  departure_time: string;
  arrival_time: string;
  duration_mins: number;
  legs: any[];
}

interface PTVJourneyResponse {
  journeys: PTVJourney[];
  status: {
    version: string;
    health: number;
  };
}

interface PTVStopDetails {
  stop: {
    stop_id: number;
    stop_name: string;
    stop_latitude: number;
    stop_longitude: number;
    stop_sequence?: number;
    route_type: number;
  };
  status: {
    version: string;
    health: number;
  };
}

/**
 * Get journey details between two stops
 * @param fromStopId The origin stop ID
 * @param toStopId The destination stop ID
 * @param routeType The route type ID
 * @returns Journey details including estimated travel time
 */
export async function getJourneyBetweenStops(
  fromStopId: number,
  toStopId: number,
  routeType: number
): Promise<PTVJourneyResponse> {
  // Current time in Melbourne timezone
  const now = new Date();
  const melbourneTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Melbourne' }));
  
  // Format date and time for API
  const date = melbourneTime.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = melbourneTime.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
  
  return ptvApiRequest<PTVJourneyResponse>('/v3/journey', {
    from_stop_id: fromStopId,
    to_stop_id: toStopId,
    route_types: routeType,
    date,
    time,
    max_results: 1
  });
}

/**
 * Get estimated travel time between two stops
 * @param fromStopId The origin stop ID
 * @param toStopId The destination stop ID
 * @param routeType The route type ID
 * @returns Estimated travel time in minutes
 */
export async function getEstimatedTravelTime(
  fromStopId: number,
  toStopId: number,
  routeType: number
): Promise<number> {
  try {
    const journeyResponse = await getJourneyBetweenStops(fromStopId, toStopId, routeType);
    
    // Extract duration from the first journey in the itinerary
    if (journeyResponse.journeys && journeyResponse.journeys.length > 0) {
      return journeyResponse.journeys[0].duration_mins;
    }
    
    // Fallback to a default calculation if no journey data
    throw new Error('No journey data available');
  } catch (error) {
    console.error('Error getting travel time from PTV API:', error);
    
    // Fallback to a simple estimation based on average speeds
    // This is used if the Journey API fails or returns no results
    return estimateTravelTimeFallback(fromStopId, toStopId, routeType);
  }
}

/**
 * Fallback function to estimate travel time when PTV Journey API fails
 * @param fromStopId The origin stop ID
 * @param toStopId The destination stop ID
 * @param routeType The route type ID
 * @returns Estimated travel time in minutes
 */
async function estimateTravelTimeFallback(
  fromStopId: number,
  toStopId: number,
  routeType: number
): Promise<number> {
  // Average speeds by transport mode (km/h)
  const TRANSPORT_SPEEDS = {
    0: 40, // Train: 40 km/h
    1: 20, // Tram: 20 km/h
    2: 25, // Bus: 25 km/h
    3: 40, // V/Line: 40 km/h
    4: 25, // Night Bus: 25 km/h
    5: 80  // SkyBus: 80 km/h
  };
  
  try {
    // Get stop details to get coordinates
    const fromStopDetails = await getStopDetails(fromStopId, routeType);
    const toStopDetails = await getStopDetails(toStopId, routeType);
    
    const fromLat = fromStopDetails.stop.stop_latitude;
    const fromLon = fromStopDetails.stop.stop_longitude;
    const toLat = toStopDetails.stop.stop_latitude;
    const toLon = toStopDetails.stop.stop_longitude;
    
    // Calculate distance in kilometers using Haversine formula
    const distance = calculateDistance(fromLat, fromLon, toLat, toLon) / 1000;
    
    // Get average speed for this transport mode
    const speedKmh = TRANSPORT_SPEEDS[routeType as keyof typeof TRANSPORT_SPEEDS] || 30;
    
    // Calculate time in hours, then convert to minutes
    const timeHours = distance / speedKmh;
    const timeMinutes = timeHours * 60;
    
    // Add a buffer for stops, traffic, etc.
    return Math.ceil(timeMinutes * 1.2);
  } catch (error) {
    console.error('Error in fallback travel time estimation:', error);
    
    // If all else fails, return a very rough estimate based on route type
    const defaultMinutes = {
      0: 5,  // Train: 5 minutes between stops
      1: 3,  // Tram: 3 minutes between stops
      2: 4,  // Bus: 4 minutes between stops
      3: 10, // V/Line: 10 minutes between stops
      4: 4,  // Night Bus: 4 minutes between stops
      5: 15  // SkyBus: 15 minutes between stops
    };
    
    return defaultMinutes[routeType as keyof typeof defaultMinutes] || 5;
  }
}

/**
 * Calculate distance between two points in meters using the Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in meters
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}
