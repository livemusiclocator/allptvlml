import Link from 'next/link';
import { useRouter } from 'next/router';

type RouteTypeCardProps = {
  id: number;
  name: string;
  icon: string;
  color: string;
};

export default function RouteTypeCard({ id, name, icon, color }: RouteTypeCardProps) {
  const router = useRouter();
  
  // Log routing information for debugging
  console.log('RouteTypeCard - Router info:', {
    pathname: router.pathname,
    asPath: router.asPath,
    basePath: router.basePath,
    query: router.query,
    isReady: router.isReady
  });
  // Function to get the appropriate icon
  const getIcon = () => {
    switch (icon) {
      case 'train':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="3" width="16" height="16" rx="2" />
            <path d="M4 11h16" />
            <path d="M12 3v16" />
            <path d="M8 19l-2 3" />
            <path d="M18 22l-2-3" />
          </svg>
        );
      case 'tram':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8Z" />
            <path d="M9 22v-2" />
            <path d="M15 22v-2" />
            <path d="M4 10V6a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" />
            <path d="M9 14h6" />
          </svg>
        );
      case 'bus':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6v6" />
            <path d="M16 6v6" />
            <path d="M2 12h20" />
            <path d="M7 18h10" />
            <rect x="4" y="6" width="16" height="12" rx="2" />
            <path d="M6 18v3" />
            <path d="M18 18v3" />
          </svg>
        );
      case 'skybus':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6v6" />
            <path d="M16 6v6" />
            <path d="M2 12h20" />
            <path d="M7 18h10" />
            <rect x="4" y="6" width="16" height="12" rx="2" />
            <path d="M6 18v3" />
            <path d="M18 18v3" />
            <path d="M2 6h20" />
            <path d="M4 2h16" />
          </svg>
        );
      default:
        // Fallback to bus icon for any other type
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6v6" />
            <path d="M16 6v6" />
            <path d="M2 12h20" />
            <path d="M7 18h10" />
            <rect x="4" y="6" width="16" height="12" rx="2" />
            <path d="M6 18v3" />
            <path d="M18 18v3" />
          </svg>
        );
    }
  };

  // Create the route path, ensuring it works with basePath
  const routePath = `/routes/${id}`;
  console.log(`RouteTypeCard - Generated route path: ${routePath} for ${name}`);
  
  return (
    <Link
      href={routePath}
      className="card hover:shadow-lg transition-shadow"
      onClick={(e) => {
        console.log(`Clicked on ${name} route card, navigating to ${routePath}`);
      }}
    >
      <div className={`p-6 flex flex-col items-center text-${color}`}>
        <div className="mb-4">{getIcon()}</div>
        <h2 className="text-xl font-semibold mb-2">{name}</h2>
        <p className="text-gray-600 text-sm text-center">
          View all {name.toLowerCase()} routes and stops
        </p>
        <div className="mt-2 text-xs text-gray-400">ID: {id}</div>
      </div>
    </Link>
  );
}
