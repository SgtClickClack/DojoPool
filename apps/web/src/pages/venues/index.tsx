import VenueCard from '@/components/venue/VenueCard';
import { getVenues } from '@/services/APIService';
import { Venue } from '@/types/venue';
import React, { useState } from 'react';
import useSWR from 'swr';

interface VenueFilters {
  search: string;
  city: string;
  state: string;
  hasTournaments: boolean;
  hasFood: boolean;
  hasBar: boolean;
}

const VenueDiscoveryPage: React.FC = () => {
  const [filters, setFilters] = useState<VenueFilters>({
    search: '',
    city: '',
    state: '',
    hasTournaments: false,
    hasFood: false,
    hasBar: false,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const { data, error, isLoading, mutate } = useSWR(
    ['venues', filters, pagination.page, pagination.limit],
    ([, f, page, limit]) =>
      getVenues({
        ...(f as VenueFilters),
        page: page as number,
        limit: limit as number,
      })
  );

  const venues: Venue[] = data?.venues ?? [];
  const total: number = data?.total ?? 0;
  const totalPages: number = data?.totalPages ?? 0;

  const handleFilterChange = (
    key: keyof VenueFilters,
    value: string | boolean
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    mutate();
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleVenueClick = (venue: Venue) => {
    // Navigate to venue detail page or open modal
    console.log('Venue clicked:', venue);
    // Navigation to venue detail - placeholder implementation
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      city: '',
      state: '',
      hasTournaments: false,
      hasFood: false,
      hasBar: false,
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  Failed to fetch venues. Please try again.
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => mutate()}
                    className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🏓 Discover Dojos
            </h1>
            <p className="text-xl text-gray-600">
              Find the perfect pool venue near you
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Search Venues
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Search venues by name..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  placeholder="City"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  placeholder="State"
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasTournaments}
                  onChange={(e) =>
                    handleFilterChange('hasTournaments', e.target.checked)
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">🏆 Tournaments</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasFood}
                  onChange={(e) =>
                    handleFilterChange('hasFood', e.target.checked)
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">🍕 Food</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasBar}
                  onChange={(e) =>
                    handleFilterChange('hasBar', e.target.checked)
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">🍺 Bar</span>
              </label>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Clear Filters
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : venues.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏓</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No venues found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or check back later.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, total)} of{' '}
                  {total} venues
                </p>
              </div>

              {/* Venues Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {venues.map((venue) => (
                  <VenueCard
                    key={venue.id}
                    venue={venue}
                    onClick={handleVenueClick}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <span className="px-3 py-2 text-sm text-gray-700">
                    Page {pagination.page} of {totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueDiscoveryPage;
