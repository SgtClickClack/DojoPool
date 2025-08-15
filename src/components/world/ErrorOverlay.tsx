import React from 'react';

interface ErrorOverlayProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorOverlay: React.FC<ErrorOverlayProps> = ({ 
          message = "Connection Failed. Please ensure the backend server is running and accessible.",
  onRetry 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-8 text-center text-white max-w-md mx-4">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-4 text-red-300">Connection Error</h2>
        <p className="text-sm mb-6 leading-relaxed">{message}</p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        )}
        
        <div className="mt-4 text-xs text-gray-400">
          <p>If the problem persists, please check:</p>
          <ul className="mt-2 space-y-1">
            <li>• Backend server is running on port 8080</li>
            <li>• No firewall blocking the connection</li>
            <li>• Network connectivity</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ErrorOverlay; 