import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Image 
                src="/images/LML_1_RGB.png" 
                alt="Live Music Locator Logo" 
                width={80} 
                height={80} 
                className="mr-3"
              />
              <h3 className="text-lg font-semibold">PTV-LML</h3>
            </div>
            <p className="text-gray-300 text-sm">
              A web application that displays Public Transport Victoria route information (including SkyBus) and integrates with live music gig data.
            </p>
            <p className="text-gray-300 text-sm mt-2">
              <a 
                href="http://lml.live" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Powered by Live Music Locator technology
              </a>
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/routes" className="hover:text-white transition-colors">
                  Routes
                </Link>
              </li>
              <li>
                <Link href="/allgigs" className="hover:text-white transition-colors">
                  Live Music
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">External Resources</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>
                <a 
                  href="https://www.ptv.vic.gov.au/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  PTV Official Website
                </a>
              </li>
              <li>
                <a 
                  href="https://www.ptv.vic.gov.au/footer/data-and-reporting/datasets/ptv-timetable-api/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  PTV API Documentation
                </a>
              </li>
              <li>
                <a 
                  href="http://lml.live" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Live Music Locator
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/yourusername/ptv-lml" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>
            &copy; {currentYear} PTV-LML. All rights reserved.
          </p>
          <p className="mt-2">
            PTV data is used under <a href="https://www.ptv.vic.gov.au/footer/data-and-reporting/datasets/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Creative Commons Attribution 4.0 International license</a>.
          </p>
          <p className="mt-2">
            This is an unofficial application and is not affiliated with Public Transport Victoria.
          </p>
          <p className="mt-2">
            Live Music Locator technology used with permission. Visit <a href="http://lml.live" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">lml.live</a> for more information.
          </p>
        </div>
      </div>
    </footer>
  );
}
