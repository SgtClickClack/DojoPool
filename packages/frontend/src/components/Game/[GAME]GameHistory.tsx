import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    Chip,
    Tooltip,
    TextField,
    MenuItem,
    Stack
} from '@mui/material';
import {
    Visibility,
    TrendingUp,
    EmojiEvents,
    AccessTime,
    FilterList
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMatchHistory } from '../../store/slices/gameSlice';
import { format } from 'date-fns';

interface GameHistoryProps {
    playerId?: string;
    venueId?: string;
}

type SortField = 'date' | 'score' | 'duration' | 'highest_break';
type SortOrder = 'asc' | 'desc';

export const GameHistory: React.FC<GameHistoryProps> = ({ playerId, venueId }) => {
    const dispatch = useAppDispatch();
    const { matches, isLoading } = useAppSelector(state => state.game);
    
    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Sorting state
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    
    // Filtering state
    const [filters, setFilters] = useState({
        status: 'all',
        timeframe: 'all',
    });

    useEffect(() => {
        dispatch(fetchMatchHistory({ playerId, venueId, page, rowsPerPage, sortField, sortOrder }));
    }, [dispatch, playerId, venueId, page, rowsPerPage, sortField, sortOrder]);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const handleFilterChange = (field: keyof typeof filters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
        setPage(0);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'in_progress':
                return 'warning';
            case 'scheduled':
                return 'info';
            default:
                return 'default';
        }
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    return (
        <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h6">Match History</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <TextField
                        select
                        size="small"
                        label="Status"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        sx={{ width: 150 }}
                    >
                        <MenuItem value="all">All Matches</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="scheduled">Scheduled</MenuItem>
                    </TextField>
                    <TextField
                        select
                        size="small"
                        label="Timeframe"
                        value={filters.timeframe}
                        onChange={(e) => handleFilterChange('timeframe', e.target.value)}
                        sx={{ width: 150 }}
                    >
                        <MenuItem value="all">All Time</MenuItem>
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="week">This Week</MenuItem>
                        <MenuItem value="month">This Month</MenuItem>
                    </TextField>
                </Stack>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Players</TableCell>
                                <TableCell>Score</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Duration</TableCell>
                                <TableCell>Highest Break</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {matches.map((match) => (
                                <TableRow key={match.id} hover>
                                    <TableCell>
                                        {format(new Date(match.scheduled_time), 'MMM d, yyyy HH:mm')}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {match.player1.nickname} vs {match.player2.nickname}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {match.score.player1} - {match.score.player2}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={match.status}
                                            size="small"
                                            color={getStatusColor(match.status)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {match.duration ? formatDuration(match.duration) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {Math.max(
                                            match.statistics.player1.highest_break,
                                            match.statistics.player2.highest_break
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="View Match Details">
                                            <IconButton
                                                size="small"
                                                onClick={() => {/* TODO: Implement match details view */}}
                                            >
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={-1} // Server-side pagination
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            </Paper>
        </Box>
    );
}; 