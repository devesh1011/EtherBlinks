'use client';

import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 shadow-lg rounded-2xl border border-cyan-800 px-12">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-extrabold text-cyan-400 tracking-tight drop-shadow">
          EtherBlink <span className="ml-1">⚡️</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link
            href="/create-link"
            className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-2 px-5 rounded-lg shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2"
          >
            Create Link
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;