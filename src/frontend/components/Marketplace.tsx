import React from 'react';
import { Card, Grid, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface MarketplaceProps {
  userCoins: number;
}

const Marketplace: React.FC<MarketplaceProps> = ({ userCoins }) => {
  const navigate = useNavigate();

  const categories = [
    {
      id: 'nfts',
      title: 'NFT Items',
      description: 'Collectible items and trophies',
      image: '/assets/nft-placeholder.png',
    },
    {
      id: 'avatar',
      title: 'Avatar Customization',
      description: 'Customize your avatar appearance',
      image: '/assets/avatar-placeholder.png',
    },
    {
      id: 'boosts',
      title: 'Game Boosters',
      description: 'Enhance your game experience',
      image: '/assets/boost-placeholder.png',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Marketplace
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Available Dojo Coins: {userCoins}
      </Typography>

      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: 2,
              }}
              onClick={() => navigate(`/marketplace/${category.id}`)}
            >
              <Box>
                <Typography variant="h6" gutterBottom>
                  {category.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {category.description}
                </Typography>
              </Box>
              <Button variant="contained" fullWidth>
                Browse {category.title}
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Marketplace;
