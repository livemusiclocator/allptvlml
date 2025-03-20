import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { getRouteDirections, getRouteStops } from '@/lib/ptv-api';
import { findGigsNearLocation } from '@/lib/lml-api';
import type { Gig } from '@/lib/lml-api';

// Define route type colors
const routeTypeColors = {
  '0': 'train-blue',
  '1': 'tram-green',
  '2': 'bus-orange',
  '3': 'train-blue',
  '4': 'bus-orange',
  '5': 'skybus-red'
};

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
        
        const response = await getRouteDirections(Number(routeId)) as DirectionsResponse;
        setDirections(response.directions);
        
        // Set the first direction as selected by default
        if (response.directions.length > 0) {
          setSelectedDirection(response.directions[0].direction_id);
        }
        
        // Cache the data (client-side only)
        if (isClient) {
          try {
            localStorage.setItem(`directions_route_${routeId}`, JSON.stringify({
              directions: response.directions,
              timestamp: Date.now()
            }));
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
        
        const response = await getRouteStops(
          Number(routeId),
          Number(typeId),
          selectedDirection
        ) as StopsResponse;
        
        // Ensure we sort stops by sequence for correct order
        const sortedStops = [...response.stops].sort((a, b) => {
          // First check if stop_sequence exists and use it
          if (a.stop_sequence !== undefined && b.stop_sequence !== undefined) {
            return a.stop_sequence - b.stop_sequence;
          }
          // Fallback to stop_id if no sequence available
          return a.stop_id - b.stop_id;
        });
        
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
    const stop = stops[stopIndex];
    
    // Skip if already loading or has gigs
    if (stop.isLoadingGigs || stop.nearbyGigs.length > 0) return;
    
    // Update loading state
    const updatedStops = [...stops];
    updatedStops[stopIndex] = { ...stop, isLoadingGigs: true };
    setStops(updatedStops);
    
    try {
      // Find gigs near this stop
      const gigs = await findGigsNearLocation(
        stop.stop_latitude,
        stop.stop_longitude,
        500 // 500 meters radius
      );
      
      // Update stops with gigs
      const newUpdatedStops = [...stops];
      newUpdatedStops[stopIndex] = { 
        ...stop, 
        nearbyGigs: gigs,
        isLoadingGigs: false 
      };
      setStops(newUpdatedStops);
    } catch (err) {
      console.error('Error fetching gigs for stop:', err);
      
      // Update loading state even on error
      const newUpdatedStops = [...stops];
      newUpdatedStops[stopIndex] = { 
        ...stop, 
        isLoadingGigs: false,
        nearbyGigs: [] 
      };
      setStops(newUpdatedStops);
    }
  };
  
  const routeTypeColor = typeId ? routeTypeColors[typeId as keyof typeof routeTypeColors] || 'ptv-blue' : 'ptv-blue';
  
  return (
    <Layout>
      <Head>
        <title>PTV-LML | {routeName || 'Route'} Stops</title>
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
            {routeName || 'Route'} Stops
          </h1>
          <p className="text-gray-600">
            View all stops and nearby live music events.
          </p>
        </div>
        
        {/* Direction selector */}
        {directions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Select Direction:</h2>
            <div className="flex flex-wrap gap-2">
              {directions.map((direction) => (
                <button
                  key={direction.direction_id}
                  className={`px-4 py-2 rounded-md ${
                    selectedDirection === direction.direction_id
                      ? `bg-${routeTypeColor} text-white`
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                  onClick={() => setSelectedDirection(direction.direction_id)}
                >
                  {direction.direction_name}
                </button>
              ))}
            </div>
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
