import { Alert } from 'bootstrap';

// UI element cache
export interface DOMElements {
  gameVideo: HTMLVideoElement | null;
  gameArea: HTMLElement | null;
  statusElements: {
    connection: HTMLElement | null;
    processing: HTMLElement | null;
    frames: HTMLElement | null;
    shots: HTMLElement | null;
    accuracy: HTMLElement | null;
  };
}

export const initializeDOMElements = (): DOMElements => ({
  gameVideo: document.getElementById('game-video') as HTMLVideoElement,
  gameArea: document.getElementById('game-area'),
  statusElements: {
    connection: document.getElementById('connection-status'),
    processing: document.getElementById('processing-status'),
    frames: document.getElementById('frame-count'),
    shots: document.getElementById('shot-count'),
    accuracy: document.getElementById('accuracy-display'),
  },
});

export function showError(message: string): void {
  const errorContainer = document.getElementById('error-container');
  if (!errorContainer) return;

  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger alert-dismissible fade show';
  errorDiv.innerHTML = `
    <strong>Error:</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  errorContainer.appendChild(errorDiv);
  const alert = new Alert(errorDiv);
  setTimeout(() => alert.dispose(), 5000);
}

export function showSuccess(message: string): void {
  const successContainer = document.getElementById('success-container');
  if (!successContainer) return;

  const successDiv = document.createElement('div');
  successDiv.className = 'alert alert-success alert-dismissible fade show';
  successDiv.innerHTML = `
    <strong>Success:</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  successContainer.appendChild(successDiv);
  const alert = new Alert(successDiv);
  setTimeout(() => alert.dispose(), 3000);
}

export function animateNumber(
  element: HTMLElement,
  start: number,
  end: number
): number {
  const duration = 1000;
  const startTime = performance.now();
  const change = end - start;

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const currentValue = Math.round(start + change * progress);
    element.textContent = currentValue.toString();

    if (progress < 1) {
      return requestAnimationFrame(animate);
    }
    return null;
  };

  return requestAnimationFrame(animate);
}

export function updateGameStats(stats: any): void {
  const elements = {
    totalShots: document.getElementById('total-shots'),
    accuracy: document.getElementById('accuracy'),
    streak: document.getElementById('streak'),
    score: document.getElementById('score'),
  };

  Object.entries(elements).forEach(([key, element]) => {
    if (element && stats[key] !== undefined) {
      const currentValue = parseInt(element.textContent || '0');
      animateNumber(element, currentValue, stats[key]);
    }
  });
}
