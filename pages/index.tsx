import React from 'react'
import { Box, Container, Typography, Button, Paper } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import Layout from '../src/components/layout/Layout'

const Home: React.FC = () => {
  const navigate = useNavigate()

  const gameFlowSteps = [
    {
      title: "Onboarding",
      description: "Get started with DojoPool",
      path: "/onboarding",
      color: "#00ff9d",
      icon: "🎯"
    },
    {
      title: "Avatar & Wallet",
      description: "Create your digital identity",
      path: "/avatar",
      color: "#00a8ff",
      icon: "🦊"
    },
    {
      title: "Venue Check-in",
      description: "Find and join a Dojo",
      path: "/venue",
      color: "#ff6b6b",
      icon: "🏢"
    },
    {
      title: "Tournaments",
      description: "Compete and win",
      path: "/tournaments",
      color: "#f7b731",
      icon: "🏆"
    },
    {
      title: "Social",
      description: "Connect with the community",
      path: "/feed",
      color: "#9d00ff",
      icon: "💬"
    }
  ]

  return (
    <Layout>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          position: 'relative',
          overflow: 'hidden',
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
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ py: 8, textAlign: 'center' }}>
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
              variant="h4" 
              component="h2" 
              gutterBottom
              sx={{
                fontFamily: 'Orbitron, monospace',
                color: '#00a8ff',
                textShadow: '0 0 10px #00a8ff',
                mb: 6,
                fontSize: { xs: '1.2rem', md: '1.8rem' }
              }}
            >
              Next Generation Pool Gaming
            </Typography>

            <Typography 
              variant="body1" 
              sx={{
                color: '#fff',
                fontSize: '1.1rem',
                mb: 8,
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6,
                textShadow: '0 0 5px rgba(255,255,255,0.3)'
              }}
            >
              Experience the future of pool gaming with AI-powered analysis, 
              real-time tournaments, and a vibrant community of players.
            </Typography>

            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 3, 
              justifyContent: 'center',
              mb: 8
            }}>
              {gameFlowSteps.map((step, index) => (
                <Box key={index} sx={{ width: { xs: '100%', sm: '280px', md: '220px' } }}>
                  <Paper
                    sx={{
                      p: 3,
                      background: `linear-gradient(135deg, #181818 60%, ${step.color} 100%)`,
                      border: `2px solid ${step.color}`,
                      borderRadius: 3,
                      boxShadow: `0 0 20px ${step.color}`,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: `0 0 40px ${step.color}, 0 0 60px ${step.color}40`,
                        borderColor: step.color,
                      }
                    }}
                    onClick={() => navigate(step.path)}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        color: step.color,
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 600,
                        mb: 1,
                        textShadow: `0 0 10px ${step.color}`,
                        fontSize: '1.5rem'
                      }}
                    >
                      {step.icon} {step.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#fff',
                        fontSize: '0.9rem',
                        textShadow: '0 0 5px rgba(255,255,255,0.3)'
                      }}
                    >
                      {step.description}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/onboarding')}
                sx={{
                  background: 'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
                  color: '#000',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  px: 6,
                  py: 2,
                  borderRadius: 3,
                  boxShadow: '0 0 20px #00ff9d',
                  fontSize: '1.1rem',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
                    boxShadow: '0 0 30px #00a8ff, 0 0 50px #00ff9d',
                    transform: 'translateY(-3px)',
                  }
                }}
              >
                Get Started
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/tournaments')}
                sx={{
                  borderColor: '#00ff9d',
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                  px: 6,
                  py: 2,
                  borderRadius: 3,
                  fontSize: '1.1rem',
                  borderWidth: '2px',
                  '&:hover': {
                    borderColor: '#00a8ff',
                    color: '#00a8ff',
                    boxShadow: '0 0 20px #00a8ff, 0 0 40px #00ff9d',
                    transform: 'translateY(-3px)',
                    borderWidth: '2px',
                  }
                }}
              >
                View Tournaments
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Layout>
  )
}

export default Home 