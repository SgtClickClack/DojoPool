import { type UmpireState } from './state';
import { type DOMElements, showSuccess, updateGameStats } from './ui';

export function handleShotDetection(
  domElements: DOMElements,
  data: {
    position: { x: number; y: number };
    confidence?: number;
    timestamp: number;
  }
): void {
  const { position, confidence, timestamp } = data;
  if (!domElements.gameArea) return;

  // Create shot marker using document fragment
  const fragment = document.createDocumentFragment();
  const shotElement = document.createElement('div');
  shotElement.className = 'shot-marker';

  // Use transform instead of left/top for better performance
  shotElement.style.transform = `translate(${position.x}px, ${position.y}px)`;

  // Add confidence indicator
  if (confidence) {
    shotElement.style.opacity = Math.min(confidence, 1).toString();
  }

  fragment.appendChild(shotElement);
  domElements.gameArea.appendChild(fragment);

  // Remove old markers after delay
  setTimeout(() => {
    shotElement.remove();
  }, 2000);
}

export function handleCalibrationComplete(data: { stats: any }): void {
  showSuccess('Calibration complete');
  updateGameStats(data.stats);
}

export function updateMonitoringStatus(
  state: UmpireState,
  data: { stats: any }
): void {
  state.stats = {
    ...state.stats,
    ...data.stats,
  };
}
