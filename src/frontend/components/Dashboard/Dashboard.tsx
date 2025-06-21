import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
} from "@mui/material";
import Layout from "../../../components/layout/Layout";
import { useNavigate } from "react-router-dom";
import AnimatedAvatar3D from "../Avatar/AnimatedAvatar3D";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // State for avatar status
  const [hasAvatar, setHasAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState("Player");
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  // Check for avatar in localStorage on component mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem('userAvatar');
    const savedUsername = localStorage.getItem('userNickname');
    const justCreated = localStorage.getItem('avatarJustCreated');
    
    if (savedAvatar) {
      setHasAvatar(true);
      setAvatarUrl(savedAvatar);
    }
    
    if (savedUsername) {
      setUsername(savedUsername);
    }
    
    // Show welcome back message if avatar was just created
    if (justCreated === 'true') {
      setShowWelcomeBack(true);
      localStorage.removeItem('avatarJustCreated'); // Clear the flag
      
      // Hide the message after 5 seconds
      setTimeout(() => {
        setShowWelcomeBack(false);
      }, 5000);
    }
  }, []);

  // Listen for avatar creation events
  useEffect(() => {
    const handleAvatarCreated = (event: CustomEvent) => {
      setHasAvatar(true);
      setAvatarUrl(event.detail.avatarUrl);
      if (event.detail.nickname) {
        setUsername(event.detail.nickname);
      }
    };

    window.addEventListener('avatarCreated', handleAvatarCreated as EventListener);
    
    return () => {
      window.removeEventListener('avatarCreated', handleAvatarCreated as EventListener);
    };
  }, []);

  const gameFlowSteps = [
    {
      title: "Onboarding",
      description: "Complete your profile setup",
      path: "/onboarding",
      color: "#00ff9d",
      icon: "🎯"
    },
    {
      title: "Avatar & Wallet",
      description: "Customize your digital identity and wallet",
      path: "/avatar",
      color: "#00a8ff",
      icon: "🦊"
    },
    {
      title: "Ledger",
      description: "Manage your wallet, NFTs, and transactions",
      path: "/ledger",
      color: "#9d00ff",
      icon: "💰"
    },
    {
      title: "Venue Check-in",
      description: "Find and join a Dojo venue",
      path: "/venue",
      color: "#ff6b6b",
      icon: "🏢"
    },
    {
      title: "Tournaments",
      description: "Compete and track your progress",
      path: "/tournaments",
      color: "#f7b731",
      icon: "🏆"
    },
    {
      title: "Social",
      description: "Connect with the community",
      path: "/feed",
      color: "#00ff9d",
      icon: "💬"
    },
  ];

  return (
    <Layout>
      <Box sx={{ py: 6 }}>
        <Typography
          variant="h2"
          align="center"
          sx={{
            color: "#00ff9d",
            textShadow: "0 0 10px #00ff9d, 0 0 20px #00a8ff",
            fontFamily: 'Orbitron',
            mb: 4,
          }}
        >
          DojoPool Dashboard
        </Typography>

        {/* Welcome Back Message */}
        {showWelcomeBack && (
          <Box
            sx={{
              background: 'rgba(0, 255, 157, 0.1)',
              border: '2px solid #00ff9d',
              borderRadius: 3,
              p: 3,
              textAlign: 'center',
              mb: 4,
              boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: '#00ff9d',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 700,
                mb: 1,
              }}
            >
              🎉 Welcome Back, {username}!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#00a8ff',
                fontFamily: 'Orbitron, monospace',
              }}
            >
              Your avatar has been created successfully. Ready to dominate the pool?
            </Typography>
          </Box>
        )}

        {/* Avatar Section */}
        <Box
          sx={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '2px solid #00ff9d',
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
            mb: 4,
            boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: '#00ff9d',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              mb: 3,
              textShadow: '0 0 20px #00ff9d',
            }}
          >
            YOUR AVATAR
          </Typography>

          {hasAvatar ? (
            <AnimatedAvatar3D
              hasAvatar={hasAvatar}
              avatarUrl={avatarUrl}
              username={username}
            />
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h6"
                sx={{
                  color: '#00a8ff',
                  fontFamily: 'Orbitron, monospace',
                  mb: 3,
                }}
              >
                Create Your Legend
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/avatar-creation')}
                sx={{
                  background: 'linear-gradient(45deg, #00ff9d, #00a8ff)',
                  color: '#000',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 700,
                  px: 4,
                  py: 2,
                  borderRadius: 2,
                  boxShadow: '0 0 20px rgba(0, 255, 157, 0.5)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #00a8ff, #00ff9d)',
                    boxShadow: '0 0 30px rgba(0, 168, 255, 0.7)',
                  },
                }}
              >
                CREATE AVATAR
              </Button>
            </Box>
          )}
        </Box>

        {/* Quick Actions Section */}
        <Box
          sx={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '2px solid #9d00ff',
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
            mb: 4,
            boxShadow: '0 0 30px rgba(157, 0, 255, 0.3)',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: '#9d00ff',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              mb: 3,
              textShadow: '0 0 20px #9d00ff',
            }}
          >
            QUICK ACTIONS
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/ledger')}
              sx={{
                background: 'linear-gradient(45deg, #9d00ff, #00a8ff)',
                color: '#fff',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 700,
                px: 4,
                py: 2,
                borderRadius: 2,
                boxShadow: '0 0 20px rgba(157, 0, 255, 0.5)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #00a8ff, #9d00ff)',
                  boxShadow: '0 0 30px rgba(0, 168, 255, 0.7)',
                },
              }}
            >
              💰 MANAGE WALLET
            </Button>
            
            <Button
              variant="contained"
              onClick={() => navigate('/tournaments')}
              sx={{
                background: 'linear-gradient(45deg, #f7b731, #ff6b6b)',
                color: '#fff',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 700,
                px: 4,
                py: 2,
                borderRadius: 2,
                boxShadow: '0 0 20px rgba(247, 183, 49, 0.5)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #ff6b6b, #f7b731)',
                  boxShadow: '0 0 30px rgba(255, 107, 107, 0.7)',
                },
              }}
            >
              🏆 JOIN TOURNAMENT
            </Button>
          </Box>
        </Box>
        
        {/* Game Flow Steps */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
          {gameFlowSteps.map((step, index) => (
            <Box key={index} sx={{ flex: 1 }}>
              <Paper
                elevation={6}
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #181818 60%, #00a8ff 100%)',
                  border: '2px solid #00a8ff',
                  borderRadius: 3,
                  boxShadow: '0 0 30px #00a8ff, 0 0 50px rgba(0, 168, 255, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 0 40px #00a8ff, 0 0 60px rgba(0, 168, 255, 0.5)',
                  },
                }}
                onClick={() => navigate(step.path)}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: '#00a8ff',
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 700,
                    mb: 2,
                    textShadow: '0 0 10px #00a8ff',
                  }}
                >
                  {step.icon} {step.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#ccc',
                    fontFamily: 'Orbitron, monospace',
                  }}
                >
                  {step.description}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>
        
        {/* Stats Section */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, justifyContent: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, #181818 60%, #00a8ff 100%)', 
              border: '2px solid #00a8ff',
              boxShadow: '0 0 20px #00a8ff'
            }}>
              <Typography variant="h5" sx={{ color: '#00a8ff', mb: 2, fontFamily: 'Orbitron' }}>
                Wallet Balance
              </Typography>
              <Typography variant="h4" sx={{ color: '#fff', fontFamily: 'Orbitron' }}>
                $1,250.00
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, #181818 60%, #f7b731 100%)', 
              border: '2px solid #f7b731',
              boxShadow: '0 0 20px #f7b731'
            }}>
              <Typography variant="h5" sx={{ color: '#f7b731', mb: 2, fontFamily: 'Orbitron' }}>
                Rewards
              </Typography>
              <Typography variant="h4" sx={{ color: '#fff', fontFamily: 'Orbitron' }}>
                2,450 Points
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, #181818 60%, #ff6b6b 100%)', 
              border: '2px solid #ff6b6b',
              boxShadow: '0 0 20px #ff6b6b'
            }}>
              <Typography variant="h5" sx={{ color: '#ff6b6b', mb: 2, fontFamily: 'Orbitron' }}>
                Games Won
              </Typography>
              <Typography variant="h4" sx={{ color: '#fff', fontFamily: 'Orbitron' }}>
                47
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default Dashboard;
