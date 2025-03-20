import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';

export default function DebugPage() {
  const router = useRouter();
  const [envInfo, setEnvInfo] = useState<any>({});
  const [routerInfo, setRouterInfo] = useState<any>({});
  const [browserInfo, setBrowserInfo] = useState<any>({});

  useEffect(() => {
    // Collect environment variable information
    setEnvInfo({
      NEXT_PUBLIC_PTV_DEV_ID_EXISTS: !!process.env.NEXT_PUBLIC_PTV_DEV_ID,
      NEXT_PUBLIC_PTV_API_KEY_EXISTS: !!process.env.NEXT_PUBLIC_PTV_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      BASE_PATH: process.env.NODE_ENV === 'production' ? '/ptv-lml' : '',
    });

    // Collect router information
    setRouterInfo({
      pathname: router.pathname,
      asPath: router.asPath,
      basePath: router.basePath,
      query: router.query,
      isReady: router.isReady,
    });

    // Collect browser information
    if (typeof window !== 'undefined') {
      setBrowserInfo({
        userAgent: window.navigator.userAgent,
        location: window.location.href,
        localStorage: !!window.localStorage,
        indexedDB: !!window.indexedDB,
        cookiesEnabled: navigator.cookieEnabled,
      });
    }
  }, [router]);

  // Test PTV API
  const [apiTestResult, setApiTestResult] = useState<string>('Not tested');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const testPtvApi = async () => {
    setIsLoading(true);
    setApiTestResult('Testing...');
    
    try {
      // Import dynamically to avoid server-side issues
      const { getRouteTypes } = await import('@/lib/ptv-api');
      const result = await getRouteTypes();
      // Type assertion to access route_types
      const typedResult = result as { route_types?: Array<any> };
      setApiTestResult(`Success! Received ${typedResult.route_types?.length || 0} route types.`);
      console.log('API Test Result:', result);
    } catch (error) {
      console.error('API Test Error:', error);
      setApiTestResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>PTV-LML | Debug</title>
      </Head>

      <div className="container py-8">
        <h1 className="text-3xl font-bold text-ptv-blue mb-6">Debug Information</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
              {JSON.stringify(envInfo, null, 2)}
            </pre>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Router Information</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
              {JSON.stringify(routerInfo, null, 2)}
            </pre>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Browser Information</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
              {JSON.stringify(browserInfo, null, 2)}
            </pre>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">PTV API Test</h2>
            <button
              onClick={testPtvApi}
              disabled={isLoading}
              className="bg-ptv-blue text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
            >
              {isLoading ? 'Testing...' : 'Test PTV API'}
            </button>
            <div className="mt-4">
              <h3 className="font-medium">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded mt-2">{apiTestResult}</pre>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Navigation Tests</h2>
          <div className="flex flex-wrap gap-4">
            <a href="/" className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
              Home (HTML a tag)
            </a>
            <a href="/routes/0" className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
              Train Routes (HTML a tag)
            </a>
            <a href="/allgigs" className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
              All Gigs (HTML a tag)
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}