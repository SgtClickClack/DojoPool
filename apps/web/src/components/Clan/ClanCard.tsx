import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';
import { Group, LocationOn, EmojiEvents, Shield } from '@mui/icons-material';
import { Clan } from '@/types/clan';

export interface ClanCardProps {
  id: string;
  name: string;
  description?: string;
  location: string;
  memberCount: number;
  treasury: number;
  leader: {
    id: string;
    email: string;
    username: string;
  };
  clan: Clan;
  onJoin: (clanId: string) => void;
  onView: (clanId: string) => void;
  disabled?: boolean;
}

interface ClanCardState {
  isExpanded: boolean;
}

const ClanCard: React.FC<ClanCardProps> = ({ id, name, description, location, memberCount, treasury, leader, clan, onJoin, onView, disabled = false }) => {
  const experienceProgress = (clan.experience / (clan.experience + 100)) * 100;
  const warWinRate = clan.warWins > 0 ? (clan.warWins / (clan.warWins + clan.warLosses)) * 100 : 0;

  // Component implementation
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{name}</Typography>
        <Typography variant="body2">{description}</Typography>
        <Typography variant="body2">{location}</Typography>
        <Typography variant="body2">{memberCount} members</Typography>
        <Typography variant="body2">Treasury: {treasury} DojoCoins</Typography>
        <Typography variant="body2">Level: {clan.level}</Typography>
        <Typography variant="body2">Experience: {clan.experience}</Typography>
        <Typography variant="body2">Reputation: {clan.reputation}</Typography>

        <Button onClick={() => onJoin(clan.id)} disabled={disabled}>
          Join Clan
        </Button>
        <Button onClick={() => onView(clan.id)}>
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default ClanCard;
