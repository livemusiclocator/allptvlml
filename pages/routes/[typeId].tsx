import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { getRoutesByType } from '@/lib/ptv-api';

// Define route type names
const routeTypeNames = {
  '0': 'Train',
  '1': 'Tram',
  '2': 'Bus',
  '3': 'V/Line'
};

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
  route_gtfs_id: string;
}

interface RoutesResponse {
  routes: Route[];
  status: {
    version: string;
    health: number;
  };
}

export default function RoutesByType() {
  const router = useRouter();
  const { typeId } = router.query;
  
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Check if window is defined (client-side only)
  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    if (!typeId) return;
    
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we have cached data (client-side only)
        if (isClient) {
          try {
            const cachedData = localStorage.getItem(`routes_type_${typeId}`);
            if (cachedData) {
              setRoutes(JSON.parse(cachedData));
              setLoading(false);
              
              // Refresh in background if cache is older than 1 day
              const cacheTimestamp = localStorage.getItem(`routes_type_${typeId}_timestamp`);
              if (cacheTimestamp && Date.now() - parseInt(cacheTimestamp) > 86400000) {
                refreshRoutes();
              }
              return;
            }
          } catch (localStorageError) {
            console.error('LocalStorage error:', localStorageError);
            // Continue with API request if localStorage fails
          }
        }
        
        await refreshRoutes();
      } catch (err) {
        setError('Failed to load routes. Please try again later.');
        setLoading(false);
        console.error('Error fetching routes:', err);
      }
    };
    
    const refreshRoutes = async () => {
      try {
        console.log(`Fetching routes for type ID: ${typeId}`);
        
        // Log environment variables (without exposing sensitive data)
        console.log('Environment check:', {
          devIdExists: !!process.env.NEXT_PUBLIC_PTV_DEV_ID,
          apiKeyExists: !!process.env.NEXT_PUBLIC_PTV_API_KEY,
          nodeEnv: process.env.NODE_ENV,
          basePath: process.env.NODE_ENV === 'production' ? '/ptv-lml' : ''
        });
        
        let response: RoutesResponse;
        
        // Use PTV API for all route types
        console.log(`Using PTV API for route type ${typeId}`);
        response = await getRoutesByType(Number(typeId)) as RoutesResponse;
        
        console.log('API Response received:', {
          status: response.status,
          routesCount: response.routes?.length || 0
        });
        
        const sortedRoutes = response.routes.sort((a, b) => {
          // Sort by route number if available, otherwise by name
          if (a.route_number && b.route_number) {
            return a.route_number.localeCompare(b.route_number, undefined, { numeric: true });
          }
          return a.route_name.localeCompare(b.route_name);
        });
        
        console.log(`Sorted ${sortedRoutes.length} routes`);
        setRoutes(sortedRoutes);
        setLoading(false);
        
        // Cache the data (client-side only)
        if (isClient) {
          try {
            localStorage.setItem(`routes_type_${typeId}`, JSON.stringify(sortedRoutes));
            localStorage.setItem(`routes_type_${typeId}_timestamp`, Date.now().toString());
            console.log('Routes cached successfully');
          } catch (localStorageError) {
            console.error('LocalStorage saving error:', localStorageError);
            // Continue even if localStorage fails
          }
        }
      } catch (err) {
        console.error('Error in refreshRoutes:', err);
        if (err instanceof Error) {
          console.error('Error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack
          });
        }
        throw err; // Re-throw to be caught by the outer try/catch
      }
    };
    
    fetchRoutes();
  }, [typeId, isClient]);
  
  // Filter routes based on search term
  const filteredRoutes = routes.filter(route => 
    route.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (route.route_number && route.route_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const routeTypeName = typeId ? routeTypeNames[typeId as keyof typeof routeTypeNames] || 'Routes' : 'Routes';
  const routeTypeColor = typeId ? routeTypeColors[typeId as keyof typeof routeTypeColors] || 'ptv-blue' : 'ptv-blue';
  
  return (
    <Layout>
      <Head>
        <title>PTV-LML | {routeTypeName} Routes</title>
      </Head>
      
      <div className="container py-8">
        <div className="mb-8">
          <Link href="/" className="text-ptv-blue hover:underline mb-4 inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
          
          <h1 className={`text-3xl font-bold text-${routeTypeColor} mb-2 md:text-4xl`}>
            {routeTypeName} Routes
          </h1>
          <p className="text-gray-600">
            Select a route to view its stops and live music events nearby.
          </p>
        </div>
        
        {/* Search box */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search routes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ptv-blue"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoutes.length > 0 ? (
              filteredRoutes.map((route) => (
                <Link
                  key={route.route_id}
                  href={`/routes/${typeId}/${route.route_id}`}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="p-4 border-l-4 border-ptv-blue">
                    <div className="flex items-center">
                      {route.route_number && (
                        <span className={`text-white bg-${routeTypeColor} px-2 py-1 rounded-md text-sm font-medium mr-3`}>
                          {route.route_number}
                        </span>
                      )}
                      <h2 className="text-lg font-semibold">
                        {route.route_number && Number(typeId) === 1 && `Number ${route.route_number}: `}
                        {route.route_number && Number(typeId) === 2 && `Route ${route.route_number}: `}
                        {route.route_name}
                      </h2>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No routes found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
