import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Tabs,
  Statistic,
  Row,
  Col,
  Timeline,
  message,
} from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { Line } from "@ant-design/charts";

import { useAuth } from "../../hooks/useAuth";
import {
  checkIn,
  checkOut,
  getActiveCheckins,
  getCheckinHistory,
  getOccupancyStats,
} from "../../api/venues";

const { TabPane } = Tabs;
const { Option } = Select;

interface CheckInSystemProps {
  venueId: number;
  venueName: string;
}

const CheckInSystem: React.FC<CheckInSystemProps> = ({
  venueId,
  venueName,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeCheckins, setActiveCheckins] = useState<any[]>([]);
  const [checkinHistory, setCheckinHistory] = useState<any[]>([]);
  const [occupancyStats, setOccupancyStats] = useState<any>(null);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [venueId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [active, history, stats] = await Promise.all([
        getActiveCheckins(venueId),
        getCheckinHistory(venueId),
        getOccupancyStats(venueId),
      ]);
      setActiveCheckins(active);
      setCheckinHistory(history);
      setOccupancyStats(stats);
    } catch (error) {
      console.error("Error fetching check-in data:", error);
      message.error("Failed to fetch check-in data");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (values: any) => {
    try {
      await checkIn(venueId, values);
      message.success("Checked in successfully");
      setCheckInModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error("Error checking in:", error);
      message.error("Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut(venueId);
      message.success("Checked out successfully");
      fetchData();
    } catch (error) {
      console.error("Error checking out:", error);
      message.error("Failed to check out");
    }
  };

  const activeColumns = [
    {
      title: "Player",
      dataIndex: "username",
      key: "username",
      render: (text: string, record: any) => (
        <span>
          <UserOutlined /> {text}
        </span>
      ),
    },
    {
      title: "Table",
      dataIndex: "table_number",
      key: "table_number",
    },
    {
      title: "Game",
      dataIndex: "game_type",
      key: "game_type",
    },
    {
      title: "Check-in Time",
      dataIndex: "checked_in_at",
      key: "checked_in_at",
      render: (date: string) => moment(date).format("h:mm A"),
    },
    {
      title: "Duration",
      key: "duration",
      render: (_, record: any) => {
        const duration = moment.duration(
          moment().diff(moment(record.checked_in_at)),
        );
        return `${Math.floor(duration.asHours())}h ${duration.minutes()}m`;
      },
    },
  ];

  const historyColumns = [
    {
      title: "Player",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Check-in",
      dataIndex: "checked_in_at",
      key: "checked_in_at",
      render: (date: string) => moment(date).format("MMM D, h:mm A"),
    },
    {
      title: "Check-out",
      dataIndex: "checked_out_at",
      key: "checked_out_at",
      render: (date: string) => (date ? moment(date).format("h:mm A") : "-"),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      render: (duration: string) => duration || "-",
    },
  ];

  const isCheckedIn = activeCheckins.some((c) => c.user_id === user?.id);

  return (
    <div className="check-in-system">
      <Card
        title={
          <>
            <TeamOutlined /> Check-in System
          </>
        }
        extra={
          isCheckedIn ? (
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              onClick={handleCheckOut}
            >
              Check Out
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setCheckInModalVisible(true)}
            >
              Check In
            </Button>
          )
        }
      >
        <Tabs defaultActiveKey="active">
          <TabPane
            tab={
              <span>
                <TeamOutlined /> Active Players
              </span>
            }
            key="active"
          >
            <Row gutter={[16, 16]} className="stats-row">
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="Current Occupancy"
                  value={occupancyStats?.current_occupancy || 0}
                  prefix={<TeamOutlined />}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="Peak Occupancy"
                  value={occupancyStats?.peak_occupancy || 0}
                  prefix={<BarChartOutlined />}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="Total Check-ins"
                  value={occupancyStats?.total_checkins || 0}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
            </Row>
            <Table
              columns={activeColumns}
              dataSource={activeCheckins}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <ClockCircleOutlined /> Check-in History
              </span>
            }
            key="history"
          >
            <Table
              columns={historyColumns}
              dataSource={checkinHistory}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
              }}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <BarChartOutlined /> Occupancy Trends
              </span>
            }
            key="trends"
          >
            {occupancyStats?.checkins_by_hour && (
              <Line
                data={occupancyStats.checkins_by_hour}
                xField="hour"
                yField="count"
                point={{
                  size: 4,
                  shape: "diamond",
                }}
                label={{
                  style: {
                    fill: "#aaa",
                  },
                }}
              />
            )}
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="Check In"
        visible={checkInModalVisible}
        onCancel={() => {
          setCheckInModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleCheckIn} layout="vertical">
          <Form.Item
            name="table_number"
            label="Table Number"
            rules={[{ required: true, message: "Please enter table number" }]}
          >
            <Input type="number" min={1} />
          </Form.Item>

          <Form.Item
            name="game_type"
            label="Game Type"
            rules={[{ required: true, message: "Please select game type" }]}
          >
            <Select>
              <Option value="8-ball">8-Ball</Option>
              <Option value="9-ball">9-Ball</Option>
              <Option value="straight">Straight Pool</Option>
              <Option value="one-pocket">One Pocket</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Check In
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CheckInSystem;
