import React from 'react'
import { Box, Container, Typography, Button, Grid, Card, CardContent } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Business, Palette, EmojiEvents, LocalOffer } from '@mui/icons-material'
import Layout from '../../../components/layout/Layout'

const Home: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Layout>
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, rgba(10, 10, 10, 0.8) 0%, rgba(26, 26, 26, 0.7) 50%, rgba(10, 10, 10, 0.8) 100%), url('/images/pool_table_hero.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, #00ff9d20 0%, transparent 50%), radial-gradient(circle at 80% 20%, #00a8ff20 0%, transparent 50%)',
            pointerEvents: 'none',
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography 
            variant="h1" 
            component="h1" 
            gutterBottom
            sx={{
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              color: '#00ff9d',
              textShadow: '0 0 20px #00ff9d, 0 0 40px #00a8ff, 0 0 60px #00ff9d',
              mb: 4,
              fontSize: { xs: '2.5rem', md: '4rem' },
              animation: 'glow 2s ease-in-out infinite alternate',
              '@keyframes glow': {
                '0%': { textShadow: '0 0 20px #00ff9d, 0 0 40px #00a8ff' },
                '100%': { textShadow: '0 0 30px #00ff9d, 0 0 50px #00a8ff, 0 0 70px #00ff9d' }
              }
            }}
          >
            DojoPool
          </Typography>
          
          <Typography 
            variant="h3" 
            component="h2" 
            gutterBottom
            sx={{
              fontFamily: 'Orbitron, monospace',
              color: '#00a8ff',
              textShadow: '0 0 10px #00a8ff',
              mb: 6,
              fontSize: { xs: '1.5rem', md: '2.5rem' },
              lineHeight: 1.3,
              maxWidth: '800px',
              mx: 'auto'
            }}
          >
            The Pool Gods wait for the next master to ascend, but you must first...
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
            sx={{
              background: 'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
              color: '#000',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              px: 8,
              py: 3,
              borderRadius: 3,
              boxShadow: '0 0 30px #00ff9d, 0 0 50px #00a8ff',
              fontSize: '1.5rem',
              textTransform: 'none',
              minWidth: '300px',
              mb: 8,
              '&:hover': {
                background: 'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
                boxShadow: '0 0 40px #00a8ff, 0 0 60px #00ff9d, 0 0 80px #00a8ff',
                transform: 'translateY(-5px) scale(1.05)',
              }
            }}
          >
            TAKE THE DOJO
          </Button>

          {/* Venue Owner/Manager Section */}
          <Box sx={{ mt: 8, pt: 4, borderTop: '2px solid rgba(0, 255, 157, 0.3)' }}>
            <Typography 
              variant="h4" 
              component="h3" 
              gutterBottom
              sx={{
                fontFamily: 'Orbitron, monospace',
                color: '#feca57',
                textShadow: '0 0 15px #feca57',
                mb: 4,
                fontSize: { xs: '1.8rem', md: '2.2rem' }
              }}
            >
              Venue Owners & Managers
            </Typography>
            
            <Typography 
              variant="h6" 
              component="p" 
              gutterBottom
              sx={{
                fontFamily: 'Orbitron, monospace',
                color: '#ffffff',
                mb: 4,
                fontSize: { xs: '1rem', md: '1.2rem' },
                maxWidth: '600px',
                mx: 'auto'
              }}
            >
              Transform your venue into a Dojo with AI-powered customization, Dojo Coin rewards, and advanced tournament management.
            </Typography>

            <Grid container spacing={3} sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: 'rgba(26, 26, 26, 0.9)', 
                  border: '1px solid #333',
                  height: '100%',
                  '&:hover': {
                    border: '1px solid #00ff9d',
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 20px rgba(0, 255, 157, 0.2)'
                  },
                  transition: 'all 0.3s ease'
                }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Palette sx={{ fontSize: 40, color: '#00ff9d', mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#ffffff', fontFamily: 'Orbitron, monospace', mb: 1 }}>
                      Custom Themes
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', fontSize: '0.8rem' }}>
                      AI-generated venue themes and branding
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: 'rgba(26, 26, 26, 0.9)', 
                  border: '1px solid #333',
                  height: '100%',
                  '&:hover': {
                    border: '1px solid #00a8ff',
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 20px rgba(0, 168, 255, 0.2)'
                  },
                  transition: 'all 0.3s ease'
                }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <EmojiEvents sx={{ fontSize: 40, color: '#00a8ff', mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#ffffff', fontFamily: 'Orbitron, monospace', mb: 1 }}>
                      Dojo Coins
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', fontSize: '0.8rem' }}>
                      Reward system and loyalty programs
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: 'rgba(26, 26, 26, 0.9)', 
                  border: '1px solid #333',
                  height: '100%',
                  '&:hover': {
                    border: '1px solid #feca57',
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 20px rgba(254, 202, 87, 0.2)'
                  },
                  transition: 'all 0.3s ease'
                }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <LocalOffer sx={{ fontSize: 40, color: '#feca57', mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#ffffff', fontFamily: 'Orbitron, monospace', mb: 1 }}>
                      Special Offers
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', fontSize: '0.8rem' }}>
                      Happy hour and tournament promotions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  bgcolor: 'rgba(26, 26, 26, 0.9)', 
                  border: '1px solid #333',
                  height: '100%',
                  '&:hover': {
                    border: '1px solid #ff6b6b',
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 20px rgba(255, 107, 107, 0.2)'
                  },
                  transition: 'all 0.3s ease'
                }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Business sx={{ fontSize: 40, color: '#ff6b6b', mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#ffffff', fontFamily: 'Orbitron, monospace', mb: 1 }}>
                      Management
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', fontSize: '0.8rem' }}>
                      Complete venue management portal
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/venue/dojo-profile')}
              startIcon={<Business />}
              sx={{
                border: '2px solid #feca57',
                color: '#feca57',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                px: 6,
                py: 2,
                borderRadius: 3,
                fontSize: '1.1rem',
                textTransform: 'none',
                '&:hover': {
                  border: '2px solid #feca57',
                  background: 'rgba(254, 202, 87, 0.1)',
                  boxShadow: '0 0 20px rgba(254, 202, 87, 0.3)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              Access Dojo Profile Portal
            </Button>
          </Box>
        </Container>
      </Box>
    </Layout>
  )
}

export default Home 