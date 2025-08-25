import { createClan } from '@/services/APIService';
import type { CreateClanRequest } from '@/types/clan';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Paper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

const CreateClanForm: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateClanRequest>({
    name: '',
    tag: '',
    description: '',
    isPublic: true,
    requirements: {
      minRating: undefined,
      minLevel: undefined,
      invitationOnly: false,
      approvalRequired: false,
    },
  });

  const handleInputChange = (field: string, value: unknown) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Clan name is required');
      }
      if (!formData.tag.trim()) {
        throw new Error('Clan tag is required');
      }
      if (formData.tag.length < 2 || formData.tag.length > 5) {
        throw new Error('Clan tag must be between 2-5 characters');
      }
      if (!formData.description.trim()) {
        throw new Error('Clan description is required');
      }

      const newClan = await createClan(formData);
      setSuccess(true);

      // Redirect to the new clan page after a short delay
      setTimeout(() => {
        router.push(`/clans/${newClan.id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create clan');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          Clan created successfully! Redirecting to clan page...
        </Alert>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create New Clan
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Start your own clan and build a community of pool players. Choose your
        clan's identity and set requirements for new members.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Clan Name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          margin="normal"
          required
          helperText="Choose a unique and memorable name for your clan"
        />

        <TextField
          fullWidth
          label="Clan Tag"
          value={formData.tag}
          onChange={(e) =>
            handleInputChange('tag', e.target.value.toUpperCase())
          }
          margin="normal"
          required
          inputProps={{ maxLength: 5 }}
          helperText="2-5 character tag that represents your clan (e.g., PHX, DRAGON)"
        />

        <TextField
          fullWidth
          label="Description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          margin="normal"
          required
          multiline
          rows={4}
          helperText="Describe your clan's mission, values, and what makes it special"
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.isPublic}
              onChange={(e) => handleInputChange('isPublic', e.target.checked)}
            />
          }
          label="Public Clan (visible to all players)"
          sx={{ mt: 2 }}
        />

        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Membership Requirements
        </Typography>

        <TextField
          fullWidth
          label="Minimum Rating"
          type="number"
          value={formData.requirements?.minRating || ''}
          onChange={(e) =>
            handleInputChange(
              'requirements.minRating',
              e.target.value ? parseInt(e.target.value) : undefined
            )
          }
          margin="normal"
          helperText="Minimum player rating required to join (optional)"
        />

        <TextField
          fullWidth
          label="Minimum Level"
          type="number"
          value={formData.requirements?.minLevel || ''}
          onChange={(e) =>
            handleInputChange(
              'requirements.minLevel',
              e.target.value ? parseInt(e.target.value) : undefined
            )
          }
          margin="normal"
          helperText="Minimum player level required to join (optional)"
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.requirements?.invitationOnly || false}
              onChange={(e) =>
                handleInputChange(
                  'requirements.invitationOnly',
                  e.target.checked
                )
              }
            />
          }
          label="Invitation Only"
          sx={{ mt: 1 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.requirements?.approvalRequired || false}
              onChange={(e) =>
                handleInputChange(
                  'requirements.approvalRequired',
                  e.target.checked
                )
              }
            />
          }
          label="Require Approval for New Members"
          sx={{ mt: 1 }}
        />

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            type="button"
            variant="outlined"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ flexGrow: 1 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Create Clan'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default CreateClanForm;
