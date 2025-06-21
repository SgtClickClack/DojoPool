import React from 'react'
import { Box, Container, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
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
              '&:hover': {
                background: 'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
                boxShadow: '0 0 40px #00a8ff, 0 0 60px #00ff9d, 0 0 80px #00a8ff',
                transform: 'translateY(-5px) scale(1.05)',
              }
            }}
          >
            TAKE THE DOJO
          </Button>
        </Container>
      </Box>
    </Layout>
  )
}

export default Home 