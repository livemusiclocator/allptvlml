import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function StopsAheadRedirect() {
  const router = useRouter();
  const { typeId, routeId, stopId, directionId } = router.query;
  
  useEffect(() => {
    if (!typeId || !routeId || !stopId || !directionId) return;
    
    // Redirect to the new URL structure
    router.replace(`/routes/${typeId}/${routeId}/direction/${directionId}/stop/${stopId}/stops-ahead`);
  }, [typeId, routeId, stopId, directionId, router]);
  
  return (
    <div className="container py-8 text-center">
      <p>Redirecting...</p>
    </div>
  );
}