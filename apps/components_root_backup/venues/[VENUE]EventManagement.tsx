import {
  Event as CalendarOutlined,
  CheckCircle as CheckCircleOutlined,
  Schedule as ClockCircleOutlined,
  Add as PlusOutlined,
  Group as TeamOutlined,
} from '@mui/icons-material';
import { UserOutlined } from '@ant-design/icons';
import {
  CardContent,
  CardHeader,
  Chip,
  Button as MuiButton,
  Card as MuiCard,
} from '@mui/material';
import {
  Avatar,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Select,
  Table,
  Tag,
  message,
} from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';

import {
  checkInParticipant,
  createEvent,
  getEventParticipants,
  getVenueEvents,
  registerForEvent,
} from '../../api/venues';
import { useAuth } from '../../hooks/useAuth';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface EventManagementProps {
  venueId: number;
  venueName: string;
  isOwner?: boolean;
}

const EventManagement: React.FC<EventManagementProps> = ({
  venueId,
  venueName,
  isOwner = false,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [participantsModalVisible, setParticipantsModalVisible] =
    useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchEvents();
  }, [venueId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getVenueEvents(venueId);
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      message.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (eventId: number) => {
    try {
      const data = await getEventParticipants(eventId);
      setParticipants(data);
    } catch (error) {
      console.error('Error fetching participants:', error);
      message.error('Failed to fetch participants');
    }
  };

  const handleCreateEvent = async (values: any) => {
    try {
      const [start, end] = values.timeRange;
      const data = {
        ...values,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        registration_deadline: values.registration_deadline?.toISOString(),
      };
      delete data.timeRange;

      await createEvent({ venueId, ...data });
      message.success('Event created successfully');
      setCreateModalVisible(false);
      form.resetFields();
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      message.error('Failed to create event');
    }
  };

  const handleRegister = async (eventId: number) => {
    try {
      await registerForEvent(eventId);
      message.success('Successfully registered for event');
      fetchEvents();
    } catch (error) {
      console.error('Error registering for event:', error);
      message.error('Failed to register for event');
    }
  };

  const handleCheckIn = async (eventId: number, userId: number) => {
    try {
      await checkInParticipant(eventId, userId);
      message.success('Successfully checked in participant');
      fetchParticipants(eventId);
    } catch (error) {
      console.error('Error checking in participant:', error);
      message.error('Failed to check in participant');
    }
  };

  const columns = [
    {
      title: 'Event',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {record.description}
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'event_type',
      key: 'event_type',
      width: 120,
      render: (type: string) => (
        <Chip
          label={type.charAt(0).toUpperCase() + type.slice(1)}
          color={
            type === 'tournament'
              ? 'primary'
              : type === 'social'
              ? 'success'
              : 'default'
          }
          size="small"
        />
      ),
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      width: 200,
      render: (record: any) => (
        <div>
          <div>{moment(record.start_time).format('MMM D, YYYY')}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {moment(record.start_time).format('h:mm A')} -{' '}
            {moment(record.end_time).format('h:mm A')}
          </div>
        </div>
      ),
    },
    {
      title: 'Participants',
      key: 'participants',
      width: 120,
      render: (record: any) => (
        <MuiButton
          variant="text"
          onClick={() => {
            setSelectedEvent(record);
            setParticipantsModalVisible(true);
            fetchParticipants(record.id);
          }}
        >
          {record.participant_count} / {record.max_participants || '∞'}
        </MuiButton>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (record: any) => {
        const now = moment();
        const start = moment(record.start_time);
        const end = moment(record.end_time);

        let status = record.status;
        if (now < start) status = 'upcoming';
        if (now >= start && now <= end) status = 'in_progress';
        if (now > end) status = 'completed';

        return (
          <Chip
            label={status.replace('_', ' ').toUpperCase()}
            color={
              status === 'upcoming'
                ? 'primary'
                : status === 'in_progress'
                ? 'success'
                : status === 'completed'
                ? 'default'
                : 'error'
            }
            size="small"
          />
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (record: any) => {
        const now = moment();
        const start = moment(record.start_time);
        const deadline = moment(record.registration_deadline);
        const isRegistered = record.participants?.some(
          (p: any) => p.user_id === user?.id
        );

        if (isRegistered) {
          return (
            <Chip
              label="Registered"
              color="success"
              icon={<CheckCircleOutlined />}
              size="small"
            />
          );
        }

        if (now > start || (record.registration_deadline && now > deadline)) {
          return (
            <Chip
              label="Closed"
              color="default"
              icon={<ClockCircleOutlined />}
              size="small"
            />
          );
        }

        if (
          record.max_participants &&
          record.participant_count >= record.max_participants
        ) {
          return (
            <Chip
              label="Full"
              color="error"
              icon={<TeamOutlined />}
              size="small"
            />
          );
        }

        return (
          <MuiButton
            variant="contained"
            size="small"
            onClick={() => handleRegister(record.id)}
          >
            Register
          </MuiButton>
        );
      },
    },
  ];

  return (
    <div className="event-management">
      <MuiCard>
        <CardHeader
          title={
            <>
              <CalendarOutlined /> Events
            </>
          }
          action={
            isOwner && (
              <MuiButton
                variant="contained"
                startIcon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                Create Event
              </MuiButton>
            )
          }
        />
        <CardContent>
          <Table
            columns={columns}
            dataSource={events}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
            }}
          />
        </CardContent>
      </MuiCard>

      <Modal
        title="Create Event"
        visible={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleCreateEvent} layout="vertical">
          <Form.Item
            name="name"
            label="Event Name"
            rules={[{ required: true, message: 'Please enter event name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="event_type"
            label="Event Type"
            rules={[{ required: true, message: 'Please select event type' }]}
          >
            <Select>
              <Option value="tournament">Tournament</Option>
              <Option value="social">Social</Option>
              <Option value="training">Training</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="timeRange"
            label="Event Time"
            rules={[{ required: true, message: 'Please select event time' }]}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="registration_deadline" label="Registration Deadline">
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="max_participants" label="Maximum Participants">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="entry_fee" label="Entry Fee">
            <InputNumber
              min={0}
              precision={2}
              prefix="$"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="prize_pool" label="Prize Pool">
            <InputNumber
              min={0}
              precision={2}
              prefix="$"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Event
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          selectedEvent && (
            <div>
              <div style={{ fontSize: 20, marginBottom: 4 }}>
                {selectedEvent.name}
              </div>
              <div style={{ fontSize: 14, color: '#8c8c8c' }}>
                {moment(selectedEvent.start_time).format('MMM D, YYYY h:mm A')}
              </div>
            </div>
          )
        }
        visible={participantsModalVisible}
        onCancel={() => {
          setParticipantsModalVisible(false);
          setSelectedEvent(null);
          setParticipants([]);
        }}
        footer={null}
        width={600}
      >
        <List
          loading={loading}
          dataSource={participants}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                isOwner && !item.checked_in && (
                  <Button
                    type="link"
                    onClick={() =>
                      handleCheckIn(selectedEvent.id, item.user_id)
                    }
                  >
                    Check In
                  </Button>
                ),
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar src={item.avatar_url} icon={<UserOutlined />} />
                }
                title={item.username}
                description={
                  <div>
                    {item.checked_in ? (
                      <Tag color="success">
                        <CheckCircleOutlined /> Checked In
                      </Tag>
                    ) : (
                      <Tag color="default">
                        <ClockCircleOutlined /> Not Checked In
                      </Tag>
                    )}
                    <div
                      style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}
                    >
                      Registered {moment(item.registered_at).fromNow()}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default EventManagement;
