import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path: string) => {
    return router.pathname === path ? 'text-ptv-blue font-semibold' : 'text-gray-700 hover:text-ptv-blue';
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-ptv-blue">PTV-LML</span>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className={`${isActive('/')} transition-colors`}>
              Home
            </Link>
            <Link href="/routes" className={`${isActive('/routes')} transition-colors`}>
              Routes
            </Link>
            <Link href="/allgigs" className={`${isActive('/allgigs')} transition-colors`}>
              Live Music
            </Link>
            <Link href="/about" className={`${isActive('/about')} transition-colors`}>
              About
            </Link>
          </nav>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <ul className="space-y-4">
              <li>
                <Link href="/" className={`${isActive('/')} block py-2`} onClick={toggleMenu}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/routes" className={`${isActive('/routes')} block py-2`} onClick={toggleMenu}>
                  Routes
                </Link>
              </li>
              <li>
                <Link href="/allgigs" className={`${isActive('/allgigs')} block py-2`} onClick={toggleMenu}>
                  Live Music
                </Link>
              </li>
              <li>
                <Link href="/about" className={`${isActive('/about')} block py-2`} onClick={toggleMenu}>
                  About
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
