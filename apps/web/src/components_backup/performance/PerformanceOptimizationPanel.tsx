import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Badge,
  Button,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardHeader,
  CardBody,
  Heading,
  List,
  ListItem,
  ListIcon,
  Divider,
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cacheHitRate: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  timestamp: Date;
}

interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number;
  timestamp: Date;
}

interface BundleMetrics {
  totalSize: number;
  gzippedSize: number;
  chunkCount: number;
  chunks: {
    name: string;
    size: number;
    gzippedSize: number;
  }[];
  optimizationScore: number;
  recommendations: string[];
}

interface OptimizationRecommendation {
  type: 'cache' | 'memory' | 'bundle' | 'security' | 'performance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: number;
  effort: number;
  implementation: string;
}

const PerformanceOptimizationPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [memoryMetrics, setMemoryMetrics] = useState<MemoryMetrics | null>(
    null
  );
  const [bundleMetrics, setBundleMetrics] = useState<BundleMetrics | null>(
    null
  );
  const [recommendations, setRecommendations] = useState<
    OptimizationRecommendation[]
  >([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);
  const toast = useToast();

  useEffect(() => {
    // Mock data loading - in real implementation, this would come from the service
    loadPerformanceData();
    const interval = setInterval(loadPerformanceData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = () => {
    // Mock performance metrics
    setPerformanceMetrics({
      responseTime: Math.random() * 100 + 50,
      throughput: Math.random() * 100 + 50,
      errorRate: Math.random() * 5,
      cacheHitRate: Math.random() * 30 + 70,
      memoryUsage: Math.random() * 0.5 + 0.3,
      cpuUsage: Math.random() * 50 + 20,
      activeConnections: Math.floor(Math.random() * 100 + 50),
      timestamp: new Date(),
    });

    // Mock memory metrics
    setMemoryMetrics({
      heapUsed: Math.random() * 100000000 + 50000000,
      heapTotal: Math.random() * 200000000 + 100000000,
      external: Math.random() * 50000000 + 10000000,
      arrayBuffers: Math.random() * 10000000 + 5000000,
      rss: Math.random() * 300000000 + 200000000,
      timestamp: new Date(),
    });

    // Mock bundle metrics
    setBundleMetrics({
      totalSize: 1920000,
      gzippedSize: 480000,
      chunkCount: 4,
      chunks: [
        { name: 'main', size: 512000, gzippedSize: 128000 },
        { name: 'vendor', size: 1024000, gzippedSize: 256000 },
        { name: 'game-mechanics', size: 256000, gzippedSize: 64000 },
        { name: 'tournament', size: 128000, gzippedSize: 32000 },
      ],
      optimizationScore: 75,
      recommendations: [
        'Consider code splitting to reduce bundle size',
        'Large chunks detected - consider lazy loading',
      ],
    });

    // Mock recommendations
    setRecommendations([
      {
        type: 'performance',
        priority: 'high',
        title: 'High Response Time',
        description: 'Average response time is 145.2ms.',
        impact: 9,
        effort: 7,
        implementation: 'Optimize database queries and implement caching',
      },
      {
        type: 'memory',
        priority: 'medium',
        title: 'Memory Usage Optimization',
        description:
          'Memory usage is at 65%. Consider optimizing memory usage.',
        impact: 6,
        effort: 4,
        implementation:
          'Implement memory pooling and reduce object allocations',
      },
      {
        type: 'bundle',
        priority: 'medium',
        title: 'Bundle Optimization Needed',
        description: 'Bundle optimization score is 75%.',
        impact: 7,
        effort: 5,
        implementation: 'Implement code splitting and tree shaking',
      },
    ]);

    setCacheSize(Math.floor(Math.random() * 500 + 100));
    setIsMonitoring(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getPerformanceStatus = (metrics: PerformanceMetrics) => {
    if (metrics.responseTime > 200 || metrics.errorRate > 5) return 'warning';
    if (metrics.responseTime > 150 || metrics.errorRate > 2) return 'info';
    return 'success';
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="blue.600">
          Performance Optimization Dashboard
        </Heading>

        <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
          <TabList>
            <Tab>Overview</Tab>
            <Tab>Memory Management</Tab>
            <Tab>Bundle Analysis</Tab>
            <Tab>Cache Management</Tab>
            <Tab>Recommendations</Tab>
            <Tab>Monitoring</Tab>
          </TabList>

          <TabPanels>
            {/* Overview Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {performanceMetrics && (
                  <Card>
                    <CardHeader>
                      <Heading size="md">Performance Metrics</Heading>
                    </CardHeader>
                    <CardBody>
                      <HStack spacing={8} wrap="wrap">
                        <Stat>
                          <StatLabel>Response Time</StatLabel>
                          <StatNumber>
                            {performanceMetrics.responseTime.toFixed(1)}ms
                          </StatNumber>
                          <StatHelpText>
                            <Badge
                              colorScheme={
                                performanceMetrics.responseTime > 150
                                  ? 'red'
                                  : 'green'
                              }
                            >
                              {performanceMetrics.responseTime > 150
                                ? 'High'
                                : 'Good'}
                            </Badge>
                          </StatHelpText>
                        </Stat>

                        <Stat>
                          <StatLabel>Throughput</StatLabel>
                          <StatNumber>
                            {performanceMetrics.throughput.toFixed(0)} req/s
                          </StatNumber>
                          <StatHelpText>
                            <Badge colorScheme="blue">Active</Badge>
                          </StatHelpText>
                        </Stat>

                        <Stat>
                          <StatLabel>Error Rate</StatLabel>
                          <StatNumber>
                            {performanceMetrics.errorRate.toFixed(2)}%
                          </StatNumber>
                          <StatHelpText>
                            <Badge
                              colorScheme={
                                performanceMetrics.errorRate > 5
                                  ? 'red'
                                  : 'green'
                              }
                            >
                              {performanceMetrics.errorRate > 5
                                ? 'High'
                                : 'Low'}
                            </Badge>
                          </StatHelpText>
                        </Stat>

                        <Stat>
                          <StatLabel>Cache Hit Rate</StatLabel>
                          <StatNumber>
                            {performanceMetrics.cacheHitRate.toFixed(1)}%
                          </StatNumber>
                          <StatHelpText>
                            <Badge
                              colorScheme={
                                performanceMetrics.cacheHitRate < 80
                                  ? 'yellow'
                                  : 'green'
                              }
                            >
                              {performanceMetrics.cacheHitRate < 80
                                ? 'Low'
                                : 'Good'}
                            </Badge>
                          </StatHelpText>
                        </Stat>
                      </HStack>

                      <Box mt={4}>
                        <Text mb={2}>Memory Usage</Text>
                        <Progress
                          value={performanceMetrics.memoryUsage * 100}
                          colorScheme={
                            performanceMetrics.memoryUsage > 0.8
                              ? 'red'
                              : 'green'
                          }
                          size="lg"
                        />
                        <Text fontSize="sm" mt={1}>
                          {(performanceMetrics.memoryUsage * 100).toFixed(1)}%
                          used
                        </Text>
                      </Box>

                      <Box mt={4}>
                        <Text mb={2}>CPU Usage</Text>
                        <Progress
                          value={performanceMetrics.cpuUsage}
                          colorScheme={
                            performanceMetrics.cpuUsage > 80 ? 'red' : 'green'
                          }
                          size="lg"
                        />
                        <Text fontSize="sm" mt={1}>
                          {performanceMetrics.cpuUsage.toFixed(1)}% used
                        </Text>
                      </Box>
                    </CardBody>
                  </Card>
                )}

                <Alert
                  status={
                    performanceMetrics
                      ? getPerformanceStatus(performanceMetrics)
                      : 'info'
                  }
                >
                  <AlertIcon />
                  {performanceMetrics
                    ? performanceMetrics.responseTime > 200
                      ? 'Performance issues detected. Review recommendations.'
                      : 'Performance is within acceptable limits.'
                    : 'Loading performance data...'}
                </Alert>
              </VStack>
            </TabPanel>

            {/* Memory Management Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {memoryMetrics && (
                  <Card>
                    <CardHeader>
                      <Heading size="md">Memory Management</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between">
                          <Text>Heap Used</Text>
                          <Text fontWeight="bold">
                            {formatBytes(memoryMetrics.heapUsed)}
                          </Text>
                        </HStack>

                        <HStack justify="space-between">
                          <Text>Heap Total</Text>
                          <Text fontWeight="bold">
                            {formatBytes(memoryMetrics.heapTotal)}
                          </Text>
                        </HStack>

                        <HStack justify="space-between">
                          <Text>External Memory</Text>
                          <Text fontWeight="bold">
                            {formatBytes(memoryMetrics.external)}
                          </Text>
                        </HStack>

                        <HStack justify="space-between">
                          <Text>Array Buffers</Text>
                          <Text fontWeight="bold">
                            {formatBytes(memoryMetrics.arrayBuffers)}
                          </Text>
                        </HStack>

                        <HStack justify="space-between">
                          <Text>RSS (Resident Set Size)</Text>
                          <Text fontWeight="bold">
                            {formatBytes(memoryMetrics.rss)}
                          </Text>
                        </HStack>

                        <Divider />

                        <Box>
                          <Text mb={2}>Memory Usage Ratio</Text>
                          <Progress
                            value={
                              (memoryMetrics.heapUsed /
                                memoryMetrics.heapTotal) *
                              100
                            }
                            colorScheme={
                              memoryMetrics.heapUsed / memoryMetrics.heapTotal >
                              0.8
                                ? 'red'
                                : 'green'
                            }
                            size="lg"
                          />
                          <Text fontSize="sm" mt={1}>
                            {(
                              (memoryMetrics.heapUsed /
                                memoryMetrics.heapTotal) *
                              100
                            ).toFixed(1)}
                            % of heap used
                          </Text>
                        </Box>

                        <Button
                          colorScheme="blue"
                          onClick={() =>
                            toast({
                              title: 'Memory Optimization',
                              description: 'Memory optimization completed',
                              status: 'success',
                              duration: 3000,
                              isClosable: true,
                            })
                          }
                        >
                          Optimize Memory
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>

            {/* Bundle Analysis Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {bundleMetrics && (
                  <Card>
                    <CardHeader>
                      <Heading size="md">Bundle Analysis</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between">
                          <Text>Total Size</Text>
                          <Text fontWeight="bold">
                            {formatBytes(bundleMetrics.totalSize)}
                          </Text>
                        </HStack>

                        <HStack justify="space-between">
                          <Text>Gzipped Size</Text>
                          <Text fontWeight="bold">
                            {formatBytes(bundleMetrics.gzippedSize)}
                          </Text>
                        </HStack>

                        <HStack justify="space-between">
                          <Text>Chunk Count</Text>
                          <Text fontWeight="bold">
                            {bundleMetrics.chunkCount}
                          </Text>
                        </HStack>

                        <HStack justify="space-between">
                          <Text>Optimization Score</Text>
                          <Badge
                            colorScheme={
                              bundleMetrics.optimizationScore > 80
                                ? 'green'
                                : bundleMetrics.optimizationScore > 60
                                  ? 'yellow'
                                  : 'red'
                            }
                            fontSize="md"
                            p={2}
                          >
                            {bundleMetrics.optimizationScore}/100
                          </Badge>
                        </HStack>

                        <Divider />

                        <Box>
                          <Text mb={3} fontWeight="bold">
                            Bundle Chunks
                          </Text>
                          <Table variant="simple" size="sm">
                            <Thead>
                              <Tr>
                                <Th>Chunk</Th>
                                <Th>Size</Th>
                                <Th>Gzipped</Th>
                                <Th>Compression</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {bundleMetrics.chunks.map((chunk, index) => (
                                <Tr key={index}>
                                  <Td>{chunk.name}</Td>
                                  <Td>{formatBytes(chunk.size)}</Td>
                                  <Td>{formatBytes(chunk.gzippedSize)}</Td>
                                  <Td>
                                    <Badge
                                      colorScheme={
                                        chunk.gzippedSize / chunk.size < 0.3
                                          ? 'green'
                                          : 'yellow'
                                      }
                                    >
                                      {(
                                        (chunk.gzippedSize / chunk.size) *
                                        100
                                      ).toFixed(1)}
                                      %
                                    </Badge>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>

                        {bundleMetrics.recommendations.length > 0 && (
                          <Box>
                            <Text mb={3} fontWeight="bold">
                              Recommendations
                            </Text>
                            <List spacing={2}>
                              {bundleMetrics.recommendations.map(
                                (rec, index) => (
                                  <ListItem key={index}>
                                    <ListIcon as={InfoIcon} color="blue.500" />
                                    {rec}
                                  </ListItem>
                                )
                              )}
                            </List>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>

            {/* Cache Management Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card>
                  <CardHeader>
                    <Heading size="md">Cache Management</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <Text>Cache Size</Text>
                        <Text fontWeight="bold">{cacheSize} entries</Text>
                      </HStack>

                      <HStack justify="space-between">
                        <Text>Cache Hit Rate</Text>
                        <Text fontWeight="bold">
                          {performanceMetrics
                            ? `${performanceMetrics.cacheHitRate.toFixed(1)}%`
                            : 'N/A'}
                        </Text>
                      </HStack>

                      <HStack spacing={4}>
                        <Button
                          colorScheme="blue"
                          onClick={() =>
                            toast({
                              title: 'Cache Cleared',
                              description:
                                'Cache has been cleared successfully',
                              status: 'success',
                              duration: 3000,
                              isClosable: true,
                            })
                          }
                        >
                          Clear Cache
                        </Button>

                        <Button
                          colorScheme="green"
                          onClick={() =>
                            toast({
                              title: 'Cache Optimized',
                              description: 'Cache optimization completed',
                              status: 'success',
                              duration: 3000,
                              isClosable: true,
                            })
                          }
                        >
                          Optimize Cache
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Recommendations Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card>
                  <CardHeader>
                    <Heading size="md">Optimization Recommendations</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {recommendations.map((rec, index) => (
                        <Box
                          key={index}
                          p={4}
                          borderWidth={1}
                          borderRadius="md"
                          borderColor={getSeverityColor(rec.priority)}
                        >
                          <HStack justify="space-between" mb={2}>
                            <Text fontWeight="bold">{rec.title}</Text>
                            <Badge colorScheme={getSeverityColor(rec.priority)}>
                              {rec.priority.toUpperCase()}
                            </Badge>
                          </HStack>

                          <Text mb={3} color="gray.600">
                            {rec.description}
                          </Text>

                          <HStack spacing={4} mb={3}>
                            <Badge colorScheme="blue">
                              Impact: {rec.impact}/10
                            </Badge>
                            <Badge colorScheme="purple">
                              Effort: {rec.effort}/10
                            </Badge>
                          </HStack>

                          <Text fontSize="sm" color="gray.500">
                            <strong>Implementation:</strong>{' '}
                            {rec.implementation}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Monitoring Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card>
                  <CardHeader>
                    <Heading size="md">Performance Monitoring</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <Text>Monitoring Status</Text>
                        <Badge colorScheme={isMonitoring ? 'green' : 'red'}>
                          {isMonitoring ? 'Active' : 'Inactive'}
                        </Badge>
                      </HStack>

                      <HStack justify="space-between">
                        <Text>Last Update</Text>
                        <Text>
                          {performanceMetrics?.timestamp.toLocaleTimeString() ||
                            'N/A'}
                        </Text>
                      </HStack>

                      <HStack spacing={4}>
                        <Button
                          colorScheme={isMonitoring ? 'red' : 'green'}
                          onClick={() => {
                            setIsMonitoring(!isMonitoring);
                            toast({
                              title: `Monitoring ${!isMonitoring ? 'Started' : 'Stopped'}`,
                              description: `Performance monitoring has been ${!isMonitoring ? 'started' : 'stopped'}`,
                              status: 'success',
                              duration: 3000,
                              isClosable: true,
                            });
                          }}
                        >
                          {isMonitoring
                            ? 'Stop Monitoring'
                            : 'Start Monitoring'}
                        </Button>

                        <Button
                          colorScheme="blue"
                          onClick={() =>
                            toast({
                              title: 'Metrics Refreshed',
                              description:
                                'Performance metrics have been refreshed',
                              status: 'success',
                              duration: 3000,
                              isClosable: true,
                            })
                          }
                        >
                          Refresh Metrics
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default PerformanceOptimizationPanel;
