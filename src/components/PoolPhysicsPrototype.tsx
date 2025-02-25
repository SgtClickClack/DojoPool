import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { World, Body, Sphere, Plane } from 'cannon-es';

const PoolPhysicsPrototype: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // --- Three.js Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // --- Cannon-es Physics World Setup ---
    const world = new World();
    world.gravity.set(0, -9.81, 0);

    // Create a static ground plane to simulate the pool table surface
    const groundBody = new Body({
      mass: 0, // mass = 0 makes it static
      shape: new Plane(),
    });
    // Rotate the plane so that it's horizontal
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // Create a pool ball using Cannon-es physics
    const ballRadius = 0.5;
    const ballBody = new Body({
      mass: 1,
      shape: new Sphere(ballRadius),
    });
    // Position the ball slightly above the plane
    ballBody.position.set(0, ballRadius, 0);
    world.addBody(ballBody);

    // Create a Three.js sphere to represent the pool ball visually
    const sphereGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const ballMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(ballMesh);

    // Add ambient and directional lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // --- Animation Loop & Physics Update ---
    let lastTime: number;
    const animate = (time: number) => {
      requestAnimationFrame(animate);
      if (lastTime !== undefined) {
        const delta = (time - lastTime) / 1000; // Convert ms to seconds
        world.step(1 / 60, delta, 3);
      }
      lastTime = time;

      // Synchronize Three.js ball with Cannon-es ball
      ballMesh.position.set(
        ballBody.position.x,
        ballBody.position.y,
        ballBody.position.z
      );
      ballMesh.quaternion.set(
        ballBody.quaternion.x,
        ballBody.quaternion.y,
        ballBody.quaternion.z,
        ballBody.quaternion.w
      );

      renderer.render(scene, camera);
    };
    animate(0);

    // --- Handle Window Resize ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default PoolPhysicsPrototype; 