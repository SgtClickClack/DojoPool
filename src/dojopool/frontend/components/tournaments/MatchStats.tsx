import React, { useState, useEffect } from 'react';
import { Card, Table, Statistic, Row, Col, Timeline, Tag } from 'antd';
import { 
    TrophyOutlined, FireOutlined, FieldTimeOutlined,
    SafetyOutlined, WarningOutlined
} from '@ant-design/icons';
import moment from 'moment';

import { TournamentMatch, TournamentParticipant } from '../../types/tournament';
import { getMatchHistory, getParticipantStats } from '../../api/tournaments';

interface Props {
    participantId: number;
}

interface ParticipantStats {
    matches_played: number;
    matches_won: number;
    frames_played: number;
    frames_won: number;
    total_breaks: number;
    highest_break: number;
    average_break: number;
    total_fouls: number;
}

const MatchStats: React.FC<Props> = ({ participantId }) => {
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState<TournamentMatch[]>([]);
    const [stats, setStats] = useState<ParticipantStats | null>(null);

    useEffect(() => {
        fetchData();
    }, [participantId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [matchesData, statsData] = await Promise.all([
                getMatchHistory(participantId),
                getParticipantStats(participantId)
            ]);
            setMatches(matchesData);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching match data:', error);
        } finally {
            setLoading(false);
        }
    };

    const matchColumns = [
        {
            title: 'Date',
            dataIndex: 'end_time',
            key: 'date',
            render: (date: string) => moment(date).format('MMM D, YYYY')
        },
        {
            title: 'Tournament',
            dataIndex: 'tournament',
            key: 'tournament',
            render: (tournament: any) => tournament.name
        },
        {
            title: 'Opponent',
            key: 'opponent',
            render: (_, record: TournamentMatch) => {
                const opponent = record.player1_id === participantId
                    ? record.player2
                    : record.player1;
                return opponent ? opponent.username : 'TBD';
            }
        },
        {
            title: 'Score',
            dataIndex: 'score',
            key: 'score',
            render: (score: any) => score?.final_score || '-'
        },
        {
            title: 'Result',
            key: 'result',
            render: (_, record: TournamentMatch) => (
                <Tag color={
                    record.winner_id === participantId ? 'success' :
                    record.winner_id ? 'error' : 'default'
                }>
                    {record.winner_id === participantId ? 'Won' :
                     record.winner_id ? 'Lost' : 'Pending'}
                </Tag>
            )
        }
    ];

    if (!stats) {
        return <div>Loading...</div>;
    }

    return (
        <div className="match-stats">
            <Row gutter={[16, 16]}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Matches Played"
                            value={stats.matches_played}
                            prefix={<TrophyOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Win Rate"
                            value={stats.matches_played ? (
                                (stats.matches_won / stats.matches_played) * 100
                            ) : 0}
                            precision={1}
                            suffix="%"
                            prefix={<FireOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Highest Break"
                            value={stats.highest_break}
                            prefix={<SafetyOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Average Break"
                            value={stats.average_break}
                            precision={1}
                            prefix={<FieldTimeOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Match History" className="match-history" style={{ marginTop: 16 }}>
                <Table
                    columns={matchColumns}
                    dataSource={matches}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: false
                    }}
                />
            </Card>

            <Card title="Recent Achievements" style={{ marginTop: 16 }}>
                <Timeline>
                    {stats.highest_break > 0 && (
                        <Timeline.Item color="green">
                            Achieved highest break of {stats.highest_break}
                        </Timeline.Item>
                    )}
                    {stats.matches_won > 0 && (
                        <Timeline.Item color="blue">
                            Won {stats.matches_won} matches
                        </Timeline.Item>
                    )}
                    {stats.frames_won > 0 && (
                        <Timeline.Item color="blue">
                            Won {stats.frames_won} frames
                        </Timeline.Item>
                    )}
                    {stats.total_breaks > 0 && (
                        <Timeline.Item color="green">
                            Made {stats.total_breaks} breaks
                        </Timeline.Item>
                    )}
                </Timeline>
            </Card>
        </div>
    );
};

export default MatchStats; 