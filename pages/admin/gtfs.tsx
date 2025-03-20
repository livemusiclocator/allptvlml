import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Head from 'next/head';
import Link from 'next/link';

// Define interface for GTFS source
interface GTFSSource {
  name: string;
  routeType: number;
  version: string;
  fileSize: number;
  fileHash: string;
  fileExists?: boolean;
}

// Define interface for GTFS versions
interface GTFSVersions {
  lastUpdated: string;
  sources: GTFSSource[];
  daysSinceUpdate?: number;
  status?: string;
}

export default function GTFSAdmin() {
  const [status, setStatus] = useState<GTFSVersions | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    fetchStatus();
  }, []);
  
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gtfs/status');
      
      if (!response.ok) {
        const errorData = await response.json();
        setMessage(`Error: ${errorData.error || errorData.message || 'Unknown error'}`);
        setStatus(null);
      } else {
        const data = await response.json();
        setStatus(data);
        setMessage('');
      }
    } catch (error) {
      setMessage(`Error fetching GTFS status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };
  
  const triggerUpdate = async () => {
    try {
      setUpdating(true);
      setMessage('Updating GTFS data... This may take a few minutes.');
      
      const response = await fetch('/api/gtfs/update', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('GTFS data update initiated. Check logs for details.');
        // Wait a bit before refreshing status to allow update to complete
        setTimeout(() => {
          fetchStatus();
        }, 5000);
      } else {
        setMessage(`Error updating GTFS data: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`Error updating GTFS data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  return (
    <Layout>
      <Head>
        <title>PTV-LML | GTFS Admin</title>
      </Head>
      
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">GTFS Data Management</h1>
          <Link href="/" className="text-ptv-blue hover:underline">
            Back to Home
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ptv-blue"></div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">GTFS Status</h2>
              
              {status ? (
                <div className="bg-gray-100 p-4 rounded-md">
                  <p className="mb-2">
                    <span className="font-semibold">Last Updated:</span> {new Date(status.lastUpdated).toLocaleString()}
                  </p>
                  <p className="mb-2">
                    <span className="font-semibold">Days Since Update:</span> {status.daysSinceUpdate}
                  </p>
                  <p className="mb-4">
                    <span className="font-semibold">Status:</span>{' '}
                    <span className={status.status === 'current' ? 'text-green-600' : 'text-red-600'}>
                      {status.status}
                    </span>
                  </p>
                  
                  <h3 className="text-lg font-semibold mt-4 mb-2">Sources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {status.sources.map((source) => (
                      <div key={source.name} className="bg-white p-4 rounded-md shadow-sm">
                        <p className="font-semibold text-lg">{source.name}</p>
                        <p className="text-gray-600 mb-2">Route Type: {source.routeType}</p>
                        <p className="mb-1">
                          <span className="font-medium">Version:</span> {source.version}
                        </p>
                        <p className="mb-1">
                          <span className="font-medium">File Size:</span> {formatFileSize(source.fileSize)}
                        </p>
                        <p className="mb-1">
                          <span className="font-medium">File Exists:</span>{' '}
                          <span className={source.fileExists ? 'text-green-600' : 'text-red-600'}>
                            {source.fileExists ? 'Yes' : 'No'}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 truncate" title={source.fileHash}>
                          <span className="font-medium">Hash:</span> {source.fileHash.substring(0, 16)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
                  <p>No GTFS status information available. You may need to run the update script for the first time.</p>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Manual Update</h2>
              <p className="mb-4 text-gray-600">
                Click the button below to manually update GTFS data. This process may take a few minutes.
              </p>
              
              <button
                className="bg-ptv-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                onClick={triggerUpdate}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update GTFS Data Now'}
              </button>
              
              {message && (
                <div className={`mt-4 p-3 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                  {message}
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Documentation</h2>
              <p className="mb-2">
                For more information on GTFS data updates, please refer to the{' '}
                <Link href="/docs/gtfs-update-guide.md" className="text-ptv-blue hover:underline" target="_blank">
                  GTFS Update Guide
                </Link>.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}