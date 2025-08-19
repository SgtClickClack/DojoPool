import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
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
import { UserOutlined } from '@ant-design/icons';

import {
  createEvent,
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
    // TODO: Implement when getEventParticipants is available
    console.log('Fetching participants for event:', eventId);
    setParticipants([]);
  };

  const handleCreateEvent = async (values: any) => {
    try {
      const [start, end] = values.timeRange;
      const data = {
        venueId,
        ...values,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        registration_deadline: values.registration_deadline?.toISOString(),
      };
      delete data.timeRange;

      await createEvent(data);
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
    // TODO: Implement when checkInParticipant is available
    console.log('Checking in participant:', eventId, userId);
    message.info('Check-in functionality not yet implemented');
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
        <Tag
          color={
            type === 'tournament'
              ? 'blue'
              : type === 'social'
              ? 'green'
              : 'default'
          }
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Tag>
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
        <Button
          type="link"
          onClick={() => {
            setSelectedEvent(record);
            setParticipantsModalVisible(true);
            fetchParticipants(record.id);
          }}
        >
          {record.participant_count} / {record.max_participants || '∞'}
        </Button>
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
          <Tag
            color={
              status === 'upcoming'
                ? 'blue'
                : status === 'in_progress'
                ? 'green'
                : status === 'completed'
                ? 'default'
                : 'red'
            }
          >
            {status.replace('_', ' ').toUpperCase()}
          </Tag>
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
            <Tag color="success">
              <CheckCircleOutlined /> Registered
            </Tag>
          );
        }

        if (now > start || (record.registration_deadline && now > deadline)) {
          return (
            <Tag color="default">
              <ClockCircleOutlined /> Closed
            </Tag>
          );
        }

        if (
          record.max_participants &&
          record.participant_count >= record.max_participants
        ) {
          return (
            <Tag color="error">
              <TeamOutlined /> Full
            </Tag>
          );
        }

        return (
          <Button
            type="primary"
            size="small"
            onClick={() => handleRegister(record.id)}
          >
            Register
          </Button>
        );
      },
    },
  ];

  return (
    <div className="event-management">
      <Card
        title={
          <>
            <CalendarOutlined /> Events
          </>
        }
        extra={
          isOwner && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              Create Event
            </Button>
          )
        }
      >
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
      </Card>

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
