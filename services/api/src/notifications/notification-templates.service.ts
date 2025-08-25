import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';

export interface NotificationTemplate {
  title: string;
  message: string;
  type: NotificationType;
}

@Injectable()
export class NotificationTemplatesService {
  getFriendRequestTemplate(requesterUsername: string): NotificationTemplate {
    return {
      title: 'New Friend Request',
      message: `${requesterUsername} sent you a friend request`,
      type: NotificationType.FRIEND_REQUEST,
    };
  }

  getChallengeReceivedTemplate(
    challengerUsername: string,
    venueName: string
  ): NotificationTemplate {
    return {
      title: 'New Challenge Received',
      message: `${challengerUsername} challenged you at ${venueName}`,
      type: NotificationType.CHALLENGE_RECEIVED,
    };
  }

  getTerritoryChangedTemplate(
    venueName: string,
    newOwnerUsername: string
  ): NotificationTemplate {
    return {
      title: 'Territory Control Changed',
      message: `${newOwnerUsername} now controls ${venueName}`,
      type: NotificationType.TERRITORY_CHANGED,
    };
  }

  getTournamentInviteTemplate(
    tournamentName: string,
    inviterUsername: string
  ): NotificationTemplate {
    return {
      title: 'Tournament Invitation',
      message: `${inviterUsername} invited you to join ${tournamentName}`,
      type: NotificationType.TOURNAMENT_INVITE,
    };
  }

  getClanInviteTemplate(
    clanName: string,
    inviterUsername: string
  ): NotificationTemplate {
    return {
      title: 'Clan Invitation',
      message: `${inviterUsername} invited you to join ${clanName}`,
      type: NotificationType.CLAN_INVITE,
    };
  }

  getAchievementUnlockedTemplate(
    achievementName: string
  ): NotificationTemplate {
    return {
      title: 'Achievement Unlocked!',
      message: `Congratulations! You've unlocked: ${achievementName}`,
      type: NotificationType.ACHIEVEMENT_UNLOCKED,
    };
  }

  getMatchResultTemplate(
    result: 'win' | 'loss',
    opponentUsername: string,
    venueName: string
  ): NotificationTemplate {
    const resultText = result === 'win' ? 'won against' : 'lost to';
    return {
      title: `Match ${result === 'win' ? 'Victory' : 'Result'}`,
      message: `You ${resultText} ${opponentUsername} at ${venueName}`,
      type: NotificationType.MATCH_RESULT,
    };
  }

  getVenueCheckinTemplate(venueName: string): NotificationTemplate {
    return {
      title: 'Venue Check-in',
      message: `Welcome to ${venueName}! You're now checked in and ready to play.`,
      type: NotificationType.VENUE_CHECKIN,
    };
  }

  getClanWarUpdateTemplate(
    clanName: string,
    action: 'started' | 'ended' | 'victory' | 'defeat'
  ): NotificationTemplate {
    const messages = {
      started: `Clan war against ${clanName} has begun!`,
      ended: `Clan war against ${clanName} has ended.`,
      victory: `Victory! Your clan defeated ${clanName}!`,
      defeat: `Your clan was defeated by ${clanName}.`,
    };

    return {
      title: 'Clan War Update',
      message: messages[action],
      type: NotificationType.CLAN_WAR_UPDATE,
    };
  }

  getSystemNotificationTemplate(
    title: string,
    message: string
  ): NotificationTemplate {
    return {
      title,
      message,
      type: NotificationType.SYSTEM,
    };
  }
}
