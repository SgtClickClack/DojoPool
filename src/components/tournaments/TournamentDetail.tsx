import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useEnhancedTournamentAPI } from '../../frontend/hooks/useEnhancedTournamentAPI';
import { useAuth } from '../../hooks/useAuth';
import {
  type MatchStatus,
  type TournamentMatch,
  type TournamentParticipant,
} from '../../types/[TOURN]tournament';
import TournamentBracket from '../Tournament/[TOURN]TournamentBracket';
// import MatchStats from './MatchStats';

const { TabPane } = Tabs;
const { Option } = Select;

interface ParamsType {
  id: string;
  [key: string]: string;
}

const TournamentDetail: React.FC = () => {
  const { id } = useParams<ParamsType>();
  const navigate = useNavigate();
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const isAdmin = false; // TODO: Add admin role support
  const [form] = Form.useForm();

  const {
    currentTournament: tournament,
    matches,
    loading,
    error,
    loadTournament,
    loadMatches,
    registerPlayer,
    unregisterPlayer,
    startTournamentWithRealTime,
    updateMatchWithRealTime,
    clearError,
    realTimeConnected,
    lastUpdate,
  } = useEnhancedTournamentAPI();

  useEffect(() => {
    if (id) {
      loadTournament(id);
      loadMatches(id);
    }
  }, [id, loadTournament, loadMatches]);

  const handleRegister = async () => {
    if (!id || !user) return;

    try {
      await registerPlayer(id, user.id);
      message.success('Successfully registered for tournament');
      loadTournament(id);
    } catch (error) {
      console.error('Error registering for tournament:', error);
      message.error('Failed to register for tournament');
    }
  };

  const handleUnregister = async () => {
    if (!id || !user) return;

    try {
      await unregisterPlayer(id, user.id);
      message.success('Successfully unregistered from tournament');
      loadTournament(id);
    } catch (error) {
      console.error('Error unregistering from tournament:', error);
      message.error('Failed to unregister from tournament');
    }
  };

  const handleStartTournament = async () => {
    if (!id) return;

    try {
      await startTournamentWithRealTime(id);
      message.success('Tournament started successfully');
      loadTournament(id);
      loadMatches(id);
    } catch (error) {
      console.error('Error starting tournament:', error);
      message.error('Failed to start tournament');
    }
  };

  const handleUpdateMatch = async (
    matchId: string,
    scoreA: number,
    scoreB: number,
    winnerId: string
  ) => {
    try {
      await updateMatchWithRealTime(matchId, scoreA, scoreB, winnerId);
      message.success('Match updated successfully');
      if (id) {
        loadMatches(id);
      }
    } catch (error) {
      console.error('Error updating match:', error);
      message.error('Failed to update match');
    }
  };

  const matchColumns = [
    {
      title: 'Round',
      dataIndex: 'round_number',
      key: 'round_number',
    },
    {
      title: 'Match',
      dataIndex: 'match_number',
      key: 'match_number',
    },
    {
      title: 'Player 1',
      dataIndex: 'player1',
      key: 'player1',
      render: (player: TournamentParticipant) =>
        player ? player.username : 'TBD',
    },
    {
      title: 'Player 2',
      dataIndex: 'player2',
      key: 'player2',
      render: (player: TournamentParticipant) =>
        player ? player.username : 'TBD',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: MatchStatus) => (
        <Tag
          color={
            status === 'completed'
              ? 'success'
              : status === 'in_progress'
              ? 'processing'
              : status === 'walkover'
              ? 'warning'
              : status === 'cancelled'
              ? 'error'
              : 'default'
          }
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: TournamentMatch) => (
        <Space>
          {isAdmin && record.status !== 'completed' && (
            <Button
              type="primary"
              onClick={() => {
                setSelectedMatch(record);
                setIsModalVisible(true);
              }}
            >
              Update
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (!tournament) {
    return <div>Loading...</div>;
  }

  const totalRounds = (tournament as any).bracket_data?.rounds || 0;

  return (
    <div className="tournament-detail">
      <Card loading={loading}>
        <div className="tournament-detail__header">
          <Space align="start" size="large">
            <div>
              <h1>{tournament.name}</h1>
              <Tag
                color={
                  (tournament.status as any) === 'completed'
                    ? 'success'
                    : (tournament.status as any) === 'in_progress'
                    ? 'processing'
                    : (tournament.status as any) === 'registration'
                    ? 'warning'
                    : (tournament.status as any) === 'cancelled'
                    ? 'error'
                    : 'default'
                }
              >
                {(tournament.status as any).toUpperCase?.() ||
                  tournament.status}
              </Tag>
            </div>
            <Space>
              {isAuthenticated &&
                (tournament.status as any) === 'registration' && (
                  <Button type="primary" onClick={handleRegister}>
                    Register
                  </Button>
                )}
              {isAdmin && (tournament.status as any) === 'registration' && (
                <Button type="primary" onClick={handleStartTournament}>
                  Start Tournament
                </Button>
              )}
            </Space>
          </Space>
        </div>

        <Descriptions column={2}>
          <Descriptions.Item label="Format">
            {tournament.format}
          </Descriptions.Item>
          <Descriptions.Item label="Start Date">
            {moment(
              (tournament as any).start_date ?? (tournament as any).startDate
            ).format('MMM D, YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Entry Fee">
            $
            {(
              Number(
                (tournament as any).entry_fee ?? (tournament as any).entryFee
              ) || 0
            ).toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="Prize Pool">
            $
            {(
              Number(
                (tournament as any).prize_pool ?? (tournament as any).prizePool
              ) || 0
            ).toFixed(2)}
          </Descriptions.Item>
          {(tournament as any).registration_deadline && (
            <Descriptions.Item label="Registration Deadline">
              {moment((tournament as any).registration_deadline).format(
                'MMM D, YYYY'
              )}
            </Descriptions.Item>
          )}
          {(tournament as any).max_participants && (
            <Descriptions.Item label="Max Participants">
              {(tournament as any).max_participants}
            </Descriptions.Item>
          )}
        </Descriptions>

        {(tournament as any).rules && (
          <div className="tournament-detail__rules">
            <h3>Rules</h3>
            <p>{(tournament as any).rules}</p>
          </div>
        )}

        <Tabs defaultActiveKey="matches">
          <TabPane tab="Matches" key="matches">
            <Table
              columns={matchColumns}
              dataSource={matches}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
          <TabPane tab="Bracket" key="bracket">
            {matches.length > 0 && totalRounds > 0 ? (
              <TournamentBracket tournament={tournament as any} />
            ) : (
              <div>No bracket data available</div>
            )}
          </TabPane>
          <TabPane tab="Statistics" key="stats">
            {/* Participant data not available in current interface */}
            <div>Tournament statistics not available</div>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="Update Match"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          onFinish={(values: any) => {
            if (!selectedMatch) return;
            const winnerId = values.winner_id;
            const [scoreA, scoreB] = String(values.score ?? '0-0')
              .split('-')
              .map((n: string) => parseInt(n.trim(), 10) || 0);
            handleUpdateMatch(
              String(selectedMatch.id),
              scoreA,
              scoreB,
              winnerId
            );
          }}
          initialValues={selectedMatch}
          layout="vertical"
        >
          <Form.Item
            name="winner_id"
            label="Winner"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select winner">
              {selectedMatch?.player1 && (
                <Option value={selectedMatch.player1.id}>
                  {selectedMatch.player1.username}
                </Option>
              )}
              {selectedMatch?.player2 && (
                <Option value={selectedMatch.player2.id}>
                  {selectedMatch.player2.username}
                </Option>
              )}
            </Select>
          </Form.Item>
          <Form.Item name="score" label="Score">
            <Input placeholder="e.g., 2-1" />
          </Form.Item>
          <Form.Item name="table_number" label="Table Number">
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TournamentDetail;
