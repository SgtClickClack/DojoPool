export interface ChallengeWithExpiration {
  id: string;
  challengerId: string;
  defenderId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  stakeCoins: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export const isChallengeExpired = (
  challenge: ChallengeWithExpiration
): boolean => {
  if (challenge.status === 'EXPIRED') return true;

  const now = new Date();
  const expiresAt = new Date(challenge.expiresAt);
  return now > expiresAt;
};

export const getTimeUntilExpiration = (expiresAt: string): string => {
  const now = new Date();
  const expiration = new Date(expiresAt);
  const diff = expiration.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `Expires in ${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `Expires in ${minutes}m`;
  } else {
    return 'Expires soon';
  }
};

export const getExpirationColor = (
  expiresAt: string
): 'warning' | 'error' | 'default' => {
  const now = new Date();
  const expiration = new Date(expiresAt);
  const diff = expiration.getTime() - now.getTime();

  if (diff <= 0) return 'default';
  if (diff <= 15 * 60 * 1000) return 'error'; // Less than 15 minutes
  if (diff <= 60 * 60 * 1000) return 'warning'; // Less than 1 hour

  return 'default';
};

export const formatChallengeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};
