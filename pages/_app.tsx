import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Handle 404 errors by redirecting to home page
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Custom 404 handling logic if needed
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  // Add debug output to see if environment variables are loaded
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_PTV_DEV_ID) {
      console.log('Environment variables loaded:');
      console.log('DEV_ID:', process.env.NEXT_PUBLIC_PTV_DEV_ID);
      console.log('API_KEY exists:', !!process.env.NEXT_PUBLIC_PTV_API_KEY);
    } else {
      console.error('Environment variables not loaded!');
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content="PTV Route Viewer with Live Music Integration" />
        <meta name="theme-color" content="#0072ce" />
        <title>PTV-LML | Public Transport Victoria - Live Music Locator</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      {/* Pass environment variables explicitly as props if needed */}
      <Component 
        {...pageProps} 
      />
    </>
  );
}
