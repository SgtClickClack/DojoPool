import React, { useState } from 'react';

interface AvatarEditorProps {
  onSave: (imageData: string) => Promise<void>;
  initialAvatarUrl: string | null;
  disabled: boolean;
}

const AvatarEditor: React.FC<AvatarEditorProps> = ({ onSave, initialAvatarUrl, disabled }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const handleGenerateFromText = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your avatar.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedAvatarUrl(null);

    try {
      // API Call to the backend
      const response = await fetch('/api/avatar/generate_from_text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate avatar.');
      }

      setGeneratedAvatarUrl(result.avatar_url);
      // Optionally display success message: result.success
      console.log('Avatar generated successfully:', result.avatar_url);
    } catch (err: any) {
      console.error('Avatar generation error:', err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedAvatarUrl) return;
    setSaving(true);
    try {
      await onSave(generatedAvatarUrl);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-3">Create Avatar from Text</h2>
      <div className="mb-3">
        <label htmlFor="avatarPrompt" className="block text-sm font-medium text-gray-700 mb-1">
          Describe your avatar:
        </label>
        <textarea
          id="avatarPrompt"
          rows={3}
          className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g., a cyberpunk samurai with a glowing pool cue"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading || disabled}
        />
      </div>

      <button
        onClick={handleGenerateFromText}
        className={`px-4 py-2 rounded text-white ${isLoading || disabled ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        disabled={isLoading || disabled}
      >
        {isLoading ? 'Generating...' : 'Generate from Text'}
      </button>

      {error && (
        <p className="text-red-500 mt-3">Error: {error}</p>
      )}

      {(generatedAvatarUrl || initialAvatarUrl) && (
        <div className="mt-4">
          <h3 className="text-lg font-medium">Generated Avatar:</h3>
          <img src={generatedAvatarUrl || initialAvatarUrl || ''} alt="Generated Avatar" className="mt-2 border rounded max-w-xs" />
          {generatedAvatarUrl && (
            <button
              onClick={handleSave}
              className={`mt-3 px-4 py-2 rounded text-white ${saving || disabled ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              disabled={saving || disabled}
            >
              {saving ? 'Saving...' : 'Save Avatar'}
            </button>
          )}
        </div>
      )}

      {/* Placeholder: Add components for image upload based generation */}
    </div>
  );
};

export default AvatarEditor; 