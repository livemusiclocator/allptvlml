import JSZip from 'jszip';
import { parse } from 'csv-parse/sync';

// Define interfaces for GTFS data
interface GTFSRoute {
  route_id: string;
  agency_id?: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number;
  route_color?: string;
  route_text_color?: string;
}

interface GTFSStop {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
  location_type?: string;
  parent_station?: string;
  stop_sequence?: number; // Added for compatibility with PTV API
  route_id?: string; // Added to associate stops with routes
}

interface GTFSTrip {
  route_id: string;
  service_id: string;
  trip_id: string;
  trip_headsign?: string;
  direction_id: string;
  shape_id?: string;
}

interface GTFSStopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: string;
  pickup_type?: string;
  drop_off_type?: string;
}

interface GTFSDirection {
  direction_id: number;
  direction_name: string;
  route_id: string;
  route_type: number;
}

// Mock data for client-side rendering
const mockGTFSData = {
  skybus: {
    routes: [
      {
        route_id: '5001',
        route_short_name: 'SkyBus',
        route_long_name: 'Melbourne Airport to Southern Cross',
        route_type: 5
      },
      {
        route_id: '5002',
        route_short_name: 'SkyBus',
        route_long_name: 'Avalon Airport to Southern Cross',
        route_type: 5
      }
    ],
    directions: [
      {
        direction_id: 0,
        direction_name: 'To Southern Cross',
        route_id: '5001',
        route_type: 5
      },
      {
        direction_id: 1,
        direction_name: 'To Melbourne Airport',
        route_id: '5001',
        route_type: 5
      },
      {
        direction_id: 0,
        direction_name: 'To Southern Cross',
        route_id: '5002',
        route_type: 5
      },
      {
        direction_id: 1,
        direction_name: 'To Avalon Airport',
        route_id: '5002',
        route_type: 5
      }
    ],
    stops: [
      {
        stop_id: '50001',
        stop_name: 'Melbourne Airport',
        stop_lat: '-37.669746',
        stop_lon: '144.848134',
        stop_sequence: 1,
        route_id: '5001'
      },
      {
        stop_id: '50002',
        stop_name: 'Southern Cross Station',
        stop_lat: '-37.818304',
        stop_lon: '144.952507',
        stop_sequence: 2,
        route_id: '5001'
      },
      {
        stop_id: '50003',
        stop_name: 'Avalon Airport',
        stop_lat: '-38.039917',
        stop_lon: '144.469864',
        stop_sequence: 1,
        route_id: '5002'
      },
      {
        stop_id: '50004',
        stop_name: 'Southern Cross Station',
        stop_lat: '-37.818304',
        stop_lon: '144.952507',
        stop_sequence: 2,
        route_id: '5002'
      }
    ]
  },
  nightbus: {
    routes: [
      {
        route_id: '4001',
        route_short_name: 'N1',
        route_long_name: 'Night Bus - City to Reservoir',
        route_type: 4
      },
      {
        route_id: '4002',
        route_short_name: 'N2',
        route_long_name: 'Night Bus - City to Bayswater',
        route_type: 4
      }
    ],
    directions: [
      {
        direction_id: 0,
        direction_name: 'To City',
        route_id: '4001',
        route_type: 4
      },
      {
        direction_id: 1,
        direction_name: 'To Reservoir',
        route_id: '4001',
        route_type: 4
      },
      {
        direction_id: 0,
        direction_name: 'To City',
        route_id: '4002',
        route_type: 4
      },
      {
        direction_id: 1,
        direction_name: 'To Bayswater',
        route_id: '4002',
        route_type: 4
      }
    ],
    stops: [
      {
        stop_id: '40001',
        stop_name: 'Flinders Street Station',
        stop_lat: '-37.818304',
        stop_lon: '144.967150',
        stop_sequence: 1,
        route_id: '4001'
      },
      {
        stop_id: '40002',
        stop_name: 'Reservoir Station',
        stop_lat: '-37.718304',
        stop_lon: '144.997150',
        stop_sequence: 2,
        route_id: '4001'
      },
      {
        stop_id: '40003',
        stop_name: 'Flinders Street Station',
        stop_lat: '-37.818304',
        stop_lon: '144.967150',
        stop_sequence: 1,
        route_id: '4002'
      },
      {
        stop_id: '40004',
        stop_name: 'Box Hill Station',
        stop_lat: '-37.819304',
        stop_lon: '145.121150',
        stop_sequence: 2,
        route_id: '4002'
      },
      {
        stop_id: '40005',
        stop_name: 'Bayswater Station',
        stop_lat: '-37.842304',
        stop_lon: '145.267150',
        stop_sequence: 3,
        route_id: '4002'
      }
    ]
  }
};

/**
 * Check if code is running on server or client
 * @returns true if running on server, false if running on client
 */
function isServer() {
  return typeof window === 'undefined';
}

/**
 * Fetch data from the GTFS API
 * @param action The API action to perform
 * @param routeType The route type ID
 * @param routeId Optional route ID
 * @param directionId Optional direction ID
 * @returns Promise that resolves to the API response
 */
async function fetchGTFSData(action: string, routeType: number, routeId?: number, directionId?: number) {
  try {
    let url = `/api/gtfs/routes?action=${action}&routeType=${routeType}`;
    if (routeId !== undefined) {
      url += `&routeId=${routeId}`;
    }
    if (directionId !== undefined) {
      url += `&directionId=${directionId}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching GTFS data:', error);
    throw error;
  }
}

/**
 * Get routes for a specific route type from GTFS data
 * @param routeType The route type ID (5 for SkyBus, 4 for Night Bus)
 * @returns Array of routes in a format compatible with PTV API
 */
export async function getGTFSRoutesByType(routeType: number) {
  console.log(`Getting GTFS routes for route type ${routeType}`);
  
  try {
    // Try to fetch from API if in browser
    if (typeof window !== 'undefined') {
      return await fetchGTFSData('routes', routeType);
    }
  } catch (error) {
    console.error('Error fetching from API, falling back to mock data:', error);
  }
  
  // Use mock data as fallback
  const mockData = routeType === 5 ? mockGTFSData.skybus : mockGTFSData.nightbus;
  const routes = mockData.routes;
  
  console.log(`Using mock data: Found ${routes.length} routes for route type ${routeType}`);
  
  // Convert to PTV API format
  return {
    routes: routes.map(route => ({
      route_id: parseInt(route.route_id),
      route_name: route.route_long_name,
      route_number: route.route_short_name,
      route_type: routeType,
      route_gtfs_id: route.route_id
    })),
    status: {
      version: "3.0",
      health: 1
    }
  };
}

/**
 * Get directions for a specific route from GTFS data
 * @param routeId The route ID
 * @param routeType The route type ID
 * @returns Array of directions in a format compatible with PTV API
 */
export async function getGTFSRouteDirections(routeId: number, routeType: number) {
  console.log(`Getting GTFS directions for route ${routeId} (type ${routeType})`);
  
  try {
    // Try to fetch from API if in browser
    if (typeof window !== 'undefined') {
      return await fetchGTFSData('directions', routeType, routeId);
    }
  } catch (error) {
    console.error('Error fetching from API, falling back to mock data:', error);
  }
  
  // Use mock data as fallback
  const mockData = routeType === 5 ? mockGTFSData.skybus : mockGTFSData.nightbus;
  const directions = mockData.directions.filter(dir => dir.route_id === String(routeId));
  
  console.log(`Using mock data: Found ${directions.length} directions for route ${routeId}`);
  
  // Convert to PTV API format
  return {
    directions: directions.map(dir => ({
      direction_id: dir.direction_id,
      direction_name: dir.direction_name,
      route_id: routeId,
      route_type: routeType
    })),
    status: {
      version: "3.0",
      health: 1
    }
  };
}

/**
 * Get stops for a specific route and direction from GTFS data
 * @param routeId The route ID
 * @param routeType The route type ID
 * @param directionId Optional direction ID
 * @returns Array of stops in a format compatible with PTV API
 */
export async function getGTFSRouteStops(routeId: number, routeType: number, directionId?: number) {
  console.log(`Getting GTFS stops for route ${routeId} (type ${routeType}), direction ${directionId}`);
  
  try {
    // Try to fetch from API if in browser
    if (typeof window !== 'undefined') {
      return await fetchGTFSData('stops', routeType, routeId, directionId);
    }
  } catch (error) {
    console.error('Error fetching from API, falling back to mock data:', error);
  }
  
  // Use mock data as fallback
  const mockData = routeType === 5 ? mockGTFSData.skybus : mockGTFSData.nightbus;
  
  // Filter stops by route_id
  const stops = mockData.stops.filter(stop => stop.route_id === String(routeId));
  
  console.log(`Using mock data: Found ${stops.length} stops for route ${routeId}`);
  
  // Convert to PTV API format
  const routeStops = stops.map(stop => ({
    stop_id: parseInt(stop.stop_id),
    stop_name: stop.stop_name,
    stop_latitude: parseFloat(stop.stop_lat),
    stop_longitude: parseFloat(stop.stop_lon),
    stop_sequence: stop.stop_sequence,
    route_type: routeType
  }));
  
  // Sort by sequence number
  routeStops.sort((a, b) => a.stop_sequence - b.stop_sequence);
  
  return {
    stops: routeStops,
    status: {
      version: "3.0",
      health: 1
    }
  };
}