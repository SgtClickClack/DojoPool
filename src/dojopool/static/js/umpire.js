// Animation frame IDs and state tracking
let frameProcessingId = null;
let statusAnimationId = null;
let isProcessingFrame = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Frame processing throttling
const FRAME_PROCESSING_INTERVAL = 100; // ms
let lastFrameTime = 0;

// Umpire system state
const umpireState = {
  isCalibrated: false,
  isMonitoring: false,
  lastError: null,
  shotCount: 0,
  foulCount: 0,
  connectionStatus: 'disconnected',
};

// Initialize WebSocket connection for real-time updates
let socket;

// Initialize the umpire system
function initUmpireSystem() {
  initializeSocket();

  // Set up UI event listeners
  document
    .getElementById('start-monitoring')
    ?.addEventListener('click', startMonitoring);
  document
    .getElementById('stop-monitoring')
    ?.addEventListener('click', stopMonitoring);

  // Initialize status indicators
  updateStatusIndicators();
}

// Initialize Socket.IO connection with error handling
function initializeSocket() {
  socket = io({
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    timeout: 10000,
    auth: {
      token: document.querySelector('meta[name="csrf-token"]')?.content,
    },
  });

  // Connection event handlers
  socket.on('connect', handleConnect);
  socket.on('connect_error', handleConnectionError);
  socket.on('disconnect', handleDisconnect);
  socket.on('error', handleSocketError);
  socket.on('reconnect_attempt', handleReconnectAttempt);
  socket.on('reconnect_failed', handleReconnectFailed);

  // Game event handlers
  socket.on('shot_detected', handleShotDetection);
  socket.on('monitoring_status', updateMonitoringStatus);
  socket.on('calibration_complete', handleCalibrationComplete);
}

// Socket event handlers
function handleConnect() {
  console.log('Connected to server');
  umpireState.connectionStatus = 'connected';
  reconnectAttempts = 0;
  updateStatusIndicators();
  showSuccess('Connected to server');
}

function handleConnectionError(error) {
  console.error('Connection error:', error);
  umpireState.connectionStatus = 'error';
  umpireState.lastError = `Connection error: ${error.message}`;
  updateStatusIndicators();
}

function handleDisconnect(reason) {
  console.log('Disconnected:', reason);
  umpireState.connectionStatus = 'disconnected';
  updateStatusIndicators();
  cleanup();
}

function handleSocketError(error) {
  console.error('Socket error:', error);
  umpireState.lastError = `Socket error: ${error.message}`;
  updateStatusIndicators();
}

function handleReconnectAttempt(attemptNumber) {
  console.log(`Reconnection attempt ${attemptNumber}`);
  reconnectAttempts = attemptNumber;
  umpireState.connectionStatus = 'reconnecting';
  updateStatusIndicators();
}

function handleReconnectFailed() {
  console.error('Failed to reconnect after maximum attempts');
  umpireState.connectionStatus = 'failed';
  umpireState.lastError = 'Failed to reconnect to server';
  updateStatusIndicators();
  showError('Connection lost. Please refresh the page.');
}

// Start frame processing and monitoring
function startMonitoring() {
  if (umpireState.isMonitoring || umpireState.connectionStatus !== 'connected')
    return;

  umpireState.isMonitoring = true;
  updateStatusIndicators();

  // Emit start monitoring event to server
  socket.emit('start_monitoring', null, (response) => {
    if (!response.success) {
      umpireState.isMonitoring = false;
      umpireState.lastError = response.error || 'Failed to start monitoring';
      updateStatusIndicators();
      return;
    }
    processFrames();
  });
}

// Stop monitoring and cleanup
function stopMonitoring() {
  if (!umpireState.isMonitoring) return;

  umpireState.isMonitoring = false;
  updateStatusIndicators();
  cleanup();

  // Emit stop monitoring event to server
  socket.emit('stop_monitoring');
}

// Clean up resources
function cleanup() {
  if (frameProcessingId) {
    cancelAnimationFrame(frameProcessingId);
    frameProcessingId = null;
  }
  if (statusAnimationId) {
    cancelAnimationFrame(statusAnimationId);
    statusAnimationId = null;
  }
  isProcessingFrame = false;
}

// Process frames with throttling and validation
async function processFrames() {
  if (!umpireState.isMonitoring) return;

  const currentTime = performance.now();
  if (currentTime - lastFrameTime >= FRAME_PROCESSING_INTERVAL) {
    try {
      if (isProcessingFrame) return;
      isProcessingFrame = true;

      // Capture frame from video element
      const videoElement = document.getElementById('game-video');
      if (!videoElement) throw new Error('Video element not found');
      if (!videoElement.videoWidth || !videoElement.videoHeight) {
        throw new Error('Invalid video dimensions');
      }

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      context.drawImage(videoElement, 0, 0);

      // Validate frame content
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      if (!validateFrame(imageData)) {
        throw new Error('Invalid frame content');
      }

      // Convert canvas to blob with compression
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.8)
      );
      if (!blob || blob.size === 0) {
        throw new Error('Failed to create frame blob');
      }

      // Create FormData and append the frame
      const formData = new FormData();
      formData.append('frame', blob);

      // Send frame to server
      const response = await fetch('/umpire/api/process-frame', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Server error: ${response.status}`
        );
      }

      const data = await response.json();
      handleFrameProcessingResult(data);

      lastFrameTime = currentTime;
    } catch (error) {
      console.error('Frame processing error:', error);
      umpireState.lastError = error.message;
      updateStatusIndicators();

      if (
        error.message.includes('authentication') ||
        error.message.includes('unauthorized')
      ) {
        stopMonitoring();
        showError('Authentication expired. Please refresh the page.');
        return;
      }
    } finally {
      isProcessingFrame = false;
    }
  }

  // Schedule next frame
  frameProcessingId = requestAnimationFrame(processFrames);
}

// Validate frame content
function validateFrame(imageData) {
  // Check for completely black or white frames
  let totalPixels = imageData.data.length / 4;
  let blackPixels = 0;
  let whitePixels = 0;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];

    if (r === 0 && g === 0 && b === 0) blackPixels++;
    if (r === 255 && g === 255 && b === 255) whitePixels++;
  }

  const blackRatio = blackPixels / totalPixels;
  const whiteRatio = whitePixels / totalPixels;

  return blackRatio < 0.95 && whiteRatio < 0.95;
}

// Handle frame processing results
function handleFrameProcessingResult(data) {
  if (data.status === 'success') {
    updateGameStats(data.stats);
    if (data.shot_detected) {
      animateShotDetection(data);
    }
  } else {
    console.error('Frame processing failed:', data.message);
    umpireState.lastError = data.message;
  }
  updateStatusIndicators();
}

// Update UI with smooth animations
function updateStatusIndicators() {
  const statusContainer = document.querySelector('.umpire-status');
  if (!statusContainer) return;

  // Update connection status
  const connectionIndicator = statusContainer.querySelector(
    '.connection-indicator'
  );
  if (connectionIndicator) {
    connectionIndicator.className = `status-indicator ${umpireState.connectionStatus}`;
    animateStatusChange(connectionIndicator);
  }

  // Update monitoring status
  const monitoringIndicator = statusContainer.querySelector(
    '.monitoring-indicator'
  );
  if (monitoringIndicator) {
    monitoringIndicator.className = `status-indicator ${umpireState.isMonitoring ? 'active' : 'inactive'}`;
    animateStatusChange(monitoringIndicator);
  }

  // Update calibration status
  const calibrationIndicator = statusContainer.querySelector(
    '.calibration-indicator'
  );
  if (calibrationIndicator) {
    calibrationIndicator.className = `status-indicator ${umpireState.isCalibrated ? 'active' : 'inactive'}`;
    animateStatusChange(calibrationIndicator);
  }

  // Update error display with animation
  const errorDisplay = statusContainer.querySelector('.error-message');
  if (errorDisplay) {
    if (umpireState.lastError) {
      errorDisplay.textContent = umpireState.lastError;
      errorDisplay.style.display = 'block';
      errorDisplay.style.opacity = '0';
      requestAnimationFrame(() => {
        errorDisplay.style.opacity = '1';
      });
    } else {
      errorDisplay.style.opacity = '0';
      setTimeout(() => {
        errorDisplay.style.display = 'none';
        errorDisplay.textContent = '';
      }, 200);
    }
  }
}

// Animate status indicator changes
function animateStatusChange(element) {
  element.style.transform = 'scale(1.2)';
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 200);
}

// Show user-friendly error messages
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className =
    'alert alert-danger alert-dismissible fade show position-fixed bottom-0 start-50 translate-middle-x mb-3';
  errorDiv.setAttribute('role', 'alert');
  errorDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  document.body.appendChild(errorDiv);

  errorDiv.addEventListener('closed.bs.alert', () => {
    errorDiv.remove();
  });

  setTimeout(() => {
    const alert = bootstrap.Alert.getOrCreateInstance(errorDiv);
    alert.close();
  }, 5000);
}

// Show success messages
function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className =
    'alert alert-success alert-dismissible fade show position-fixed bottom-0 start-50 translate-middle-x mb-3';
  successDiv.setAttribute('role', 'alert');
  successDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  document.body.appendChild(successDiv);

  successDiv.addEventListener('closed.bs.alert', () => {
    successDiv.remove();
  });

  setTimeout(() => {
    const alert = bootstrap.Alert.getOrCreateInstance(successDiv);
    alert.close();
  }, 3000);
}

// Update game statistics display with animations
function updateGameStats(stats) {
  const statsContainer = document.querySelector('.game-stats');
  if (!statsContainer) return;

  const elements = {
    shots: statsContainer.querySelector('.shots-count'),
    fouls: statsContainer.querySelector('.fouls-count'),
  };

  Object.entries(elements).forEach(([key, element]) => {
    if (element) {
      const currentValue = parseInt(element.textContent) || 0;
      const newValue = stats[key === 'shots' ? 'total_shots' : 'fouls'];

      if (currentValue !== newValue) {
        animateNumber(element, currentValue, newValue);
      }
    }
  });
}

// Animate number changes
function animateNumber(element, start, end) {
  const duration = 500;
  const startTime = performance.now();

  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const current = Math.round(start + (end - start) * progress);
    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

// Handle WebSocket events
function handleShotDetection(data) {
  if (data.valid) {
    umpireState.shotCount++;
  } else {
    umpireState.foulCount++;
  }
  updateGameStats({
    total_shots: umpireState.shotCount,
    fouls: umpireState.foulCount,
  });
}

function handleCalibrationComplete(data) {
  umpireState.isCalibrated = true;
  updateStatusIndicators();
  showSuccess('System calibration complete');
}

function updateMonitoringStatus(data) {
  umpireState.isMonitoring = data.status === 'active';
  updateStatusIndicators();
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  cleanup();
  if (socket) {
    socket.disconnect();
  }
});

// Initialize the system when the DOM is loaded
document.addEventListener('DOMContentLoaded', initUmpireSystem);
