import type { Clan } from '@/types/clan';
import { EmojiEvents, Group, LocationOn, Star } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Rating,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React from 'react';

interface ClanCardProps {
  clan: Clan;
  onJoin?: (clanId: string) => void;
  showJoinButton?: boolean;
}

const ClanCard: React.FC<ClanCardProps> = ({
  clan,
  onJoin,
  showJoinButton = true,
}) => {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/clans/${clan.id}`);
  };

  const handleJoin = () => {
    if (onJoin) {
      onJoin(clan.id);
    }
  };

  return (
    <Card
      sx={{
        minWidth: 300,
        maxWidth: 400,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={clan.avatar}
            sx={{
              width: 56,
              height: 56,
              mr: 2,
              bgcolor: 'primary.main',
              fontSize: '1.5rem',
            }}
          >
            {clan.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 'bold' }}
            >
              {clan.name}
            </Typography>
            <Chip
              label={clan.tag}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, minHeight: 40 }}
        >
          {clan.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Group sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {clan.memberCount}/{clan.maxMembers} members
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {clan.territories} territories
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <EmojiEvents sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {clan.stats.winRate.toFixed(1)}% win rate
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Star sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Rating
            value={clan.rating / 400}
            precision={0.1}
            size="small"
            readOnly
          />
          <Typography variant="body2" sx={{ ml: 1 }}>
            {clan.rating}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={clan.isPublic ? 'Public' : 'Private'}
            size="small"
            color={clan.isPublic ? 'success' : 'default'}
            variant="outlined"
          />
          {clan.requirements?.minRating && (
            <Chip
              label={`Min Rating: ${clan.requirements.minRating}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button size="small" onClick={handleViewDetails} variant="outlined">
          View Details
        </Button>

        {showJoinButton && (
          <Button
            size="small"
            onClick={handleJoin}
            variant="contained"
            color="primary"
            disabled={clan.memberCount >= clan.maxMembers}
          >
            {clan.memberCount >= clan.maxMembers ? 'Full' : 'Join'}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default ClanCard;
