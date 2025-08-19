import React, { useState } from 'react';
import { useAdvancedVenueManagement } from '../../hooks/useAdvancedVenueManagement';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AdvancedVenueManagementDashboard: React.FC = () => {
  const {
    config,
    metrics,
    performances,
    topVenues,
    isLoading,
    error,
    getConfig,
    updateConfig,
    getMetrics,
    getAllPerformances,
    getVenuePerformance,
    updateVenuePerformance,
    getTopPerformingVenues,
    generateVenueAnalytics,
    getVenueAnalytics,
    updateTablePerformance,
    getTablePerformances,
    addMaintenanceRecord,
    updatePlayerEngagement,
    getPlayerEngagements,
    generateRevenueAnalytics,
    getRevenueAnalytics,
    generateVenueOptimization,
    getVenueOptimizations,
    clearError,
  } = useAdvancedVenueManagement();

  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [optimizationData, setOptimizationData] = useState<any>(null);

  const handleVenueSelect = async (venueId: string) => {
    setSelectedVenue(venueId);

    // Load venue-specific data
    const [analytics, tables, engagements, revenue, optimizations] =
      await Promise.all([
        getVenueAnalytics(venueId),
        getTablePerformances(venueId),
        getPlayerEngagements(venueId),
        getRevenueAnalytics(venueId),
        getVenueOptimizations(venueId),
      ]);

    setAnalyticsData(analytics[0] || null);
    setTableData(tables);
    setEngagementData(engagements);
    setRevenueData(revenue[0] || null);
    setOptimizationData(optimizations[0] || null);
  };

  const handleGenerateAnalytics = async () => {
    if (!selectedVenue) return;

    const analytics = await generateVenueAnalytics(
      selectedVenue,
      'monthly',
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );

    if (analytics) {
      setAnalyticsData(analytics);
    }
  };

  const handleGenerateOptimization = async () => {
    if (!selectedVenue) return;

    const optimization = await generateVenueOptimization(selectedVenue);

    if (optimization) {
      setOptimizationData(optimization);
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading venue management data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mb-4">
        <AlertDescription>
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={clearError}
            className="ml-2"
          >
            Dismiss
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          Advanced Venue Management & Analytics
        </h1>
        <div className="flex gap-2">
          <Button onClick={getMetrics} disabled={isLoading}>
            Refresh Metrics
          </Button>
          <Button onClick={getAllPerformances} disabled={isLoading}>
            Refresh Performances
          </Button>
        </div>
      </div>

      {/* System Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Venues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalVenues}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeVenues} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: ${metrics.averageRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.averageUtilization.toFixed(1)}%
              </div>
              <Progress value={metrics.averageUtilization} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.averageRating.toFixed(1)}/5
              </div>
              <p className="text-xs text-muted-foreground">
                Last updated:{' '}
                {new Date(metrics.lastActivity).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Venue Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Venue Selection</CardTitle>
          <CardDescription>
            Select a venue to view detailed analytics and management options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performances.map((venue) => (
              <Card
                key={venue.venueId}
                className={`cursor-pointer transition-colors ${
                  selectedVenue === venue.venueId ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleVenueSelect(venue.venueId)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{venue.venueName}</CardTitle>
                  <CardDescription>Venue ID: {venue.venueId}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Revenue:</span>
                      <span className="font-semibold">
                        ${venue.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilization:</span>
                      <span className="font-semibold">
                        {venue.tableUtilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <span className="font-semibold">
                        {venue.averageRating.toFixed(1)}/5
                      </span>
                    </div>
                    <Badge
                      variant={
                        venue.playerEngagement > 80 ? 'default' : 'secondary'
                      }
                    >
                      {venue.playerEngagement.toFixed(1)}% Engagement
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      {selectedVenue && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="tables">Table Performance</TabsTrigger>
            <TabsTrigger value="engagement">Player Engagement</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Venue Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {performances.find((v) => v.venueId === selectedVenue) && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Matches
                          </p>
                          <p className="text-2xl font-bold">
                            {
                              performances.find(
                                (v) => v.venueId === selectedVenue
                              )?.totalMatches
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Players
                          </p>
                          <p className="text-2xl font-bold">
                            {
                              performances.find(
                                (v) => v.venueId === selectedVenue
                              )?.totalPlayers
                            }
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Peak Hours
                        </p>
                        <div className="flex gap-1 mt-1">
                          {performances
                            .find((v) => v.venueId === selectedVenue)
                            ?.peakHours.map((hour, i) => (
                              <Badge key={i} variant="outline">
                                {hour}
                              </Badge>
                            ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Popular Game Types
                        </p>
                        <div className="flex gap-1 mt-1">
                          {performances
                            .find((v) => v.venueId === selectedVenue)
                            ?.popularGameTypes.map((type, i) => (
                              <Badge key={i} variant="secondary">
                                {type}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  {performances.find((v) => v.venueId === selectedVenue) && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Table Utilization</span>
                          <span>
                            {performances
                              .find((v) => v.venueId === selectedVenue)
                              ?.tableUtilization.toFixed(1)}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            performances.find(
                              (v) => v.venueId === selectedVenue
                            )?.tableUtilization
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Player Engagement</span>
                          <span>
                            {performances
                              .find((v) => v.venueId === selectedVenue)
                              ?.playerEngagement.toFixed(1)}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            performances.find(
                              (v) => v.venueId === selectedVenue
                            )?.playerEngagement
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Customer Rating</span>
                          <span>
                            {performances
                              .find((v) => v.venueId === selectedVenue)
                              ?.averageRating.toFixed(1)}
                            /5
                          </span>
                        </div>
                        <Progress
                          value={
                            (performances.find(
                              (v) => v.venueId === selectedVenue
                            )?.averageRating || 0) * 20
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Venue Analytics</h3>
              <Button onClick={handleGenerateAnalytics} disabled={isLoading}>
                Generate Analytics
              </Button>
            </div>

            {analyticsData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Revenue
                          </p>
                          <p className="text-xl font-bold">
                            $
                            {analyticsData.metrics.totalRevenue.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Matches
                          </p>
                          <p className="text-xl font-bold">
                            {analyticsData.metrics.totalMatches}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Unique Players
                          </p>
                          <p className="text-xl font-bold">
                            {analyticsData.metrics.uniquePlayers}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Utilization Rate
                          </p>
                          <p className="text-xl font-bold">
                            {analyticsData.metrics.tableUtilizationRate.toFixed(
                              1
                            )}
                            %
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Revenue Growth
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          +{analyticsData.trends.revenue.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Player Growth
                        </p>
                        <p className="text-xl font-bold text-blue-600">
                          +{analyticsData.trends.playerGrowth.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Engagement Trend
                        </p>
                        <p className="text-xl font-bold text-purple-600">
                          +{analyticsData.trends.engagement.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Insights & Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Insights</h4>
                        <ul className="space-y-1">
                          {analyticsData.insights.map(
                            (insight: string, i: number) => (
                              <li
                                key={i}
                                className="text-sm text-muted-foreground"
                              >
                                • {insight}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                          {analyticsData.recommendations.map(
                            (rec: string, i: number) => (
                              <li
                                key={i}
                                className="text-sm text-muted-foreground"
                              >
                                • {rec}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tables" className="space-y-4">
            <h3 className="text-lg font-semibold">Table Performance</h3>

            {tableData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tableData.map((table) => (
                  <Card key={table.tableId}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        {table.tableNumber}
                        <Badge
                          variant={
                            table.status === 'active' ? 'default' : 'secondary'
                          }
                        >
                          {table.status}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Matches:</span>
                          <span className="font-semibold">
                            {table.totalMatches}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Utilization:</span>
                          <span className="font-semibold">
                            {table.utilizationRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Revenue:</span>
                          <span className="font-semibold">
                            ${table.revenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rating:</span>
                          <span className="font-semibold">
                            {table.averageRating.toFixed(1)}/5
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Last maintenance:{' '}
                            {new Date(
                              table.lastMaintenance
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No table data available
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4">
            <h3 className="text-lg font-semibold">Player Engagement</h3>

            {engagementData.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {engagementData.slice(0, 9).map((engagement) => (
                    <Card key={engagement.playerId}>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Player {engagement.playerId}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Visits:</span>
                            <span className="font-semibold">
                              {engagement.totalVisits}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Matches:</span>
                            <span className="font-semibold">
                              {engagement.totalMatches}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Spent:</span>
                            <span className="font-semibold">
                              ${engagement.totalSpent}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Engagement:</span>
                            <span className="font-semibold">
                              {engagement.engagementScore.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={engagement.engagementScore}
                            className="mt-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No engagement data available
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <h3 className="text-lg font-semibold">Revenue Analysis</h3>

            {revenueData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(revenueData.revenueBySource).map(
                            ([key, value]) => ({
                              name: key
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, (str) => str.toUpperCase()),
                              value,
                            })
                          )}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(revenueData.revenueBySource).map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Revenue
                        </p>
                        <p className="text-2xl font-bold">
                          ${revenueData.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Growth Rate
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          +{revenueData.growthRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Top Revenue Drivers
                        </p>
                        <div className="flex gap-1 mt-1">
                          {revenueData.topRevenueDrivers.map((driver, i) => (
                            <Badge key={i} variant="outline">
                              {driver}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Venue Optimization</h3>
              <Button onClick={handleGenerateOptimization} disabled={isLoading}>
                Generate Optimization
              </Button>
            </div>

            {optimizationData && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      Optimization Recommendations
                      <Badge
                        variant={
                          optimizationData.priority === 'critical'
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        {optimizationData.priority} Priority
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {optimizationData.recommendations.map((rec) => (
                        <Card key={rec.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold">{rec.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {rec.description}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{rec.category}</Badge>
                                <Badge variant="secondary">
                                  {rec.difficulty}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                ${rec.cost.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {rec.implementationTime} days
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">
                                Revenue
                              </p>
                              <p className="text-sm font-semibold text-green-600">
                                +{rec.impact.revenue}%
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">
                                Efficiency
                              </p>
                              <p className="text-sm font-semibold text-blue-600">
                                +{rec.impact.efficiency}%
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">
                                Satisfaction
                              </p>
                              <p className="text-sm font-semibold text-purple-600">
                                +{rec.impact.satisfaction}%
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expected Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Revenue Increase
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          $
                          {optimizationData.expectedImpact.revenueIncrease.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Efficiency Gain
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          +
                          {optimizationData.expectedImpact.efficiencyGain.toFixed(
                            1
                          )}
                          %
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Customer Satisfaction
                        </p>
                        <p className="text-2xl font-bold text-purple-600">
                          +
                          {optimizationData.expectedImpact.customerSatisfaction.toFixed(
                            1
                          )}
                          %
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Configuration Panel */}
      {config && (
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>
              Configure venue management system settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Features</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="realTimeTracking"
                      checked={config.realTimeTracking}
                      onChange={(e) =>
                        updateConfig({ realTimeTracking: e.target.checked })
                      }
                    />
                    <label htmlFor="realTimeTracking">Real-time Tracking</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="performanceAnalytics"
                      checked={config.performanceAnalytics}
                      onChange={(e) =>
                        updateConfig({ performanceAnalytics: e.target.checked })
                      }
                    />
                    <label htmlFor="performanceAnalytics">
                      Performance Analytics
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="revenueTracking"
                      checked={config.revenueTracking}
                      onChange={(e) =>
                        updateConfig({ revenueTracking: e.target.checked })
                      }
                    />
                    <label htmlFor="revenueTracking">Revenue Tracking</label>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Settings</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm">Update Interval (ms)</label>
                    <input
                      type="number"
                      value={config.updateInterval}
                      onChange={(e) =>
                        updateConfig({
                          updateInterval: parseInt(e.target.value),
                        })
                      }
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-sm">Retention Period (days)</label>
                    <input
                      type="number"
                      value={config.retentionPeriod / (24 * 60 * 60 * 1000)}
                      onChange={(e) =>
                        updateConfig({
                          retentionPeriod:
                            parseInt(e.target.value) * 24 * 60 * 60 * 1000,
                        })
                      }
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
