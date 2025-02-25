import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { World, Body, Sphere, Plane } from 'cannon-es';

const EnhancedPoolPhysicsPrototype: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // --- Three.js Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x006400); // Dark green background

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 20);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // --- Cannon-es Physics World Setup ---
    const world = new World();
    world.gravity.set(0, -9.81, 0);

    // Create a static ground plane for the pool table surface
    const tableBody = new Body({
      mass: 0,
      shape: new Plane(),
    });
    // Rotate the plane so it's horizontal
    tableBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(tableBody);

    // Visual representation of the pool table using a box geometry for table felt
    const tableWidth = 10;
    const tableLength = 20;
    const tableGeometry = new THREE.BoxGeometry(tableWidth, 0.2, tableLength);
    const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const tableMesh = new THREE.Mesh(tableGeometry, tableMaterial);
    tableMesh.position.set(0, 0.1, 0);
    scene.add(tableMesh);

    // --- Create Multiple Pool Balls ---
    const ballRadius = 0.5;
    const ballPositions = [
      new THREE.Vector3(0, ballRadius, 0),    // Cue ball
      new THREE.Vector3(1, ballRadius, -2),
      new THREE.Vector3(-1, ballRadius, -2),
      new THREE.Vector3(0, ballRadius, -3),
    ];

    const ballBodies: Body[] = [];
    const ballMeshes: THREE.Mesh[] = [];
    const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);

    ballPositions.forEach((pos) => {
      // Create a Cannon-es body for the ball
      const ballBody = new Body({
        mass: 1,
        shape: new Sphere(ballRadius),
      });
      ballBody.position.set(pos.x, pos.y, pos.z);
      world.addBody(ballBody);
      ballBodies.push(ballBody);

      // Create a Three.js mesh for visual representation
      const ballMaterial = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
      });
      const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
      scene.add(ballMesh);
      ballMeshes.push(ballMesh);
    });

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 20, 10);
    scene.add(directionalLight);

    // --- Animation Loop & Physics Update ---
    let lastTime: number;
    const animate = (time: number) => {
      requestAnimationFrame(animate);
      if (lastTime !== undefined) {
        const delta = (time - lastTime) / 1000;
        world.step(1 / 60, delta, 3);
      }
      lastTime = time;

      // Synchronize physics bodies with Three.js meshes
      ballBodies.forEach((body, idx) => {
        const mesh = ballMeshes[idx];
        mesh.position.set(body.position.x, body.position.y, body.position.z);
        mesh.quaternion.set(
          body.quaternion.x,
          body.quaternion.y,
          body.quaternion.z,
          body.quaternion.w
        );
      });

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

export default EnhancedPoolPhysicsPrototype; 