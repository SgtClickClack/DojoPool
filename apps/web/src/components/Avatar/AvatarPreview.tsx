'use client';

import { AvatarCustomizationData } from '@/types/avatar';
import { Avatar, Box, Chip, Typography } from '@mui/material';
import React from 'react';

interface AvatarPreviewProps {
  customization: AvatarCustomizationData;
  avatarData?: any;
  size?: 'small' | 'medium' | 'large';
}

export const AvatarPreview: React.FC<AvatarPreviewProps> = ({
  customization,
  avatarData,
  size = 'medium',
}) => {
  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return 80;
      case 'large':
        return 200;
      default:
        return 120;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return '1rem';
      case 'large':
        return '2.5rem';
      default:
        return '1.5rem';
    }
  };

  // Get the equipped asset names for display
  const getEquippedAssets = () => {
    const equipped: string[] = [];

    if (customization.hair) equipped.push('Hair');
    if (customization.face) equipped.push('Face');
    if (customization.clothesTop) equipped.push('Top');
    if (customization.clothesBottom) equipped.push('Bottom');
    if (customization.shoes) equipped.push('Shoes');
    if (customization.accessoryHead) equipped.push('Headwear');
    if (customization.accessoryNeck) equipped.push('Necklace');
    if (customization.accessoryBack) equipped.push('Back Item');
    if (customization.weapon) equipped.push('Weapon');
    if (customization.pet) equipped.push('Pet');
    if (customization.effect) equipped.push('Effect');

    return equipped;
  };

  const equippedAssets = getEquippedAssets();

  return (
    <Box sx={{ textAlign: 'center' }}>
      {/* Main Avatar Display */}
      <Box
        sx={{
          position: 'relative',
          display: 'inline-block',
          mb: 3,
        }}
      >
        <Avatar
          src={avatarData?.user?.profile?.avatarUrl}
          alt={avatarData?.user?.username || 'Avatar'}
          sx={{
            width: getSizeValue(),
            height: getSizeValue(),
            fontSize: getFontSize(),
            border: '3px solid #00ff9d',
            boxShadow: '0 0 20px rgba(0, 255, 157, 0.3)',
            backgroundColor:
              customization.skinTone || avatarData?.skinTone || '#F5DEB3',
            // Add some cyberpunk styling
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              background:
                'linear-gradient(45deg, #00ff9d, #00a8ff, #ff6b6b, #ffaa00)',
              borderRadius: '50%',
              zIndex: -1,
              opacity: 0.7,
              filter: 'blur(2px)',
            },
          }}
        >
          {!avatarData?.user?.profile?.avatarUrl &&
            avatarData?.user?.username?.charAt(0).toUpperCase()}
        </Avatar>

        {/* Equipped Items Indicators */}
        {equippedAssets.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              backgroundColor: '#ffaa00',
              color: '#000',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              border: '2px solid #000',
            }}
          >
            {equippedAssets.length}
          </Box>
        )}
      </Box>

      {/* Avatar Info */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#00ff9d', mb: 1 }}>
          {avatarData?.user?.username || 'Your Avatar'}
        </Typography>

        {avatarData?.user?.profile?.displayName && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            "{avatarData.user.profile.displayName}"
          </Typography>
        )}

        {/* Body Type and Skin Tone Info */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            justifyContent: 'center',
            mb: 2,
            flexWrap: 'wrap',
          }}
        >
          <Chip
            label={`Body: ${customization.bodyType || avatarData?.bodyType || 'Athletic'}`}
            size="small"
            sx={{
              backgroundColor: 'rgba(0, 168, 255, 0.2)',
              color: '#00a8ff',
              border: '1px solid #00a8ff',
            }}
          />
          <Chip
            label={`Skin: ${customization.skinTone || avatarData?.skinTone || '#F5DEB3'}`}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 170, 0, 0.2)',
              color: '#ffaa00',
              border: '1px solid #ffaa00',
            }}
          />
        </Box>

        {/* Equipped Items List */}
        {equippedAssets.length > 0 && (
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              Equipped Items:
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {equippedAssets.map((item, index) => (
                <Chip
                  key={index}
                  label={item}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 107, 107, 0.2)',
                    color: '#ff6b6b',
                    border: '1px solid #ff6b6b',
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Unlocked Features */}
        {avatarData?.unlockedFeatures &&
          avatarData.unlockedFeatures.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', mb: 1 }}
              >
                Unlocked Features:
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {avatarData.unlockedFeatures.map(
                  (feature: string, index: number) => (
                    <Chip
                      key={index}
                      label={feature}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(0, 255, 157, 0.2)',
                        color: '#00ff9d',
                        border: '1px solid #00ff9d',
                      }}
                    />
                  )
                )}
              </Box>
            </Box>
          )}

        {/* No customizations message */}
        {equippedAssets.length === 0 && (
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 2 }}
          >
            No customizations applied yet. Start building your unique avatar!
          </Typography>
        )}
      </Box>
    </Box>
  );
};
