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

import {
  generateBracket,
  getTournament,
  getTournamentMatches,
  registerForTournament,
  updateMatch,
} from '../../api/tournaments';
import { useAuth } from '../../hooks/useAuth';
import {
  type Tournament,
  type TournamentMatch,
  type TournamentParticipant,
} from '../../types/tournament';
const TournamentBracket: any = () => null;
const MatchStats: any = () => null;

const { TabPane } = Tabs;
const { Option } = Select;

interface ParamsType {
  id: string;
  [key: string]: string;
}

const TournamentDetail: React.FC = () => {
  const { id } = useParams<ParamsType>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament>();
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const isAdmin = (user as any)?.role === 'ADMIN';
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchTournament();
      fetchMatches();
    }
  }, [id]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const data = await getTournament(parseInt(id || '0'));
      setTournament(data);
    } catch (error) {
      console.error('Error fetching tournament:', error);
      message.error('Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const data = await getTournamentMatches(parseInt(id || '0'));
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
      message.error('Failed to load tournament matches');
    }
  };

  const handleRegister = async () => {
    try {
      await registerForTournament(parseInt(id || '0'));
      message.success('Successfully registered for tournament');
      fetchTournament();
    } catch (error) {
      console.error('Error registering for tournament:', error);
      message.error('Failed to register for tournament');
    }
  };

  const handleGenerateBracket = async () => {
    try {
      await generateBracket(parseInt(id || '0'));
      message.success('Tournament bracket generated successfully');
      fetchTournament();
      fetchMatches();
    } catch (error) {
      console.error('Error generating bracket:', error);
      message.error('Failed to generate tournament bracket');
    }
  };

  const handleUpdateMatch = async (values: any) => {
    if (!selectedMatch) return;

    try {
      await updateMatch(Number((selectedMatch as any).id), values);
      message.success('Match updated successfully');
      setIsModalVisible(false);
      fetchMatches();
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
        player
          ? (player as any).username || (player as any).name || 'TBD'
          : 'TBD',
    },
    {
      title: 'Player 2',
      dataIndex: 'player2',
      key: 'player2',
      render: (player: TournamentParticipant) =>
        player
          ? (player as any).username || (player as any).name || 'TBD'
          : 'TBD',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: any) => (
        <Tag
          color={
            status === 'completed' || status === 'COMPLETED'
              ? 'success'
              : status === 'in_progress' || status === 'IN_PROGRESS'
              ? 'processing'
              : status === 'walkover'
              ? 'warning'
              : status === 'cancelled' || status === 'CANCELLED'
              ? 'error'
              : 'default'
          }
        >
          {String(status).toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: TournamentMatch) => (
        <Space>
          {isAdmin &&
            (record as any).status !== 'completed' &&
            (record as any).status !== 'COMPLETED' && (
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
                  (tournament as any).status === 'completed' ||
                  (tournament as any).status === 'COMPLETED'
                    ? 'success'
                    : (tournament as any).status === 'in_progress' ||
                      (tournament as any).status === 'IN_PROGRESS'
                    ? 'processing'
                    : (tournament as any).status === 'registration' ||
                      (tournament as any).status === 'REGISTRATION'
                    ? 'warning'
                    : (tournament as any).status === 'cancelled' ||
                      (tournament as any).status === 'CANCELLED'
                    ? 'error'
                    : 'default'
                }
              >
                {String((tournament as any).status).toUpperCase()}
              </Tag>
            </div>
            <Space>
              {isAuthenticated &&
                ((tournament as any).status === 'registration' ||
                  (tournament as any).status === 'REGISTRATION') && (
                  <Button type="primary" onClick={handleRegister}>
                    Register
                  </Button>
                )}
              {isAdmin &&
                ((tournament as any).status === 'registration' ||
                  (tournament as any).status === 'REGISTRATION') && (
                  <Button type="primary" onClick={handleGenerateBracket}>
                    Generate Bracket
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
              (tournament as any).start_date || (tournament as any).startDate
            ).format('MMM D, YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Entry Fee">
            $
            {Number(
              (tournament as any).entry_fee || (tournament as any).entryFee || 0
            ).toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="Prize Pool">
            ${Number((tournament as any).prize_pool || 0).toFixed(2)}
          </Descriptions.Item>
          {((tournament as any).registration_deadline ||
            (tournament as any).registrationDeadline) && (
            <Descriptions.Item label="Registration Deadline">
              {moment(
                (tournament as any).registration_deadline ||
                  (tournament as any).registrationDeadline
              ).format('MMM D, YYYY')}
            </Descriptions.Item>
          )}
          {((tournament as any).max_participants ||
            (tournament as any).maxParticipants) && (
            <Descriptions.Item label="Max Participants">
              {(tournament as any).max_participants ||
                (tournament as any).maxParticipants}
            </Descriptions.Item>
          )}
        </Descriptions>

        {tournament.rules && (
          <div className="tournament-detail__rules">
            <h3>Rules</h3>
            <p>{tournament.rules}</p>
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
              <TournamentBracket matches={matches} totalRounds={totalRounds} />
            ) : (
              <div>No bracket data available</div>
            )}
          </TabPane>
          <TabPane tab="Statistics" key="stats">
            {((tournament as any).participants || []).map(
              (participant: any) => (
                <Card
                  key={participant.id}
                  title={participant.username || participant.name}
                  style={{ marginBottom: 16 }}
                >
                  <MatchStats participantId={participant.id} />
                </Card>
              )
            )}
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
          onFinish={handleUpdateMatch}
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
                <Option value={(selectedMatch as any).player1.id}>
                  {(selectedMatch as any).player1.username ||
                    (selectedMatch as any).player1.name}
                </Option>
              )}
              {selectedMatch?.player2 && (
                <Option value={(selectedMatch as any).player2.id}>
                  {(selectedMatch as any).player2.username ||
                    (selectedMatch as any).player2.name}
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
