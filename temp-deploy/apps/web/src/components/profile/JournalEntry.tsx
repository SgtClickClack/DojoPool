import {
  JournalEntryType as EntryType,
  JournalEntry as JournalEntryType,
} from '@/types/journal';
import {
  Star as AchievementIcon,
  Bolt as ChallengeIcon,
  Groups as ClanIcon,
  AttachMoney as CoinsIcon,
  Group as FriendIcon,
  SportsEsports as GameIcon,
  Collections as NFTIcon,
  TrendingUp as SkillIcon,
  Info as SystemIcon,
  Flag as TerritoryIcon,
  EmojiEvents as TournamentIcon,
  LocationOn as VenueIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
} from '@mui/material';
import React from 'react';

interface JournalEntryProps {
  entry: JournalEntryType;
}

const JournalEntry: React.FC<JournalEntryProps> = ({ entry }) => {
  const getEntryIcon = (type: EntryType) => {
    const iconProps = { fontSize: 'small' as const };

    switch (type) {
      case EntryType.MATCH_PLAYED:
        return <GameIcon {...iconProps} color="primary" />;
      case EntryType.TOURNAMENT_JOINED:
      case EntryType.TOURNAMENT_WON:
        return <TournamentIcon {...iconProps} color="secondary" />;
      case EntryType.ACHIEVEMENT_UNLOCKED:
        return <AchievementIcon {...iconProps} color="warning" />;
      case EntryType.FRIEND_ADDED:
        return <FriendIcon {...iconProps} color="success" />;
      case EntryType.VENUE_CHECKIN:
        return <VenueIcon {...iconProps} color="info" />;
      case EntryType.TERRITORY_CAPTURED:
        return <TerritoryIcon {...iconProps} color="error" />;
      case EntryType.CLAN_JOINED:
        return <ClanIcon {...iconProps} color="secondary" />;
      case EntryType.CHALLENGE_ISSUED:
      case EntryType.CHALLENGE_ACCEPTED:
        return <ChallengeIcon {...iconProps} color="primary" />;
      case EntryType.SKILL_LEVEL_UP:
        return <SkillIcon {...iconProps} color="success" />;
      case EntryType.DOJO_COINS_EARNED:
        return <CoinsIcon {...iconProps} color="warning" />;
      case EntryType.NFT_ACQUIRED:
        return <NFTIcon {...iconProps} color="info" />;
      case EntryType.SYSTEM_EVENT:
      default:
        return <SystemIcon {...iconProps} color="action" />;
    }
  };

  const getEntryColor = (type: EntryType) => {
    switch (type) {
      case EntryType.MATCH_PLAYED:
        return 'primary';
      case EntryType.TOURNAMENT_JOINED:
      case EntryType.TOURNAMENT_WON:
        return 'secondary';
      case EntryType.ACHIEVEMENT_UNLOCKED:
        return 'warning';
      case EntryType.FRIEND_ADDED:
        return 'success';
      case EntryType.VENUE_CHECKIN:
        return 'info';
      case EntryType.TERRITORY_CAPTURED:
        return 'error';
      case EntryType.CLAN_JOINED:
        return 'secondary';
      case EntryType.CHALLENGE_ISSUED:
      case EntryType.CHALLENGE_ACCEPTED:
        return 'primary';
      case EntryType.SKILL_LEVEL_UP:
        return 'success';
      case EntryType.DOJO_COINS_EARNED:
        return 'warning';
      case EntryType.NFT_ACQUIRED:
        return 'info';
      case EntryType.SYSTEM_EVENT:
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatEntryType = (type: EntryType) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Card
      sx={{
        mb: 2,
        '&:hover': {
          boxShadow: 2,
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease-in-out',
        },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: `${getEntryColor(entry.type)}.light`,
              color: `${getEntryColor(entry.type)}.contrastText`,
              width: 40,
              height: 40,
            }}
          >
            {getEntryIcon(entry.type)}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="medium">
                {entry.message}
              </Typography>
              <Chip
                label={formatEntryType(entry.type)}
                size="small"
                color={getEntryColor(entry.type) as any}
                variant="outlined"
              />
            </Box>

            <Typography variant="caption" color="text.secondary">
              {formatTimeAgo(entry.createdAt)}
            </Typography>

            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
              <Box sx={{ mt: 1 }}>
                {Object.entries(entry.metadata).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default JournalEntry;
