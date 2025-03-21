import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { getRouteStops, getEstimatedTravelTime, getRouteDirections } from '@/lib/ptv-api';
import { findGigsNearMultipleLocations, isGigReachable, GigWithStop } from '@/lib/lml-api';

// Define interfaces for API responses
interface Direction {
  direction_id: number;
  direction_name: string;
  route_id: number;
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

// Define route type colors (same as in [routeId].tsx)
const routeTypeColors = {
  '0': 'train-blue',
  '1': 'tram-green',
  '2': 'bus-orange',
  '3': 'train-blue'
};

interface Stop {
  stop_id: number;
  stop_name: string;
  stop_latitude: number;
  stop_longitude: number;
  stop_sequence: number;
  route_type: number;
  absolute_sequence?: number; // Legacy property
  api_sequence?: number;      // Sequence from API
  name_sequence?: number;     // Sequence extracted from name (e.g. #47)
  docklands_sequence?: number; // For Docklands stops (D14-D18)
}

interface GigAhead extends GigWithStop {
  travelTimeMinutes: number;
  isReachable: boolean;
}

export default function StopsAhead() {
  const router = useRouter();
  const { typeId, routeId, directionId, stopId } = router.query;
  
  const [currentStop, setCurrentStop] = useState<Stop | null>(null);
  const [stopsAhead, setStopsAhead] = useState<Stop[]>([]);
  const [gigsAhead, setGigsAhead] = useState<GigAhead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch stops when parameters change
  useEffect(() => {
    if (!typeId || !routeId || !stopId || !directionId) return;
    
    const fetchStopsAndGigs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all stops for this route and direction
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
            console.log(`Using PTV API with special handling for tram route ${routeId}`);
            try {
              // Try PTV API first
              response = await getRouteStops(
                Number(routeId),
                Number(typeId),
                Number(directionId)
              ) as StopsResponse;
            } catch (ptvError) {
              console.error(`Error fetching stops for tram route ${routeId}, trying alternative direction:`, ptvError);
              
              // If the selected direction fails, try to get all available directions for this route
              console.log(`Fetching all available directions for route ${routeId}`);
              
              // Get all directions for this route
              const directionsResponse = await getRouteDirections(Number(routeId)) as DirectionsResponse;
              const availableDirections = directionsResponse.directions.map((d: Direction) => d.direction_id);
              
              console.log(`Available directions for route ${routeId}:`, availableDirections);
              
              // Filter out the current direction that already failed
              const alternativeDirections = availableDirections.filter(d => d !== Number(directionId));
              
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
              Number(directionId)
            ) as StopsResponse;
          }
        } catch (error) {
          console.error('Error fetching stops:', error);
          // If all attempts fail, initialize with an empty response
          response = {
            stops: [],
            status: {
              version: '',
              health: 0
            }
          };
        }
        
        // Log all stops with their sequence information for debugging
        console.log('All stops with sequence info:', response.stops.map((stop: Stop) => ({
          name: stop.stop_name,
          id: stop.stop_id,
          sequence: stop.stop_sequence
        })));
        
        // Process stops - simplify by trusting the API's stop_sequence
        console.log('Processing stops - using API stop_sequence for ordering');
        
        // We trust that the API provides the correct ordering via stop_sequence
        // when given the correct direction_id
        const sortedStops = [...response.stops].sort((a, b) => {
          // First priority: API-provided stop_sequence (when non-zero)
          if (a.stop_sequence && b.stop_sequence) {
            return a.stop_sequence - b.stop_sequence;
          }
          
          // If only one has sequence, it comes first
          if (a.stop_sequence) return -1;
          if (b.stop_sequence) return 1;
          
          // Fallback to name-based sequence if available
          const aNameMatch = a.stop_name.match(/#(\d+)/);
          const bNameMatch = b.stop_name.match(/#(\d+)/);
          
          if (aNameMatch && bNameMatch) {
            return parseInt(aNameMatch[1]) - parseInt(bNameMatch[1]);
          }
          
          // Last resort: sort by stop_id
          return a.stop_id - b.stop_id;
        });
        
        // Log the sorted stops
        console.log('Sorted stops:', sortedStops.map(stop => ({
          name: stop.stop_name,
          sequence: stop.absolute_sequence,
          original_sequence: stop.stop_sequence
        })));
        
        // Find the current stop
        const currentStopIndex = sortedStops.findIndex(
          stop => stop.stop_id === Number(stopId)
        );
        
        if (currentStopIndex === -1) {
          setError('Current stop not found in route stops');
          setLoading(false);
          return;
        }
        
        const current = sortedStops[currentStopIndex];
        setCurrentStop(current);
        
        // Get stops ahead of the current stop
        const ahead = sortedStops.slice(currentStopIndex + 1);
        setStopsAhead(ahead);
        
        // Find gigs near stops ahead
        if (ahead.length > 0) {
          const locations = ahead.map(stop => ({
            latitude: stop.stop_latitude,
            longitude: stop.stop_longitude,
            stopId: stop.stop_id,
            stopName: stop.stop_name,
            stopSequence: stop.absolute_sequence || stop.stop_sequence
          }));
          
          const nearbyGigs = await findGigsNearMultipleLocations(locations);
          
          // Calculate travel times and time criteria
          const currentTime = new Date().toISOString();
          console.log(`Current time for gig reachability: ${currentTime}`);
          console.log(`Found ${nearbyGigs.length} nearby gigs before travel time calculation`);
          
          const gigsWithTravelTimePromises = nearbyGigs.map(async gig => {
            // Find the stop this gig is near
            const stop = ahead.find(s => s.stop_id === gig.stopId);
            
            if (!stop) return null;
            
            try {
              // Get estimated travel time from PTV API
              console.log(`Getting travel time from stop ${stopId} to ${stop.stop_id}`);
              const travelTimeMinutes = await getEstimatedTravelTime(
                Number(stopId),
                stop.stop_id,
                Number(typeId)
              );
              console.log(`Travel time: ${travelTimeMinutes} minutes`);
              
              // Check if gig is reachable in time
              const gigStartTime = `${gig.date}T${gig.start_time || '19:00:00'}`;
              console.log(`Gig start time: ${gigStartTime}`);
              const isReachable = isGigReachable(
                gigStartTime,
                currentTime,
                travelTimeMinutes
              );
              
              console.log(`Gig "${gig.name}" at ${gig.venue.name} is ${isReachable ? 'reachable' : 'not reachable'}`);
              
              return {
                ...gig,
                travelTimeMinutes,
                isReachable
              };
            } catch (error) {
              console.error('Error getting travel time:', error);
              // Return the gig with default travel time in case of error
              return {
                ...gig,
                travelTimeMinutes: 30, // Default travel time as fallback
                isReachable: true // Assume reachable by default
              };
            }
          });
          
          // Wait for all travel time calculations to complete
          const gigsWithTravelTime = (await Promise.all(gigsWithTravelTimePromises))
            .filter(Boolean) as GigAhead[];
          
          console.log(`Found ${gigsWithTravelTime.length} gigs after travel time calculation`);
          
          // Deduplicate gigs - keep only one instance of each gig (with the smallest distance)
          const uniqueGigsMap = new Map<string, GigAhead>();
          
          gigsWithTravelTime.forEach(gig => {
            // If we haven't seen this gig before, add it
            if (!uniqueGigsMap.has(gig.id)) {
              uniqueGigsMap.set(gig.id, gig);
            } else {
              // If we've seen this gig before, keep the one with smaller distance
              const existingGig = uniqueGigsMap.get(gig.id)!;
              if ((gig.distance_meters || 0) < (existingGig.distance_meters || 0)) {
                uniqueGigsMap.set(gig.id, gig);
              }
            }
          });
          
          // Convert back to array and sort by start time
          const uniqueGigs = Array.from(uniqueGigsMap.values()).sort((a, b) => {
            // Convert to 24-hour time format or use default
            const timeA = a.start_time || '19:00:00';
            const timeB = b.start_time || '19:00:00';
            
            // Compare dates first
            const dateComparison = a.date.localeCompare(b.date);
            if (dateComparison !== 0) return dateComparison;
            
            // If same date, compare times
            return timeA.localeCompare(timeB);
          });
          
          console.log(`Deduplicated to ${uniqueGigs.length} unique gigs`);
          console.log(`Reachable gigs: ${uniqueGigs.filter(g => g.isReachable).length}`);
          
          // Include all gigs, not just reachable ones
          setGigsAhead(uniqueGigs);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load stops ahead. Please try again later.');
        setLoading(false);
        console.error('Error fetching stops ahead:', err);
      }
    };
    
    fetchStopsAndGigs();
  }, [typeId, routeId, stopId, directionId]);
  
  const routeTypeColor = typeId ? routeTypeColors[typeId as keyof typeof routeTypeColors] || 'ptv-blue' : 'ptv-blue';
  
  return (
    <Layout>
      <Head>
        <title>PTV-LML | Stops Ahead</title>
      </Head>
      
      <div className="container py-8">
        <div className="mb-8">
          <Link href={`/routes/${typeId}/${routeId}`} className="text-ptv-blue hover:underline mb-4 inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Route
          </Link>
          
          <h1 className={`text-3xl font-bold text-${routeTypeColor} mb-2 md:text-4xl`}>
            Stops Ahead
          </h1>
          <p className="text-gray-600">
            {currentStop ? `Live music ahead of ${currentStop.stop_name}` : 'Loading...'}
          </p>
        </div>
        
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
          <div className="space-y-6">
            {gigsAhead.length > 0 ? (
              <>
                {/* First show reachable gigs */}
                {gigsAhead.filter(gig => gig.isReachable).length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-green-600 mb-3">Reachable Gigs</h2>
                    <div className="space-y-4">
                      {gigsAhead
                        .filter(gig => gig.isReachable)
                        .map((gig) => (
                          <div key={`${gig.id}-${gig.stopId}`} className="card p-4 border-l-4 border-green-500">
                            <h3 className="text-lg font-semibold text-music-purple">{gig.name}</h3>
                            <p className="text-sm text-gray-600">{gig.genre_tags.join(', ')}</p>
                            <p className="text-sm font-medium mt-1">
                              {gig.venue.name}, {gig.start_time ? gig.start_time.substring(0, 5) : '8:00'} pm
                            </p>
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                              <span>{Math.round(gig.distance_meters || 0)}m from {gig.stopName}</span>
                              <span className="mx-2">•</span>
                              <span>~{gig.travelTimeMinutes} min travel time</span>
                            </div>
                            <div className="mt-2">
                              <a 
                                href={`https://www.google.com/maps/dir/?api=1&destination=${gig.venue.latitude},${gig.venue.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-ptv-blue hover:underline"
                              >
                                Venue Directions
                              </a>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Then show non-reachable gigs, if any */}
                {gigsAhead.filter(gig => !gig.isReachable).length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-yellow-600 mb-3">Other Gigs</h2>
                    <div className="space-y-4">
                      {gigsAhead
                        .filter(gig => !gig.isReachable)
                        .map((gig) => (
                          <div key={`${gig.id}-${gig.stopId}`} className="card p-4 border-l-4 border-yellow-400 opacity-80">
                            <h3 className="text-lg font-semibold text-music-purple">{gig.name}</h3>
                            <p className="text-sm text-gray-600">{gig.genre_tags.join(', ')}</p>
                            <p className="text-sm font-medium mt-1">
                              {gig.venue.name}, {gig.start_time ? gig.start_time.substring(0, 5) : '8:00'} pm
                            </p>
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                              <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                              <span>{Math.round(gig.distance_meters || 0)}m from {gig.stopName}</span>
                              <span className="mx-2">•</span>
                              <span>~{gig.travelTimeMinutes} min travel time</span>
                            </div>
                            <div className="mt-2">
                              <a 
                                href={`https://www.google.com/maps/dir/?api=1&destination=${gig.venue.latitude},${gig.venue.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-ptv-blue hover:underline"
                              >
                                Venue Directions
                              </a>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No upcoming gigs found at stops ahead.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
