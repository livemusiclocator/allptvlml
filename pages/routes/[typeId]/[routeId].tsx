import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { getRouteDirections, getRouteStops, getRoutesByType } from '@/lib/ptv-api';
import { findGigsNearLocation } from '@/lib/lml-api';
import type { Gig } from '@/lib/lml-api';

// Define route type colors
const routeTypeColors = {
  '0': 'train-blue',
  '1': 'tram-green',
  '2': 'bus-orange',
  '3': 'train-blue'
};

interface Route {
  route_id: number;
  route_name: string;
  route_number: string;
  route_type: number;
  route_gtfs_id?: string;
}

interface RoutesResponse {
  routes: Route[];
  status: {
    version: string;
    health: number;
  };
}

interface Direction {
  direction_id: number;
  direction_name: string;
  route_id: number;
  route_type: number;
}

interface Stop {
  stop_id: number;
  stop_name: string;
  stop_latitude: number;
  stop_longitude: number;
  stop_sequence: number;
  route_type: number;
  absolute_sequence?: number; // Added for better sorting
}

interface DirectionsResponse {
  directions: Direction[];
  status: {
    version: string;
    health: number;
  };
}

interface StopsResponse {
  stops: Stop[];
  status: {
    version: string;
    health: number;
  };
}

interface StopWithGigs extends Stop {
  nearbyGigs: Gig[];
  isLoadingGigs: boolean;
}

export default function RouteDetail() {
  const router = useRouter();
  const { typeId, routeId } = router.query;
  
  const [directions, setDirections] = useState<Direction[]>([]);
  const [selectedDirection, setSelectedDirection] = useState<number | null>(null);
  const [stops, setStops] = useState<StopWithGigs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeName, setRouteName] = useState('');
  const [routeNumber, setRouteNumber] = useState('');
  
  // Check if window is defined (client-side only)
  const isClient = typeof window !== 'undefined';

  // Fetch directions when route ID changes
  useEffect(() => {
    if (!typeId || !routeId) return;
    
    const fetchDirections = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we have cached data (client-side only)
        if (isClient) {
          try {
            const cachedData = localStorage.getItem(`directions_route_${routeId}`);
            if (cachedData) {
              const parsed = JSON.parse(cachedData);
              setDirections(parsed.directions);
              setRouteName(parsed.routeName || '');
              setRouteNumber(parsed.routeNumber || '');
              console.log(`Loaded cached route number: ${parsed.routeNumber}`);
              
              // Set the first direction as selected by default
              if (parsed.directions.length > 0 && !selectedDirection) {
                setSelectedDirection(parsed.directions[0].direction_id);
              }
              
              setLoading(false);
              return;
            }
          } catch (localStorageError) {
            console.error('LocalStorage error:', localStorageError);
            // Continue with API request if localStorage fails
          }
        }
        
        let response: DirectionsResponse;
        
        // Use PTV API for all route types
        console.log(`Using PTV API for route type ${typeId}`);
        response = await getRouteDirections(Number(routeId)) as DirectionsResponse;
        
        setDirections(response.directions);
        
        // Set the first direction as selected by default
        if (response.directions.length > 0) {
          setSelectedDirection(response.directions[0].direction_id);
        }
        
        // Variable to store route data for caching
        let routeNameToCache = '';
        let routeNumberToCache = '';
        
        // Try to get route details to find the route number
        try {
          const routesResponse = await getRoutesByType(Number(typeId)) as RoutesResponse;
          const route = routesResponse.routes.find((r: Route) => r.route_id === Number(routeId));
          if (route) {
            routeNameToCache = route.route_name;
            routeNumberToCache = route.route_number;
            setRouteName(routeNameToCache);
            setRouteNumber(routeNumberToCache);
            console.log(`Found route: ${routeNameToCache}, number: ${routeNumberToCache}`);
          }
        } catch (routeError) {
          console.error('Error fetching route details:', routeError);
        }
        
        // Cache the data (client-side only)
        if (isClient) {
          try {
            localStorage.setItem(`directions_route_${routeId}`, JSON.stringify({
              directions: response.directions,
              routeName: routeNameToCache,
              routeNumber: routeNumberToCache,
              timestamp: Date.now()
            }));
            
            console.log(`Cached route data with name: ${routeNameToCache}, number: ${routeNumberToCache}`);
          } catch (localStorageError) {
            console.error('LocalStorage saving error:', localStorageError);
            // Continue even if localStorage fails
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load route directions. Please try again later.');
        setLoading(false);
        console.error('Error fetching directions:', err);
      }
    };
    
    fetchDirections();
  }, [typeId, routeId, selectedDirection, isClient]);
  
  // Fetch stops when direction changes
  useEffect(() => {
    if (!typeId || !routeId || selectedDirection === null) return;
    
    const fetchStops = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we have cached data (client-side only)
        if (isClient) {
          try {
            const cacheKey = `stops_route_${routeId}_${selectedDirection}`;
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
              const parsed = JSON.parse(cachedData);
              
              // Initialize stops with empty gigs arrays
              const stopsWithGigs = parsed.stops.map((stop: Stop) => ({
                ...stop,
                nearbyGigs: [],
                isLoadingGigs: false
              }));
              
              setStops(stopsWithGigs);
              setLoading(false);
              return;
            }
          } catch (localStorageError) {
            console.error('LocalStorage error:', localStorageError);
            // Continue with API request if localStorage fails
          }
        }
        
        // Initialize response with a default empty value
        let response: StopsResponse = {
          stops: [],
          status: {
            version: '',
            health: 1
          }
        };
        
        try {
          // Special handling for tram routes #11 and #96 which might have issues
          if (Number(typeId) === 1 && (Number(routeId) === 11 || Number(routeId) === 96)) {
            console.log(`Using PTV API with fallback for tram route ${routeId}`);
            try {
              // Try PTV API first
              response = await getRouteStops(
                Number(routeId),
                Number(typeId),
                selectedDirection
              ) as StopsResponse;
            } catch (ptvError) {
              console.error(`Error fetching stops for tram route ${routeId}, trying alternative direction:`, ptvError);
              
              // If the selected direction fails, try to get all available directions for this route
              console.log(`Fetching all available directions for route ${routeId}`);
              
              // Get all directions for this route
              const directionsResponse = await getRouteDirections(Number(routeId)) as DirectionsResponse;
              const availableDirections = directionsResponse.directions.map(d => d.direction_id);
              
              console.log(`Available directions for route ${routeId}:`, availableDirections);
              
              // Filter out the current direction that already failed
              const alternativeDirections = availableDirections.filter(d => d !== selectedDirection);
              
              if (alternativeDirections.length > 0) {
                // Try each alternative direction until one works
                let foundValidDirection = false;
                
                for (const altDirection of alternativeDirections) {
                  console.log(`Trying alternative direction ${altDirection} for route ${routeId}`);
                  
                  try {
                    response = await getRouteStops(
                      Number(routeId),
                      Number(typeId),
                      altDirection
                    ) as StopsResponse;
                    
                    // If this works, we'll use these stops but keep them in the original selected direction
                    console.log(`Successfully fetched stops using alternative direction ${altDirection}`);
                    foundValidDirection = true;
                    break;
                  } catch (dirError) {
                    console.error(`Direction ${altDirection} also failed:`, dirError);
                    // Continue to the next direction
                  }
                }
                
                if (!foundValidDirection) {
                  throw new Error('All available directions failed');
                }
              } else {
                throw new Error('No alternative directions available');
              }
            }
          } else {
            console.log(`Using PTV API for route type ${typeId}`);
            response = await getRouteStops(
              Number(routeId),
              Number(typeId),
              selectedDirection
            ) as StopsResponse;
          }
        } catch (error) {
          console.error('Error fetching stops:', error);
          
          // Initialize with an empty response if all attempts fail
          response = {
            stops: [],
            status: {
              version: '',
              health: 0
            }
          };
        }
        
        // Log the raw response to see if stop_sequence is available
        console.log('Raw stops response:', response.stops);
        
        // Check if stop_sequence is available in the response
        const hasStopSequence = response.stops.some(stop => stop.stop_sequence !== undefined);
        console.log('Has stop_sequence property:', hasStopSequence);
        
        // Log all stops with their sequence information for debugging
        console.log('All stops with sequence info:', response.stops.map(stop => ({
          name: stop.stop_name,
          id: stop.stop_id,
          sequence: stop.stop_sequence
        })));
        
        // Extract sequence information from stops
        console.log('Processing stop sequence information...');
        
        const processedStops = response.stops.map(stop => {
          // Create a new object with all properties from the original stop
          const processedStop = { ...stop };
          
          // 1. FIRST CHOICE: API-provided stop_sequence - this is the most reliable source
          if (stop.stop_sequence !== undefined && stop.stop_sequence > 0) {
            processedStop.absolute_sequence = stop.stop_sequence;
            console.log(`Stop ${stop.stop_name} assigned sequence ${processedStop.absolute_sequence} from API's stop_sequence`);
            return processedStop;
          }
          
          // 2. SECOND CHOICE: Extract from name if it contains a number with # prefix
          const nameMatch = stop.stop_name.match(/#(\d+)/);
          if (nameMatch) {
            processedStop.absolute_sequence = parseInt(nameMatch[1]);
            console.log(`Stop ${stop.stop_name} assigned sequence ${processedStop.absolute_sequence} from stop name`);
            return processedStop;
          }
          
          // 3. THIRD CHOICE: For docklands stops with D prefix
          if (stop.stop_name.includes('D')) {
            const docklandsMatch = stop.stop_name.match(/D(\d+)/);
            if (docklandsMatch) {
              // Place these at the end of the sequence
              processedStop.absolute_sequence = 100 + parseInt(docklandsMatch[1]);
              console.log(`Docklands stop ${stop.stop_name} assigned sequence ${processedStop.absolute_sequence}`);
              return processedStop;
            }
          }
          
          // 4. FOURTH CHOICE: Extract from stop ID if possible
          const stopIdStr = String(stop.stop_id);
          if (stop.stop_id) {
            const lastDigits = stopIdStr.slice(-2);
            if (!isNaN(parseInt(lastDigits))) {
              processedStop.absolute_sequence = parseInt(lastDigits);
              console.log(`Stop ${stop.stop_name} assigned sequence ${processedStop.absolute_sequence} from stop ID`);
              return processedStop;
            }
          }
          
          // FALLBACK: If no sequence can be determined, use a high number
          processedStop.absolute_sequence = 999999;
          console.log(`Stop ${stop.stop_name} assigned default high sequence (no sequence info available)`);
          return processedStop;
        });
        
        // Log the processed stops with their sequences
        const sequenceDebugInfo = processedStops.map(stop => ({
          name: stop.stop_name, 
          sequence: stop.absolute_sequence
        }));
        console.log('Stops with assigned sequences:', sequenceDebugInfo);
        
        // Sort stops by absolute_sequence
        const sortedStops = [...processedStops].sort((a, b) => {
          return (a.absolute_sequence || 999999) - (b.absolute_sequence || 999999);
        });
        
        // Log the sorted stops
        console.log('Sorted stops:', sortedStops.map(stop => ({
          name: stop.stop_name,
          sequence: stop.absolute_sequence,
          original_sequence: stop.stop_sequence
        })));
        
        // Filter out stops with invalid sequence (optional)
        // const validStops = sortedStops.filter(stop => stop.absolute_sequence !== 999999);
        
        console.log('Sorted stops:', sortedStops.map(stop => ({
          name: stop.stop_name,
          sequence: stop.stop_sequence,
          id: stop.stop_id
        })));
        
        // Initialize stops with empty gigs arrays
        const stopsWithGigs = sortedStops.map(stop => ({
          ...stop,
          nearbyGigs: [],
          isLoadingGigs: false
        }));
        
        setStops(stopsWithGigs);
        
        // Cache the data (client-side only)
        if (isClient) {
          try {
            const cacheKey = `stops_route_${routeId}_${selectedDirection}`;
            localStorage.setItem(cacheKey, JSON.stringify({
              stops: sortedStops,
              timestamp: Date.now()
            }));
          } catch (localStorageError) {
            console.error('LocalStorage saving error:', localStorageError);
            // Continue even if localStorage fails
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load stops. Please try again later.');
        setLoading(false);
        console.error('Error fetching stops:', err);
      }
    };
    
    fetchStops();
  }, [typeId, routeId, selectedDirection, isClient]);
  
  // Function to load gigs for a specific stop
  const loadGigsForStop = async (stopIndex: number) => {
    console.log(`Loading gigs for stop index ${stopIndex}`);
    const stop = stops[stopIndex];
    console.log(`Stop details:`, {
      name: stop.stop_name,
      latitude: stop.stop_latitude,
      longitude: stop.stop_longitude,
      isLoadingGigs: stop.isLoadingGigs,
      hasGigs: stop.nearbyGigs.length > 0
    });
    
    // Skip if already loading or has gigs
    if (stop.isLoadingGigs || stop.nearbyGigs.length > 0) {
      console.log('Skipping - already loading or has gigs');
      return;
    }
    
    // Update loading state
    const updatedStops = [...stops];
    updatedStops[stopIndex] = { ...stop, isLoadingGigs: true };
    setStops(updatedStops);
    console.log('Updated loading state to true');
    
    try {
      console.log('Calling findGigsNearLocation with:', {
        latitude: stop.stop_latitude,
        longitude: stop.stop_longitude,
        radius: 500
      });
      
      // Find gigs near this stop
      const gigs = await findGigsNearLocation(
        stop.stop_latitude,
        stop.stop_longitude,
        500 // 500 meters radius
      );
      
      console.log(`Found ${gigs.length} gigs near ${stop.stop_name}`);
      
      // Update stops with gigs
      const newUpdatedStops = [...stops];
      newUpdatedStops[stopIndex] = {
        ...stop,
        nearbyGigs: gigs,
        isLoadingGigs: false
      };
      setStops(newUpdatedStops);
      console.log('Updated stops with gigs');
    } catch (err) {
      console.error('Error fetching gigs for stop:', err);
      if (err instanceof Error) {
        console.error('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
      }
      
      // Update loading state even on error
      const newUpdatedStops = [...stops];
      newUpdatedStops[stopIndex] = {
        ...stop,
        isLoadingGigs: false,
        nearbyGigs: []
      };
      setStops(newUpdatedStops);
      console.log('Updated loading state to false after error');
    }
  };
  
  const routeTypeColor = typeId ? routeTypeColors[typeId as keyof typeof routeTypeColors] || 'ptv-blue' : 'ptv-blue';
  
  return (
    <Layout>
      <Head>
        <title>PTV-LML | {routeNumber && Number(typeId) === 1 ? `Number ${routeNumber}: ` : ''}
        {routeNumber && Number(typeId) === 2 ? `Route ${routeNumber}: ` : ''}
        {routeName || 'Route'} Stops</title>
      </Head>
      
      <div className="container py-8">
        <div className="mb-8">
          <Link href={`/routes/${typeId}`} className="text-ptv-blue hover:underline mb-4 inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Routes
          </Link>
          
          <h1 className={`text-3xl font-bold text-${routeTypeColor} mb-2 md:text-4xl`}>
            {routeNumber && Number(typeId) === 1 ? `Number ${routeNumber}: ` : ''}
            {routeNumber && Number(typeId) === 2 ? `Route ${routeNumber}: ` : ''}
            {routeName || 'Route'} Stops
          </h1>
          <p className="text-gray-600">
            View all stops and nearby live music events.
          </p>
        </div>
        
        {/* Direction selector using radio buttons */}
        {directions.length > 0 && (
          <div className="mb-6">
            <fieldset>
              <legend className="text-lg font-semibold mb-2">Select Direction:</legend>
              <div className="space-y-2 mb-2">
                {directions.map((direction) => {
                  // Format direction name to include "To" prefix if not already present
                  let displayName = direction.direction_name;
                  if (!displayName.toLowerCase().startsWith('to ')) {
                    displayName = `To ${displayName}`;
                  }
                  
                  const isSelected = selectedDirection === direction.direction_id;
                  const id = `direction-${direction.direction_id}`;
                  
                  return (
                    <div key={direction.direction_id} className="flex items-center">
                      <input
                        type="radio"
                        id={id}
                        name="direction"
                        value={direction.direction_id}
                        checked={isSelected}
                        onChange={() => setSelectedDirection(direction.direction_id)}
                        className={`w-5 h-5 text-${routeTypeColor} focus:ring-${routeTypeColor} border-gray-300`}
                      />
                      <label 
                        htmlFor={id} 
                        className={`ml-2 text-base ${isSelected ? 'font-bold' : 'font-normal'}`}
                      >
                        {displayName}
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>
            
            {selectedDirection !== null && directions.length > 0 && (
              <div className={`text-sm bg-${routeTypeColor} bg-opacity-10 text-${routeTypeColor} p-2 rounded-md mt-2 inline-block`}>
                Currently showing stops heading {
                  directions.find(d => d.direction_id === selectedDirection)?.direction_name.toLowerCase().startsWith('to ') 
                    ? directions.find(d => d.direction_id === selectedDirection)?.direction_name
                    : `to ${directions.find(d => d.direction_id === selectedDirection)?.direction_name}`
                }
              </div>
            )}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ptv-blue"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {stops.map((stop, index) => (
              <div key={stop.stop_id} className="card">
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{stop.stop_name}</h3>
                  
                  {/* Gig information */}
                  <div className="mt-2">
                    {stop.isLoadingGigs ? (
                      <p className="text-gray-500 text-sm flex items-center">
                        <span className="inline-block w-4 h-4 mr-2 border-t-2 border-b-2 border-ptv-blue rounded-full animate-spin"></span>
                        Loading nearby gigs...
                      </p>
                    ) : stop.nearbyGigs.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium text-music-purple mb-1">
                          {stop.nearbyGigs.length} Live Music {stop.nearbyGigs.length === 1 ? 'Event' : 'Events'} Nearby
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {stop.nearbyGigs.slice(0, 3).map((gig) => (
                            <li key={gig.id} className="flex items-start">
                              <span className="inline-block w-2 h-2 mt-1.5 mr-2 bg-music-purple rounded-full"></span>
                              <div>
                                <span className="font-medium">{gig.name}</span>
                                <span className="text-gray-500"> at {gig.venue.name}</span>
                                <span className="text-gray-400 block text-xs">
                                  {Math.round(gig.distance_meters || 0)}m away
                                </span>
                              </div>
                            </li>
                          ))}
                          {stop.nearbyGigs.length > 3 && (
                            <li className="text-music-purple text-xs font-medium">
                              +{stop.nearbyGigs.length - 3} more events
                            </li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <button
                        className="text-sm text-music-purple hover:underline focus:outline-none"
                        onClick={() => loadGigsForStop(index)}
                      >
                        Check for nearby gigs
                      </button>
                    )}
                  </div>
                  
                  {/* Stops Ahead Link */}
                  <div className="mt-2 border-t pt-2">
                    <Link
                      href={`/routes/${typeId}/${routeId}/direction/${selectedDirection}/stop/${stop.stop_id}/stops-ahead`}
                      className="text-sm text-music-purple hover:underline focus:outline-none inline-flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      View gigs at stops ahead
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            
            {stops.length === 0 && !loading && !error && (
              <div className="text-center py-8">
                <p className="text-gray-500">No stops found for this route and direction.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
