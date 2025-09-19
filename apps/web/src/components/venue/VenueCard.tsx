import { type Venue } from '@/types/venue';
import React from 'react';

interface VenueCardProps {
  venue: Venue;
  onClick?: (venue: Venue) => void;
  incomeRate?: number;
  defenseLevel?: number;
  isLeader?: boolean;
  onUpgrade?: (venueId: string) => void;
}

const VenueCard: React.FC<VenueCardProps> = ({
  venue,
  onClick,
  incomeRate,
  defenseLevel,
  isLeader,
  onUpgrade,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(venue);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'CLOSED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAddress = (address: Venue['address']) => {
    if (!address) return 'Address not available';

    const parts = [
      address.street,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ].filter(Boolean);

    return parts.join(', ');
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }

    if (hasHalfStar) {
      stars.push('☆');
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push('☆');
    }

    return stars.join('');
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      {/* Venue Image */}
      <div className="relative h-48 bg-gray-200">
        {venue.images && venue.images.length > 0 ? (
          <img
            src={venue.images[0]}
            alt={venue.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-gray-400">🏓</span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
              venue.status
            )}`}
          >
            {venue.status}
          </span>
        </div>

        {/* Rating Badge */}
        {venue.rating && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium">
            {getRatingStars(venue.rating)} {venue.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Venue Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {venue.name}
        </h3>

        <p className="text-sm text-gray-600 mb-3">
          {formatAddress(venue.address)}
        </p>

        {venue.description && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {venue.description}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {venue.tables?.length || 0}
            </div>
            <div className="text-xs text-gray-500">Tables</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {venue.reviews?.length || 0}
            </div>
            <div className="text-xs text-gray-500">Reviews</div>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-3">
          {venue.features?.includes('TOURNAMENTS') && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              🏆 Tournaments
            </span>
          )}
          {venue.features?.includes('FOOD') && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              🍕 Food
            </span>
          )}
          {venue.features?.includes('BAR') && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              🍺 Bar
            </span>
          )}
          {venue.features?.includes('PARKING') && (
            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
              🚗 Parking
            </span>
          )}
        </div>

        {incomeRate !== undefined && (
          <div className="text-sm text-gray-700 mt-2">
            Income Rate: +{incomeRate} 💰/hr
          </div>
        )}
        {defenseLevel !== undefined && (
          <div className="text-sm text-gray-700 mt-1">
            Defense Level: {defenseLevel}
          </div>
        )}
        {isLeader && onUpgrade && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering onClick
              onUpgrade(venue.id);
            }}
            className="mt-3 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Upgrade
          </button>
        )}

        {/* Distance */}
        {venue.distance && (
          <div className="text-sm text-gray-500 text-center">
            {venue.distance < 1
              ? `${Math.round(venue.distance * 1000)}m away`
              : `${venue.distance.toFixed(1)}km away`}
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueCard;
