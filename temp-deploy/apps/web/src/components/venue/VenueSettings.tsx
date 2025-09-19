'use client';

import {
  BellIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  KeyIcon,
  PhoneIcon,
  PhotoIcon,
  ShieldCheckIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';

interface Venue {
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
  stats: {
    totalTables: number;
    activePlayers: number;
    monthlyRevenue: number;
    averageRating: number;
    totalTournaments: number;
  };
}

interface VenueSettingsProps {
  venue: Venue;
}

const VenueSettings: React.FC<VenueSettingsProps> = ({ venue }) => {
  const [activeSection, setActiveSection] = useState<
    'profile' | 'hours' | 'pricing' | 'amenities' | 'notifications' | 'security'
  >('profile');
  const [isEditing, setIsEditing] = useState(false);

  const sections = [
    {
      id: 'profile',
      label: 'Venue Profile',
      icon: BuildingStorefrontIcon,
      description: 'Basic information and branding',
    },
    {
      id: 'hours',
      label: 'Operating Hours',
      icon: ClockIcon,
      description: 'Business hours and availability',
    },
    {
      id: 'pricing',
      label: 'Pricing',
      icon: CurrencyDollarIcon,
      description: 'Table rates and service fees',
    },
    {
      id: 'amenities',
      label: 'Amenities',
      icon: TagIcon,
      description: 'Features and services offered',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellIcon,
      description: 'Communication preferences',
    },
    {
      id: 'security',
      label: 'Security',
      icon: ShieldCheckIcon,
      description: 'Access control and permissions',
    },
  ];

  const daysOfWeek = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const formatDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Venue Settings</h2>
          <p className="text-gray-600">
            Manage your venue's information and preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <motion.button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as any)}
                    className={`w-full flex items-start space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{section.label}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {section.description}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeSection === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Venue Profile
                  </h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    {isEditing ? 'Save Changes' : 'Edit Profile'}
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Venue Name
                      </label>
                      <input
                        type="text"
                        defaultValue={venue.name}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        defaultValue={venue.address}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      defaultValue={venue.description}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          defaultValue={venue.contactInfo.phone}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          defaultValue={venue.contactInfo.email}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <div className="relative">
                        <GlobeAltIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="url"
                          defaultValue={venue.contactInfo.website || ''}
                          disabled={!isEditing}
                          placeholder="https://yourwebsite.com"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Venue Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue Images
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {venue.images.map((image, index) => (
                        <div key={index} className="relative">
                          <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                            <PhotoIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          {isEditing && (
                            <button className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                          <PhotoIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'hours' && (
              <motion.div
                key="hours"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Operating Hours
                  </h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    {isEditing ? 'Save Changes' : 'Edit Hours'}
                  </button>
                </div>

                <div className="space-y-4">
                  {daysOfWeek.map((day) => {
                    const dayHours =
                      venue.operatingHours[
                        day as keyof typeof venue.operatingHours
                      ];

                    return (
                      <div
                        key={day}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-20">
                            <span className="font-medium text-gray-900">
                              {formatDayName(day)}
                            </span>
                          </div>

                          {isEditing ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="time"
                                defaultValue={dayHours.open}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <span className="text-gray-500">to</span>
                              <input
                                type="time"
                                defaultValue={dayHours.close}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                          ) : (
                            <span className="text-gray-600">
                              {dayHours.open} - {dayHours.close}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeSection === 'pricing' && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pricing & Rates
                  </h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    {isEditing ? 'Save Changes' : 'Edit Pricing'}
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Table Rates</h4>
                      <div className="space-y-3">
                        {[
                          { label: 'Per Hour (Weekday)', value: '$15' },
                          { label: 'Per Hour (Weekend)', value: '$20' },
                          { label: 'Per Game', value: '$5' },
                          { label: 'Table Reservation', value: '$25' },
                        ].map((rate) => (
                          <div
                            key={rate.label}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-gray-700">{rate.label}</span>
                            {isEditing ? (
                              <input
                                type="text"
                                defaultValue={rate.value}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              />
                            ) : (
                              <span className="font-medium text-gray-900">
                                {rate.value}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">
                        Service Fees
                      </h4>
                      <div className="space-y-3">
                        {[
                          { label: 'Cue Rental', value: '$3' },
                          { label: 'Ball Set', value: '$2' },
                          { label: 'Chalk', value: '$1' },
                          { label: 'Tournament Fee', value: '$10' },
                        ].map((fee) => (
                          <div
                            key={fee.label}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-gray-700">{fee.label}</span>
                            {isEditing ? (
                              <input
                                type="text"
                                defaultValue={fee.value}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              />
                            ) : (
                              <span className="font-medium text-gray-900">
                                {fee.value}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'amenities' && (
              <motion.div
                key="amenities"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Amenities & Services
                  </h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    {isEditing ? 'Save Changes' : 'Edit Amenities'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Available Amenities
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        'Professional Tables',
                        'Craft Beer',
                        'Food Service',
                        'WiFi',
                        'Parking',
                        'Tournament Area',
                        'Practice Tables',
                        'Pro Shop',
                        'Lounge Area',
                        'Smoking Area',
                        'ATM',
                        'Lockers',
                      ].map((amenity) => {
                        const isSelected = venue.amenities.includes(amenity);

                        return (
                          <label
                            key={amenity}
                            className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            } ${!isEditing ? 'cursor-default' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!isEditing}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm">{amenity}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="border-t border-gray-200 pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Custom Amenity
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Enter amenity name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeSection === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notification Preferences
                  </h3>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    Save Preferences
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Email Notifications
                    </h4>
                    <div className="space-y-3">
                      {[
                        'Tournament registrations and updates',
                        'New player sign-ups',
                        'Revenue reports and summaries',
                        'System maintenance notifications',
                        'Marketing and promotional updates',
                      ].map((notification) => (
                        <label
                          key={notification}
                          className="flex items-center space-x-3"
                        >
                          <input
                            type="checkbox"
                            defaultChecked
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{notification}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Push Notifications
                    </h4>
                    <div className="space-y-3">
                      {[
                        'Real-time tournament updates',
                        'New player arrivals',
                        'Table availability alerts',
                        'Urgent maintenance issues',
                      ].map((notification) => (
                        <label
                          key={notification}
                          className="flex items-center space-x-3"
                        >
                          <input
                            type="checkbox"
                            defaultChecked
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{notification}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Report Frequency
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="report-frequency"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">
                          Daily revenue summary
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="report-frequency"
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">
                          Weekly detailed report
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="report-frequency"
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">
                          Monthly comprehensive report
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Security & Access
                  </h3>
                </div>

                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <KeyIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">
                          Access Control
                        </h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Manage who can access your venue management portal and
                          what they can do.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Staff Permissions
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            Tournament Management
                          </p>
                          <p className="text-sm text-gray-600">
                            Create, edit, and manage tournaments
                          </p>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                          Manage
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            Financial Reports
                          </p>
                          <p className="text-sm text-gray-600">
                            View revenue and financial data
                          </p>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                          Manage
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            Player Management
                          </p>
                          <p className="text-sm text-gray-600">
                            Manage player accounts and access
                          </p>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Security Settings
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            Two-Factor Authentication
                          </p>
                          <p className="text-sm text-gray-600">
                            Add extra security to your account
                          </p>
                        </div>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                          Enable
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            Login History
                          </p>
                          <p className="text-sm text-gray-600">
                            View recent login activity
                          </p>
                        </div>
                        <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default VenueSettings;
