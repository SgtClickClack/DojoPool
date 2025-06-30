import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/hooks/useAuth';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../src/components/ui/card';
import { Button } from '../src/components/ui/button';
import { Badge } from '../src/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  Trophy, 
  MapPin, 
  BarChart3, 
  Mic, 
  Shield, 
  Settings,
  Activity,
  Target,
  DollarSign,
  MessageSquare,
  Video,
  Award,
  Zap
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [systemStatus, setSystemStatus] = useState({
    analytics: true,
    aiCommentary: true,
    venueManagement: true,
    aiReferee: true,
    socialCommunity: true,
    playerAnalytics: true,
    diception: true
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const systemCards = [
    {
      title: 'Advanced Analytics',
      description: 'Comprehensive platform analytics and insights',
      icon: <BarChart3 className="w-8 h-8" />,
      status: systemStatus.analytics,
      href: '/advanced-analytics',
      color: 'bg-blue-500',
      features: ['Trend Analysis', 'Performance Metrics', 'Predictive Insights']
    },
    {
      title: 'AI Match Commentary',
      description: 'AI-powered match commentary and highlights',
      icon: <Mic className="w-8 h-8" />,
      status: systemStatus.aiCommentary,
      href: '/advanced-ai-match-commentary-highlights',
      color: 'bg-purple-500',
      features: ['Live Commentary', 'Video Highlights', 'Multi-Voice Synthesis']
    },
    {
      title: 'Venue Management',
      description: 'Advanced venue analytics and management',
      icon: <MapPin className="w-8 h-8" />,
      status: systemStatus.venueManagement,
      href: '/advanced-venue-management',
      color: 'bg-green-500',
      features: ['Performance Tracking', 'Revenue Analytics', 'Table Management']
    },
    {
      title: 'AI Referee System',
      description: 'AI-powered rule enforcement and decisions',
      icon: <Shield className="w-8 h-8" />,
      status: systemStatus.aiReferee,
      href: '/advanced-ai-referee-rule-enforcement',
      color: 'bg-red-500',
      features: ['Rule Interpretation', 'Foul Detection', 'Strategy Analysis']
    },
    {
      title: 'Social Community',
      description: 'Advanced social networking and engagement',
      icon: <MessageSquare className="w-8 h-8" />,
      status: systemStatus.socialCommunity,
      href: '/advanced-social-community',
      color: 'bg-pink-500',
      features: ['Community Posts', 'Leaderboards', 'Event Management']
    },
    {
      title: 'Player Analytics',
      description: 'Comprehensive player performance tracking',
      icon: <Users className="w-8 h-8" />,
      status: systemStatus.playerAnalytics,
      href: '/advanced-player-analytics',
      color: 'bg-indigo-500',
      features: ['Skill Analysis', 'Progression Tracking', 'Performance Insights']
    },
    {
      title: 'Diception AI',
      description: 'Real-time ball tracking and match analysis',
      icon: <Target className="w-8 h-8" />,
      status: systemStatus.diception,
      href: '/diception-test',
      color: 'bg-orange-500',
      features: ['Ball Tracking', 'Shot Detection', 'AI Commentary']
    }
  ];

  const quickStats = [
    {
      title: 'Active Players',
      value: '1,247',
      change: '+12%',
      icon: <Users className="w-4 h-4" />,
      color: 'text-blue-600'
    },
    {
      title: 'Total Matches',
      value: '8,934',
      change: '+8%',
      icon: <Trophy className="w-4 h-4" />,
      color: 'text-green-600'
    },
    {
      title: 'Revenue',
      value: '$125K',
      change: '+15%',
      icon: <DollarSign className="w-4 h-4" />,
      color: 'text-purple-600'
    },
    {
      title: 'System Health',
      value: '98%',
      change: '+2%',
      icon: <Activity className="w-4 h-4" />,
      color: 'text-orange-600'
    }
  ];

  return (
    <>
      <Head>
        <title>DojoPool Dashboard - Advanced Gaming Platform</title>
        <meta name="description" content="Comprehensive dashboard for DojoPool advanced gaming platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎯 DojoPool Advanced Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Welcome back, {user?.displayName || user?.email}! All systems are operational and ready.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-full ${stat.color} bg-opacity-10`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">{stat.change}</span>
                    <span className="text-sm text-gray-500 ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* System Status Overview */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">System Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {systemCards.map((system, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-4">
                    <div className={`${system.color} text-white p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center`}>
                      {system.icon}
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{system.title}</h3>
                    <Badge variant={system.status ? "default" : "destructive"} className="text-xs">
                      {system.status ? 'Operational' : 'Offline'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Main System Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {systemCards.map((system, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`${system.color} text-white p-2 rounded-lg`}>
                        {system.icon}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{system.title}</CardTitle>
                        <p className="text-sm text-gray-600">{system.description}</p>
                      </div>
                    </div>
                    <Badge variant={system.status ? "default" : "destructive"}>
                      {system.status ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {system.features.map((feature, featureIndex) => (
                        <Badge key={featureIndex} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      onClick={() => router.push(system.href)}
                      className="w-full"
                      disabled={!system.status}
                    >
                      Access {system.title}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => router.push('/diception-test')}
                className="h-16 text-lg"
                variant="outline"
              >
                <Target className="w-5 h-5 mr-2" />
                Test Diception AI
              </Button>
              <Button 
                onClick={() => router.push('/advanced-social-community')}
                className="h-16 text-lg"
                variant="outline"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                View Community
              </Button>
              <Button 
                onClick={() => router.push('/advanced-analytics')}
                className="h-16 text-lg"
                variant="outline"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                View Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard; 