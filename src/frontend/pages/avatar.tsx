import React, { useState, useEffect, useCallback } from 'react';
import AvatarEditor from '../components/AvatarEditor'; // Assuming this path is correct
import { useSnackbar } from 'notistack'; // Standard way to use notistack

// Configuration (Ideally, move to a config file or environment variables)
const API_BASE_URL = '/api/users/me'; // Example base URL

interface AvatarPageProps {
  // Props for AvatarPage, if any, would go here
}

const AvatarPage: React.FC<AvatarPageProps> = () => {
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true); // For fetching initial avatar
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar(); // Destructure directly

  const fetchAvatar = useCallback(async () => {
    setInitialLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/avatar`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Failed to fetch avatar: ${response.status}`,
        }));
        throw new Error(
          errorData.message || `Failed to fetch avatar: ${response.status}`
        );
      }
      const data = await response.json();
      setCurrentAvatarUrl(data.avatarUrl); // Adjust based on your API response structure
    } catch (e: any) {
      const errorMessage =
        e.message || 'An unexpected error occurred while loading avatar.';
      setError(errorMessage);
      console.error('Error fetching avatar:', e);
      // No enqueueSnackbar here for initial load, error is displayed in UI
    } finally {
      setInitialLoading(false);
    }
  }, []); // No dependencies needed if API_BASE_URL is constant or defined outside

  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  const handleSaveAvatar = useCallback(
    async (imageData: string) => {
      // imageData is likely base64
      setSaving(true);
      setError(null); // Clear previous errors specific to save attempts
      try {
        // Consider sending as FormData if your backend supports file uploads directly
        // For JSON payload with base64:
        const response = await fetch(`${API_BASE_URL}/avatar`, {
          method: 'POST', // Or 'PUT'
          headers: {
            'Content-Type': 'application/json',
            // Add Authorization headers if required
          },
          body: JSON.stringify({ avatarData: imageData }), // Adjust payload as needed
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: `Failed to save avatar: ${response.status}`,
          }));
          throw new Error(
            errorData.message || `Failed to save avatar: ${response.status}`
          );
        }

        const data = await response.json();
        setCurrentAvatarUrl(data.avatarUrl); // Update displayed avatar from response
        enqueueSnackbar('Avatar updated successfully!', { variant: 'success' });
      } catch (e: any) {
        const errorMessage =
          e.message || 'An unexpected error occurred while saving avatar.';
        setError(errorMessage); // Set error for display within the component section
        console.error('Error saving avatar:', e);
        enqueueSnackbar(errorMessage, { variant: 'error' });
      } finally {
        setSaving(false);
      }
    },
    [enqueueSnackbar]
  ); // API_BASE_URL if it were dynamic

  // UI Rendering
  const renderContent = () => {
    // The AvatarEditor should always be visible if not initially loading,
    // allowing users to upload even if the initial fetch failed.
    return (
      <>
        <AvatarEditor
          onSave={handleSaveAvatar}
          initialAvatarUrl={currentAvatarUrl}
          disabled={saving} // Disable editor while saving
        />

        {/* Display current avatar preview if available */}
        {currentAvatarUrl &&
          !saving && ( // Hide if saving to avoid flicker if URL changes mid-save
            <div className="mt-6 text-center">
              <h3 className="text-lg font-medium mb-2">Current Avatar</h3>
              <img
                src={currentAvatarUrl}
                alt="Current User Avatar"
                className="rounded-full w-24 h-24 md:w-32 md:h-32 mx-auto border border-gray-300 shadow-sm"
              />
            </div>
          )}

        {/* Saving indicator */}
        {saving && (
          <div className="mt-4 text-center text-blue-600">
            <p>Saving avatar, please wait...</p>
            {/* Optionally add a spinner here */}
          </div>
        )}

        {/* Display error message related to saving or other interactions */}
        {error &&
          !initialLoading && ( // Don't show this error if initialLoading error is already shown
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-center">
              {error}
            </div>
          )}
      </>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-lg">
      {' '}
      {/* Max width for better focus */}
      <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center text-gray-700">
          Customize Your Avatar
        </h1>

        {initialLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading avatar information...</p>
            {/* Optionally, add a more prominent loading spinner (e.g., MUI CircularProgress if available) */}
          </div>
        ) : error && !currentAvatarUrl ? ( // Show initial load error prominently if no avatar could be loaded
          <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-center">
            <p>
              <strong>Error:</strong> {error}
            </p>
            <p className="mt-2">
              Could not load your current avatar. You can still try uploading a
              new one below.
            </p>
          </div>
        ) : // Render the editor even on initial load error
        // {renderContent()} // This would show the editor below the prominent error.
        // Decided to keep it simpler: error for initial load OR the editor.
        // If you want the editor AND the error, uncomment and adjust.
        // For now, if initial load fails, it shows error, then editor when error is cleared by new action.
        null}

        {/* Render the main content (editor, preview, saving status) */}
        {/* This section is rendered if not initialLoading, or if initialLoading is done and there was an error (but user can still interact) */}
        {!initialLoading && renderContent()}
      </div>
    </div>
  );
};

export default AvatarPage;
