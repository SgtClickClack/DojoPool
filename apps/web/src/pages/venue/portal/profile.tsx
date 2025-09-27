import ProtectedRoute from '@/components/Common/ProtectedRoute';
import VenuePortalLayout from '@/components/VenuePortal/VenuePortalLayout';

// Venue Profile Management Page
import VenueProfileForm from '@/components/venue/VenueProfileForm';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

interface VenueProfile {
  id: string;
  name: string;
  address: string;
  description: string;
  images: string[];
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  operatingHours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  amenities: string[];
  pricing: {
    tableRates: {
      weekdayHourly: number;
      weekendHourly: number;
      perGame: number;
      reservation: number;
    };
    serviceFees: {
      cueRental: number;
      ballSet: number;
      chalk: number;
      tournamentFee: number;
    };
  };
}

const VenueProfilePage: React.FC = () => {
  const router = useRouter();
  const [venueProfile, setVenueProfile] = useState<VenueProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development
  const mockVenueProfile: VenueProfile = {
    id: '1',
    name: 'Jade Tiger Pool Hall',
    address: '123 Collins Street, Melbourne VIC 3000',
    description:
      "Melbourne's premier pool venue featuring 12 professional tables, craft beer, and competitive tournaments.",
    images: ['/venue-main.jpg', '/venue-interior.jpg', '/venue-bar.jpg'],
    contactInfo: {
      phone: '+61 3 1234 5678',
      email: 'info@jadetiger.com.au',
      website: 'https://jadetiger.com.au',
    },
    operatingHours: {
      monday: { open: '16:00', close: '24:00' },
      tuesday: { open: '16:00', close: '24:00' },
      wednesday: { open: '16:00', close: '24:00' },
      thursday: { open: '16:00', close: '02:00' },
      friday: { open: '14:00', close: '04:00' },
      saturday: { open: '12:00', close: '04:00' },
      sunday: { open: '12:00', close: '24:00' },
    },
    amenities: [
      'Professional Tables',
      'Craft Beer',
      'Food Service',
      'WiFi',
      'Parking',
    ],
    pricing: {
      tableRates: {
        weekdayHourly: 15,
        weekendHourly: 20,
        perGame: 5,
        reservation: 25,
      },
      serviceFees: {
        cueRental: 3,
        ballSet: 2,
        chalk: 1,
        tournamentFee: 10,
      },
    },
  };

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchVenueProfile = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setVenueProfile(mockVenueProfile);
      } catch (err) {
        setError('Failed to load venue profile');
        console.error('Error fetching venue profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVenueProfile();
  }, []);

  const handleSave = async (updatedProfile: VenueProfile) => {
    try {
      setSaving(true);
      setError(null);

      // TODO: Replace with actual API call
      // await venueApi.updateProfile(updatedProfile);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setVenueProfile(updatedProfile);

      // Show success message
      alert('Venue profile updated successfully!');
    } catch (err) {
      setError('Failed to save venue profile');
      console.error('Error saving venue profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <VenuePortalLayout>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading venue profile...</p>
            </div>
          </div>
        </VenuePortalLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <VenuePortalLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
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
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </VenuePortalLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <VenuePortalLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Venue Profile
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your venue&apos;s information, hours, pricing, and
                amenities
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Back to Portal
            </button>
          </div>

          {/* Profile Form */}
          {venueProfile && (
            <VenueProfileForm
              venueProfile={venueProfile}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </div>
      </VenuePortalLayout>
    </ProtectedRoute>
  );
};

export default VenueProfilePage;
