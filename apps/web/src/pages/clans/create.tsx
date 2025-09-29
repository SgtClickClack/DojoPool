import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Checkbox,
  Radio,
} from '@mui/material';
import Head from 'next/head';
import Layout from '@/components/Layout/Layout';
import ProtectedRoute from '@/components/Common/ProtectedRoute';
import { createClan } from '@/services/APIService';

interface ClanFormData {
  name: string;
  tag: string;
  description: string;
  isPublic: boolean;
  minRating?: number;
  minLevel?: number;
  invitationOnly: boolean;
  approvalRequired: boolean;
}

const CreateClanPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<ClanFormData>({
    name: '',
    tag: '',
    description: '',
    isPublic: true,
    minRating: undefined,
    minLevel: undefined,
    invitationOnly: false,
    approvalRequired: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (field: keyof ClanFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Clan name is required';
    }

    if (!formData.tag.trim()) {
      newErrors.tag = 'Clan tag is required';
    } else if (formData.tag.length < 2 || formData.tag.length > 5) {
      newErrors.tag = 'Clan tag must be between 2-5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Clan description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const clanData = {
        name: formData.name.trim(),
        tag: formData.tag.trim().toUpperCase(),
        description: formData.description.trim(),
        isPublic: formData.isPublic,
        requirements: {
          minRating: formData.minRating || undefined,
          minLevel: formData.minLevel || undefined,
          invitationOnly: formData.invitationOnly,
          approvalRequired: formData.approvalRequired,
        },
      };

      const newClan = await createClan(clanData);

      // Show success message
      setSubmitError('');

      // Redirect to clan page
      await router.push(`/clans/${newClan.id}`);
    } catch (error: any) {
      // Error handled by setSubmitError
      setSubmitError(
        error.message || 'Failed to create clan. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>Create New Clan — DojoPool</title>
        </Head>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Create New Clan
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Build your own community of pool players and compete for territory.
          </Typography>

          <Paper elevation={3} sx={{ mt: 4, p: { xs: 3, md: 4 } }}>
            <Box component="form" onSubmit={handleSubmit}>
              {submitError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {submitError}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Clan Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                sx={{ mb: 3 }}
                inputProps={{ 'data-testid': 'clan-name-input' }}
              />

              <TextField
                fullWidth
                label="Clan Tag"
                value={formData.tag}
                onChange={(e) =>
                  handleChange('tag', e.target.value.toUpperCase())
                }
                error={!!errors.tag}
                helperText={
                  errors.tag || '2-5 characters, will be displayed in uppercase'
                }
                sx={{ mb: 3 }}
                inputProps={{ 'data-testid': 'clan-tag-input' }}
              />

              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                minRows={3}
                sx={{ mb: 3 }}
                inputProps={{ 'data-testid': 'clan-description-input' }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isPublic}
                    onChange={(e) => handleChange('isPublic', e.target.checked)}
                    data-testid="public-clan-checkbox"
                  />
                }
                label="Public Clan"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Minimum Rating"
                type="number"
                value={formData.minRating || ''}
                onChange={(e) =>
                  handleChange(
                    'minRating',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                helperText="Optional: Minimum rating required to join"
                sx={{ mb: 3 }}
                inputProps={{ 'data-testid': 'min-rating-input' }}
              />

              <TextField
                fullWidth
                label="Minimum Level"
                type="number"
                value={formData.minLevel || ''}
                onChange={(e) =>
                  handleChange(
                    'minLevel',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                helperText="Optional: Minimum level required to join"
                sx={{ mb: 3 }}
                inputProps={{ 'data-testid': 'min-level-input' }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.invitationOnly}
                    onChange={(e) =>
                      handleChange('invitationOnly', e.target.checked)
                    }
                    data-testid="invitation-only-checkbox"
                  />
                }
                label="Invitation Only"
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.approvalRequired}
                    onChange={(e) =>
                      handleChange('approvalRequired', e.target.checked)
                    }
                    data-testid="approval-required-checkbox"
                  />
                }
                label="Approval Required"
                sx={{ mb: 3 }}
              />

              <Box display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  data-testid="create-clan-button"
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress
                        size={20}
                        sx={{ color: 'inherit', mr: 1 }}
                      />
                      Creating...
                    </>
                  ) : (
                    'Create Clan'
                  )}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Layout>
    </ProtectedRoute>
  );
};

export default CreateClanPage;
