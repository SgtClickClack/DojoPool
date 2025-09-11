'use client';

import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-white shadow">
      <nav className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold text-gray-700">
            <Link href="/">Dojo Pool</Link>
          </div>
          <div className="flex items-center">
            <Link
              href="/leaderboard"
              className="text-gray-600 hover:text-gray-800 px-3 py-2"
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
