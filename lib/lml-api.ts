import axios from 'axios';

// Live Music Locator API configuration
const LML_BASE_URL = 'https://api.lml.live';

// Error handling
class LMLApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'LMLApiError';
    this.status = status;
  }
}

/**
 * Interface for gig data
 */
export interface Gig {
  id: string;
  name: string;
  date: string;
  start_time?: string;
  end_time?: string;
  venue: {
    id: string;
    name: string;
    address: string;
    suburb?: string;
    postcode?: string;
    state?: string;
    latitude: number;
    longitude: number;
    website?: string;
  };
  genre_tags: string[];
  information_tags: string[];
  distance_meters?: number; // Added when calculating distance to stops
}

/**
 * Make a request to the Live Music Locator API
 * @param endpoint The API endpoint to call
 * @param params Optional query parameters
 * @returns The API response data
 */
export async function lmlApiRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  // Build the query string from params
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, String(value));
  });
  
  // Build the full URL
  const url = `${LML_BASE_URL}${endpoint}${Object.keys(params).length > 0 ? '?' + queryParams.toString() : ''}`;
  
  try {
    const response = await axios.get<T>(url);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new LMLApiError(
        `LML API error: ${error.response.status} ${error.response.statusText}`,
        error.response.status
      );
    }
    throw new Error(`LML API request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get today's gigs
 * @param location The location to search for gigs (default: 'melbourne')
 * @returns Array of gigs
 */
export async function getTodaysGigs(location: string = 'melbourne'): Promise<Gig[]> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  return lmlApiRequest<Gig[]>('/gigs/query', {
    location,
    date_from: today,
    date_to: today
  });
}

/**
 * Calculate distance between two points in meters using the Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in meters
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

/**
 * Find gigs near a specific location
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @param maxDistance Maximum distance in meters (default: 500)
 * @returns Array of gigs with distance_meters added
 */
export async function findGigsNearLocation(
  latitude: number,
  longitude: number,
  maxDistance: number = 500
): Promise<Gig[]> {
  const gigs = await getTodaysGigs();
  
  return gigs
    .map(gig => {
      const distance = calculateDistance(
        latitude,
        longitude,
        gig.venue.latitude,
        gig.venue.longitude
      );
      
      return {
        ...gig,
        distance_meters: distance
      };
    })
    .filter(gig => gig.distance_meters <= maxDistance)
    .sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
}
