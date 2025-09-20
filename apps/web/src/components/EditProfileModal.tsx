import {
  profileApi,
  type UpdateProfileData,
  type UserProfile,
} from '@/services/api/profile';
import { PhotoCamera } from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
  currentProfile: UserProfile;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onClose,
  onProfileUpdated,
  currentProfile,
}) => {
  const [formData, setFormData] = useState<UpdateProfileData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Image cropping states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [cropping, setCropping] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentProfile) {
      setFormData({
        username: currentProfile.username,
        bio: currentProfile.profile?.bio || '',
        avatarUrl: currentProfile.profile?.avatarUrl || '',
        location: currentProfile.profile?.location || '',
        displayName: currentProfile.profile?.displayName || '',
      });
    }
  }, [currentProfile]);

  const handleInputChange =
    (field: keyof UpdateProfileData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (crop: PixelCrop) => {
    setCompletedCrop(crop);
  };

  const handleCropSave = async () => {
    if (!completedCrop || !imageRef.current) return;

    setCropping(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
      const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;

      ctx.drawImage(
        imageRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      // Convert canvas to blob
      canvas.toBlob(
        async (blob) => {
          if (blob) {
            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

            // Upload the cropped image
            const result = await profileApi.uploadAvatar(file);

            // Update form data with new avatar URL
            setFormData((prev) => ({
              ...prev,
              avatarUrl: result.avatarUrl,
            }));

            // Close crop modal
            setCropModalOpen(false);
            setSelectedImage(null);
          }
        },
        'image/jpeg',
        0.9
      );
    } catch (_err) {
      setError('Failed to process image');
    } finally {
      setCropping(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Only send fields that have values
      const updateData: UpdateProfileData = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          updateData[key as keyof UpdateProfileData] = value;
        }
      });

      const updatedProfile = await profileApi.updateProfile(updateData);
      onProfileUpdated(updatedProfile);
      setSuccess(true);

      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !cropping) {
      setError(null);
      setSuccess(false);
      setCropModalOpen(false);
      setSelectedImage(null);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={formData.avatarUrl}
                  sx={{ width: 64, height: 64, cursor: 'pointer' }}
                  onClick={handleAvatarClick}
                />
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                  size="small"
                  onClick={handleAvatarClick}
                >
                  <PhotoCamera />
                </IconButton>
              </Box>
              <Box>
                <Typography variant="h6">{currentProfile?.username}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentProfile?.email}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Click avatar to change
                </Typography>
              </Box>
            </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileSelect}
              aria-label="Upload avatar image"
              title="Upload avatar image"
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Profile updated successfully!
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Username"
                value={formData.username || ''}
                onChange={handleInputChange('username')}
                fullWidth
                disabled={loading}
              />

              <TextField
                label="Display Name"
                value={formData.displayName || ''}
                onChange={handleInputChange('displayName')}
                fullWidth
                disabled={loading}
                helperText="How you want to be known to other players"
              />

              <TextField
                label="Bio"
                value={formData.bio || ''}
                onChange={handleInputChange('bio')}
                fullWidth
                multiline
                rows={3}
                disabled={loading}
                helperText="Tell other players about yourself"
              />

              <TextField
                label="Location"
                value={formData.location || ''}
                onChange={handleInputChange('location')}
                fullWidth
                disabled={loading}
                helperText="Your city or region"
              />

              <TextField
                label="Avatar URL"
                value={formData.avatarUrl || ''}
                onChange={handleInputChange('avatarUrl')}
                fullWidth
                disabled={loading}
                helperText="Link to your profile picture or upload above"
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Image Crop Modal */}
      <Dialog
        open={cropModalOpen}
        onClose={() => !cropping && setCropModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Crop Avatar Image</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Select a circular crop area for your avatar
            </Typography>
          </Box>

          {selectedImage && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={handleCropComplete}
                aspect={1}
                circularCrop
              >
                <Box
                  component="img"
                  ref={imageRef as unknown as React.RefObject<HTMLImageElement>}
                  src={selectedImage}
                  alt="Crop preview"
                  sx={{ maxWidth: '100%', maxHeight: 400 }}
                />
              </ReactCrop>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setCropModalOpen(false)} disabled={cropping}>
            Cancel
          </Button>
          <Button
            onClick={handleCropSave}
            variant="contained"
            disabled={cropping || !completedCrop}
            startIcon={cropping ? <CircularProgress size={16} /> : null}
          >
            {cropping ? 'Processing...' : 'Save Crop'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditProfileModal;
