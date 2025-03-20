import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Custom404() {
  const router = useRouter();

  // Auto-redirect to home page after 5 seconds
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-ptv-blue mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. You'll be redirected to the home page in 5 seconds.
        </p>
        <Link href="/" className="btn btn-primary">
          Go to Home Page
        </Link>
      </div>
    </div>
  );
}
