import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Select,
  Row,
  Col,
  Statistic,
  Avatar,
  Tooltip,
  Button,
  message,
} from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  RiseOutlined,
  FallOutlined,
  UserOutlined,
  StarOutlined,
} from '@ant-design/icons';
import moment from 'moment';

import { useAuth } from '../../hooks/useAuth';
import { getVenueLeaderboard, getUserStats } from '../../api/venues';

const { Option } = Select;

interface LeaderboardListProps {
  venueId: number;
}

const LeaderboardList: React.FC<LeaderboardListProps> = ({ venueId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [period, setPeriod] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [venueId, period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leaderboard, stats] = await Promise.all([
        getVenueLeaderboard(venueId, period),
        user ? getUserStats(venueId, user.id) : null,
      ]);
      setEntries(leaderboard);
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      message.error('Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => (
        <div style={{ textAlign: 'center' }}>
          {rank <= 3 ? (
            <TrophyOutlined
              style={{
                color: rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : '#cd7f32',
              }}
            />
          ) : (
            rank
          )}
        </div>
      ),
    },
    {
      title: 'Player',
      dataIndex: 'username',
      key: 'username',
      render: (text: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={record.avatar_url} icon={<UserOutlined />} style={{ marginRight: 8 }} />
          <span>{text}</span>
          {record.current_streak >= 3 && (
            <Tooltip title={`${record.current_streak} win streak!`}>
              <FireOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      width: 100,
      render: (points: number) => <Tag color="blue">{points}</Tag>,
    },
    {
      title: 'W/L',
      key: 'wl',
      width: 120,
      render: (record: any) => (
        <span>
          <Tag color="success">{record.wins}</Tag>/<Tag color="error">{record.losses}</Tag>
        </span>
      ),
    },
    {
      title: 'Win Rate',
      key: 'winRate',
      width: 100,
      render: (record: any) => {
        const total = record.wins + record.losses;
        const rate = total > 0 ? ((record.wins / total) * 100).toFixed(1) : '0.0';
        return `${rate}%`;
      },
    },
    {
      title: 'Streak',
      key: 'streak',
      width: 120,
      render: (record: any) => (
        <Tooltip title={`Highest: ${record.highest_streak}`}>
          <Tag
            color={
              record.current_streak > 0
                ? 'success'
                : record.current_streak < 0
                  ? 'error'
                  : 'default'
            }
          >
            {record.current_streak > 0 ? '+' : ''}
            {record.current_streak}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Last Played',
      dataIndex: 'last_played',
      key: 'last_played',
      width: 150,
      render: (date: string) => moment(date).fromNow(),
    },
  ];

  return (
    <div className="leaderboard-list">
      {userStats && (
        <Row gutter={[16, 16]} className="stats-row">
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Your Rank"
              value={userStats.rank}
              prefix={<TrophyOutlined />}
              valueStyle={{
                color: userStats.rank <= 3 ? '#1890ff' : undefined,
              }}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic title="Points" value={userStats.points} prefix={<StarOutlined />} />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Win Rate"
              value={userStats.win_rate}
              suffix="%"
              prefix={userStats.win_rate >= 50 ? <RiseOutlined /> : <FallOutlined />}
              valueStyle={{
                color: userStats.win_rate >= 50 ? '#3f8600' : '#cf1322',
              }}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Current Streak"
              value={userStats.current_streak}
              prefix={<FireOutlined />}
              valueStyle={{
                color:
                  userStats.current_streak > 0
                    ? '#3f8600'
                    : userStats.current_streak < 0
                      ? '#cf1322'
                      : undefined,
              }}
            />
          </Col>
        </Row>
      )}

      <Card
        title={
          <>
            <TrophyOutlined /> Leaderboard
          </>
        }
        extra={
          <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
            <Option value="all">All Time</Option>
            <Option value="year">This Year</Option>
            <Option value="month">This Month</Option>
            <Option value="week">This Week</Option>
          </Select>
        }
      >
        <Table
          columns={columns}
          dataSource={entries}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
};

export default LeaderboardList;
