import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '@/components/Layout';
import RouteTypeCard from '@/components/RouteTypeCard';

// Define route types
const routeTypes = [
  { id: 0, name: 'Train', icon: 'train', color: 'train-blue' },
  { id: 1, name: 'Tram', icon: 'tram', color: 'tram-green' },
  { id: 2, name: 'Bus', icon: 'bus', color: 'bus-orange' },
  { id: 3, name: 'V/Line', icon: 'train', color: 'train-blue' }
];

export default function Home() {
  const [loading, setLoading] = useState(false);

  return (
    <Layout>
      <Head>
        <title>PTV-LML | Home</title>
      </Head>

      <div className="container py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ptv-blue mb-2 md:text-4xl">
            PTV Route Viewer
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore Public Transport Victoria routes and discover live music events near stops.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routeTypes.map((routeType) => (
            <RouteTypeCard
              key={routeType.id}
              id={routeType.id}
              name={routeType.name}
              icon={routeType.icon}
              color={routeType.color}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/allgigs" className="btn btn-primary">
            View All Live Music Events
          </Link>
        </div>
      </div>
    </Layout>
  );
}
