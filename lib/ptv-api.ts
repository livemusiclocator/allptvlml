import axios from 'axios';
import crypto from 'crypto';

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
function generateSignature(request: string): string {
  if (!API_KEY) {
    throw new Error('PTV API key is not defined');
  }
  
  const key = Buffer.from(API_KEY, 'utf-8');
  const requestWithDevId = request + (request.includes('?') ? '&' : '?') + 'devid=' + DEV_ID;
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(requestWithDevId);
  return hmac.digest('hex').toUpperCase();
}

/**
 * Make a request to the PTV API
 * @param endpoint The API endpoint to call
 * @param params Optional query parameters
 * @returns The API response data
 */
export async function ptvApiRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  if (!DEV_ID) {
    throw new Error('PTV Developer ID is not defined');
  }
  
  // Build the query string from params
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, String(value));
  });
  
  // Add devid to query params
  queryParams.append('devid', DEV_ID);
  
  // Build the request path
  const requestPath = endpoint + (Object.keys(params).length > 0 ? '?' + queryParams.toString() : '');
  
  // Generate signature
  const signature = generateSignature(requestPath);
  
  // Add signature to query params
  queryParams.append('signature', signature);
  
  // Build the full URL
  const url = `${PTV_BASE_URL}${endpoint}?${queryParams.toString()}`;
  
  try {
    const response = await axios.get<T>(url);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new PTVApiError(
        `PTV API error: ${error.response.status} ${error.response.statusText}`,
        error.response.status
      );
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
