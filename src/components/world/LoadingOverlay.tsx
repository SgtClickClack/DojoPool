import React from 'react';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = "Connecting to Dojo World..." 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-8 text-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg font-semibold mb-2">{message}</p>
        <p className="text-sm text-gray-300">Please wait while we establish connection...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay; 