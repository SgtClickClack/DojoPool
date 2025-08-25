import ProtectedRoute from '@/components/Common/ProtectedRoute';
import VenuePortalLayout from '@/components/VenuePortal/VenuePortalLayout';
import Link from 'next/link';
import React from 'react';

const VenuePortalHome: React.FC = () => {
  return (
    <ProtectedRoute>
      <VenuePortalLayout>
        <div>
          <p>Manage your venue profile, specials, and tournaments.</p>
          <ul>
            <li>
              <Link href="/venue/portal/profile">Edit Profile</Link>
            </li>
            <li>
              <Link href="/venue/portal/specials">Manage Specials</Link>
            </li>
          </ul>
        </div>
      </VenuePortalLayout>
    </ProtectedRoute>
  );
};

export default VenuePortalHome;
