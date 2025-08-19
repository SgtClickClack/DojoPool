import { EmojiEvents, Group, LocationOn, Shield } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';

interface ClanMember {
  id: string;
  name: string;
  avatarUrl?: string;
  role: 'leader' | 'officer' | 'member';
  level: number;
}

interface ClanCardProps {
  id: string;
  name: string;
  description: string;
  location: string;
  memberCount: number;
  maxMembers: number;
  level: number;
  experience: number;
  experienceToNext: number;
  territoryCount: number;
  warWins: number;
  warLosses: number;
  members: ClanMember[];
  isMember: boolean;
  onJoin?: (clanId: string) => void;
  onView?: (clanId: string) => void;
  onLeave?: (clanId: string) => void;
}

const ClanCard: React.FC<ClanCardProps> = ({
  id,
  name,
  description,
  location,
  memberCount,
  maxMembers,
  level,
  experience,
  experienceToNext,
  territoryCount,
  warWins,
  warLosses,
  members,
  isMember,
  onJoin,
  onView,
  onLeave,
}) => {
  const experienceProgress = (experience / experienceToNext) * 100;
  const warWinRate =
    warWins + warLosses > 0 ? (warWins / (warWins + warLosses)) * 100 : 0;
  const isFull = memberCount >= maxMembers;

  const topMembers = members.slice(0, 3);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" component="h2" gutterBottom>
              {name}
            </Typography>
            <Chip
              label={`Level ${level}`}
              color="primary"
              size="small"
              icon={<Shield />}
            />
          </Box>
          <Chip
            label={isMember ? 'Member' : 'Available'}
            color={isMember ? 'success' : 'info'}
            size="small"
          />
        </Box>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" paragraph>
          {description}
        </Typography>

        {/* Stats Grid */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Group fontSize="small" color="action" />
              <Typography variant="body2">
                {memberCount}/{maxMembers} members
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn fontSize="small" color="action" />
              <Typography variant="body2">{location}</Typography>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEvents fontSize="small" color="action" />
              <Typography variant="body2">
                {territoryCount} territories
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Shield fontSize="small" color="action" />
              <Typography variant="body2">
                {warWinRate.toFixed(1)}% win rate
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Experience Bar */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Experience: {experience}/{experienceToNext}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={experienceProgress}
            sx={{ mt: 0.5 }}
          />
        </Box>

        {/* Top Members */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Top Members:
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {topMembers.map((member) => (
              <Avatar
                key={member.id}
                src={member.avatarUrl}
                sx={{ width: 32, height: 32, fontSize: '0.75rem' }}
              >
                {!member.avatarUrl && member.name.charAt(0).toUpperCase()}
              </Avatar>
            ))}
            {memberCount > 3 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ alignSelf: 'center' }}
              >
                +{memberCount - 3} more
              </Typography>
            )}
          </Stack>
        </Box>

        {/* War Stats */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Wars: {warWins}W - {warLosses}L
          </Typography>
          {isFull && <Chip label="Full" color="warning" size="small" />}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button size="small" onClick={() => onView?.(id)} variant="outlined">
          View Details
        </Button>

        {!isMember && !isFull && (
          <Button
            size="small"
            onClick={() => onJoin?.(id)}
            variant="contained"
            color="primary"
          >
            Join Clan
          </Button>
        )}

        {isMember && (
          <Button
            size="small"
            onClick={() => onLeave?.(id)}
            variant="outlined"
            color="error"
          >
            Leave Clan
          </Button>
        )}

        {!isMember && isFull && (
          <Button size="small" variant="outlined" disabled>
            Clan Full
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default ClanCard;
