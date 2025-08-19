import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
// TODO: Implement DojoService and OnboardingService
// import {
//   DojoService,
//   type DojoCandidate,
//   type DojoNomination,
// } from '../../src/services/DojoService';
// import { OnboardingService } from '../../src/services/OnboardingService';

// Mock implementations for development
interface DojoCandidate {
  id: string;
  name: string;
  address: string;
  distance: number;
  status: 'verified' | 'unconfirmed' | 'pending_verification';
  photo: string;
  latitude: number;
  longitude: number;
}

interface DojoNomination {
  id?: string;
  dojoId?: string;
  nominatorId?: string;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  contactInfo?: string;
}

const DojoService = {
  getCandidates: async (lat: number, lng: number, radius: number) => {
    return MOCK_DOJOS;
  },
  nominateDojo: async (nomination: DojoNomination) => {
    console.log('Nominating dojo:', nomination);
    return {
      success: true,
      nominationId: nomination.id,
      message: 'Dojo nominated successfully',
    };
  },
};

const OnboardingService = {
  getCurrentLocation: async () => {
    return {
      latitude: -27.4568,
      longitude: 153.0364,
      city: 'Brisbane',
    };
  },
  getOnboardingState: () => ({
    step: 'choose-dojo',
    location: null,
  }),
  saveOnboardingState: (state: any) => {
    console.log('Saving onboarding state:', state);
  },
  completeOnboarding: async (dojoId: string) => {
    console.log('Completing onboarding for dojo:', dojoId);
    return {
      success: true,
      dojoId,
      message: 'Onboarding completed successfully',
    };
  },
};

// Mock data for development - remove in production
const MOCK_DOJOS: DojoCandidate[] = [
  {
    id: '1',
    name: 'The Empire Hotel',
    address: '339 Brunswick St, Fortitude Valley QLD 4006',
    distance: 120,
    status: 'verified',
    photo: '/images/empire-hotel.jpg',
    latitude: -27.4568,
    longitude: 153.0364,
  },
  {
    id: '2',
    name: 'The Wickham',
    address: '308 Wickham St, Fortitude Valley QLD 4006',
    distance: 300,
    status: 'unconfirmed',
    photo: '/images/wickham.jpg',
    latitude: -27.4589,
    longitude: 153.0345,
  },
  {
    id: '3',
    name: 'The Brightside',
    address: '27 Warner St, Fortitude Valley QLD 4006',
    distance: 450,
    status: 'pending_verification',
    photo: '/images/brightside.jpg',
    latitude: -27.4601,
    longitude: 153.0321,
  },
];

const ChooseDojoScreen: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    city: string;
  } | null>(null);
  const [dojos, setDojos] = useState<DojoCandidate[]>([]);
  const [selectedDojo, setSelectedDojo] = useState<DojoCandidate | null>(null);
  const [showNominationForm, setShowNominationForm] = useState(false);
  const [nominating, setNominating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  useEffect(() => {
    initializeOnboarding();
  }, []);

  useEffect(() => {
    if (location && mapRef.current && !map) {
      initializeMap();
    }
  }, [location, mapRef.current]);

  useEffect(() => {
    if (map && dojos.length > 0) {
      addMarkersToMap();
    }
  }, [map, dojos]);

  const initializeOnboarding = async () => {
    try {
      setLoading(true);

      // Get user's location
      const userLocation = await OnboardingService.getCurrentLocation();
      setLocation(userLocation);

      // Get dojo candidates
      const candidates = await DojoService.getCandidates(
        userLocation.latitude,
        userLocation.longitude,
        5000
      );

      // Use mock data for development
      setDojos(MOCK_DOJOS);

      // Update onboarding state
      const state = OnboardingService.getOnboardingState();
      state.step = 'choose-dojo';
      state.location = userLocation;
      OnboardingService.saveOnboardingState(state);
    } catch (error) {
      console.error('Error initializing onboarding:', error);
      // Fallback to mock data
      setDojos(MOCK_DOJOS);
      setLocation({
        latitude: -27.4568,
        longitude: 153.0364,
        city: 'Fortitude Valley',
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !location) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: location.latitude, lng: location.longitude },
      zoom: 15,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    });

    setMap(mapInstance);
  };

  const addMarkersToMap = () => {
    if (!map) return;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];

    dojos.forEach((dojo) => {
      const marker = new google.maps.Marker({
        position: { lat: dojo.latitude, lng: dojo.longitude },
        map: map,
        title: dojo.name,
        icon: {
          url: getMarkerIcon(dojo.status),
          scaledSize: new google.maps.Size(32, 32),
        },
      });

      marker.addListener('click', () => {
        setSelectedDojo(dojo);
        // Zoom to marker
        map.panTo({ lat: dojo.latitude, lng: dojo.longitude });
        map.setZoom(17);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  };

  const getMarkerIcon = (status: string): string => {
    switch (status) {
      case 'verified':
        return '/images/markers/verified-dojo-marker.svg';
      case 'unconfirmed':
        return '/images/markers/unconfirmed-dojo-marker.svg';
      case 'pending_verification':
        return '/images/markers/pending-dojo-marker.svg';
      default:
        return '/images/markers/default-dojo-marker.svg';
    }
  };

  const handleDojoSelect = (dojo: DojoCandidate) => {
    setSelectedDojo(dojo);

    // Animate map zoom to selected dojo
    if (map) {
      map.panTo({ lat: dojo.latitude, lng: dojo.longitude });
      map.setZoom(17);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!selectedDojo) return;

    try {
      setCompleting(true);
      const result = await OnboardingService.completeOnboarding(
        selectedDojo.id
      );

      if (result.success) {
        // Redirect to main game
        router.push('/');
      } else {
        alert('Error completing onboarding: ' + result.message);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Error completing onboarding. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  const handleNominateDojo = async (nomination: DojoNomination) => {
    try {
      setNominating(true);
      const result = await DojoService.nominateDojo(nomination);

      if (result.success) {
        alert(
          'Dojo nomination sent! Thank you for helping build the DojoPool world!'
        );
        setShowNominationForm(false);
        // Refresh dojo list
        if (location) {
          const candidates = await DojoService.getCandidates(
            location.latitude,
            location.longitude,
            5000
          );
          setDojos([...dojos, ...candidates]);
        }
      } else {
        alert('Error nominating dojo: ' + result.message);
      }
    } catch (error) {
      console.error('Error nominating dojo:', error);
      alert('Error nominating dojo. Please try again.');
    } finally {
      setNominating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
            Verified
          </span>
        );
      case 'unconfirmed':
        return (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
            Unconfirmed
          </span>
        );
      case 'pending_verification':
        return (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Finding Dojos near you...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Choose Your Home Dojo - DojoPool</title>
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          async
          defer
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        {/* Header */}
        <div className="bg-black bg-opacity-50 p-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-2">
              Choose Your Home Dojo
            </h1>
            <p className="text-blue-200">
              {location?.city || 'Fortitude Valley'} • Select where your journey
              begins
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map Section */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div
                ref={mapRef}
                className="w-full h-96"
                style={{ minHeight: '400px' }}
              />
            </div>

            {/* Dojo List Section */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Nearby Dojos
                </h2>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {dojos.map((dojo) => (
                    <div
                      key={dojo.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedDojo?.id === dojo.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => handleDojoSelect(dojo)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                            {dojo.photo ? (
                              <img
                                src={dojo.photo}
                                alt={dojo.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                                <span className="text-gray-600 text-xs">
                                  No Photo
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {dojo.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {dojo.address}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-500">
                              {dojo.distance}m away
                            </span>
                            {getStatusBadge(dojo.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nominate New Dojo */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Can't find your Dojo?
                </h3>
                <button
                  onClick={() => setShowNominationForm(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  Nominate a New Dojo
                </button>
              </div>

              {/* Complete Button */}
              {selectedDojo && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Selected: {selectedDojo.name}
                    </h3>
                    <button
                      onClick={handleCompleteOnboarding}
                      disabled={completing}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {completing ? 'Setting Home Dojo...' : 'Set as Home Dojo'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nomination Modal */}
        {showNominationForm && (
          <NominationModal
            onClose={() => setShowNominationForm(false)}
            onSubmit={handleNominateDojo}
            loading={nominating}
            location={location}
          />
        )}
      </div>
    </>
  );
};

// Nomination Modal Component
interface NominationModalProps {
  onClose: () => void;
  onSubmit: (nomination: DojoNomination) => Promise<void>;
  loading: boolean;
  location: { latitude: number; longitude: number; city: string } | null;
}

const NominationModal: React.FC<NominationModalProps> = ({
  onClose,
  onSubmit,
  loading,
  location,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    contactInfo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    const nomination: DojoNomination = {
      name: formData.name,
      address: formData.address,
      latitude: location.latitude,
      longitude: location.longitude,
      description: formData.description || undefined,
      contactInfo: formData.contactInfo || undefined,
    };

    await onSubmit(nomination);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Nominate a New Dojo
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., The Empire Hotel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 339 Brunswick St, Fortitude Valley"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Tell us about this venue..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Info (Optional)
            </label>
            <input
              type="text"
              value={formData.contactInfo}
              onChange={(e) =>
                setFormData({ ...formData, contactInfo: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Phone number or email"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Nomination'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChooseDojoScreen;
