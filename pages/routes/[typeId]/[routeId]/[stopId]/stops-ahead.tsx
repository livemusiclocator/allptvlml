import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { getRouteStops, getEstimatedTravelTime } from '@/lib/ptv-api';
import { getGTFSRouteStops } from '@/lib/gtfs-api';
import { findGigsNearMultipleLocations, isGigReachable, GigWithStop } from '@/lib/lml-api';

// Define route type colors (same as in [routeId].tsx)
const routeTypeColors = {
  '0': 'train-blue',
  '1': 'tram-green',
  '2': 'bus-orange',
  '3': 'train-blue',
  '4': 'bus-orange',
  '5': 'skybus-red'
};

interface Stop {
  stop_id: number;
  stop_name: string;
  stop_latitude: number;
  stop_longitude: number;
  stop_sequence: number;
  route_type: number;
  absolute_sequence?: number;
}

interface GigAhead extends GigWithStop {
  travelTimeMinutes: number;
  isReachable: boolean;
}

export default function StopsAhead() {
  const router = useRouter();
  const { typeId, routeId, stopId, directionId } = router.query;
  
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
        let response;
        if (Number(typeId) === 5 || Number(typeId) === 4) {
          response = await getGTFSRouteStops(
            Number(routeId),
            Number(typeId),
            Number(directionId)
          );
        } else {
          response = await getRouteStops(
            Number(routeId),
            Number(typeId),
            Number(directionId)
          );
        }
        
        // Process stops to add absolute_sequence (same as in [routeId].tsx)
        const processedStops = response.stops.map((stop: Stop) => {
          const processedStop = { ...stop };
          
          if (Number(typeId) === 1) {
            const match = stop.stop_name.match(/#(\d+)/);
            if (match) {
              processedStop.absolute_sequence = parseInt(match[1]);
            } else if (stop.stop_sequence !== undefined && stop.stop_sequence > 0) {
              processedStop.absolute_sequence = stop.stop_sequence;
            } else {
              processedStop.absolute_sequence = 999999;
            }
          } else {
            processedStop.absolute_sequence =
              (stop.stop_sequence !== undefined && stop.stop_sequence > 0)
                ? stop.stop_sequence
                : 999999;
          }
          
          return processedStop;
        });
        
        // Sort stops by absolute_sequence
        const sortedStops = [...processedStops].sort((a, b) => {
          return (a.absolute_sequence || 999999) - (b.absolute_sequence || 999999);
        });
        
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
          
          // Calculate travel times and filter by time criteria
          const currentTime = new Date().toISOString();
          const gigsWithTravelTimePromises = nearbyGigs.map(async gig => {
            // Find the stop this gig is near
            const stop = ahead.find(s => s.stop_id === gig.stopId);
            
            if (!stop) return null;
            
            try {
              // Get estimated travel time from PTV API
              const travelTimeMinutes = await getEstimatedTravelTime(
                Number(stopId),
                stop.stop_id,
                Number(typeId)
              );
              
              // Check if gig is reachable in time
              const gigStartTime = `${gig.date}T${gig.start_time || '19:00:00'}`;
              const isReachable = isGigReachable(
                gigStartTime,
                currentTime,
                travelTimeMinutes
              );
              
              return {
                ...gig,
                travelTimeMinutes,
                isReachable
              };
            } catch (error) {
              console.error('Error getting travel time:', error);
              return null;
            }
          });
          
          // Wait for all travel time calculations to complete
          const gigsWithTravelTime = (await Promise.all(gigsWithTravelTimePromises))
            .filter(Boolean) as GigAhead[];
          
          // Filter to only include reachable gigs
          const reachableGigs = gigsWithTravelTime.filter(gig => gig.isReachable);
          
          setGigsAhead(reachableGigs);
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
              gigsAhead.map((gig) => (
                <div key={`${gig.id}-${gig.stopId}`} className="card p-4">
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
              ))
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