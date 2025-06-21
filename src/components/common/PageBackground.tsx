import React from 'react';
import { Box } from '@mui/material';

interface PageBackgroundProps {
  variant: 'home' | 'dashboard' | 'tournaments' | 'map' | 'ledger' | 'social' | 'profile' | 'settings' | 'analytics' | 'mobile' | 'streaming' | 'venue' | 'blockchain';
  children: React.ReactNode;
}

const PageBackground: React.FC<PageBackgroundProps> = ({ variant, children }) => {
  const getBackgroundStyle = () => {
    switch (variant) {
      case 'home':
        return {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, rgba(0,255,157,0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(0,168,255,0.15) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(255,0,255,0.1) 0%, transparent 70%)
            `,
            pointerEvents: 'none',
          }
        };
      
      case 'dashboard':
        return {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 30% 70%, rgba(0,255,157,0.12) 0%, transparent 50%),
              radial-gradient(circle at 70% 30%, rgba(0,168,255,0.12) 0%, transparent 50%),
              linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.02) 50%, transparent 60%)
            `,
            pointerEvents: 'none',
          }
        };
      
      case 'tournaments':
        return {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 25% 75%, rgba(255,215,0,0.15) 0%, transparent 50%),
              radial-gradient(circle at 75% 25%, rgba(255,0,255,0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 70%)
            `,
            pointerEvents: 'none',
          }
        };
      
      case 'map':
        return {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 40% 60%, rgba(0,255,0,0.12) 0%, transparent 50%),
              radial-gradient(circle at 60% 40%, rgba(0,168,255,0.12) 0%, transparent 50%),
              linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%)
            `,
            pointerEvents: 'none',
          }
        };
      
      case 'ledger':
        return {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 35% 65%, rgba(255,193,7,0.15) 0%, transparent 50%),
              radial-gradient(circle at 65% 35%, rgba(76,175,80,0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)
            `,
            pointerEvents: 'none',
          }
        };
      
      case 'social':
        return {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 45% 55%, rgba(156,39,176,0.15) 0%, transparent 50%),
              radial-gradient(circle at 55% 45%, rgba(255,64,129,0.12) 0%, transparent 50%),
              linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)
            `,
            pointerEvents: 'none',
          }
        };
      
      case 'profile':
        return {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 50% 50%, rgba(0,255,157,0.1) 0%, transparent 60%),
              radial-gradient(circle at 20% 80%, rgba(0,168,255,0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
          }
        };
      
      case 'settings':
        return {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 30% 30%, rgba(158,158,158,0.12) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(255,255,255,0.08) 0%, transparent 50%),
              linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.02) 55%, transparent 65%)
            `,
            pointerEvents: 'none',
          }
        };
      
      case 'analytics':
        return {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 25% 25%, rgba(0,255,157,0.15) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(0,168,255,0.15) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(255,193,7,0.1) 0%, transparent 70%),
              linear-gradient(45deg, transparent 35%, rgba(255,255,255,0.03) 50%, transparent 65%)
            `,
            pointerEvents: 'none',
          }
        };
      
      case 'mobile':
        return {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 20%, rgba(0,255,157,0.12) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(0,168,255,0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(255,193,7,0.08) 0%, transparent 70%),
              linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.02) 50%, transparent 70%)
            `,
            pointerEvents: 'none',
          }
        };
      
      case 'streaming':
        return {
          background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 20%, rgba(0,255,157,0.12) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(0,168,255,0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(255,193,7,0.08) 0%, transparent 70%),
              linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.02) 50%, transparent 70%)
            `,
            pointerEvents: 'none',
          }
        };
      
      case 'venue':
        return {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 50% 50%, rgba(0,255,157,0.1) 0%, transparent 60%),
              radial-gradient(circle at 20% 80%, rgba(0,168,255,0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
          }
        };
      
      case 'blockchain':
        return {
          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 50% 50%, rgba(0,255,157,0.1) 0%, transparent 60%),
              radial-gradient(circle at 20% 80%, rgba(0,168,255,0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
          }
        };
      
      default:
        return {
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
        };
    }
  };

  const getBackgroundImage = (type: string): string => {
    switch (type) {
      case 'home':
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'dashboard':
        return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      case 'tournaments':
        return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      case 'map':
        return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      case 'ledger':
        return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
      case 'analytics':
        return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
      case 'mobile':
        return 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)';
      case 'streaming':
        return 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)';
      case 'venue':
        return 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)';
      case 'blockchain':
        return 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        ...getBackgroundStyle(),
      }}
    >
      {children}
    </Box>
  );
};

export default PageBackground; 