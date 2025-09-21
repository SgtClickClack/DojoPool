import { type DojoData } from '@/services/dojoService';
import { type PlayerPosition } from '@/services/WebSocketService';

export const getMarkerIcon = (dojo: DojoData) => {
  if (dojo.isLocked) {
    return {
      url:
        'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#ff4444" stroke="#ffffff" stroke-width="2"/>
            <path d="M12 16h8v8h-8z" fill="#ffffff"/>
            <rect x="14" y="12" width="4" height="4" fill="#ffffff"/>
          </svg>
        `),
      scaledSize: { width: 32, height: 32 },
    };
  }

  if (dojo.controllingClanId && dojo.controllingClan) {
    // Enhanced clan-controlled dojo marker with clan tag
    return {
      url:
        'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#ff8800" stroke="#ffffff" stroke-width="2"/>
            <text x="16" y="18" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial">🏰</text>
            <text x="16" y="28" text-anchor="middle" fill="#ffffff" font-size="8" font-family="Arial">${
              dojo.controllingClan
                ? dojo.controllingClan.name.slice(0, 4).toUpperCase()
                : 'CLAN'
            }</text>
          </svg>
        `),
      scaledSize: { width: 32, height: 32 },
    };
  }

  return {
    url:
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#44ff44" stroke="#ffffff" stroke-width="2"/>
          <text x="16" y="20" text-anchor="middle" fill="#ffffff" font-size="16" font-family="Arial">🎱</text>
        </svg>
      `),
    scaledSize: { width: 32, height: 32 },
  };
};

export const getPlayerMarkerIcon = (player: PlayerPosition) => {
  return {
    url:
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#4a90e2" stroke="#ffffff" stroke-width="2"/>
          <text x="12" y="16" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial">👤</text>
        </svg>
      `),
    scaledSize: { width: 24, height: 24 },
  };
};
