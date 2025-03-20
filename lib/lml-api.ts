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
  console.log(`LML API Request - Endpoint: ${endpoint}`);
  
  // Build the query string from params
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, String(value));
  });
  
  // Build the full URL
  const url = `${LML_BASE_URL}${endpoint}${Object.keys(params).length > 0 ? '?' + queryParams.toString() : ''}`;
  console.log(`Full API URL: ${url}`);
  
  try {
    console.log('Sending API request...');
    const response = await axios.get<T>(url);
    console.log('API Response received:', {
      status: response.status,
      statusText: response.statusText,
      dataSize: JSON.stringify(response.data).length
    });
    
    return response.data;
  } catch (error) {
    console.error('LML API Request failed:', error);
    
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
        throw new LMLApiError(
          `LML API error: ${error.response.status} ${error.response.statusText}`,
          error.response.status
        );
      }
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
  console.log(`Getting today's gigs for location: ${location}`);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  console.log(`Today's date: ${today}`);
  
  try {
    console.log(`Making API request to /gigs/query with params:`, {
      location,
      date_from: today,
      date_to: today
    });
    
    const gigs = await lmlApiRequest<Gig[]>('/gigs/query', {
      location,
      date_from: today,
      date_to: today
    });
    
    console.log(`Received ${gigs.length} gigs from API`);
    
    // Log a sample gig for debugging
    if (gigs.length > 0) {
      console.log('Sample gig:', {
        id: gigs[0].id,
        name: gigs[0].name,
        venue: gigs[0].venue.name,
        hasCoordinates: gigs[0].venue.latitude !== undefined && gigs[0].venue.longitude !== undefined
      });
    }
    
    return gigs;
  } catch (error) {
    console.error('Error in getTodaysGigs:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    // Return empty array instead of throwing to prevent cascading failures
    return [];
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
  console.log(`Finding gigs near location: lat=${latitude}, lon=${longitude}, maxDistance=${maxDistance}m`);
  
  try {
    console.log('Fetching today\'s gigs...');
    const gigs = await getTodaysGigs();
    console.log(`Fetched ${gigs.length} gigs for today`);
    
    console.log('Calculating distances and filtering by proximity...');
    const gigsWithDistance = gigs.map(gig => {
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
    });
    
    const nearbyGigs = gigsWithDistance
      .filter(gig => gig.distance_meters <= maxDistance)
      .sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
    
    console.log(`Found ${nearbyGigs.length} gigs within ${maxDistance}m`);
    
    // Log the first few nearby gigs for debugging
    if (nearbyGigs.length > 0) {
      console.log('First nearby gig:', {
        name: nearbyGigs[0].name,
        venue: nearbyGigs[0].venue.name,
        distance: Math.round(nearbyGigs[0].distance_meters || 0)
      });
    }
    
    return nearbyGigs;
  } catch (error) {
    console.error('Error in findGigsNearLocation:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}
