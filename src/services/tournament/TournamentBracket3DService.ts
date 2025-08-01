import { EventEmitter } from 'events';

export interface BracketNode3D {
  id: string;
  matchId: string;
  player1: string;
  player2: string;
  winner: string | null;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  status: 'pending' | 'in_progress' | 'completed';
  round: number;
  matchNumber: number;
  isHighlighted: boolean;
  isSelected: boolean;
  animationState: 'idle' | 'hover' | 'selected' | 'completed';
}

export interface BracketConnection3D {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  points: Array<{ x: number; y: number; z: number }>;
  thickness: number;
  color: string;
  isActive: boolean;
  animationProgress: number;
}

export interface BracketView3D {
  id: string;
  name: string;
  camera: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    fov: number;
  };
  lighting: {
    ambient: { intensity: number; color: string };
    directional: { intensity: number; color: string; position: { x: number; y: number; z: number } };
  };
  effects: {
    shadows: boolean;
    bloom: boolean;
    depthOfField: boolean;
  };
}

export interface MatchData3D {
  id: string;
  player1: {
    id: string;
    name: string;
    avatar: string;
    score: number;
    isWinner: boolean;
  };
  player2: {
    id: string;
    name: string;
    avatar: string;
    score: number;
    isWinner: boolean;
  };
  status: 'pending' | 'in_progress' | 'completed';
  startTime: Date | null;
  endTime: Date | null;
  duration: number;
  highlights: string[];
  statistics: {
    totalShots: number;
    averageAccuracy: number;
    safetySuccess: number;
    breakSuccess: number;
  };
}

class TournamentBracket3DService extends EventEmitter {
  private static instance: TournamentBracket3DService;
  private nodes: Map<string, BracketNode3D> = new Map();
  private connections: Map<string, BracketConnection3D> = new Map();
  private views: Map<string, BracketView3D> = new Map();
  private matches: Map<string, MatchData3D> = new Map();
  private selectedNode: string | null = null;
  private hoveredNode: string | null = null;
  private currentView: string = 'default';
  private isAnimating: boolean = false;

  private constructor() {
    super();
    this.initializeDefaultViews();
    this.initializeMockData();
  }

  public static getInstance(): TournamentBracket3DService {
    if (!TournamentBracket3DService.instance) {
      TournamentBracket3DService.instance = new TournamentBracket3DService();
    }
    return TournamentBracket3DService.instance;
  }

  private initializeDefaultViews(): void {
    // Default view - overview
    this.views.set('default', {
      id: 'default',
      name: 'Overview',
      camera: {
        position: { x: 0, y: 15, z: 20 },
        target: { x: 0, y: 0, z: 0 },
        fov: 60
      },
      lighting: {
        ambient: { intensity: 0.4, color: '#404040' },
        directional: { intensity: 0.8, color: '#ffffff', position: { x: 10, y: 10, z: 5 } }
      },
      effects: {
        shadows: true,
        bloom: false,
        depthOfField: false
      }
    });

    // Close-up view
    this.views.set('closeup', {
      id: 'closeup',
      name: 'Close-up',
      camera: {
        position: { x: 0, y: 5, z: 8 },
        target: { x: 0, y: 0, z: 0 },
        fov: 45
      },
      lighting: {
        ambient: { intensity: 0.6, color: '#404040' },
        directional: { intensity: 1.0, color: '#ffffff', position: { x: 5, y: 5, z: 3 } }
      },
      effects: {
        shadows: true,
        bloom: true,
        depthOfField: true
      }
    });

    // Top-down view
    this.views.set('topdown', {
      id: 'topdown',
      name: 'Top Down',
      camera: {
        position: { x: 0, y: 25, z: 0 },
        target: { x: 0, y: 0, z: 0 },
        fov: 75
      },
      lighting: {
        ambient: { intensity: 0.5, color: '#404040' },
        directional: { intensity: 0.7, color: '#ffffff', position: { x: 0, y: 10, z: 0 } }
      },
      effects: {
        shadows: false,
        bloom: false,
        depthOfField: false
      }
    });
  }

  private initializeMockData(): void {
    // Create mock bracket nodes for a 16-player tournament
    const players = [
      'Alex Chen', 'Sarah Johnson', 'Mike Rodriguez', 'Emma Wilson',
      'David Kim', 'Lisa Thompson', 'James Brown', 'Maria Garcia',
      'Robert Lee', 'Jennifer Davis', 'Christopher White', 'Amanda Miller',
      'Daniel Taylor', 'Jessica Anderson', 'Matthew Martinez', 'Nicole Clark'
    ];

    // Round 1 (16 players -> 8 matches)
    for (let i = 0; i < 8; i++) {
      const nodeId = `node-r1-${i + 1}`;
      const matchId = `match-r1-${i + 1}`;
      
      this.nodes.set(nodeId, {
        id: nodeId,
        matchId,
        player1: players[i * 2],
        player2: players[i * 2 + 1],
        winner: null,
        position: { x: (i - 3.5) * 4, y: 0, z: -10 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        status: 'pending',
        round: 1,
        matchNumber: i + 1,
        isHighlighted: false,
        isSelected: false,
        animationState: 'idle'
      });

      // Create match data
      this.matches.set(matchId, {
        id: matchId,
        player1: {
          id: `player-${i * 2}`,
          name: players[i * 2],
          avatar: `/avatars/player-${i * 2}.jpg`,
          score: 0,
          isWinner: false
        },
        player2: {
          id: `player-${i * 2 + 1}`,
          name: players[i * 2 + 1],
          avatar: `/avatars/player-${i * 2 + 1}.jpg`,
          score: 0,
          isWinner: false
        },
        status: 'pending',
        startTime: null,
        endTime: null,
        duration: 0,
        highlights: [],
        statistics: {
          totalShots: 0,
          averageAccuracy: 0,
          safetySuccess: 0,
          breakSuccess: 0
        }
      });
    }

    // Round 2 (8 players -> 4 matches)
    for (let i = 0; i < 4; i++) {
      const nodeId = `node-r2-${i + 1}`;
      const matchId = `match-r2-${i + 1}`;
      
      this.nodes.set(nodeId, {
        id: nodeId,
        matchId,
        player1: 'TBD',
        player2: 'TBD',
        winner: null,
        position: { x: (i - 1.5) * 6, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.2, y: 1.2, z: 1.2 },
        status: 'pending',
        round: 2,
        matchNumber: i + 1,
        isHighlighted: false,
        isSelected: false,
        animationState: 'idle'
      });

      // Create connections from round 1
      const fromNode1 = `node-r1-${i * 2 + 1}`;
      const fromNode2 = `node-r1-${i * 2 + 2}`;
      
      this.connections.set(`conn-${fromNode1}-${nodeId}`, {
        id: `conn-${fromNode1}-${nodeId}`,
        fromNodeId: fromNode1,
        toNodeId: nodeId,
        points: this.calculateConnectionPoints(fromNode1, nodeId),
        thickness: 2,
        color: '#00d4ff',
        isActive: false,
        animationProgress: 0
      });

      this.connections.set(`conn-${fromNode2}-${nodeId}`, {
        id: `conn-${fromNode2}-${nodeId}`,
        fromNodeId: fromNode2,
        toNodeId: nodeId,
        points: this.calculateConnectionPoints(fromNode2, nodeId),
        thickness: 2,
        color: '#00d4ff',
        isActive: false,
        animationProgress: 0
      });
    }

    // Round 3 (4 players -> 2 matches)
    for (let i = 0; i < 2; i++) {
      const nodeId = `node-r3-${i + 1}`;
      const matchId = `match-r3-${i + 1}`;
      
      this.nodes.set(nodeId, {
        id: nodeId,
        matchId,
        player1: 'TBD',
        player2: 'TBD',
        winner: null,
        position: { x: (i - 0.5) * 8, y: 0, z: 10 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1.4, y: 1.4, z: 1.4 },
        status: 'pending',
        round: 3,
        matchNumber: i + 1,
        isHighlighted: false,
        isSelected: false,
        animationState: 'idle'
      });

      // Create connections from round 2
      const fromNode1 = `node-r2-${i * 2 + 1}`;
      const fromNode2 = `node-r2-${i * 2 + 2}`;
      
      this.connections.set(`conn-${fromNode1}-${nodeId}`, {
        id: `conn-${fromNode1}-${nodeId}`,
        fromNodeId: fromNode1,
        toNodeId: nodeId,
        points: this.calculateConnectionPoints(fromNode1, nodeId),
        thickness: 3,
        color: '#ff6b35',
        isActive: false,
        animationProgress: 0
      });

      this.connections.set(`conn-${fromNode2}-${nodeId}`, {
        id: `conn-${fromNode2}-${nodeId}`,
        fromNodeId: fromNode2,
        toNodeId: nodeId,
        points: this.calculateConnectionPoints(fromNode2, nodeId),
        thickness: 3,
        color: '#ff6b35',
        isActive: false,
        animationProgress: 0
      });
    }

    // Final (2 players -> 1 match)
    const finalNodeId = 'node-final';
    const finalMatchId = 'match-final';
    
    this.nodes.set(finalNodeId, {
      id: finalNodeId,
      matchId: finalMatchId,
      player1: 'TBD',
      player2: 'TBD',
      winner: null,
      position: { x: 0, y: 0, z: 20 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1.6, y: 1.6, z: 1.6 },
      status: 'pending',
      round: 4,
      matchNumber: 1,
      isHighlighted: false,
      isSelected: false,
      animationState: 'idle'
    });

    // Create connections to final
    this.connections.set('conn-r3-1-final', {
      id: 'conn-r3-1-final',
      fromNodeId: 'node-r3-1',
      toNodeId: finalNodeId,
      points: this.calculateConnectionPoints('node-r3-1', finalNodeId),
      thickness: 4,
      color: '#ffd700',
      isActive: false,
      animationProgress: 0
    });

    this.connections.set('conn-r3-2-final', {
      id: 'conn-r3-2-final',
      fromNodeId: 'node-r3-2',
      toNodeId: finalNodeId,
      points: this.calculateConnectionPoints('node-r3-2', finalNodeId),
      thickness: 4,
      color: '#ffd700',
      isActive: false,
      animationProgress: 0
    });
  }

  private calculateConnectionPoints(fromNodeId: string, toNodeId: string): Array<{ x: number; y: number; z: number }> {
    const fromNode = this.nodes.get(fromNodeId);
    const toNode = this.nodes.get(toNodeId);
    
    if (!fromNode || !toNode) {
      return [];
    }

    // Create a curved path between nodes
    const midPoint = {
      x: (fromNode.position.x + toNode.position.x) / 2,
      y: (fromNode.position.y + toNode.position.y) / 2 + 2,
      z: (fromNode.position.z + toNode.position.z) / 2
    };

    return [
      fromNode.position,
      midPoint,
      toNode.position
    ];
  }

  // Public API Methods
  public getNodes(): BracketNode3D[] {
    return Array.from(this.nodes.values());
  }

  public getConnections(): BracketConnection3D[] {
    return Array.from(this.connections.values());
  }

  public getViews(): BracketView3D[] {
    return Array.from(this.views.values());
  }

  public getCurrentView(): BracketView3D {
    return this.views.get(this.currentView) || this.views.get('default')!;
  }

  public getMatches(): MatchData3D[] {
    return Array.from(this.matches.values());
  }

  public getNode(nodeId: string): BracketNode3D | null {
    return this.nodes.get(nodeId) || null;
  }

  public getMatch(matchId: string): MatchData3D | null {
    return this.matches.get(matchId) || null;
  }

  public selectNode(nodeId: string): void {
    // Clear previous selection
    if (this.selectedNode) {
      const prevNode = this.nodes.get(this.selectedNode);
      if (prevNode) {
        prevNode.isSelected = false;
        prevNode.animationState = 'idle';
      }
    }

    // Set new selection
    this.selectedNode = nodeId;
    const node = this.nodes.get(nodeId);
    if (node) {
      node.isSelected = true;
      node.animationState = 'selected';
      this.emit('nodeSelected', node);
    }
  }

  public hoverNode(nodeId: string | null): void {
    // Clear previous hover
    if (this.hoveredNode && this.hoveredNode !== this.selectedNode) {
      const prevNode = this.nodes.get(this.hoveredNode);
      if (prevNode) {
        prevNode.isHighlighted = false;
        prevNode.animationState = prevNode.isSelected ? 'selected' : 'idle';
      }
    }

    // Set new hover
    this.hoveredNode = nodeId;
    if (nodeId && nodeId !== this.selectedNode) {
      const node = this.nodes.get(nodeId);
      if (node) {
        node.isHighlighted = true;
        node.animationState = 'hover';
        this.emit('nodeHovered', node);
      }
    }
  }

  public setView(viewId: string): void {
    if (this.views.has(viewId)) {
      this.currentView = viewId;
      this.emit('viewChanged', this.views.get(viewId));
    }
  }

  public startMatch(matchId: string): void {
    const match = this.matches.get(matchId);
    if (match) {
      match.status = 'in_progress';
      match.startTime = new Date();
      
      const node = Array.from(this.nodes.values()).find(n => n.matchId === matchId);
      if (node) {
        node.status = 'in_progress';
        node.animationState = 'selected';
        this.emit('matchStarted', match);
      }
    }
  }

  public completeMatch(matchId: string, winnerId: string, scores: { player1: number; player2: number }): void {
    const match = this.matches.get(matchId);
    if (match) {
      match.status = 'completed';
      match.endTime = new Date();
      match.duration = match.endTime.getTime() - (match.startTime?.getTime() || 0);
      
      // Update scores and winner
      match.player1.score = scores.player1;
      match.player2.score = scores.player2;
      match.player1.isWinner = winnerId === match.player1.id;
      match.player2.isWinner = winnerId === match.player2.id;

      // Update bracket node
      const node = Array.from(this.nodes.values()).find(n => n.matchId === matchId);
      if (node) {
        node.status = 'completed';
        node.winner = winnerId === match.player1.id ? match.player1.name : match.player2.name;
        node.animationState = 'completed';
        
        // Activate connections to next round
        this.activateConnections(node.id);
        
        // Update next round match
        this.updateNextRoundMatch(node);
      }

      this.emit('matchCompleted', match);
    }
  }

  private activateConnections(nodeId: string): void {
    this.connections.forEach(connection => {
      if (connection.fromNodeId === nodeId) {
        connection.isActive = true;
        connection.animationProgress = 0;
        this.animateConnection(connection.id);
      }
    });
  }

  private updateNextRoundMatch(node: BracketNode3D): void {
    // Find the next round match this winner should advance to
    const nextRoundConnections = Array.from(this.connections.values())
      .filter(conn => conn.fromNodeId === node.id);
    
    if (nextRoundConnections.length > 0) {
      const nextNodeId = nextRoundConnections[0].toNodeId;
      const nextNode = this.nodes.get(nextNodeId);
      const nextMatch = this.matches.get(nextNode?.matchId || '');
      
      if (nextNode && nextMatch) {
        // Determine which player slot to fill
        const fromNode1 = this.nodes.get(nextRoundConnections[0].fromNodeId);
        const fromNode2 = this.nodes.get(nextRoundConnections[1]?.fromNodeId || '');
        
        if (fromNode1 && fromNode2) {
          // Both matches are completed, set up the next match
          nextMatch.player1.name = fromNode1.winner || 'TBD';
          nextMatch.player2.name = fromNode2.winner || 'TBD';
          nextNode.player1 = nextMatch.player1.name;
          nextNode.player2 = nextMatch.player2.name;
        } else {
          // Only one match completed, fill the first slot
          if (!nextMatch.player1.name || nextMatch.player1.name === 'TBD') {
            nextMatch.player1.name = node.winner || 'TBD';
            nextNode.player1 = nextMatch.player1.name;
          } else {
            nextMatch.player2.name = node.winner || 'TBD';
            nextNode.player2 = nextMatch.player2.name;
          }
        }
      }
    }
  }

  private animateConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    this.isAnimating = true;
    const animate = () => {
      connection.animationProgress += 0.02;
      if (connection.animationProgress >= 1) {
        connection.animationProgress = 1;
        this.isAnimating = false;
      } else {
        requestAnimationFrame(animate);
      }
      this.emit('connectionAnimated', connection);
    };
    animate();
  }

  public addHighlight(matchId: string, highlight: string): void {
    const match = this.matches.get(matchId);
    if (match) {
      match.highlights.push(highlight);
      this.emit('highlightAdded', { matchId, highlight });
    }
  }

  public updateStatistics(matchId: string, statistics: {
    totalShots: number;
    averageAccuracy: number;
    safetySuccess: number;
    breakSuccess: number;
  }): void {
    const match = this.matches.get(matchId);
    if (match) {
      match.statistics = statistics;
      this.emit('statisticsUpdated', { matchId, statistics });
    }
  }

  public createCustomView(name: string, camera: BracketView3D['camera'], lighting: BracketView3D['lighting'], effects: BracketView3D['effects']): string {
    const viewId = `custom-${Date.now()}`;
    const view: BracketView3D = {
      id: viewId,
      name,
      camera,
      lighting,
      effects
    };
    
    this.views.set(viewId, view);
    this.emit('viewCreated', view);
    return viewId;
  }

  public deleteView(viewId: string): boolean {
    if (viewId === 'default' || viewId === 'closeup' || viewId === 'topdown') {
      return false; // Cannot delete default views
    }
    
    const deleted = this.views.delete(viewId);
    if (deleted && this.currentView === viewId) {
      this.currentView = 'default';
    }
    this.emit('viewDeleted', viewId);
    return deleted;
  }

  public exportBracketData(): string {
    const data = {
      nodes: Array.from(this.nodes.values()),
      connections: Array.from(this.connections.values()),
      matches: Array.from(this.matches.values()),
      views: Array.from(this.views.values()),
      currentView: this.currentView
    };
    
    return JSON.stringify(data, null, 2);
  }

  public importBracketData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      
      // Clear existing data
      this.nodes.clear();
      this.connections.clear();
      this.matches.clear();
      this.views.clear();
      
      // Import data
      parsed.nodes?.forEach((node: BracketNode3D) => {
        this.nodes.set(node.id, node);
      });
      
      parsed.connections?.forEach((conn: BracketConnection3D) => {
        this.connections.set(conn.id, conn);
      });
      
      parsed.matches?.forEach((match: MatchData3D) => {
        this.matches.set(match.id, match);
      });
      
      parsed.views?.forEach((view: BracketView3D) => {
        this.views.set(view.id, view);
      });
      
      this.currentView = parsed.currentView || 'default';
      
      this.emit('bracketDataImported', parsed);
      return true;
    } catch (error) {
      console.error('Failed to import bracket data:', error);
      return false;
    }
  }

  // Event subscription methods
  public subscribeToUpdates(callback: (event: string, data: unknown) => void): void {
    this.on('nodeSelected', (data) => callback('nodeSelected', data));
    this.on('nodeHovered', (data) => callback('nodeHovered', data));
    this.on('viewChanged', (data) => callback('viewChanged', data));
    this.on('matchStarted', (data) => callback('matchStarted', data));
    this.on('matchCompleted', (data) => callback('matchCompleted', data));
    this.on('connectionAnimated', (data) => callback('connectionAnimated', data));
    this.on('highlightAdded', (data) => callback('highlightAdded', data));
    this.on('statisticsUpdated', (data) => callback('statisticsUpdated', data));
    this.on('viewCreated', (data) => callback('viewCreated', data));
    this.on('viewDeleted', (data) => callback('viewDeleted', data));
    this.on('bracketDataImported', (data) => callback('bracketDataImported', data));
  }

  public unsubscribeFromUpdates(_callback: (event: string, data: unknown) => void): void {
    this.removeAllListeners();
  }
}

export default TournamentBracket3DService; 
