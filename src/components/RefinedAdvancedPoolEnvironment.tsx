import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { World, Body, Sphere, Box, Vec3, Material, ContactMaterial } from 'cannon-es';

const RefinedAdvancedPoolEnvironment: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // --- Three.js Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x006400); // Dark green table

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

    // --- Define Physics Materials ---
    const tableMat = new Material('tableMat');
    const ballMat = new Material('ballMat');
    const railMat = new Material('railMat');

    // --- Define Contact Materials ---
    // Ball-Table: Lower restitution to simulate the absorption by the felt, moderate friction.
    const ballTableCM = new ContactMaterial(tableMat, ballMat, {
      friction: 0.5,
      restitution: 0.2,
    });
    world.addContactMaterial(ballTableCM);

    // Ball-Ball: Moderate friction and higher restitution for energy transfer.
    const ballBallCM = new ContactMaterial(ballMat, ballMat, {
      friction: 0.4,
      restitution: 0.6,
    });
    world.addContactMaterial(ballBallCM);

    // Ball-Rail: High friction to simulate cushioned collisions with rails and lower restitution.
    const ballRailCM = new ContactMaterial(ballMat, railMat, {
      friction: 0.7,
      restitution: 0.3,
    });
    world.addContactMaterial(ballRailCM);

    // --- Create Table Surface ---
    const tableWidth = 10;
    const tableLength = 20;
    const tableHeight = 0.2;

    // Visual table felt
    const tableGeometry = new THREE.BoxGeometry(tableWidth, tableHeight, tableLength);
    const tableVisualMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const tableMesh = new THREE.Mesh(tableGeometry, tableVisualMat);
    tableMesh.position.set(0, tableHeight / 2, 0);
    scene.add(tableMesh);

    // Physics body for table with table material
    const tableBody = new Body({
      mass: 0,
      position: new Vec3(0, tableHeight / 2, 0),
      material: tableMat,
    });
    const tableHalfExtents = new Vec3(tableWidth / 2, tableHeight / 2, tableLength / 2);
    tableBody.addShape(new Box(tableHalfExtents));
    world.addBody(tableBody);

    // --- Add Table Borders (Rails) ---
    const borderThickness = 0.5;
    const borderHeight = 0.3;
    const tableEdgeX = tableWidth / 2;
    const tableEdgeZ = tableLength / 2;
    const borderY = tableHeight + borderHeight / 2;

    // Helper to create rail with rail material
    const createRail = (
      pos: { x: number; y: number; z: number },
      size: { x: number; y: number; z: number }
    ) => {
      const railGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const railVisualMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const railMesh = new THREE.Mesh(railGeometry, railVisualMat);
      railMesh.position.set(pos.x, pos.y, pos.z);
      scene.add(railMesh);

      const railBody = new Body({
        mass: 0,
        position: new Vec3(pos.x, pos.y, pos.z),
        material: railMat,
      });
      const halfExtents = new Vec3(size.x / 2, size.y / 2, size.z / 2);
      railBody.addShape(new Box(halfExtents));
      world.addBody(railBody);
    };

    // Top rail (near -Z)
    createRail({ x: 0, y: borderY, z: -tableEdgeZ - borderThickness / 2 }, { x: tableWidth, y: borderHeight, z: borderThickness });
    // Bottom rail (near +Z)
    createRail({ x: 0, y: borderY, z: tableEdgeZ + borderThickness / 2 }, { x: tableWidth, y: borderHeight, z: borderThickness });
    // Left rail (near -X)
    createRail({ x: -tableEdgeX - borderThickness / 2, y: borderY, z: 0 }, { x: borderThickness, y: borderHeight, z: tableLength });
    // Right rail (near +X)
    createRail({ x: tableEdgeX + borderThickness / 2, y: borderY, z: 0 }, { x: borderThickness, y: borderHeight, z: tableLength });

    // --- Add Pockets (Visual Only) ---
    const pocketRadius = 0.6;
    const pocketPositions = [
      { x: -tableEdgeX, z: -tableEdgeZ },
      { x: tableEdgeX, z: -tableEdgeZ },
      { x: -tableEdgeX, z: tableEdgeZ },
      { x: tableEdgeX, z: tableEdgeZ },
      { x: -tableEdgeX, z: 0 },
      { x: tableEdgeX, z: 0 },
    ];
    pocketPositions.forEach((pos) => {
      const pocketGeom = new THREE.CircleGeometry(pocketRadius, 32);
      const pocketMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const pocketMesh = new THREE.Mesh(pocketGeom, pocketMat);
      pocketMesh.rotation.x = -Math.PI / 2;
      pocketMesh.position.set(pos.x, tableHeight + 0.01, pos.z);
      scene.add(pocketMesh);
    });

    // --- Create Multiple Pool Balls ---
    const ballRadius = 0.5;
    const ballPositions = [
      new THREE.Vector3(0, ballRadius + tableHeight, 0),    // Cue ball
      new THREE.Vector3(1, ballRadius + tableHeight, -2),
      new THREE.Vector3(-1, ballRadius + tableHeight, -2),
      new THREE.Vector3(0, ballRadius + tableHeight, -3),
    ];

    const ballBodies: Body[] = [];
    const ballMeshes: THREE.Mesh[] = [];
    const ballGeom = new THREE.SphereGeometry(ballRadius, 32, 32);

    ballPositions.forEach((pos) => {
      const ballBody = new Body({
        mass: 1,
        material: ballMat,
        position: new Vec3(pos.x, pos.y, pos.z),
      });
      ballBody.addShape(new Sphere(ballRadius));
      world.addBody(ballBody);
      ballBodies.push(ballBody);

      const ballVisualMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
      const ballMesh = new THREE.Mesh(ballGeom, ballVisualMat);
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

      // Update ball meshes with physics bodies
      ballBodies.forEach((body, idx) => {
        const mesh = ballMeshes[idx];
        mesh.position.set(body.position.x, body.position.y, body.position.z);
        mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
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

export default RefinedAdvancedPoolEnvironment; 