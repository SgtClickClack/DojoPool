import React from 'react';

const TestVenuesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Test Venues Page
        </h1>
        <p className="text-gray-600">
          This is a simple test page to verify routing works.
        </p>

        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Page Status
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ Page loads successfully</li>
            <li>✅ Basic routing works</li>
            <li>✅ No API dependencies</li>
            <li>✅ Simple component structure</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestVenuesPage;
