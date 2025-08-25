import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Spin,
  Tag,
  message,
} from 'antd';
import moment from 'moment';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';

import { createEvent, registerForEvent } from '../../api/venues';
import { useAuth } from '../../hooks/useAuth';
import { type VenueEvent } from '../../types/venue';

interface EventListProps {
  events?: VenueEvent[];
  loading?: boolean;
  venueId: number;
}

const { RangePicker } = DatePicker;

const EventList: React.FC<EventListProps> = ({
  events = [],
  loading,
  venueId,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  const createEventMutation = useMutation(createEvent, {
    onSuccess: () => {
      message.success('Event created successfully');
      setCreateModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries(['venueEvents', venueId]);
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to create event');
    },
  });

  const registerMutation = useMutation(registerForEvent, {
    onSuccess: () => {
      message.success('Successfully registered for event');
      queryClient.invalidateQueries(['venueEvents', venueId]);
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to register for event');
    },
  });

  const handleCreateEvent = (values: any) => {
    const [startTime, endTime] = values.time;
    createEventMutation.mutate({
      venueId,
      name: values.name,
      description: values.description,
      event_type: values.event_type,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      registration_deadline: values.registration_deadline?.toISOString(),
      max_participants: values.max_participants,
      entry_fee: values.entry_fee,
      prize_pool: values.prize_pool,
    });
  };

  const handleRegister = (eventId: number) => {
    if (!user) {
      message.error('Please log in to register for events');
      return;
    }
    registerMutation.mutate(eventId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'blue';
      case 'in_progress':
        return 'green';
      case 'completed':
        return 'gray';
      case 'cancelled':
        return 'red';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="event-list">
      {(user as any)?.is_verified && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
          style={{ marginBottom: 16 }}
        >
          Create Event
        </Button>
      )}

      <List
        grid={{
          gutter: 16,
          xs: 1,
          sm: 2,
          md: 3,
          lg: 3,
          xl: 4,
          xxl: 4,
        }}
        dataSource={events}
        renderItem={(event) => (
          <List.Item>
            <Card
              title={event.name}
              extra={
                <Tag color={getStatusColor(event.status)}>{event.status}</Tag>
              }
            >
              <p>{event.description}</p>
              <p>
                <strong>Type:</strong>{' '}
                {(event as any).event_type ?? event.eventType}
              </p>
              <p>
                <strong>Date:</strong>{' '}
                {moment(
                  ((event as any).start_time ?? event.startTime) as string
                ).format('MMM D, YYYY')}
              </p>
              <p>
                <strong>Time:</strong>{' '}
                {moment(
                  ((event as any).start_time ?? event.startTime) as string
                ).format('h:mm A')}{' '}
                -{' '}
                {moment(
                  ((event as any).end_time ?? event.endTime) as string
                ).format('h:mm A')}
              </p>
              {(((event as any).entry_fee ?? event.entryFee) as number) > 0 && (
                <p>
                  <strong>Entry Fee:</strong> $
                  {((event as any).entry_fee ?? event.entryFee) as number}
                </p>
              )}
              {(((event as any).prize_pool ?? event.prizePool) as number) >
                0 && (
                <p>
                  <strong>Prize Pool:</strong> $
                  {((event as any).prize_pool ?? event.prizePool) as number}
                </p>
              )}
              {((event as any).max_participants ?? event.maxParticipants) && (
                <p>
                  <strong>Spots:</strong> {event.participants?.length || 0}/
                  {
                    ((event as any).max_participants ??
                      event.maxParticipants) as number
                  }
                </p>
              )}
              {event.status === 'upcoming' && (
                <Button
                  type="primary"
                  block
                  onClick={() => handleRegister(parseInt(String(event.id)))}
                  loading={registerMutation.isLoading}
                  disabled={
                    !user ||
                    event.participants?.some(
                      (p: any) => (p.user_id ?? p.id) === user.id
                    )
                  }
                >
                  {event.participants?.some(
                    (p: any) => (p.user_id ?? p.id) === user?.id
                  )
                    ? 'Registered'
                    : 'Register'}
                </Button>
              )}
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="Create Event"
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleCreateEvent} layout="vertical">
          <Form.Item
            name="name"
            label="Event Name"
            rules={[
              {
                required: true,
                message: 'Please enter the event name',
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[
              {
                required: true,
                message: 'Please enter the event description',
              },
            ]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="event_type"
            label="Event Type"
            rules={[
              {
                required: true,
                message: 'Please enter the event type',
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="time"
            label="Event Time"
            rules={[
              {
                required: true,
                message: 'Please select the event time',
              },
            ]}
          >
            <RangePicker showTime />
          </Form.Item>
          <Form.Item name="registration_deadline" label="Registration Deadline">
            <DatePicker showTime />
          </Form.Item>
          <Form.Item name="max_participants" label="Maximum Participants">
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="entry_fee" label="Entry Fee">
            <InputNumber min={0} precision={2} />
          </Form.Item>
          <Form.Item name="prize_pool" label="Prize Pool">
            <InputNumber min={0} precision={2} />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={createEventMutation.isLoading}
              block
            >
              Create Event
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EventList;
