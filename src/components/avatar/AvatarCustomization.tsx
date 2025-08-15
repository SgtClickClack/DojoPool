import React from 'react';
import { Box, Typography, Paper, TextField, Button, CircularProgress, Alert } from '@mui/material';

interface AvatarCustomizationProps {}

const AvatarCustomization: React.FC<AvatarCustomizationProps> = () => {
  const [prompt, setPrompt] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);

  const handleGenerate = async () => {
    // TODO: Implement actual API call to backend AI service
    setLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      // Placeholder for API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate loading
      // Assuming API returns an image URL
      setImageUrl('http://example.com/placeholder-avatar.png');
    } catch (err: any) {
      setError('Failed to generate avatar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>Customize Your Avatar</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>Describe the avatar you want to create using text.</Typography>
      <TextField
        label="Avatar Description"
        fullWidth
        multiline
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        sx={{ mb: 2 }}
        disabled={loading}
      />
      <Button
        variant="contained"
        onClick={handleGenerate}
        disabled={loading || prompt.trim() === ''}
      >
        {loading ? 'Generating...' : 'Generate Avatar'}
      </Button>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}

      {imageUrl && !loading && !error && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>Generated Avatar</Typography>
          <img src={imageUrl} alt="Generated Avatar" style={{ maxWidth: '100%', height: 'auto' }} />
          {/* TODO: Add option to save or use this avatar */}
        </Box>
      )}

    </Paper>
  );
};

export default AvatarCustomization; 