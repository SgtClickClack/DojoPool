import React, { useState } from 'react';

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

interface VenueProfileFormProps {
  venueProfile: VenueProfile;
  onSave: (profile: VenueProfile) => Promise<void>;
  saving: boolean;
}

const VenueProfileForm: React.FC<VenueProfileFormProps> = ({
  venueProfile,
  onSave,
  saving,
}) => {
  const [formData, setFormData] = useState<VenueProfile>(venueProfile);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (path: string, value: any) => {
    const keys = path.split('.');
    setFormData(prev => {
      const updated = { ...prev };
      let current: any = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleHoursChange = (day: string, type: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day as keyof typeof prev.operatingHours],
          [type]: value,
        },
      },
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const availableAmenities = [
    'Professional Tables',
    'Craft Beer',
    'Food Service',
    'WiFi',
    'Parking',
    'Snooker Tables',
    'Darts',
    'Pool Lessons',
    'Tournament Hosting',
    'Live Music',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venue Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter venue name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full address"
              required
            />
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your venue, its atmosphere, amenities, and what makes it special..."
            required
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.contactInfo.phone}
              onChange={(e) => handleNestedInputChange('contactInfo.phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 (555) 123-4567"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.contactInfo.email}
              onChange={(e) => handleNestedInputChange('contactInfo.email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="contact@venue.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.contactInfo.website || ''}
              onChange={(e) => handleNestedInputChange('contactInfo.website', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://"
            />
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h3>
        <div className="space-y-4">
          {Object.entries(formData.operatingHours).map(([day, hours]) => (
            <div key={day} className="flex items-center space-x-4">
              <div className="w-24">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {day}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  value={hours.open}
                  onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="09:00"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={hours.close}
                  onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="17:00"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableAmenities.map((amenity) => (
            <label key={amenity} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.amenities.includes(amenity)}
                onChange={() => handleAmenityToggle(amenity)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>

        {/* Table Rates */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Table Rates</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weekday Hourly ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.pricing.tableRates.weekdayHourly}
                onChange={(e) => handleNestedInputChange('pricing.tableRates.weekdayHourly', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="15.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weekend Hourly ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.pricing.tableRates.weekendHourly}
                onChange={(e) => handleNestedInputChange('pricing.tableRates.weekendHourly', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="20.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Per Game ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.pricing.tableRates.perGame}
                onChange={(e) => handleNestedInputChange('pricing.tableRates.perGame', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reservation ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.pricing.tableRates.reservation}
                onChange={(e) => handleNestedInputChange('pricing.tableRates.reservation', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="25.00"
                required
              />
            </div>
          </div>
        </div>

        {/* Service Fees */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Service Fees</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cue Rental ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.pricing.serviceFees.cueRental}
                onChange={(e) => handleNestedInputChange('pricing.serviceFees.cueRental', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ball Set ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.pricing.serviceFees.ballSet}
                onChange={(e) => handleNestedInputChange('pricing.serviceFees.ballSet', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chalk ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.pricing.serviceFees.chalk}
                onChange={(e) => handleNestedInputChange('pricing.serviceFees.chalk', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Fee ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.pricing.serviceFees.tournamentFee}
                onChange={(e) => handleNestedInputChange('pricing.serviceFees.tournamentFee', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10.00"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default VenueProfileForm;
