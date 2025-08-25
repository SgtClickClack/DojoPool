import { ClanRole, type ClanMember } from '@/types/clan';
import { EmojiEvents, Star, TrendingUp } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Rating,
  Typography,
} from '@mui/material';
import React from 'react';

interface ClanMemberCardProps {
  member: ClanMember;
  isLeader?: boolean;
}

const ClanMemberCard: React.FC<ClanMemberCardProps> = ({
  member,
  isLeader = false,
}) => {
  const getRoleColor = (role: ClanRole) => {
    switch (role) {
      case ClanRole.LEADER:
        return 'error';
      case ClanRole.OFFICER:
        return 'warning';
      case ClanRole.MEMBER:
        return 'primary';
      case ClanRole.RECRUIT:
        return 'default';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: ClanRole) => {
    switch (role) {
      case ClanRole.LEADER:
        return 'Leader';
      case ClanRole.OFFICER:
        return 'Officer';
      case ClanRole.MEMBER:
        return 'Member';
      case ClanRole.RECRUIT:
        return 'Recruit';
      default:
        return role;
    }
  };

  return (
    <Card
      sx={{
        minWidth: 250,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 2,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={member.user.avatar}
            sx={{
              width: 48,
              height: 48,
              mr: 2,
              bgcolor: isLeader ? 'error.main' : 'primary.main',
              fontSize: '1.2rem',
            }}
          >
            {member.user.username.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 'bold' }}
            >
              {member.user.username}
            </Typography>
            <Chip
              label={getRoleLabel(member.role)}
              color={getRoleColor(member.role)}
              variant={isLeader ? 'filled' : 'outlined'}
              size="small"
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Star sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Rating
            value={member.user.rating / 400}
            precision={0.1}
            size="small"
            readOnly
          />
          <Typography variant="body2" sx={{ ml: 1 }}>
            {member.user.rating}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TrendingUp sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            Contribution: {member.contribution}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EmojiEvents sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            Joined {new Date(member.joinedAt).toLocaleDateString()}
          </Typography>
        </Box>

        {isLeader && (
          <Chip
            label="Clan Leader"
            size="small"
            color="error"
            variant="filled"
            sx={{ fontWeight: 'bold' }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ClanMemberCard;
