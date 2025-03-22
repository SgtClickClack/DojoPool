import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardMedia,
  CardContent
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ImageAnalysis {
  total_images: number;
  total_size: number;
  average_size: number;
  format_distribution: Record<string, number>;
  optimization_suggestions: string[];
}

interface ImageMetrics {
  original_size: number;
  optimized_size: number;
  reduction_percentage: number;
  format: string;
  dimensions: [number, number];
  quality: number;
}

interface ResponsiveImage {
  bytes: string;
  size: number;
  dimensions: [number, number];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`image-optimization-tabpanel-${index}`}
      aria-labelledby={`image-optimization-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ImageOptimizationDashboard() {
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [imagePath, setImagePath] = useState('');
  const [targetFormat, setTargetFormat] = useState('WebP');
  const [maxWidth, setMaxWidth] = useState(1920);
  const [maxHeight, setMaxHeight] = useState(1080);
  const [quality, setQuality] = useState(85);
  const [optimizedImage, setOptimizedImage] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ImageMetrics | null>(null);
  const [responsiveImages, setResponsiveImages] = useState<Record<string, ResponsiveImage> | null>(null);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/optimization/image');
      if (!response.ok) {
        throw new Error('Failed to fetch image analysis');
      }
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOptimizeImage = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/optimization/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'optimize_image',
          data: {
            image_path: imagePath,
            target_format: targetFormat,
            max_width: maxWidth,
            max_height: maxHeight,
            quality: quality
          }
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to optimize image');
      }
      const data = await response.json();
      setOptimizedImage(data.image);
      setMetrics(data.metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize image');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResponsive = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/optimization/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_responsive',
          data: {
            image_path: imagePath,
            sizes: [
              [640, 480],
              [1024, 768],
              [1920, 1080]
            ]
          }
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate responsive images');
      }
      const data = await response.json();
      setResponsiveImages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate responsive images');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: '100%', mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Image Optimization Dashboard
        </Typography>

        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="Image Analysis" />
            <Tab label="Image Optimizer" />
            <Tab label="Responsive Images" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Image Overview
                  </Typography>
                  <Typography>
                    Total Images: {analysis?.total_images}
                  </Typography>
                  <Typography>
                    Total Size: {(analysis?.total_size / (1024 * 1024)).toFixed(2)} MB
                  </Typography>
                  <Typography>
                    Average Size: {(analysis?.average_size / 1024).toFixed(2)} KB
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Format Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(analysis?.format_distribution || {}).map(([name, value]) => ({
                          name,
                          value
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {Object.entries(analysis?.format_distribution || {}).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Image Optimizer
                  </Typography>
                  <TextField
                    fullWidth
                    value={imagePath}
                    onChange={(e) => setImagePath(e.target.value)}
                    placeholder="Enter image path"
                    sx={{ mb: 2 }}
                  />
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Target Format</InputLabel>
                    <Select
                      value={targetFormat}
                      onChange={(e) => setTargetFormat(e.target.value)}
                      label="Target Format"
                    >
                      <MenuItem value="JPEG">JPEG</MenuItem>
                      <MenuItem value="PNG">PNG</MenuItem>
                      <MenuItem value="WebP">WebP</MenuItem>
                      <MenuItem value="AVIF">AVIF</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography gutterBottom>
                    Max Width: {maxWidth}px
                  </Typography>
                  <Slider
                    value={maxWidth}
                    onChange={(_, value) => setMaxWidth(value as number)}
                    min={100}
                    max={3840}
                    step={100}
                    valueLabelDisplay="auto"
                    sx={{ mb: 2 }}
                  />
                  <Typography gutterBottom>
                    Max Height: {maxHeight}px
                  </Typography>
                  <Slider
                    value={maxHeight}
                    onChange={(_, value) => setMaxHeight(value as number)}
                    min={100}
                    max={2160}
                    step={100}
                    valueLabelDisplay="auto"
                    sx={{ mb: 2 }}
                  />
                  <Typography gutterBottom>
                    Quality: {quality}%
                  </Typography>
                  <Slider
                    value={quality}
                    onChange={(_, value) => setQuality(value as number)}
                    min={1}
                    max={100}
                    step={1}
                    valueLabelDisplay="auto"
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleOptimizeImage}
                    disabled={!imagePath}
                  >
                    Optimize Image
                  </Button>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                {optimizedImage && metrics && (
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Optimization Results
                    </Typography>
                    <Card sx={{ mb: 2 }}>
                      <CardMedia
                        component="img"
                        height="300"
                        image={`data:image/${targetFormat.toLowerCase()};base64,${optimizedImage}`}
                        alt="Optimized image"
                      />
                      <CardContent>
                        <Typography>
                          Original Size: {(metrics.original_size / 1024).toFixed(2)} KB
                        </Typography>
                        <Typography>
                          Optimized Size: {(metrics.optimized_size / 1024).toFixed(2)} KB
                        </Typography>
                        <Typography>
                          Reduction: {metrics.reduction_percentage.toFixed(1)}%
                        </Typography>
                        <Typography>
                          Dimensions: {metrics.dimensions[0]}x{metrics.dimensions[1]}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Paper>
                )}
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Responsive Images
                  </Typography>
                  <TextField
                    fullWidth
                    value={imagePath}
                    onChange={(e) => setImagePath(e.target.value)}
                    placeholder="Enter image path"
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleGenerateResponsive}
                    disabled={!imagePath}
                    sx={{ mb: 2 }}
                  >
                    Generate Responsive Images
                  </Button>
                  {responsiveImages && (
                    <Grid container spacing={2}>
                      {Object.entries(responsiveImages).map(([size, image]) => (
                        <Grid item xs={12} md={4} key={size}>
                          <Card>
                            <CardMedia
                              component="img"
                              height="200"
                              image={`data:image/${targetFormat.toLowerCase()};base64,${image.bytes}`}
                              alt={`${size} responsive image`}
                            />
                            <CardContent>
                              <Typography>
                                Size: {(image.size / 1024).toFixed(2)} KB
                              </Typography>
                              <Typography>
                                Dimensions: {image.dimensions[0]}x{image.dimensions[1]}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
} 