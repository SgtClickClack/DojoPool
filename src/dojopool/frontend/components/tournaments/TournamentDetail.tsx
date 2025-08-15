import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Tabs,
  Button,
  Space,
  Tag,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Descriptions,
  Timeline,
  Select,
} from "antd";
import {
  TrophyOutlined,
  TeamOutlined,
  FieldTimeOutlined,
  DollarOutlined,
  EditOutlined,
} from "@ant-design/icons";
import moment from "moment";

import {
  Tournament,
  TournamentMatch,
  TournamentParticipant,
  TournamentStatus,
  MatchStatus,
} from "../../types/tournament";
import {
  getTournament,
  getTournamentMatches,
  updateMatch,
  registerForTournament,
  generateBracket,
} from "../../api/tournaments";
import { useAuth } from "../../hooks/useAuth";
import TournamentBracket from "./TournamentBracket";
import MatchStats from "./MatchStats";

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
  const { isAuthenticated, isAdmin } = useAuth();
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
      const data = await getTournament(parseInt(id));
      setTournament(data);
    } catch (error) {
      console.error("Error fetching tournament:", error);
      message.error("Failed to load tournament details");
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const data = await getTournamentMatches(parseInt(id));
      setMatches(data);
    } catch (error) {
      console.error("Error fetching matches:", error);
      message.error("Failed to load tournament matches");
    }
  };

  const handleRegister = async () => {
    try {
      await registerForTournament(parseInt(id));
      message.success("Successfully registered for tournament");
      fetchTournament();
    } catch (error) {
      console.error("Error registering for tournament:", error);
      message.error("Failed to register for tournament");
    }
  };

  const handleGenerateBracket = async () => {
    try {
      await generateBracket(parseInt(id));
      message.success("Tournament bracket generated successfully");
      fetchTournament();
      fetchMatches();
    } catch (error) {
      console.error("Error generating bracket:", error);
      message.error("Failed to generate tournament bracket");
    }
  };

  const handleUpdateMatch = async (values: any) => {
    if (!selectedMatch) return;

    try {
      await updateMatch(selectedMatch.id, values);
      message.success("Match updated successfully");
      setIsModalVisible(false);
      fetchMatches();
    } catch (error) {
      console.error("Error updating match:", error);
      message.error("Failed to update match");
    }
  };

  const matchColumns = [
    {
      title: "Round",
      dataIndex: "round_number",
      key: "round_number",
    },
    {
      title: "Match",
      dataIndex: "match_number",
      key: "match_number",
    },
    {
      title: "Player 1",
      dataIndex: "player1",
      key: "player1",
      render: (player: TournamentParticipant) =>
        player ? player.username : "TBD",
    },
    {
      title: "Player 2",
      dataIndex: "player2",
      key: "player2",
      render: (player: TournamentParticipant) =>
        player ? player.username : "TBD",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: MatchStatus) => (
        <Tag
          color={
            status === "completed"
              ? "success"
              : status === "in_progress"
                ? "processing"
                : status === "walkover"
                  ? "warning"
                  : status === "cancelled"
                    ? "error"
                    : "default"
          }
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: TournamentMatch) => (
        <Space>
          {isAdmin && record.status !== "completed" && (
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

  const totalRounds = tournament.bracket_data?.rounds || 0;

  return (
    <div className="tournament-detail">
      <Card loading={loading}>
        <div className="tournament-detail__header">
          <Space align="start" size="large">
            <div>
              <h1>{tournament.name}</h1>
              <Tag
                color={
                  tournament.status === "completed"
                    ? "success"
                    : tournament.status === "in_progress"
                      ? "processing"
                      : tournament.status === "registration"
                        ? "warning"
                        : tournament.status === "cancelled"
                          ? "error"
                          : "default"
                }
              >
                {tournament.status.toUpperCase()}
              </Tag>
            </div>
            <Space>
              {isAuthenticated && tournament.status === "registration" && (
                <Button type="primary" onClick={handleRegister}>
                  Register
                </Button>
              )}
              {isAdmin && tournament.status === "registration" && (
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
            {moment(tournament.start_date).format("MMM D, YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Entry Fee">
            ${tournament.entry_fee.toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="Prize Pool">
            ${tournament.prize_pool.toFixed(2)}
          </Descriptions.Item>
          {tournament.registration_deadline && (
            <Descriptions.Item label="Registration Deadline">
              {moment(tournament.registration_deadline).format("MMM D, YYYY")}
            </Descriptions.Item>
          )}
          {tournament.max_participants && (
            <Descriptions.Item label="Max Participants">
              {tournament.max_participants}
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
            {tournament.participants.map((participant) => (
              <Card
                key={participant.id}
                title={participant.username}
                style={{ marginBottom: 16 }}
              >
                <MatchStats participantId={participant.id} />
              </Card>
            ))}
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
