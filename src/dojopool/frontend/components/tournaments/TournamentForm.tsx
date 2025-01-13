import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, DatePicker, InputNumber, Button, Card, message, Space } from 'antd';
import moment from 'moment';

import { Tournament, TournamentFormat, CreateTournamentData } from '../../types/tournament';
import { createTournament, getTournament, updateTournament } from '../../api/tournaments';

const { Option } = Select;
const { TextArea } = Input;

interface ParamsType {
  id?: string;
  [key: string]: string | undefined;
}

const TournamentForm: React.FC = () => {
  const { id } = useParams<ParamsType>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tournament, setTournament] = useState<Tournament>();

  useEffect(() => {
    if (id) {
      fetchTournament();
    }
  }, [id]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const data = await getTournament(parseInt(id!));
      setTournament(data);
      form.setFieldsValue({
        ...data,
        start_date: moment(data.start_date),
        end_date: moment(data.end_date),
        registration_deadline: data.registration_deadline
          ? moment(data.registration_deadline)
          : undefined,
      });
    } catch (error) {
      console.error('Error fetching tournament:', error);
      message.error('Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const tournamentData: CreateTournamentData = {
        ...values,
        start_date: values.start_date.toISOString(),
        end_date: values.end_date.toISOString(),
        registration_deadline: values.registration_deadline
          ? values.registration_deadline.toISOString()
          : undefined,
      };

      if (id) {
        await updateTournament(parseInt(id), tournamentData);
        message.success('Tournament updated successfully');
      } else {
        await createTournament(tournamentData);
        message.success('Tournament created successfully');
      }
      navigate('/tournaments');
    } catch (error) {
      console.error('Error saving tournament:', error);
      message.error('Failed to save tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tournament-form">
      <Card title={id ? 'Edit Tournament' : 'Create Tournament'} loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            entry_fee: 0,
            prize_pool: 0,
          }}
        >
          <Form.Item
            name="name"
            label="Tournament Name"
            rules={[
              { required: true, message: 'Please enter tournament name' },
              { max: 100, message: 'Name cannot exceed 100 characters' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ max: 500, message: 'Description cannot exceed 500 characters' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="venue_id"
            label="Venue"
            rules={[{ required: true, message: 'Please select a venue' }]}
          >
            <Select placeholder="Select venue">
              {/* TODO: Add venue options */}
              <Option value={1}>Venue 1</Option>
              <Option value={2}>Venue 2</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="format"
            label="Tournament Format"
            rules={[{ required: true, message: 'Please select tournament format' }]}
          >
            <Select placeholder="Select format">
              <Option value="single_elimination">Single Elimination</Option>
              <Option value="double_elimination">Double Elimination</Option>
              <Option value="round_robin">Round Robin</Option>
              <Option value="swiss">Swiss System</Option>
            </Select>
          </Form.Item>

          <Space size="large">
            <Form.Item
              name="start_date"
              label="Start Date"
              rules={[{ required: true, message: 'Please select start date' }]}
            >
              <DatePicker showTime />
            </Form.Item>

            <Form.Item
              name="end_date"
              label="End Date"
              rules={[{ required: true, message: 'Please select end date' }]}
            >
              <DatePicker showTime />
            </Form.Item>

            <Form.Item name="registration_deadline" label="Registration Deadline">
              <DatePicker showTime />
            </Form.Item>
          </Space>

          <Space size="large">
            <Form.Item
              name="max_participants"
              label="Max Participants"
              rules={[
                {
                  type: 'number',
                  min: 2,
                  message: 'Must have at least 2 participants',
                },
              ]}
            >
              <InputNumber min={2} />
            </Form.Item>

            <Form.Item
              name="entry_fee"
              label="Entry Fee"
              rules={[
                {
                  type: 'number',
                  min: 0,
                  message: 'Entry fee cannot be negative',
                },
              ]}
            >
              <InputNumber min={0} precision={2} prefix="$" />
            </Form.Item>

            <Form.Item
              name="prize_pool"
              label="Prize Pool"
              rules={[
                {
                  type: 'number',
                  min: 0,
                  message: 'Prize pool cannot be negative',
                },
              ]}
            >
              <InputNumber min={0} precision={2} prefix="$" />
            </Form.Item>
          </Space>

          <Form.Item
            name="rules"
            label="Tournament Rules"
            rules={[{ max: 1000, message: 'Rules cannot exceed 1000 characters' }]}
          >
            <TextArea rows={6} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {id ? 'Update Tournament' : 'Create Tournament'}
              </Button>
              <Button onClick={() => navigate('/tournaments')}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TournamentForm;
