// @ts-nocheck
import React, { useMemo } from 'react';
import { Canvas, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';

// Extend THREE with geometries we're using
extend({
  BoxGeometry: THREE.BoxGeometry,
  SphereGeometry: THREE.SphereGeometry,
  CylinderGeometry: THREE.CylinderGeometry,
  CircleGeometry: THREE.CircleGeometry,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
});

interface Avatar3DPreviewProps {
  image?: string;
  prompt?: string;
}

const Mohawk = () => (
  <mesh position={[0, 1.1, 0]}>
    <boxGeometry args={[0.15, 0.5, 0.15]} />
    <meshStandardMaterial color="#ff00ff" />
  </mesh>
);

const Head = () => (
  <mesh position={[0, 1, 0]}>
    <sphereGeometry args={[0.5, 32, 32]} />
    <meshStandardMaterial color="#ffe0b2" />
  </mesh>
);

const Body = () => (
  <mesh position={[0, 0.25, 0]}>
    <cylinderGeometry args={[0.4, 0.4, 0.5, 32]} />
    <meshStandardMaterial color="#2196f3" />
  </mesh>
);

const Avatar3DPreview: React.FC<Avatar3DPreviewProps> = ({ image, prompt }) => {
  const hasMohawk = useMemo(() => {
    return prompt?.toLowerCase().includes('mohawk') || false;
  }, [prompt]);

  return (
    <div
      style={{
        width: '100%',
        height: '600px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        border: '2px solid #00ff9d',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.4} />

        <group position={[0, -0.5, 0]}>
          <Head />
          <Body />
          {hasMohawk && <Mohawk />}
        </group>

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
};

export default Avatar3DPreview;
