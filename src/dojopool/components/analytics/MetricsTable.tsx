import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
  Typography,
  Skeleton
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';

interface MetricsTableProps {
  data: any[];
  metrics: string[];
  loading: boolean;
}

const METRIC_LABELS: { [key: string]: string } = {
  games_played: 'Games Played',
  win_rate: 'Win Rate',
  avg_score: 'Average Score',
  occupancy_rate: 'Occupancy Rate',
  revenue: 'Revenue',
  response_time: 'Response Time',
  error_rate: 'Error Rate',
  cpu_usage: 'CPU Usage'
};

const METRIC_FORMATS: { [key: string]: (value: number) => string } = {
  games_played: (value) => value.toFixed(0),
  win_rate: (value) => `${(value * 100).toFixed(1)}%`,
  avg_score: (value) => value.toFixed(1),
  occupancy_rate: (value) => `${(value * 100).toFixed(1)}%`,
  revenue: (value) => `$${value.toFixed(2)}`,
  response_time: (value) => `${value.toFixed(0)}ms`,
  error_rate: (value) => `${(value * 100).toFixed(2)}%`,
  cpu_usage: (value) => `${(value * 100).toFixed(1)}%`
};

type Order = 'asc' | 'desc';

export const MetricsTable: React.FC<MetricsTableProps> = ({
  data,
  metrics,
  loading
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<string>('date');
  const [order, setOrder] = useState<Order>('desc');

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const tableData = useMemo(() => {
    // Group data by date
    const groupedData = data.reduce((acc: { [key: string]: any }, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          dimension_id: item.dimension_id,
          dimension: item.dimension
        };
      }
      acc[date][item.metric_type] = item.value;
      return acc;
    }, {});

    // Convert to array
    return Object.values(groupedData);
  }, [data]);

  const sortedData = useMemo(() => {
    const comparator = (a: any, b: any) => {
      if (orderBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      const valueA = a[orderBy] || 0;
      const valueB = b[orderBy] || 0;
      return order === 'asc' ? valueA - valueB : valueB - valueA;
    };

    return [...tableData].sort(comparator);
  }, [tableData, order, orderBy]);

  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (!data.length) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No data available for the selected period
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'date'}
                  direction={orderBy === 'date' ? order : 'asc'}
                  onClick={() => handleRequestSort('date')}
                >
                  Date
                  {orderBy === 'date' ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              {metrics.map((metric) => (
                <TableCell key={metric} align="right">
                  <TableSortLabel
                    active={orderBy === metric}
                    direction={orderBy === metric ? order : 'asc'}
                    onClick={() => handleRequestSort(metric)}
                  >
                    {METRIC_LABELS[metric] || metric}
                    {orderBy === metric ? (
                      <Box component="span" sx={visuallyHidden}>
                        {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                      </Box>
                    ) : null}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row) => (
              <TableRow hover key={row.date}>
                <TableCell component="th" scope="row">
                  {new Date(row.date).toLocaleDateString()}
                </TableCell>
                {metrics.map((metric) => (
                  <TableCell key={metric} align="right">
                    {METRIC_FORMATS[metric]?.(row[metric]) || 
                      (row[metric]?.toFixed(2) || '-')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={sortedData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}; 