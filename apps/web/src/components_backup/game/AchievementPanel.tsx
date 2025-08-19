import React from 'react';

export interface AchievementPanelProps {
  onAchievementUnlocked?: (achievement: any) => void;
  onClose?: () => void;
}

const mockAchievements = [
  { id: 'first_win', title: 'First Victory', description: 'Win your first match' },
  { id: 'streak_3', title: 'On a Roll', description: 'Win 3 matches in a row' },
];

const AchievementPanel: React.FC<AchievementPanelProps> = ({
  onAchievementUnlocked,
  onClose,
}) => {
  const unlock = (a: any) => {
    if (onAchievementUnlocked) onAchievementUnlocked(a);
  };

  return (
    <div style={{ padding: 16, border: '1px solid #0f0', borderRadius: 8 }}>
      <h3>Achievements</h3>
      <ul>
        {mockAchievements.map((a) => (
          <li key={a.id} style={{ marginBottom: 8 }}>
            <strong>{a.title}</strong> — {a.description}{' '}
            <button onClick={() => unlock(a)}>Simulate Unlock</button>
          </li>
        ))}
      </ul>
      {onClose && (
        <button onClick={onClose} style={{ marginTop: 8 }}>
          Close
        </button>
      )}
    </div>
  );
};

export default AchievementPanel;
