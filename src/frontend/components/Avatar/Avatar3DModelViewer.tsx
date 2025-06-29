import React, { Suspense, useEffect, useState } from 'react';
import { Canvas, extend } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Stage } from '@react-three/drei';
import { Box, Typography, CircularProgress } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import * as THREE from 'three';

extend({
  BoxGeometry: THREE.BoxGeometry,
  SphereGeometry: THREE.SphereGeometry,
  CylinderGeometry: THREE.CylinderGeometry,
  CircleGeometry: THREE.CircleGeometry,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
});

interface Avatar3DModelViewerProps {
  modelUrl?: string;
  height?: number;
}

function Model({ modelUrl }: { modelUrl: string }) {
  const [error, setError] = useState<Error | null>(null);
  const { scene, errors } = useGLTF(modelUrl, true);
  
  useEffect(() => {
    if (errors?.length) {
      setError(new Error(errors[0]));
    }
  }, [errors]);

  if (error) {
    throw error;
  }
  
  return <primitive object={scene} />;
}

function LoadingFallback() {
  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <CircularProgress />
    </Box>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 2,
      p: 2
    }}>
      <Typography variant="body1" color="error">
        Error loading 3D model
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {error.message}
      </Typography>
    </Box>
  );
}

const Avatar3DModelViewer: React.FC<Avatar3DModelViewerProps> = ({ 
  modelUrl, 
  height = 400 
}) => {
  if (!modelUrl) {
    return (
      <Box
        sx={{
          width: '100%',
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #666',
          borderRadius: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.1)'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No 3D model available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height }}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Stage environment="city" intensity={0.6}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Model modelUrl={modelUrl} />
              </ErrorBoundary>
            </Stage>
          </Suspense>
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={false}
          />
          <Environment preset="city" />
        </Canvas>
      </ErrorBoundary>
    </Box>
  );
};

export default Avatar3DModelViewer; 