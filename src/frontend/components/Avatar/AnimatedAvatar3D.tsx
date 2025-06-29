import React, { useEffect, useRef } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface AnimatedAvatar3DProps {
  hasAvatar?: boolean;
  avatarUrl?: string;
  username?: string;
}

const AnimatedAvatar3D: React.FC<AnimatedAvatar3DProps> = ({ 
  hasAvatar = false, 
  avatarUrl, 
  username = 'Player' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 300;
    canvas.height = 400;

    let animationId: number;
    let time = 0;

    const drawAvatar = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create gradient background
      const gradient = ctx.createRadialGradient(150, 200, 0, 150, 200, 200);
      gradient.addColorStop(0, 'rgba(0, 255, 157, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 168, 255, 0.05)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Animation timing
      const bounce = Math.sin(time * 0.05) * 3;
      const sway = Math.sin(time * 0.03) * 2;
      const footShift = Math.sin(time * 0.04) * 8;

      // Draw shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(150 + sway, 380, 40 + Math.abs(footShift) * 0.5, 15, 0, 0, 2 * Math.PI);
      ctx.fill();

      // Draw body (torso)
      ctx.fillStyle = hasAvatar ? '#4a90e2' : '#666';
      ctx.fillRect(140 + sway, 200 + bounce, 20, 60);

      // Draw head
      if (hasAvatar && avatarUrl) {
        // Draw avatar image
        const img = new Image();
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(150 + sway, 180 + bounce, 25, 0, 2 * Math.PI);
          ctx.clip();
          ctx.drawImage(img, 125 + sway, 155 + bounce, 50, 50);
          ctx.restore();
        };
        img.src = avatarUrl;
      } else {
        // Draw placeholder head
        ctx.fillStyle = '#ffb366';
        ctx.beginPath();
        ctx.arc(150 + sway, 180 + bounce, 25, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(145 + sway, 175 + bounce, 3, 0, 2 * Math.PI);
        ctx.arc(155 + sway, 175 + bounce, 3, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Draw arms
      ctx.fillStyle = hasAvatar ? '#4a90e2' : '#666';
      // Left arm (holding pool cue)
      ctx.save();
      ctx.translate(130 + sway, 220 + bounce);
      ctx.rotate(Math.sin(time * 0.02) * 0.1);
      ctx.fillRect(-5, 0, 10, 40);
      ctx.restore();

      // Right arm (combat stance)
      ctx.save();
      ctx.translate(170 + sway, 220 + bounce);
      ctx.rotate(Math.sin(time * 0.02 + 1) * 0.1 - 0.3);
      ctx.fillRect(-5, 0, 10, 35);
      ctx.restore();

      // Draw legs with foot shifting animation
      ctx.fillStyle = hasAvatar ? '#2c5aa0' : '#444';
      
      // Left leg
      ctx.save();
      ctx.translate(145 + sway, 260 + bounce);
      ctx.rotate(footShift * 0.02);
      ctx.fillRect(-5, 0, 10, 50);
      ctx.restore();

      // Right leg
      ctx.save();
      ctx.translate(155 + sway, 260 + bounce);
      ctx.rotate(-footShift * 0.02);
      ctx.fillRect(-5, 0, 10, 50);
      ctx.restore();

      // Draw feet
      ctx.fillStyle = '#333';
      ctx.fillRect(140 + sway - footShift * 0.5, 310 + bounce, 12, 8);
      ctx.fillRect(150 + sway + footShift * 0.5, 310 + bounce, 12, 8);

      // Draw pool cue
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 3;
      ctx.save();
      ctx.translate(125 + sway, 220 + bounce);
      ctx.rotate(-0.3 + Math.sin(time * 0.01) * 0.05);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-60, -20);
      ctx.stroke();
      
      // Pool cue tip
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-60, -20);
      ctx.lineTo(-70, -25);
      ctx.stroke();
      ctx.restore();

      // Draw energy aura/glow
      ctx.strokeStyle = `rgba(0, 255, 157, ${0.3 + Math.sin(time * 0.1) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(150 + sway, 200 + bounce, 80 + Math.sin(time * 0.08) * 5, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw combat stance particles
      for (let i = 0; i < 5; i++) {
        const angle = (time * 0.02 + i * 1.2) % (2 * Math.PI);
        const radius = 60 + Math.sin(time * 0.05 + i) * 10;
        const x = 150 + sway + Math.cos(angle) * radius;
        const y = 200 + bounce + Math.sin(angle) * radius;
        
        ctx.fillStyle = `rgba(0, 255, 157, ${0.6 + Math.sin(time * 0.1 + i) * 0.4})`;
        ctx.beginPath();
        ctx.arc(x, y, 2 + Math.sin(time * 0.1 + i) * 1, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Draw name
      ctx.fillStyle = '#00ff9d';
      ctx.font = '16px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#00ff9d';
      ctx.shadowBlur = 10;
      ctx.fillText(username, 150, 350);
      ctx.shadowBlur = 0;

      time++;
      animationId = requestAnimationFrame(drawAvatar);
    };

    drawAvatar();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [hasAvatar, avatarUrl, username]);

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ 
        position: 'relative',
        display: 'inline-block',
        mb: 2
      }}>
        <canvas
          ref={canvasRef}
          style={{
            border: '2px solid #00ff9d',
            borderRadius: '10px',
            boxShadow: '0 0 20px #00ff9d, 0 0 40px rgba(0, 255, 157, 0.3)',
            background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.8) 0%, rgba(26, 26, 26, 0.7) 100%)'
          }}
        />
        
        {!hasAvatar && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 1
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#00a8ff',
                fontFamily: 'Orbitron, monospace',
                textShadow: '0 0 10px #00a8ff',
                mb: 2
              }}
            >
              No Avatar
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/avatar')}
              sx={{
                background: 'linear-gradient(45deg, #00ff9d 0%, #00a8ff 100%)',
                color: '#000',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(45deg, #00a8ff 0%, #00ff9d 100%)',
                  boxShadow: '0 0 20px #00a8ff',
                }
              }}
            >
              Create Avatar
            </Button>
          </Box>
        )}
      </Box>
      
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#00ff9d',
          fontFamily: 'Orbitron, monospace',
          textShadow: '0 0 10px #00ff9d',
          mb: 1
        }}
      >
        {hasAvatar ? 'Your Avatar' : 'Avatar Status'}
      </Typography>
      
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#00a8ff',
          fontFamily: 'Orbitron, monospace',
          opacity: 0.8
        }}
      >
        {hasAvatar ? 'Combat Ready' : 'Create your digital identity'}
      </Typography>
    </Box>
  );
};

export default AnimatedAvatar3D; 