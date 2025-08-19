import React, { useState, useEffect } from 'react';
import { Card, Progress, Badge, Button, Avatar, Divider, Alert } from 'antd';
import {
  TrophyOutlined,
  TeamOutlined,
  UserOutlined,
  CompassOutlined,
  FireOutlined,
  StarOutlined,
  BookOutlined,
  FlagOutlined,
} from '@ant-design/icons';

interface StoryObjective {
  id: string;
  title: string;
  description: string;
  type: 'main' | 'side' | 'social' | 'tournament';
  progress: number;
  maxProgress: number;
  reward: string;
  location?: string;
  isActive: boolean;
}

interface PlayerStats {
  level: number;
  experience: number;
  experienceToNext: number;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  achievements: number;
  clanRank?: string;
  venueMastery: number;
}

interface StoryEvent {
  id: string;
  title: string;
  description: string;
  type:
    | 'achievement'
    | 'social'
    | 'tournament'
    | 'venue_discovery'
    | 'venue_mastery'
    | 'venue_special';
  timestamp: Date;
  rewards?: {
    experience?: number;
    dojoCoins?: number;
    items?: string[];
  };
  metadata?: {
    venueType?: 'bar' | 'club' | 'hall' | 'arcade' | 'academy';
    venueId?: string;
    venueName?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    storyArc?: string;
  };
}

const PlayerJourney: React.FC = () => {
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    level: 15,
    experience: 1250,
    experienceToNext: 2000,
    totalGames: 47,
    wins: 32,
    losses: 15,
    winRate: 68.1,
    currentStreak: 5,
    bestStreak: 8,
    achievements: 12,
    clanRank: 'Elite Member',
    venueMastery: 3,
  });

  const [currentObjectives, setCurrentObjectives] = useState<StoryObjective[]>([
    {
      id: '1',
      title: 'The Rival Challenge',
      description:
        'Face off against your rival "ShadowStriker" at Downtown Dojo. This grudge match will determine who advances to the Regional Championship.',
      type: 'main',
      progress: 0,
      maxProgress: 1,
      reward: 'Regional Championship Entry + 500 XP',
      location: 'Downtown Dojo',
      isActive: true,
    },
    {
      id: '2',
      title: 'Clan Territory Expansion',
      description:
        'Help your clan "Phoenix Warriors" expand their territory by winning 3 matches at rival-controlled venues.',
      type: 'social',
      progress: 1,
      maxProgress: 3,
      reward: 'Clan Prestige + Special Avatar Item',
      isActive: true,
    },
    {
      id: '3',
      title: 'Venue Mastery',
      description:
        'Become a master of the Elite Pool Hall by winning 5 consecutive games and unlocking the "Hall of Fame" achievement.',
      type: 'side',
      progress: 3,
      maxProgress: 5,
      reward: 'Venue Master Badge + 1000 XP',
      location: 'Elite Pool Hall',
      isActive: true,
    },
  ]);

  const [recentEvents, setRecentEvents] = useState<StoryEvent[]>([
    {
      id: '1',
      title: 'Tournament Victory!',
      description:
        'You won the "Spring Showdown" tournament and earned the "Tournament Champion" title. Your rival "ShadowStriker" was eliminated in the semifinals.',
      type: 'tournament',
      timestamp: new Date(),
      rewards: {
        experience: 500,
        dojoCoins: 1000,
      },
      metadata: {
        venueType: 'hall',
        venueId: '1',
        venueName: 'Spring Showdown',
        difficulty: 'expert',
        storyArc: 'Spring',
      },
    },
    {
      id: '2',
      title: 'New Clan Member',
      description:
        'Player "CueMaster" has joined your clan "Phoenix Warriors". They bring valuable skills and will help in upcoming clan wars.',
      type: 'social',
      timestamp: new Date(),
      rewards: {
        experience: 200,
        dojoCoins: 500,
      },
      metadata: {
        venueType: 'academy',
        venueId: '2',
        venueName: 'Clan Training Grounds',
        difficulty: 'intermediate',
        storyArc: 'Clan',
      },
    },
    {
      id: '3',
      title: 'Rival Encounter',
      description:
        'You encountered "ShadowStriker" at Downtown Dojo. They challenged you to a rematch after your last victory. The tension is building!',
      type: 'social',
      timestamp: new Date(),
      rewards: {
        experience: 200,
        dojoCoins: 300,
      },
      metadata: {
        venueType: 'academy',
        venueId: '3',
        venueName: 'Downtown Dojo',
        difficulty: 'intermediate',
        storyArc: 'Rivalry',
      },
    },
  ]);

  const [selectedObjective, setSelectedObjective] =
    useState<StoryObjective | null>(null);

  const getObjectiveIcon = (type: string) => {
    switch (type) {
      case 'main':
        return <FlagOutlined style={{ color: '#ff4d4f' }} />;
      case 'side':
        return <StarOutlined style={{ color: '#faad14' }} />;
      case 'social':
        return <TeamOutlined style={{ color: '#52c41a' }} />;
      case 'tournament':
        return <TrophyOutlined style={{ color: '#1890ff' }} />;
      default:
        return <BookOutlined />;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'social':
        return <TeamOutlined style={{ color: '#52c41a' }} />;
      case 'tournament':
        return <TrophyOutlined style={{ color: '#faad14' }} />;
      case 'achievement':
        return <StarOutlined style={{ color: '#1890ff' }} />;
      case 'venue_discovery':
        return <CompassOutlined style={{ color: '#722ed1' }} />;
      case 'venue_mastery':
        return <FireOutlined style={{ color: '#ff4d4f' }} />;
      case 'venue_special':
        return <FlagOutlined style={{ color: '#13c2c2' }} />;
      default:
        return <BookOutlined />;
    }
  };

  const handleObjectiveClick = (objective: StoryObjective) => {
    setSelectedObjective(objective);
  };

  const handleStartObjective = (objective: StoryObjective) => {
    // This would trigger the game flow to start the objective
    console.log('Starting objective:', objective.title);
    // Navigate to venue or start match
  };

  const experienceProgress =
    (playerStats.experience / playerStats.experienceToNext) * 100;

  return (
    <div
      className="player-journey"
      style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}
    >
      {/* Player Stats Header */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar size={48} icon={<UserOutlined />} />
            <div>
              <h2 style={{ margin: 0 }}>Player Journey</h2>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Badge
                  count={playerStats.level}
                  showZero
                  style={{ backgroundColor: '#52c41a' }}
                />
                <span>Level {playerStats.level}</span>
                {playerStats.clanRank && (
                  <Badge
                    count={playerStats.clanRank}
                    style={{ backgroundColor: '#1890ff' }}
                  />
                )}
              </div>
            </div>
          </div>
        }
        style={{ marginBottom: '20px' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <div>
            <h4>Experience</h4>
            <Progress
              percent={experienceProgress}
              format={() =>
                `${playerStats.experience}/${playerStats.experienceToNext} XP`
              }
              strokeColor="#52c41a"
            />
          </div>
          <div>
            <h4>Win Rate</h4>
            <Progress
              percent={playerStats.winRate}
              format={() => `${playerStats.wins}W/${playerStats.losses}L`}
              strokeColor="#1890ff"
            />
          </div>
          <div>
            <h4>Current Streak</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FireOutlined style={{ color: '#ff4d4f' }} />
              <span>{playerStats.currentStreak} wins</span>
            </div>
          </div>
          <div>
            <h4>Achievements</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StarOutlined style={{ color: '#faad14' }} />
              <span>{playerStats.achievements} unlocked</span>
            </div>
          </div>
        </div>
      </Card>

      <div
        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}
      >
        {/* Current Objectives */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CompassOutlined />
              Current Objectives
            </div>
          }
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {currentObjectives.map((objective) => (
              <Card
                key={objective.id}
                size="small"
                style={{
                  cursor: 'pointer',
                  border:
                    selectedObjective?.id === objective.id
                      ? '2px solid #1890ff'
                      : '1px solid #d9d9d9',
                }}
                onClick={() => handleObjectiveClick(objective)}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  {getObjectiveIcon(objective.type)}
                  <span style={{ fontWeight: 'bold' }}>{objective.title}</span>
                  <Badge
                    count={objective.type.toUpperCase()}
                    style={{
                      backgroundColor:
                        objective.type === 'main'
                          ? '#ff4d4f'
                          : objective.type === 'side'
                            ? '#faad14'
                            : '#52c41a',
                    }}
                  />
                </div>
                <p style={{ margin: '8px 0', color: '#666' }}>
                  {objective.description}
                </p>
                {objective.location && (
                  <p
                    style={{ margin: '4px 0', fontSize: '12px', color: '#999' }}
                  >
                    📍 Location: {objective.location}
                  </p>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '8px',
                  }}
                >
                  <Progress
                    percent={(objective.progress / objective.maxProgress) * 100}
                    size="small"
                    format={() =>
                      `${objective.progress}/${objective.maxProgress}`
                    }
                  />
                  <span style={{ fontSize: '12px', color: '#52c41a' }}>
                    Reward: {objective.reward}
                  </span>
                </div>
                {objective.isActive && (
                  <Button
                    type="primary"
                    size="small"
                    style={{ marginTop: '8px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartObjective(objective);
                    }}
                  >
                    Start Objective
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </Card>

        {/* Story Events */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOutlined />
              Recent Events
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentEvents.map((event) => (
              <Alert
                key={event.id}
                message={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {getEventIcon(event.type)}
                    <span style={{ fontWeight: 'bold' }}>{event.title}</span>
                  </div>
                }
                description={
                  <div>
                    <p style={{ margin: '4px 0', fontSize: '12px' }}>
                      {event.description}
                    </p>
                    <span style={{ fontSize: '10px', color: '#999' }}>
                      {event.timestamp.toLocaleString()}
                    </span>
                  </div>
                }
                type="info"
                showIcon={false}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  // Mark as read
                  setRecentEvents((prev) =>
                    prev.map((e) =>
                      e.id === event.id ? { ...e, isRead: true } : e
                    )
                  );
                }}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Selected Objective Details */}
      {selectedObjective && (
        <Card
          title="Objective Details"
          style={{ marginTop: '20px' }}
          extra={
            <Button
              type="primary"
              onClick={() => handleStartObjective(selectedObjective)}
              disabled={!selectedObjective.isActive}
            >
              {selectedObjective.isActive
                ? 'Begin Challenge'
                : 'Objective Locked'}
            </Button>
          }
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
            }}
          >
            <div>
              <h4>Story Context</h4>
              <p>{selectedObjective.description}</p>
              {selectedObjective.location && (
                <p>
                  <strong>Location:</strong> {selectedObjective.location}
                </p>
              )}
              <p>
                <strong>Reward:</strong> {selectedObjective.reward}
              </p>
            </div>
            <div>
              <h4>Progress</h4>
              <Progress
                percent={
                  (selectedObjective.progress / selectedObjective.maxProgress) *
                  100
                }
                format={() =>
                  `${selectedObjective.progress}/${selectedObjective.maxProgress}`
                }
                strokeColor="#52c41a"
              />
              <Divider />
              <h4>Tips</h4>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Practice your shots before the challenge</li>
                <li>Study your opponent's playing style</li>
                <li>Use your clan's support if available</li>
                <li>Focus on the story context for motivation</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PlayerJourney;
