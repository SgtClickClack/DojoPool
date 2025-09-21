import React from 'react';
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  CircularProgress,
  Pagination,
  Snackbar,
  Alert,
  Container,
  Grid,
  Box,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  Drawer,
  AppBar,
  Toolbar,
  CssBaseline,
  ThemeProvider,
  createTheme,
  styled,
} from '@mui/material';
import { DatePicker, TimePicker, DateTimePicker } from '@mui/x-date-pickers';
import {
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  ScatterChart,
  RadarChart,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  Scatter,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { Map } from '@vis.gl/react-maplibre';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Theme configuration
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

// Styled components
export const StyledButton = styled(Button)(({ _theme }) => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
}));

export const StyledCard = styled(Card)(({ _theme }) => ({
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  transition: 'box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  },
}));

export const StyledTextField = styled(TextField)(({ _theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
  },
}));

// Common component patterns
export const LoadingButton = ({ loading, children, ...props }) => (
  <Button
    {...props}
    disabled={loading || props.disabled}
    startIcon={loading ? <CircularProgress size={20} /> : props.startIcon}
  >
    {children}
  </Button>
);

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  content,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Typography>{content}</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>{cancelText}</Button>
      <Button onClick={onConfirm} variant="contained" color="primary">
        {confirmText}
      </Button>
    </DialogActions>
  </Dialog>
);

export const DataTable = ({
  columns,
  data,
  loading = false,
  pagination = null,
  onRowClick = null,
}) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          {columns.map((column) => (
            <TableCell key={column.key} align={column.align || 'left'}>
              {column.title}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={columns.length} align="center">
              <CircularProgress />
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, index) => (
            <TableRow
              key={row.id || index}
              hover
              onClick={() => onRowClick?.(row)}
              sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align || 'left'}>
                  {column.render
                    ? column.render(row[column.dataIndex], row)
                    : row[column.dataIndex]}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
    {pagination && (
      <Box display="flex" justifyContent="center" p={2}>
        <Pagination
          count={pagination.totalPages}
          page={pagination.currentPage}
          onChange={pagination.onChange}
          color="primary"
        />
      </Box>
    )}
  </TableContainer>
);

export const ChartContainer = ({ children, title, height = 400 }) => (
  <StyledCard>
    {title && <CardHeader title={title} />}
    <CardContent>
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </CardContent>
  </StyledCard>
);

export const LineChartComponent = ({
  data,
  title,
  height = 400,
  dataKey = 'value',
  nameKey = 'name',
}) => (
  <ChartContainer title={title} height={height}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={nameKey} />
      <YAxis />
      <RechartsTooltip />
      <Legend />
      <Line
        type="monotone"
        dataKey={dataKey}
        stroke="#8884d8"
        strokeWidth={2}
      />
    </LineChart>
  </ChartContainer>
);

export const BarChartComponent = ({
  data,
  title,
  height = 400,
  dataKey = 'value',
  nameKey = 'name',
}) => (
  <ChartContainer title={title} height={height}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={nameKey} />
      <YAxis />
      <RechartsTooltip />
      <Legend />
      <Bar dataKey={dataKey} fill="#8884d8" />
    </BarChart>
  </ChartContainer>
);

export const PieChartComponent = ({
  data,
  title,
  height = 400,
  dataKey = 'value',
  _nameKey = 'name',
}) => (
  <ChartContainer title={title} height={height}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        outerRadius={80}
        fill="#8884d8"
        dataKey={dataKey}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
        ))}
      </Pie>
      <RechartsTooltip />
      <Legend />
    </PieChart>
  </ChartContainer>
);

export const MapComponent = ({
  initialViewState,
  style = { width: '100%', height: '400px' },
  children,
  ...props
}) => (
  <Map initialViewState={initialViewState} style={style} {...props}>
    {children}
  </Map>
);

// Form components
export const FormField = ({ label, error, helperText, ...props }) => (
  <FormControl fullWidth error={!!error}>
    {label && <InputLabel>{label}</InputLabel>}
    <Select {...props}>{props.children}</Select>
    {helperText && (
      <Typography variant="caption" color="error">
        {helperText}
      </Typography>
    )}
  </FormControl>
);

export const TextInput = ({ label, error, helperText, ...props }) => (
  <StyledTextField
    fullWidth
    label={label}
    error={!!error}
    helperText={helperText || error}
    {...props}
  />
);

export const DateInput = ({
  label,
  value,
  onChange,
  error,
  helperText,
  ...props
}) => (
  <DatePicker
    label={label}
    value={value}
    onChange={onChange}
    renderInput={(params) => (
      <StyledTextField
        {...params}
        fullWidth
        error={!!error}
        helperText={helperText || error}
      />
    )}
    {...props}
  />
);

export const TimeInput = ({
  label,
  value,
  onChange,
  error,
  helperText,
  ...props
}) => (
  <TimePicker
    label={label}
    value={value}
    onChange={onChange}
    renderInput={(params) => (
      <StyledTextField
        {...params}
        fullWidth
        error={!!error}
        helperText={helperText || error}
      />
    )}
    {...props}
  />
);

// Layout components
export const PageContainer = ({ children, maxWidth = 'lg', ...props }) => (
  <Container maxWidth={maxWidth} {...props}>
    {children}
  </Container>
);

export const Section = ({ title, children, ...props }) => (
  <Box {...props}>
    {title && (
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
    )}
    {children}
  </Box>
);

export const GridContainer = ({ children, spacing = 2, ...props }) => (
  <Grid container spacing={spacing} {...props}>
    {children}
  </Grid>
);

export const GridItem = ({ children, xs = 12, sm, md, lg, xl, ...props }) => (
  <Grid item xs={xs} sm={sm} md={md} lg={lg} xl={xl} {...props}>
    {children}
  </Grid>
);

// Notification components
export const NotificationSnackbar = ({
  open,
  onClose,
  message,
  severity = 'info',
}) => (
  <Snackbar
    open={open}
    autoHideDuration={6000}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  >
    <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
      {message}
    </Alert>
  </Snackbar>
);

// Custom hooks for common patterns
export const useApiQuery = (queryKey, queryFn, options = {}) => {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

export const useApiMutation = (mutationFn, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Invalidate related queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

// Export all components
export {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  CircularProgress,
  Pagination,
  Snackbar,
  Alert,
  Container,
  Grid,
  Box,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Menu,
  MenuList,
  MenuItemComponent,
  Drawer,
  AppBar,
  Toolbar,
  CssBaseline,
  ThemeProvider,
  styled,
  DatePicker,
  TimePicker,
  DateTimePicker,
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  ScatterChart,
  RadarChart,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  RechartsTooltip,
  Legend,
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  Scatter,
  Radar,
  ResponsiveContainer,
  Map,
  useQuery,
  useMutation,
  useQueryClient,
};
