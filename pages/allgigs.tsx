import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { getTodaysGigs } from '@/lib/lml-api';
import type { Gig } from '@/lib/lml-api';

export default function AllGigs() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchGigs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we have cached data
        const cachedData = localStorage.getItem('all_gigs');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          setGigs(parsed.gigs);
          setLoading(false);
          
          // Refresh in background if cache is older than 1 hour
          const cacheTimestamp = localStorage.getItem('all_gigs_timestamp');
          if (cacheTimestamp && Date.now() - parseInt(cacheTimestamp) > 3600000) {
            refreshGigs();
          }
          return;
        }
        
        await refreshGigs();
      } catch (err) {
        setError('Failed to load gigs. Please try again later.');
        setLoading(false);
        console.error('Error fetching gigs:', err);
      }
    };
    
    const refreshGigs = async () => {
      const gigsData = await getTodaysGigs();
      setGigs(gigsData);
      setLoading(false);
      
      // Cache the data
      localStorage.setItem('all_gigs', JSON.stringify({ gigs: gigsData }));
      localStorage.setItem('all_gigs_timestamp', Date.now().toString());
    };
    
    fetchGigs();
  }, []);
  
  // Extract all unique genres from gigs
  const allGenres = Array.from(
    new Set(
      gigs.flatMap(gig => gig.genre_tags)
    )
  ).sort();
  
  // Filter gigs based on search term and genre filter
  const filteredGigs = gigs.filter(gig => {
    const matchesSearch = 
      gig.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.venue.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGenre = 
      !filterGenre || gig.genre_tags.includes(filterGenre);
    
    return matchesSearch && matchesGenre;
  });
  
  // Format time for display
  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Time TBA';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      
      return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };
  
  return (
    <Layout>
      <Head>
        <title>PTV-LML | Live Music Events</title>
      </Head>
      
      <div className="container py-8">
        <div className="mb-8">
          <Link href="/" className="text-ptv-blue hover:underline mb-4 inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
          
          <h1 className="text-3xl font-bold text-music-purple mb-2 md:text-4xl">
            Live Music Events
          </h1>
          <p className="text-gray-600">
            Discover today's live music events in Melbourne.
          </p>
        </div>
        
        {/* Search and filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search events or venues..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-music-purple"
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
          
          <div className="md:w-64">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-music-purple"
              value={filterGenre || ''}
              onChange={(e) => setFilterGenre(e.target.value || null)}
            >
              <option value="">All Genres</option>
              {allGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-music-purple"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGigs.length > 0 ? (
              filteredGigs.map((gig) => (
                <div key={gig.id} className="card hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-2">{gig.name}</h2>
                    
                    <div className="mb-4">
                      <div className="flex items-center text-gray-600 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-music-purple" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span>{gig.venue.name}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-music-purple" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span>{new Date(gig.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-music-purple" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span>{formatTime(gig.start_time)}</span>
                      </div>
                    </div>
                    
                    {gig.genre_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {gig.genre_tags.map(genre => (
                          <span 
                            key={genre} 
                            className="bg-purple-100 text-music-purple px-2 py-1 rounded-md text-xs font-medium"
                            onClick={() => setFilterGenre(genre)}
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {gig.venue.website && (
                      <a 
                        href={gig.venue.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-music-purple hover:underline text-sm inline-flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                        Venue Website
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No events found matching your criteria.</p>
                <button 
                  className="mt-4 text-music-purple hover:underline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterGenre(null);
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
