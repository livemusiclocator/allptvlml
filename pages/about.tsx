import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '@/components/Layout';

export default function About() {
  return (
    <Layout>
      <Head>
        <title>PTV-LML | About</title>
      </Head>
      
      <div className="container py-8">
        <div className="mb-8">
          <Link href="/" className="text-ptv-blue hover:underline mb-4 inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
          
          <h1 className="text-3xl font-bold text-ptv-blue mb-2 md:text-4xl">
            About PTV-LML
          </h1>
          <p className="text-gray-600">
            Learn more about this application and how it works.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">What is PTV-LML?</h2>
              <div className="flex items-center mb-4">
                <Image 
                  src="/images/LML_1_RGB.png" 
                  alt="Live Music Locator Logo" 
                  width={100} 
                  height={100} 
                  className="mr-4"
                />
                <p className="text-gray-700">
                  PTV-LML (Public Transport Victoria - Live Music Locator) is a web application that combines public transport information from the PTV API with live music event data to help users find gigs near public transport stops.
                </p>
              </div>
              <p className="text-gray-700 mb-4">
                Whether you're planning a night out or just exploring Melbourne's vibrant music scene, PTV-LML makes it easy to find live music events that are accessible via public transport.
              </p>
              <p className="text-gray-700">
                This application is built with Next.js and is designed to be mobile-friendly, making it easy to use on the go.
              </p>
            </div>
            
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">How It Works</h2>
              <p className="text-gray-700 mb-4">
                PTV-LML integrates two main data sources:
              </p>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium text-ptv-blue mb-2">PTV Timetable API</h3>
                <p className="text-gray-700 ml-4">
                  We use the official Public Transport Victoria API to fetch real-time data about routes, stops, and timetables. This allows us to display accurate and up-to-date information about public transport options, including trains, trams, buses, and SkyBus services.
                </p>
                <p className="text-gray-700 ml-4 mt-2">
                  PTV data is used under the <a 
                    href="https://www.ptv.vic.gov.au/footer/data-and-reporting/datasets/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >Creative Commons Attribution 4.0 International license</a>.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-music-purple mb-2">Live Music Locator API</h3>
                <p className="text-gray-700 ml-4">
                  We integrate with the Live Music Locator API to get information about current and upcoming live music events in Melbourne. This data is then cross-referenced with public transport stops to show you gigs that are easily accessible.
                </p>
                <p className="text-gray-700 ml-4 mt-2">
                  <a 
                    href="http://lml.live" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Live Music Locator
                  </a> technology is used with permission. Visit lml.live for more information about this service.
                </p>
              </div>
            </div>
            
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Features</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ptv-blue mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Browse all PTV routes by type (train, tram, bus, SkyBus)</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ptv-blue mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>View all stops for each route with proper sequencing</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ptv-blue mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Discover live music events near public transport stops</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ptv-blue mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Browse all live music events happening today</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ptv-blue mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Filter events by genre or search by name</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ptv-blue mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Mobile-friendly responsive design</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div>
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Technologies Used</h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-ptv-blue rounded-full mr-2"></span>
                  Next.js
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-ptv-blue rounded-full mr-2"></span>
                  React
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-ptv-blue rounded-full mr-2"></span>
                  TypeScript
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-ptv-blue rounded-full mr-2"></span>
                  TailwindCSS
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-ptv-blue rounded-full mr-2"></span>
                  PTV Timetable API
                </li>
                <li className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-ptv-blue rounded-full mr-2"></span>
                  Live Music Locator API
                </li>
              </ul>
            </div>
            
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">External Links</h2>
              <ul className="space-y-3 text-gray-700">
                <li>
                  <a 
                    href="https://www.ptv.vic.gov.au/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-ptv-blue hover:underline flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    PTV Official Website
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.ptv.vic.gov.au/footer/data-and-reporting/datasets/ptv-timetable-api/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-ptv-blue hover:underline flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    PTV API Documentation
                  </a>
                </li>
                <li>
                  <a 
                    href="http://lml.live" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-music-purple hover:underline flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    Live Music Locator
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/yourusername/ptv-lml" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-ptv-blue hover:underline flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a8 8 0 00-2.53 15.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0010 2z" clipRule="evenodd" />
                    </svg>
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
