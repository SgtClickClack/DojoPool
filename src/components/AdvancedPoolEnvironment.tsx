import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { World, Body, Sphere, Plane, Box, Vec3 } from 'cannon-es';

const AdvancedPoolEnvironment: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // --- Three.js Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x006400); // Dark green for the pool table

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 20, 30);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // --- Cannon-es Physics World Setup ---
    const world = new World();
    world.gravity.set(0, -9.81, 0);

    // --- Create Table Surface ---
    const tableWidth = 10;
    const tableLength = 20;
    const tableHeight = 0.2;

    // Visual table felt
    const tableGeometry = new THREE.BoxGeometry(tableWidth, tableHeight, tableLength);
    const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const tableMesh = new THREE.Mesh(tableGeometry, tableMaterial);
    tableMesh.position.set(0, tableHeight / 2, 0);
    scene.add(tableMesh);

    // Physics body for table
    const tableBody = new Body({
      mass: 0,
      position: new Vec3(0, tableHeight / 2, 0),
    });
    const tableHalfExtents = new Vec3(tableWidth / 2, tableHeight / 2, tableLength / 2);
    tableBody.addShape(new Box(tableHalfExtents));
    world.addBody(tableBody);

    // --- Add Table Borders (Rails) ---
    const borderThickness = 0.5;
    const borderHeight = 0.3;
    const tableEdgeX = tableWidth / 2;
    const tableEdgeZ = tableLength / 2;
    const borderY = tableHeight + borderHeight / 2; // Positioned just above the table

    // Helper function to create a border element
    const createBorder = (
      pos: { x: number; y: number; z: number },
      size: { x: number; y: number; z: number }
    ) => {
      // Visual mesh
      const borderGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const borderMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown color for rails
      const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
      borderMesh.position.set(pos.x, pos.y, pos.z);
      scene.add(borderMesh);

      // Physics body
      const borderBody = new Body({
        mass: 0,
        position: new Vec3(pos.x, pos.y, pos.z),
      });
      const halfExtents = new Vec3(size.x / 2, size.y / 2, size.z / 2);
      borderBody.addShape(new Box(halfExtents));
      world.addBody(borderBody);
    };

    // Top border (near -Z)
    createBorder(
      { x: 0, y: borderY, z: -tableEdgeZ - borderThickness / 2 },
      { x: tableWidth, y: borderHeight, z: borderThickness }
    );
    // Bottom border (near +Z)
    createBorder(
      { x: 0, y: borderY, z: tableEdgeZ + borderThickness / 2 },
      { x: tableWidth, y: borderHeight, z: borderThickness }
    );
    // Left border (near -X)
    createBorder(
      { x: -tableEdgeX - borderThickness / 2, y: borderY, z: 0 },
      { x: borderThickness, y: borderHeight, z: tableLength }
    );
    // Right border (near +X)
    createBorder(
      { x: tableEdgeX + borderThickness / 2, y: borderY, z: 0 },
      { x: borderThickness, y: borderHeight, z: tableLength }
    );

    // --- Add Pockets (Visual Only) ---
    const pocketRadius = 0.6;
    const pocketPositions = [
      { x: -tableEdgeX, z: -tableEdgeZ }, // top left
      { x: tableEdgeX, z: -tableEdgeZ },  // top right
      { x: -tableEdgeX, z: tableEdgeZ },  // bottom left
      { x: tableEdgeX, z: tableEdgeZ },   // bottom right
      { x: -tableEdgeX, z: 0 },           // middle left
      { x: tableEdgeX, z: 0 },            // middle right
    ];
    pocketPositions.forEach((pos) => {
      const pocketGeometry = new THREE.CircleGeometry(pocketRadius, 32);
      const pocketMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const pocketMesh = new THREE.Mesh(pocketGeometry, pocketMaterial);
      // Rotate so it lies flat on the table
      pocketMesh.rotation.x = -Math.PI / 2;
      // Position slightly above the table to avoid z-fighting
      pocketMesh.position.set(pos.x, tableHeight + 0.01, pos.z);
      scene.add(pocketMesh);
    });

    // --- Create Multiple Pool Balls ---
    const ballRadius = 0.5;
    const ballPositions = [
      new THREE.Vector3(0, ballRadius + tableHeight, 0), // Cue ball
      new THREE.Vector3(1, ballRadius + tableHeight, -2),
      new THREE.Vector3(-1, ballRadius + tableHeight, -2),
      new THREE.Vector3(0, ballRadius + tableHeight, -3),
    ];

    const ballBodies: Body[] = [];
    const ballMeshes: THREE.Mesh[] = [];
    const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);

    ballPositions.forEach((pos) => {
      // Physics body for each ball
      const ballBody = new Body({
        mass: 1,
        position: new Vec3(pos.x, pos.y, pos.z),
      });
      ballBody.addShape(new Sphere(ballRadius));
      world.addBody(ballBody);
      ballBodies.push(ballBody);

      // Visual representation
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
    directionalLight.position.set(10, 20, 10);
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

      // Synchronize ball meshes with their physics bodies
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

export default AdvancedPoolEnvironment; 