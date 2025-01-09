import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Space, Tag, Input, Select, DatePicker } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import moment from 'moment';

import { Tournament, TournamentStatus, TournamentFormat } from '../../types/tournament';
import { getTournaments } from '../../api/tournaments';
import { useAuth } from '../../hooks/useAuth';

const { Option } = Select;

const TournamentList: React.FC = () => {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<TournamentStatus>();
    const [venueFilter, setVenueFilter] = useState<number>();
    const { isAuthenticated, isAdmin } = useAuth();

    useEffect(() => {
        fetchTournaments();
    }, [statusFilter, venueFilter]);

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            const filters = {
                ...(statusFilter && { status: statusFilter }),
                ...(venueFilter && { venue_id: venueFilter })
            };
            const data = await getTournaments(10, 0, filters);
            setTournaments(data);
        } catch (error) {
            console.error('Error fetching tournaments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: TournamentStatus): string => {
        const colors: Record<TournamentStatus, string> = {
            pending: 'default',
            registration: 'processing',
            in_progress: 'warning',
            completed: 'success',
            cancelled: 'error'
        };
        return colors[status];
    };

    const getFormatLabel = (format: TournamentFormat): string => {
        const labels: Record<TournamentFormat, string> = {
            single_elimination: 'Single Elimination',
            double_elimination: 'Double Elimination',
            round_robin: 'Round Robin',
            swiss: 'Swiss System'
        };
        return labels[format];
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: Tournament) => (
                <Link to={`/tournaments/${record.id}`}>{text}</Link>
            ),
            filteredValue: [searchText],
            onFilter: (value: string, record: Tournament) =>
                record.name.toLowerCase().includes(value.toLowerCase())
        },
        {
            title: 'Format',
            dataIndex: 'format',
            key: 'format',
            render: (format: TournamentFormat) => getFormatLabel(format)
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: TournamentStatus) => (
                <Tag color={getStatusColor(status)}>
                    {status.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Start Date',
            dataIndex: 'start_date',
            key: 'start_date',
            render: (date: string) => moment(date).format('MMM D, YYYY')
        },
        {
            title: 'Entry Fee',
            dataIndex: 'entry_fee',
            key: 'entry_fee',
            render: (fee: number) => `$${fee.toFixed(2)}`
        },
        {
            title: 'Prize Pool',
            dataIndex: 'prize_pool',
            key: 'prize_pool',
            render: (pool: number) => `$${pool.toFixed(2)}`
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record: Tournament) => (
                <Space>
                    <Button type="primary">
                        <Link to={`/tournaments/${record.id}`}>View</Link>
                    </Button>
                    {isAuthenticated && record.status === 'registration' && (
                        <Button type="default">
                            <Link to={`/tournaments/${record.id}/register`}>Register</Link>
                        </Button>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div className="tournament-list">
            <div className="tournament-list__header">
                <h1>Tournaments</h1>
                {isAdmin && (
                    <Button type="primary" icon={<PlusOutlined />}>
                        <Link to="/tournaments/create">Create Tournament</Link>
                    </Button>
                )}
            </div>

            <div className="tournament-list__filters">
                <Space>
                    <Input
                        placeholder="Search tournaments"
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 200 }}
                    />
                    <Select
                        placeholder="Filter by status"
                        allowClear
                        style={{ width: 150 }}
                        onChange={value => setStatusFilter(value)}
                    >
                        <Option value="pending">Pending</Option>
                        <Option value="registration">Registration</Option>
                        <Option value="in_progress">In Progress</Option>
                        <Option value="completed">Completed</Option>
                        <Option value="cancelled">Cancelled</Option>
                    </Select>
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={tournaments}
                loading={loading}
                rowKey="id"
                pagination={{
                    pageSize: 10,
                    total: tournaments.length,
                    showSizeChanger: false
                }}
            />
        </div>
    );
};

export default TournamentList; 