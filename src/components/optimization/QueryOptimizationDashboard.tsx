import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface QueryAnalysis {
  slow_queries: {
    total: number;
    by_type: Record<string, number>;
    average_time: number;
    max_time: number;
  };
  table_stats: Record<
    string,
    {
      row_count: number;
      indexes: string[];
    }
  >;
}

interface QueryAnalysisResult {
  total_cost: number;
  total_time: number;
  operations: Array<{
    operation: string;
    cost: number;
    time: number;
  }>;
  suggestions: string[];
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
      id={`query-optimization-tabpanel-${index}`}
      aria-labelledby={`query-optimization-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function QueryOptimizationDashboard() {
  const [analysis, setAnalysis] = useState<QueryAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [query, setQuery] = useState("");
  const [analysisResult, setAnalysisResult] =
    useState<QueryAnalysisResult | null>(null);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/optimization/query");
      if (!response.ok) {
        throw new Error("Failed to fetch query analysis");
      }
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analysis");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAnalyzeQuery = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/optimization/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          action: "analyze",
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to analyze query");
      }
      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze query");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
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
      <Box sx={{ width: "100%", mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Query Optimization Dashboard
        </Typography>

        <Paper sx={{ width: "100%", mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="Query Analysis" />
            <Tab label="Table Statistics" />
            <Tab label="Query Analyzer" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Slow Queries Overview
                  </Typography>
                  <Typography>
                    Total Slow Queries: {analysis?.slow_queries.total}
                  </Typography>
                  <Typography>
                    Average Time:{" "}
                    {analysis?.slow_queries.average_time.toFixed(2)}ms
                  </Typography>
                  <Typography>
                    Max Time: {analysis?.slow_queries.max_time.toFixed(2)}ms
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Queries by Type
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(
                        analysis?.slow_queries.by_type || {},
                      ).map(([type, count]) => ({ type, count }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              {Object.entries(analysis?.table_stats || {}).map(
                ([table, stats]) => (
                  <Grid item xs={12} md={6} key={table}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {table}
                      </Typography>
                      <Typography>Row Count: {stats.row_count}</Typography>
                      <Typography variant="subtitle1" gutterBottom>
                        Indexes:
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {stats.indexes.map((index) => (
                          <Chip key={index} label={index} size="small" />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                ),
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Query Analyzer
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter SQL query to analyze"
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAnalyzeQuery}
                    disabled={!query}
                  >
                    Analyze Query
                  </Button>
                </Paper>
              </Grid>
              {analysisResult && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Analysis Results
                    </Typography>
                    <Typography>
                      Total Cost: {analysisResult.total_cost.toFixed(2)}
                    </Typography>
                    <Typography>
                      Total Time: {analysisResult.total_time.toFixed(2)}ms
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Operations:
                    </Typography>
                    <List>
                      {analysisResult.operations.map((op, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={op.operation}
                            secondary={`Cost: ${op.cost.toFixed(2)}, Time: ${op.time.toFixed(2)}ms`}
                          />
                        </ListItem>
                      ))}
                    </List>
                    {analysisResult.suggestions.length > 0 && (
                      <>
                        <Typography variant="subtitle1" gutterBottom>
                          Optimization Suggestions:
                        </Typography>
                        <List>
                          {analysisResult.suggestions.map(
                            (suggestion, index) => (
                              <ListItem key={index}>
                                <ListItemText primary={suggestion} />
                              </ListItem>
                            ),
                          )}
                        </List>
                      </>
                    )}
                  </Paper>
                </Grid>
              )}
            </Grid>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}
