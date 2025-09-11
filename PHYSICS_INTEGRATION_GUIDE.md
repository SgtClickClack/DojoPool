# DojoPool Physics Engine Integration Guide

This guide provides comprehensive instructions for integrating the C++ physics engine with the DojoPool application, enabling real-time physics calculations for pool game mechanics.

## 🎯 Integration Overview

The integration creates a complete pipeline:

```
Frontend (Next.js) → API (Python) → C++ Physics Engine → API → Frontend
```

### Components

- **C++ Physics Engine**: High-performance pool ball physics simulation
- **Node.js Addon**: Bridges C++ code to JavaScript runtime
- **Python API**: REST endpoints for physics calculations
- **Frontend Service**: TypeScript client for physics operations
- **Docker Integration**: Containerized deployment and testing

## 🚀 Quick Start

### 1. Build the Physics Engine

```bash
# Configure and build the C++ physics engine
cmake --preset release
cmake --build build/release

# Build the Node.js addon
cmake --build build/release --target install_nodejs_addon
```

### 2. Start the Integrated System

```bash
# Start all services with Docker Compose
docker-compose -f docker-compose.physics.yml up -d

# Or build and run manually
./build.sh --release
cd api && npm run start:dev
```

### 3. Verify Integration

```bash
# Check physics engine health
curl http://localhost:3001/api/physics/health

# Test physics processing
curl -X POST http://localhost:3001/api/physics/process \
  -H "Content-Type: application/json" \
  -d '{
    "balls": [{
      "position": {"x": 0, "y": 0},
      "velocity": {"x": 1, "y": 0},
      "angularVelocity": {"x": 0, "y": 0},
      "radius": 0.028575,
      "active": true,
      "id": 0
    }],
    "deltaTime": 0.016,
    "calculateTrajectories": true
  }'
```

## 🏗️ Architecture Details

### C++ Physics Engine (`src/physics/`)

The core physics engine provides:

- **Ball Physics**: Motion, friction, and spin calculations
- **Table Physics**: Boundary collision detection
- **Collision Detection**: Ball-to-ball interactions
- **Trajectory Prediction**: Shot path calculations

```cpp
// Usage example
dojopool::PoolPhysicsEngine engine;
engine.addBall({0, 0}, {1, 0}, {0, 0}, 0);
engine.simulateStep(0.016); // 60 FPS
auto balls = engine.getBallStates();
```

### Node.js Addon (`src/addon/`)

Bridges C++ to JavaScript:

```cpp
// C++ binding
Napi::Value PhysicsAddon::AddBall(const Napi::CallbackInfo& info) {
    // Extract JavaScript parameters
    // Call C++ physics engine
    // Return result to JavaScript
}
```

```javascript
// JavaScript usage
const addon = require('./dojopool_physics.node');
const physics = new addon.PhysicsAddon();
physics.addBall({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }, 0);
```

### Python API (`api/src/physics_api.py`)

REST API endpoints:

```python
# Process game state
result = await physics_api.process_game_state(game_state)

# Calculate shot prediction
prediction = await physics_api.calculate_shot(shot_request)

# Get trajectory
trajectory = await physics_api.get_trajectory(ball_id, max_time)
```

### Frontend Service (`apps/web/src/services/physicsService.ts`)

TypeScript client:

```typescript
// Process game state
const result = await physicsService.processGameState(gameState);

// Calculate shot
const prediction = await physicsService.calculateShotPrediction(shotRequest);

// Real-time simulation
const cleanup = physicsService.startRealTimeSimulation(
  () => getCurrentGameState(),
  (updatedState) => updateUI(updatedState)
);
```

## 📡 API Endpoints

### Game State Processing

**POST** `/api/physics/process`

Process complete game state through physics simulation.

**Request:**

```json
{
  "balls": [
    {
      "position": { "x": 0, "y": 0 },
      "velocity": { "x": 1, "y": 0 },
      "angularVelocity": { "x": 0, "y": 0 },
      "radius": 0.028575,
      "active": true,
      "id": 0
    }
  ],
  "deltaTime": 0.016,
  "calculateTrajectories": true
}
```

**Response:**

```json
{
  "success": true,
  "balls": [...],
  "trajectories": {"0": [...]},
  "timestamp": 1234567890,
  "processed": true
}
```

### Shot Calculation

**POST** `/api/physics/shot`

Calculate shot prediction with trajectory.

**Request:**

```json
{
  "start": { "x": 0, "y": 0 },
  "target": { "x": 2, "y": 1 },
  "power": 0.8,
  "spin": { "x": 0.1, "y": 0.05 },
  "type": "straight"
}
```

### Trajectory Calculation

**GET** `/api/physics/trajectory/{ballId}?max_time={seconds}`

Calculate trajectory for specific ball.

### Ball Management

**POST** `/api/physics/ball` - Add ball
**POST** `/api/physics/clear` - Clear all balls
**GET** `/api/physics/balls` - Get ball states

### System Status

**GET** `/api/physics/status` - Engine status
**GET** `/api/physics/health` - Health check

## 🧪 Testing

### Unit Tests

```bash
# Run physics unit tests
cmake --build build/debug --target dojopool_unit_tests
ctest --test-dir build/debug -R physics
```

### Integration Tests

```bash
# Run end-to-end integration tests
python -m pytest tests/integration/test_physics_integration.py -v

# With Docker
docker-compose -f docker-compose.physics.yml --profile testing up physics-tester
```

### Manual Testing

```bash
# Test physics processing
curl -X POST http://localhost:3001/api/physics/process \
  -H "Content-Type: application/json" \
  -d @test_data.json

# Test frontend integration
open http://localhost:3000
# Use browser dev tools to test physicsService
```

## 🐳 Docker Deployment

### Development Environment

```bash
# Start all services
docker-compose -f docker-compose.physics.yml up -d

# View logs
docker-compose -f docker-compose.physics.yml logs -f dojopool-api

# Run tests
docker-compose -f docker-compose.physics.yml --profile testing up physics-tester
```

### Production Deployment

```bash
# Build production images
docker build -f Dockerfile.api -t dojopool-api:latest .
docker build -f Dockerfile.frontend -t dojopool-frontend:latest .

# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Scaling

```bash
# Scale physics processing services
docker-compose -f docker-compose.physics.yml up -d --scale dojopool-api=3

# Load balancing with nginx
docker-compose -f docker-compose.physics.yml -f docker-compose.nginx.yml up -d
```

## ⚡ Performance Optimization

### C++ Engine Optimization

```cpp
// Enable compiler optimizations
set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -O3 -march=native")

// Use Link Time Optimization
set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE)

// Enable fast math
target_compile_options(dojopool_physics PRIVATE -ffast-math)
```

### Node.js Addon Optimization

```javascript
// Use worker threads for CPU-intensive tasks
const { Worker } = require('worker_threads');

function processPhysicsAsync(gameState) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./physics-worker.js', {
      workerData: gameState,
    });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}
```

### API Optimization

```python
# Use async processing
@app.post("/physics/process")
async def process_game_state(game_state: GameState):
    # Process in background thread
    result = await asyncio.get_event_loop().run_in_executor(
        None, physics_engine.process_game_state, game_state
    )
    return result

# Implement caching
@lru_cache(maxsize=100)
def calculate_trajectory_cached(ball_id: int, max_time: float):
    return physics_engine.calculate_trajectory(ball_id, max_time)
```

### Frontend Optimization

```typescript
// Batch physics requests
const batchProcessor = new BatchProcessor(physicsService, {
  maxBatchSize: 10,
  maxWaitTime: 16, // ~60 FPS
});

// Real-time simulation with frame rate limiting
const simulation = new RealTimeSimulation(physicsService, {
  targetFPS: 60,
  interpolation: true,
});
```

## 🔧 Troubleshooting

### Common Issues

1. **Addon Build Failures**

   ```bash
   # Clean and rebuild
   rm -rf build/ node_modules/
   npm install
   ./build.sh --clean --release

   # Check Node.js version compatibility
   node --version
   npm list node-addon-api
   ```

2. **Physics Engine Not Found**

   ```bash
   # Verify addon was built
   ls -la src/addon/build/Release/

   # Check library dependencies
   ldd src/addon/build/Release/dojopool_physics.node
   ```

3. **API Connection Issues**

   ```bash
   # Test API endpoints
   curl http://localhost:3001/api/physics/health

   # Check API logs
   docker-compose logs dojopool-api
   ```

4. **Performance Issues**

   ```bash
   # Profile C++ code
   cmake --build build/debug --target dojopool_physics -- -pg
   ./dojopool_physics
   gprof dojopool_physics gmon.out > profile.txt

   # Monitor Node.js performance
   node --prof physics-worker.js
   node --prof-process isolate-*.log > processed.txt
   ```

### Debug Mode

```bash
# Build in debug mode
cmake --preset debug
cmake --build build/debug

# Enable verbose logging
export DEBUG=physics:*
export PHYSICS_LOG_LEVEL=DEBUG

# Run with debugger
gdb --args node api/dist/main.js
```

## 📊 Monitoring & Metrics

### Health Checks

```bash
# Physics engine health
curl http://localhost:3001/api/physics/health

# System metrics
curl http://localhost:3001/metrics

# Performance metrics
curl http://localhost:3001/api/physics/status
```

### Performance Monitoring

```python
# Physics processing metrics
PHYSICS_REQUESTS = Counter('physics_requests_total', 'Total physics requests')
PHYSICS_DURATION = Histogram('physics_duration_seconds', 'Physics processing duration')

@PHYSICS_REQUESTS.count_exceptions()
@PHYSICS_DURATION.time()
async def process_game_state(game_state):
    return await physics_engine.process_game_state(game_state)
```

### Logging

```typescript
// Frontend logging
const logger = new PhysicsLogger({
  level: 'debug',
  remoteEndpoint: '/api/logs',
  batchSize: 10,
});

// Log physics operations
physicsService
  .processGameState(gameState)
  .then((result) => {
    logger.info('Physics processed', { ballsCount: result.balls.length });
  })
  .catch((error) => {
    logger.error('Physics processing failed', { error: error.message });
  });
```

## 🔄 Version Compatibility

| Component        | Version | Node.js | Python | C++ Standard |
| ---------------- | ------- | ------- | ------ | ------------ |
| Physics Engine   | 1.0.0   | 16+     | 3.8+   | C++17        |
| Node.js Addon    | 1.0.0   | 16+     | N/A    | C++17        |
| Python API       | 1.0.0   | N/A     | 3.8+   | N/A          |
| Frontend Service | 1.0.0   | 16+     | N/A    | N/A          |

## 📚 Advanced Usage

### Custom Physics Configurations

```cpp
// Custom physics parameters
PhysicsConfig config;
config.table_width = 10.0f;  // Custom table size
config.friction_coefficient = 0.01f;  // Lower friction
config.time_step = 1.0f / 120.0f;  // Higher precision

PoolPhysicsEngine engine(config);
```

### Multi-threaded Processing

```python
# Process multiple game states concurrently
async def process_multiple_games(game_states):
    tasks = [
        physics_api.process_game_state(state)
        for state in game_states
    ]
    results = await asyncio.gather(*tasks)
    return results
```

### Real-time Multiplayer Physics

```typescript
// Synchronize physics across clients
class MultiplayerPhysics {
  private localEngine: PhysicsEngine;
  private remoteStates: Map<string, GameState>;

  syncWithServer() {
    // Send local state to server
    const localState = this.getLocalState();
    physicsService.processGameState(localState).then((serverState) => {
      this.applyServerState(serverState);
    });
  }
}
```

## 🎯 Next Steps

1. **Performance Benchmarking**: Compare C++ vs JavaScript physics
2. **WebAssembly Integration**: Browser-based physics simulation
3. **Machine Learning**: AI-powered shot prediction
4. **Multiplayer Optimization**: Server-authoritative physics
5. **Mobile Support**: Cross-platform physics engine

## 📞 Support

- **Documentation**: See `BUILD_README.md` for build system details
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and feedback

---

_This integration provides a solid foundation for high-performance physics simulation in DojoPool, enabling realistic pool game mechanics with real-time performance._
