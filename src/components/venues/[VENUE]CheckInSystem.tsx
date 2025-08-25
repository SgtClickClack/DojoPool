let Line: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Line = require('@ant-design/charts').Line;
} catch (_e) {
  Line = (props: any) => null;
}
import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Statistic,
  Table,
  Tabs,
  message,
} from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
// import QRCodeScanner from '../../QRCodeScanner';

import {
  checkIn,
  checkOut,
  getActiveCheckins,
  getCheckinHistory,
  getOccupancyStats,
} from '../../api/venues';
import { useAuth } from '../../hooks/useAuth';

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
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrScanResult, setQrScanResult] = useState<string | null>(null);
  const [geoLocation, setGeoLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [qrCheckInLoading, setQrCheckInLoading] = useState(false);
  const [qrCheckInError, setQrCheckInError] = useState<string | null>(null);
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
      console.error('Error fetching check-in data:', error);
      message.error('Failed to fetch check-in data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (values: any) => {
    try {
      await checkIn(venueId, values);
      message.success('Checked in successfully');
      setCheckInModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Error checking in:', error);
      message.error('Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut(venueId);
      message.success('Checked out successfully');
      fetchData();
    } catch (error) {
      console.error('Error checking out:', error);
      message.error('Failed to check out');
    }
  };

  const handleOpenQrDialog = () => {
    setQrDialogOpen(true);
    setQrScanResult(null);
    setGeoLocation(null);
    setQrCheckInError(null);
  };

  const handleQrScan = (code: string) => {
    setQrScanResult(code);
    // Get geolocation after QR scan
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          setQrCheckInError('Failed to get geolocation.');
        }
      );
    } else {
      setQrCheckInError('Geolocation not supported.');
    }
  };

  const handleQrCheckIn = async () => {
    if (!qrScanResult || !geoLocation) return;
    setQrCheckInLoading(true);
    setQrCheckInError(null);
    try {
      await checkIn(venueId, {
        qrCode: qrScanResult,
        latitude: geoLocation.latitude,
        longitude: geoLocation.longitude,
      });
      message.success('Checked in with QR/Geolocation!');
      setQrDialogOpen(false);
      fetchData();
    } catch (err) {
      setQrCheckInError('Failed to check in with QR/Geolocation.');
    } finally {
      setQrCheckInLoading(false);
    }
  };

  const activeColumns = [
    {
      title: 'Player',
      dataIndex: 'username',
      key: 'username',
      render: (text: string, record: any) => (
        <span>
          <UserOutlined /> {text}
        </span>
      ),
    },
    {
      title: 'Table',
      dataIndex: 'table_number',
      key: 'table_number',
    },
    {
      title: 'Game',
      dataIndex: 'game_type',
      key: 'game_type',
    },
    {
      title: 'Check-in Time',
      dataIndex: 'checked_in_at',
      key: 'checked_in_at',
      render: (date: string) => moment(date).format('h:mm A'),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: any, record: any) => {
        const duration = moment.duration(
          moment().diff(moment(record.checked_in_at))
        );
        return `${Math.floor(duration.asHours())}h ${duration.minutes()}m`;
      },
    },
  ];

  const historyColumns = [
    {
      title: 'Player',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Check-in',
      dataIndex: 'checked_in_at',
      key: 'checked_in_at',
      render: (date: string) => moment(date).format('MMM D, h:mm A'),
    },
    {
      title: 'Check-out',
      dataIndex: 'checked_out_at',
      key: 'checked_out_at',
      render: (date: string) => (date ? moment(date).format('h:mm A') : '-'),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: string) => duration || '-',
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
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => setCheckInModalVisible(true)}
              >
                Check In
              </Button>
              <Button
                type="default"
                icon={<CheckCircleOutlined />}
                onClick={handleOpenQrDialog}
                style={{ marginLeft: 8 }}
              >
                Check In with QR/Geolocation
              </Button>
            </>
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
                  shape: 'diamond',
                }}
                label={{
                  style: {
                    fill: '#aaa',
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
            rules={[{ required: true, message: 'Please enter table number' }]}
          >
            <Input type="number" min={1} />
          </Form.Item>

          <Form.Item
            name="game_type"
            label="Game Type"
            rules={[{ required: true, message: 'Please select game type' }]}
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

      {/* QR Modal temporarily disabled due to missing closing tag */}
      {/* <Modal
        title="QR/Geolocation Check-In"
        visible={qrDialogOpen}
        onCancel={() => setQrDialogOpen(false)}
        footer={null}
      >
        QR Check-in functionality temporarily unavailable
      </Modal> */}
    </div>
  );
};

export default CheckInSystem;
