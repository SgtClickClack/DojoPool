import React from 'react';
import Layout from 'antd/lib/layout';
import { Typography, Card, Row, Col, Button, Space } from 'antd';
import { 
  TrophyOutlined, 
  TeamOutlined, 
  FireOutlined, 
  StarOutlined,
  CompassOutlined,
  BookOutlined
} from '@ant-design/icons';
import PlayerJourney from '../components/game/PlayerJourney';
import { progressionService } from '../services/progression/ProgressionService';

const { Title, Paragraph } = Typography;
const { Header, Content, Footer } = Layout;

const JourneyPage: React.FC = () => {
  const storyContext = progressionService.getStoryContext();
  const playerStats = progressionService.getPlayerStats();
  const objectives = progressionService.getObjectives();
  const events = progressionService.getEvents();

  const handleStartObjective = (objectiveId: string) => {
    const result = progressionService.startObjective(objectiveId);
    console.log('Objective start result:', result);
    
    if (result.success) {
      // In a real implementation, this would navigate to the game or venue
      alert(`Starting objective: ${result.message}\nNext step: ${result.nextStep}`);
    } else {
      alert(`Cannot start objective: ${result.message}`);
    }
  };

  const handleGameResult = (won: boolean) => {
    progressionService.updateGameResult(won);
    const newStats = progressionService.getPlayerStats();
    console.log('Updated stats:', newStats);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <CompassOutlined style={{ fontSize: '24px', color: 'white' }} />
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            DojoPool Journey
          </Title>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: 'white', fontSize: '16px' }}>
            Level {playerStats.level}
          </span>
          <span style={{ color: 'white', fontSize: '14px' }}>
            {playerStats.wins}W - {playerStats.losses}L
          </span>
        </div>
      </Header>

      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Story Context Banner */}
          <Card 
            style={{ 
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <Row gutter={16} align="middle">
              <Col span={16}>
                <Title level={4} style={{ color: 'white', margin: 0 }}>
                  {storyContext.currentChapter}
                </Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.9)', margin: '8px 0 0 0' }}>
                  {storyContext.mainPlot}
                </Paragraph>
              </Col>
              <Col span={8} style={{ textAlign: 'right' }}>
                <Space direction="vertical" size="small">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FireOutlined style={{ color: '#ff6b6b' }} />
                    <span>Rivals: {storyContext.activeRivals.length}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TeamOutlined style={{ color: '#4ecdc4' }} />
                    <span>{storyContext.clanStatus}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrophyOutlined style={{ color: '#ffe66d' }} />
                    <span>Next: {storyContext.nextMajorEvent}</span>
                  </div>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Main Player Journey Component */}
          <PlayerJourney />

          {/* Quick Actions */}
          <Card title="Quick Actions" style={{ marginTop: '24px' }}>
            <Row gutter={16}>
              <Col span={6}>
                <Button 
                  type="primary" 
                  icon={<FireOutlined />}
                  block
                  onClick={() => handleGameResult(true)}
                >
                  Simulate Win
                </Button>
              </Col>
              <Col span={6}>
                <Button 
                  danger 
                  icon={<FireOutlined />}
                  block
                  onClick={() => handleGameResult(false)}
                >
                  Simulate Loss
                </Button>
              </Col>
              <Col span={6}>
                <Button 
                  icon={<StarOutlined />}
                  block
                  onClick={() => {
                    progressionService.addExperience(100);
                    alert('Added 100 XP!');
                  }}
                >
                  Add 100 XP
                </Button>
              </Col>
              <Col span={6}>
                <Button 
                  icon={<BookOutlined />}
                  block
                  onClick={() => {
                    progressionService.addEvent({
                      id: 'test_event',
                      title: 'Test Story Event',
                      description: 'This is a test story event to demonstrate the narrative system.',
                      type: 'achievement',
                      timestamp: new Date().toISOString(),
                      isRead: false,
                      impact: {
                        experience: 50
                      }
                    });
                    alert('Added test story event!');
                  }}
                >
                  Add Test Event
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Active Objectives */}
          <Card title="Active Objectives" style={{ marginTop: '24px' }}>
            <Row gutter={16}>
              {objectives.filter(obj => obj.isActive).map((objective) => (
                <Col span={8} key={objective.id}>
                  <Card 
                    size="small" 
                    title={objective.title}
                    extra={
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => handleStartObjective(objective.id)}
                      >
                        Start
                      </Button>
                    }
                  >
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      {objective.description}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#52c41a' }}>
                        Progress: {objective.progress}/{objective.maxProgress}
                      </span>
                      <span style={{ fontSize: '12px', color: '#1890ff' }}>
                        {objective.reward}
                      </span>
                    </div>
                    {objective.location && (
                      <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0' }}>
                        📍 {objective.location}
                      </p>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>

          {/* Recent Story Events */}
          <Card title="Recent Story Events" style={{ marginTop: '24px' }}>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {events.slice(0, 5).map((event) => (
                <Card 
                  key={event.id} 
                  size="small" 
                  style={{ 
                    marginBottom: '8px',
                    border: event.isRead ? '1px solid #d9d9d9' : '2px solid #1890ff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                        {event.title}
                        {!event.isRead && (
                          <span style={{ 
                            backgroundColor: '#1890ff', 
                            color: 'white', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            fontSize: '10px',
                            marginLeft: '8px'
                          }}>
                            NEW
                          </span>
                        )}
                      </h4>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>
                        {event.description}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#999' }}>
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          textTransform: 'capitalize'
                        }}>
                          {event.type === 'rival' && <FireOutlined style={{ color: '#ff4d4f' }} />}
                          {event.type === 'tournament' && <TrophyOutlined style={{ color: '#faad14' }} />}
                          {event.type === 'clan' && <TeamOutlined style={{ color: '#52c41a' }} />}
                          {event.type === 'achievement' && <StarOutlined style={{ color: '#1890ff' }} />}
                          {event.type === 'venue' && <CompassOutlined style={{ color: '#722ed1' }} />}
                          {event.type}
                        </span>
                        <span>{event.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </Content>

      <Footer style={{ 
        textAlign: 'center', 
        background: '#001529', 
        color: 'white',
        padding: '16px 24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>DojoPool - Story-Driven Pool Gaming</span>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
            <span>Level {playerStats.level}</span>
            <span>{playerStats.experience}/{playerStats.experienceToNext} XP</span>
            <span>{playerStats.achievements} Achievements</span>
          </div>
        </div>
      </Footer>
    </Layout>
  );
};

export default JourneyPage; 