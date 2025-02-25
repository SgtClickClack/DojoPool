/** @jsxImportSource react */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    CardActionArea,
    Chip,
    Rating,
    Button,
    CircularProgress,
    Alert,
    Skeleton
} from '@mui/material';
import { Venue, VenueStatus } from '../../types/venue';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TableBarIcon from '@mui/icons-material/TableBar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';

interface VenueListProps {
    venues: Venue[];
    loading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
}

export const VenueList: React.FC<VenueListProps> = ({ 
    venues, 
    loading = false, 
    error = null, 
    onRefresh 
}) => {
    const navigate = useNavigate();

    const getStatusColor = (status: VenueStatus) => {
        switch (status) {
            case VenueStatus.ACTIVE:
                return 'success';
            case VenueStatus.INACTIVE:
                return 'error';
            case VenueStatus.MAINTENANCE:
                return 'warning';
            case VenueStatus.CLOSED:
                return 'error';
            default:
                return 'default';
        }
    };

    const getCurrentStatus = (venue: Venue) => {
        const now = new Date();
        const day = now.getDay();
        const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        
        const todayHours = venue.businessHours.find(hours => hours.day === day);
        if (!todayHours || todayHours.closed) {
            return 'CLOSED';
        }

        if (time >= todayHours.open && time <= todayHours.close) {
            return 'OPEN';
        }

        return 'CLOSED';
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Typography variant="h5">
                    Pool Venues
                </Typography>
                <Box>
                    {onRefresh && (
                        <Button 
                            variant="outlined" 
                            startIcon={<RefreshIcon />} 
                            onClick={onRefresh}
                            disabled={loading}
                            sx={{ mr: 2 }}
                        >
                            Refresh
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        onClick={() => navigate('/venues/register')}
                    >
                        Register Venue
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 3 }}
                    action={
                        onRefresh && (
                            <Button 
                                color="inherit" 
                                size="small" 
                                onClick={onRefresh}
                            >
                                Try Again
                            </Button>
                        )
                    }
                >
                    {error}
                </Alert>
            )}

            {loading ? (
                <Grid container spacing={3}>
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <Grid item xs={12} sm={6} md={4} key={item}>
                            <Card>
                                <Skeleton variant="rectangular" height={200} />
                                <CardContent>
                                    <Skeleton variant="text" height={32} width="80%" />
                                    <Skeleton variant="text" height={24} width="60%" />
                                    <Skeleton variant="text" height={24} width="70%" />
                                    <Skeleton variant="text" height={24} width="50%" />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : venues.length === 0 ? (
                <Box sx={{ 
                    p: 5, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    bgcolor: 'background.paper',
                    borderRadius: 1
                }}>
                    <Typography variant="h6" gutterBottom>
                        No venues found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Be the first to register a venue in your area!
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/venues/register')}
                    >
                        Register Venue
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {venues.map((venue) => (
                        <Grid item xs={12} sm={6} md={4} key={venue.id}>
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s ease-in-out',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: (theme) => theme.shadows[4]
                                }
                            }}>
                                <CardActionArea 
                                    onClick={() => navigate(`/venues/${venue.id}`)}
                                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                                >
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={venue.photos.find(photo => photo.isPrimary)?.url || '/images/venue-placeholder.jpg'}
                                        alt={venue.name}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="h6" gutterBottom>
                                                {venue.name}
                                            </Typography>
                                            <Chip
                                                size="small"
                                                label={venue.status}
                                                color={getStatusColor(venue.status)}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Rating value={venue.rating.average} precision={0.5} readOnly size="small" />
                                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                ({venue.rating.count})
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <LocationOnIcon fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                {venue.address.city}, {venue.address.state}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <TableBarIcon fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                {venue.stats.availableTables} / {venue.stats.totalTables} tables available
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <AccessTimeIcon fontSize="small" color="action" />
                                            <Typography 
                                                variant="body2" 
                                                color={getCurrentStatus(venue) === 'OPEN' ? 'success.main' : 'text.secondary'} 
                                                sx={{ ml: 1, fontWeight: getCurrentStatus(venue) === 'OPEN' ? 'bold' : 'regular' }}
                                            >
                                                {getCurrentStatus(venue)}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};