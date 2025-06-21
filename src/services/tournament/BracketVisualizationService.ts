import { io, Socket } from 'socket.io-client';
import * as THREE from 'three';

export interface BracketNode {
  id: string;
  matchId: string;
  player1: PlayerInfo;
  player2: PlayerInfo;
  winner?: PlayerInfo;
  round: number;
  position: number;
  status: 'pending' | 'in-progress' | 'completed';
  score?: string;
  startTime?: Date;
  endTime?: Date;
  position3D: THREE.Vector3;
  connections: string[];
}

export interface PlayerInfo {
  id: string;
  name: string;
  avatar: string;
  seed: number;
  rating: number;
  wins: number;
  losses: number;
  status: 'active' | 'eliminated' | 'winner';
}

export interface TournamentBracket {
  id: string;
  name: string;
  type: 'single-elimination' | 'double-elimination' | 'round-robin';
  totalRounds: number;
  totalMatches: number;
  currentRound: number;
  nodes: BracketNode[];
  players: PlayerInfo[];
  startDate: Date;
  endDate?: Date;
  status: 'upcoming' | 'in-progress' | 'completed';
}

export interface BracketConfig {
  nodeSpacing: number;
  roundSpacing: number;
  nodeSize: number;
  animationSpeed: number;
  autoRotate: boolean;
  showConnections: boolean;
  showLabels: boolean;
  cameraDistance: number;
  backgroundColor: string;
  nodeColor: string;
  connectionColor: string;
}

export interface MatchUpdate {
  matchId: string;
  player1Score: number;
  player2Score: number;
  status: 'pending' | 'in-progress' | 'completed';
  winnerId?: string;
  timestamp: Date;
}

class BracketVisualizationService {
  private socket: Socket | null = null;
  private static instance: BracketVisualizationService;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private bracket: TournamentBracket | null = null;
  private config: BracketConfig;
  private nodes: Map<string, THREE.Mesh> = new Map();
  private connections: Map<string, THREE.Line> = new Map();
  private animations: Map<string, THREE.AnimationMixer> = new Map();
  private isRendering: boolean = false;

  private constructor() {
    this.config = {
      nodeSpacing: 2,
      roundSpacing: 4,
      nodeSize: 0.5,
      animationSpeed: 1,
      autoRotate: true,
      showConnections: true,
      showLabels: true,
      cameraDistance: 15,
      backgroundColor: '#0a0a0a',
      nodeColor: '#00ff9d',
      connectionColor: '#00a8ff',
    };
    this.initializeSocket();
  }

  public static getInstance(): BracketVisualizationService {
    if (!BracketVisualizationService.instance) {
      BracketVisualizationService.instance = new BracketVisualizationService();
    }
    return BracketVisualizationService.instance;
  }

  private initializeSocket(): void {
    this.socket = io('http://localhost:8080');
    
    this.socket.on('connect', () => {
      console.log('BracketVisualizationService connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('BracketVisualizationService disconnected from server');
    });

    this.socket.on('match-update', (update: MatchUpdate) => {
      this.handleMatchUpdate(update);
    });

    this.socket.on('bracket-update', (bracket: TournamentBracket) => {
      this.updateBracket(bracket);
    });
  }

  // 3D Scene Management
  public initializeScene(container: HTMLElement): void {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.backgroundColor);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, this.config.cameraDistance);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Add lighting
    this.setupLighting();

    // Start rendering
    this.isRendering = true;
    this.animate();

    this.socket?.emit('bracket-scene-initialized');
  }

  private setupLighting(): void {
    if (!this.scene) return;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Point lights for cyberpunk effect
    const pointLight1 = new THREE.PointLight(0x00ff9d, 1, 20);
    pointLight1.position.set(-5, 5, 5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00a8ff, 1, 20);
    pointLight2.position.set(5, -5, 5);
    this.scene.add(pointLight2);
  }

  private animate(): void {
    if (!this.isRendering) return;

    requestAnimationFrame(() => this.animate());

    // Auto-rotate camera
    if (this.config.autoRotate && this.camera) {
      const time = Date.now() * 0.001;
      this.camera.position.x = Math.cos(time * 0.5) * this.config.cameraDistance;
      this.camera.position.z = Math.sin(time * 0.5) * this.config.cameraDistance;
      this.camera.lookAt(0, 0, 0);
    }

    // Update animations
    this.animations.forEach((mixer) => {
      mixer.update(0.016);
    });

    // Render scene
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // Bracket Management
  public loadBracket(bracket: TournamentBracket): void {
    this.bracket = bracket;
    this.generateBracket3D();
    this.socket?.emit('bracket-loaded', { bracketId: bracket.id });
  }

  private generateBracket3D(): void {
    if (!this.scene || !this.bracket) return;

    // Clear existing nodes and connections
    this.clearBracket();

    // Calculate positions for each round
    const roundPositions = this.calculateRoundPositions();

    // Create nodes for each match
    this.bracket.nodes.forEach((node) => {
      this.createMatchNode(node, roundPositions[node.round]);
    });

    // Create connections between nodes
    if (this.config.showConnections) {
      this.createConnections();
    }

    // Add labels if enabled
    if (this.config.showLabels) {
      this.addLabels();
    }
  }

  private calculateRoundPositions(): Map<number, THREE.Vector3[]> {
    const positions = new Map<number, THREE.Vector3[]>();
    
    if (!this.bracket) return positions;

    for (let round = 0; round < this.bracket.totalRounds; round++) {
      const matchesInRound = this.bracket.nodes.filter(node => node.round === round);
      const positionsInRound: THREE.Vector3[] = [];

      matchesInRound.forEach((match, index) => {
        const x = round * this.config.roundSpacing;
        const y = (index - (matchesInRound.length - 1) / 2) * this.config.nodeSpacing;
        const z = 0;
        
        positionsInRound.push(new THREE.Vector3(x, y, z));
        match.position3D = new THREE.Vector3(x, y, z);
      });

      positions.set(round, positionsInRound);
    }

    return positions;
  }

  private createMatchNode(node: BracketNode, position: THREE.Vector3): void {
    if (!this.scene) return;

    // Create node geometry
    const geometry = new THREE.SphereGeometry(this.config.nodeSize, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: this.getNodeColor(node.status),
      emissive: this.getNodeColor(node.status),
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.9,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(this.config.nodeSize * 1.2, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.getNodeColor(node.status),
      transparent: true,
      opacity: 0.3,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(position);
    mesh.add(glowMesh);

    // Store reference
    this.nodes.set(node.id, mesh);
    this.scene.add(mesh);

    // Add click event
    mesh.userData = { nodeId: node.id };
  }

  private createConnections(): void {
    if (!this.scene || !this.bracket) return;

    this.bracket.nodes.forEach((node) => {
      node.connections.forEach((connectionId) => {
        const targetNode = this.bracket!.nodes.find(n => n.id === connectionId);
        if (targetNode && this.nodes.has(node.id) && this.nodes.has(connectionId)) {
          const startNode = this.nodes.get(node.id)!;
          const endNode = this.nodes.get(connectionId)!;

          const geometry = new THREE.BufferGeometry().setFromPoints([
            startNode.position,
            endNode.position
          ]);

          const material = new THREE.LineBasicMaterial({
            color: this.config.connectionColor,
            transparent: true,
            opacity: 0.6,
          });

          const line = new THREE.Line(geometry, material);
          this.connections.set(`${node.id}-${connectionId}`, line);
          this.scene!.add(line);
        }
      });
    });
  }

  private addLabels(): void {
    if (!this.scene || !this.bracket) return;

    this.bracket.nodes.forEach((node) => {
      if (this.nodes.has(node.id)) {
        const mesh = this.nodes.get(node.id)!;
        
        // Create text sprite for player names
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = 256;
        canvas.height = 128;
        
        context.fillStyle = '#ffffff';
        context.font = '24px Orbitron';
        context.textAlign = 'center';
        context.fillText(node.player1.name, 128, 40);
        context.fillText(node.player2.name, 128, 80);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        sprite.position.copy(mesh.position);
        sprite.position.y += this.config.nodeSize + 0.5;
        sprite.scale.set(2, 1, 1);
        
        this.scene!.add(sprite);
      }
    });
  }

  private getNodeColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#00ff9d';
      case 'in-progress':
        return '#feca57';
      case 'pending':
        return '#666666';
      default:
        return '#00a8ff';
    }
  }

  private clearBracket(): void {
    if (!this.scene) return;

    // Remove nodes
    this.nodes.forEach((mesh) => {
      this.scene!.remove(mesh);
    });
    this.nodes.clear();

    // Remove connections
    this.connections.forEach((line) => {
      this.scene!.remove(line);
    });
    this.connections.clear();

    // Remove animations
    this.animations.clear();
  }

  // Match Updates
  private handleMatchUpdate(update: MatchUpdate): void {
    const node = this.bracket?.nodes.find(n => n.matchId === update.matchId);
    if (node && this.nodes.has(node.id)) {
      const mesh = this.nodes.get(node.id)!;
      
      // Update node color
      const material = mesh.material as THREE.MeshPhongMaterial;
      material.color.setHex(this.getNodeColor(update.status));
      material.emissive.setHex(this.getNodeColor(update.status));

      // Add animation
      this.animateNodeUpdate(mesh);

      // Update bracket data
      if (this.bracket) {
        const bracketNode = this.bracket.nodes.find(n => n.matchId === update.matchId);
        if (bracketNode) {
          bracketNode.status = update.status;
          if (update.winnerId) {
            bracketNode.winner = bracketNode.player1.id === update.winnerId 
              ? bracketNode.player1 
              : bracketNode.player2;
          }
        }
      }
    }
  }

  private animateNodeUpdate(mesh: THREE.Mesh): void {
    // Scale animation
    const originalScale = mesh.scale.clone();
    const targetScale = originalScale.clone().multiplyScalar(1.5);

    const scaleUp = new THREE.Tween(mesh.scale)
      .to(targetScale, 200)
      .easing(THREE.Easing.Quadratic.Out);

    const scaleDown = new THREE.Tween(mesh.scale)
      .to(originalScale, 200)
      .easing(THREE.Easing.Quadratic.In);

    scaleUp.chain(scaleDown);
    scaleUp.start();
  }

  // Configuration Management
  public updateConfig(newConfig: Partial<BracketConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Apply configuration changes
    if (this.scene) {
      this.scene.background = new THREE.Color(this.config.backgroundColor);
    }

    if (this.config.showConnections) {
      this.createConnections();
    } else {
      this.clearConnections();
    }

    this.socket?.emit('bracket-config-updated', this.config);
  }

  private clearConnections(): void {
    if (!this.scene) return;

    this.connections.forEach((line) => {
      this.scene!.remove(line);
    });
    this.connections.clear();
  }

  public getConfig(): BracketConfig {
    return { ...this.config };
  }

  // Camera Controls
  public setCameraPosition(x: number, y: number, z: number): void {
    if (this.camera) {
      this.camera.position.set(x, y, z);
      this.camera.lookAt(0, 0, 0);
    }
  }

  public resetCamera(): void {
    if (this.camera) {
      this.camera.position.set(0, 0, this.config.cameraDistance);
      this.camera.lookAt(0, 0, 0);
    }
  }

  public toggleAutoRotate(): void {
    this.config.autoRotate = !this.config.autoRotate;
    this.socket?.emit('auto-rotate-toggled', this.config.autoRotate);
  }

  // Interaction
  public addClickHandler(handler: (nodeId: string) => void): void {
    if (!this.renderer) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event: MouseEvent) => {
      const rect = this.renderer!.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera!);
      const intersects = raycaster.intersectObjects(Array.from(this.nodes.values()));

      if (intersects.length > 0) {
        const nodeId = intersects[0].object.userData.nodeId;
        handler(nodeId);
      }
    };

    this.renderer.domElement.addEventListener('click', onClick);
  }

  // Utility Methods
  public resize(width: number, height: number): void {
    if (this.camera && this.renderer) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  public updateBracket(bracket: TournamentBracket): void {
    this.bracket = bracket;
    this.generateBracket3D();
  }

  public getBracket(): TournamentBracket | null {
    return this.bracket;
  }

  public stopRendering(): void {
    this.isRendering = false;
  }

  public disconnect(): void {
    this.stopRendering();
    this.socket?.disconnect();
  }
}

export default BracketVisualizationService; 