import React, { useState, useEffect } from 'react';
import {
  useVenueLeaderboard,
  LeaderboardEntry,
  type DojoMaster,
  PlayerPerformance,
} from '../../hooks/useVenueLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Trophy,
  Crown,
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Star,
  Medal,
  Award,
} from 'lucide-react';

interface VenueLeaderboardDashboardProps {
  selectedVenueId?: string;
  onVenueSelect?: (venueId: string) => void;
}

export const VenueLeaderboardDashboard: React.FC<
  VenueLeaderboardDashboardProps
> = ({ selectedVenueId, onVenueSelect }) => {
  const { leaderboard, loading, error, refreshLeaderboard, getAllDojoMasters } =
    useVenueLeaderboard();

  const [dojoMasters, setDojoMasters] = useState<DojoMaster[]>([]);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'dojo-masters'>(
    'leaderboard'
  );

  useEffect(() => {
    const fetchDojoMasters = async () => {
      const masters = await getAllDojoMasters();
      setDojoMasters(masters);
    };
    fetchDojoMasters();
  }, [getAllDojoMasters]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">{rank}</span>;
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (change < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateReignDuration = (designationDate: Date) => {
    const days = Math.floor(
      (Date.now() - new Date(designationDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading leaderboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">Error loading leaderboard</div>
        <Button onClick={refreshLeaderboard} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Venue Leaderboard
          </h1>
          <p className="text-gray-600 mt-1">
            Track venue performance and Dojo Masters
          </p>
        </div>
        <Button onClick={refreshLeaderboard} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'leaderboard' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('leaderboard')}
          className="flex-1"
        >
          <Trophy className="w-4 h-4 mr-2" />
          Leaderboard
        </Button>
        <Button
          variant={activeTab === 'dojo-masters' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('dojo-masters')}
          className="flex-1"
        >
          <Crown className="w-4 h-4 mr-2" />
          Dojo Masters
        </Button>
      </div>

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {leaderboard.map((entry) => (
            <Card
              key={entry.venueId}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedVenueId === entry.venueId ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onVenueSelect?.(entry.venueId)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {entry.venueName}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary">Rank #{entry.rank}</Badge>
                        {entry.dojoMaster && (
                          <Badge
                            variant="default"
                            className="bg-purple-100 text-purple-800"
                          >
                            <Crown className="w-3 h-3 mr-1" />
                            Dojo Master
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {entry.performance.activityScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">Activity Score</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {entry.performance.totalMatches}
                    </div>
                    <div className="text-sm text-gray-500">Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {entry.performance.totalTournaments}
                    </div>
                    <div className="text-sm text-gray-500">Tournaments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {entry.performance.totalPlayers}
                    </div>
                    <div className="text-sm text-gray-500">Players</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {formatCurrency(entry.performance.revenue)}
                    </div>
                    <div className="text-sm text-gray-500">Revenue</div>
                  </div>
                </div>

                {/* Dojo Master Info */}
                {entry.dojoMaster && (
                  <div className="bg-purple-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center space-x-3">
                      <Crown className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-semibold text-purple-900">
                          Dojo Master: {entry.dojoMaster.masterName}
                        </div>
                        <div className="text-sm text-purple-700">
                          Reign:{' '}
                          {calculateReignDuration(
                            entry.dojoMaster.designationDate
                          )}{' '}
                          days
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Players */}
                {entry.topPlayers.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Top Players
                    </h4>
                    <div className="space-y-2">
                      {entry.topPlayers.slice(0, 5).map((player, index) => (
                        <div
                          key={player.playerId}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full text-xs font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">
                                {player.playerName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {player.matchesWon}/{player.matchesPlayed} wins
                                ({player.winRate.toFixed(1)}%)
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{player.rating}</div>
                            <div className="text-sm text-gray-500">Rating</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dojo Masters Tab */}
      {activeTab === 'dojo-masters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dojoMasters.map((master) => (
            <Card
              key={`${master.venueId}-${master.masterId}`}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full">
                    <Crown className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {master.masterName}
                    </CardTitle>
                    <div className="text-sm text-gray-500">
                      {master.venueName}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {calculateReignDuration(master.designationDate)}
                    </div>
                    <div className="text-sm text-gray-500">Days Reign</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {master.successfulDefenses}
                    </div>
                    <div className="text-sm text-gray-500">Defenses</div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-2">Achievements</h5>
                  <div className="space-y-1">
                    {master.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-sm">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-2">Privileges</h5>
                  <div className="flex flex-wrap gap-1">
                    {master.privileges.map((privilege, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {privilege}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Designated: {formatDate(master.designationDate)}
                </div>
              </CardContent>
            </Card>
          ))}

          {dojoMasters.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Crown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Dojo Masters Yet
              </h3>
              <p className="text-gray-500">
                Dojo Masters will appear here once they are designated.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
