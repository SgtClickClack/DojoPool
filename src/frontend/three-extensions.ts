import { extend } from '@react-three/fiber';
import * as THREE from 'three';

extend({
  BoxGeometry: THREE.BoxGeometry,
  SphereGeometry: THREE.SphereGeometry,
  CylinderGeometry: THREE.CylinderGeometry,
  CircleGeometry: THREE.CircleGeometry,
  PlaneGeometry: THREE.PlaneGeometry,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
  MeshBasicMaterial: THREE.MeshBasicMaterial,
  MeshPhysicalMaterial: THREE.MeshPhysicalMaterial,
  MeshLambertMaterial: THREE.MeshLambertMaterial,
  MeshPhongMaterial: THREE.MeshPhongMaterial,
  TorusGeometry: THREE.TorusGeometry,
  TorusKnotGeometry: THREE.TorusKnotGeometry,
  ConeGeometry: THREE.ConeGeometry,
  RingGeometry: THREE.RingGeometry,
  DodecahedronGeometry: THREE.DodecahedronGeometry,
  OctahedronGeometry: THREE.OctahedronGeometry,
  TetrahedronGeometry: THREE.TetrahedronGeometry,
  IcosahedronGeometry: THREE.IcosahedronGeometry,
  CapsuleGeometry: (THREE as any).CapsuleGeometry,
}); 