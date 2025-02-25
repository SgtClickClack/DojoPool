import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Chip,
    Rating,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Divider
} from '@mui/material';
import { Venue, TableStatus, TableType } from '../../types/venue';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import AccessibleIcon from '@mui/icons-material/Accessible';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SchoolIcon from '@mui/icons-material/School';
import EditIcon from '@mui/icons-material/Edit';

interface VenueDetailProps {
    venue: Venue;
    onEdit?: () => void;
}

export const VenueDetail: React.FC<VenueDetailProps> = ({ venue, onEdit }) => {
    const getTableStatusColor = (status: TableStatus) => {
        switch (status) {
            case TableStatus.AVAILABLE:
                return 'success';
            case TableStatus.OCCUPIED:
                return 'error';
            case TableStatus.RESERVED:
                return 'warning';
            case TableStatus.MAINTENANCE:
                return 'default';
            default:
                return 'default';
        }
    };

    const formatBusinessHours = (hours: { open: string; close: string; closed: boolean }) => {
        if (hours.closed) return 'Closed';
        return `${hours.open} - ${hours.close}`;
    };

    const getDayName = (day: number) => {
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        {venue.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating value={venue.rating.average} precision={0.5} readOnly />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({venue.rating.count} reviews)
                        </Typography>
                    </Box>
                </Box>
                {onEdit && (
                    <IconButton onClick={onEdit} color="primary">
                        <EditIcon />
                    </IconButton>
                )}
            </Box>

            <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            About
                        </Typography>
                        <Typography variant="body1" paragraph>
                            {venue.description}
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <LocationOnIcon color="action" sx={{ mr: 1 }} />
                                    <Typography variant="body2">
                                        {venue.address.street}<br />
                                        {venue.address.city}, {venue.address.state} {venue.address.postalCode}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <PhoneIcon color="action" sx={{ mr: 1 }} />
                                    <Typography variant="body2">
                                        {venue.contact.phone}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <EmailIcon color="action" sx={{ mr: 1 }} />
                                    <Typography variant="body2">
                                        {venue.contact.email}
                                    </Typography>
                                </Box>
                                {venue.contact.website && (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LanguageIcon color="action" sx={{ mr: 1 }} />
                                        <Typography variant="body2">
                                            {venue.contact.website}
                                        </Typography>
                                    </Box>
                                )}
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Tables */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Pool Tables
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Table</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Size</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Condition</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {venue.tables.map((table) => (
                                        <TableRow key={table.id}>
                                            <TableCell>#{table.number}</TableCell>
                                            <TableCell>{table.type}</TableCell>
                                            <TableCell>{table.size}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={table.status}
                                                    color={getTableStatusColor(table.status)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Rating value={table.condition} readOnly size="small" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} md={4}>
                    {/* Business Hours */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Business Hours
                        </Typography>
                        {venue.businessHours.map((hours) => (
                            <Box
                                key={hours.day}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    py: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <Typography variant="body2">
                                    {getDayName(hours.day)}
                                </Typography>
                                <Typography variant="body2">
                                    {formatBusinessHours(hours)}
                                </Typography>
                            </Box>
                        ))}
                    </Paper>

                    {/* Features */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Features
                        </Typography>
                        <Grid container spacing={1}>
                            {venue.features.hasParking && (
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LocalParkingIcon color="action" sx={{ mr: 1 }} />
                                        <Typography variant="body2">Parking</Typography>
                                    </Box>
                                </Grid>
                            )}
                            {venue.features.isWheelchairAccessible && (
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <AccessibleIcon color="action" sx={{ mr: 1 }} />
                                        <Typography variant="body2">Accessible</Typography>
                                    </Box>
                                </Grid>
                            )}
                            {venue.features.hasFood && (
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <RestaurantIcon color="action" sx={{ mr: 1 }} />
                                        <Typography variant="body2">Food Service</Typography>
                                    </Box>
                                </Grid>
                            )}
                            {venue.features.hasBar && (
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LocalBarIcon color="action" sx={{ mr: 1 }} />
                                        <Typography variant="body2">Bar Service</Typography>
                                    </Box>
                                </Grid>
                            )}
                            {venue.features.hasTournaments && (
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <EmojiEventsIcon color="action" sx={{ mr: 1 }} />
                                        <Typography variant="body2">Tournaments</Typography>
                                    </Box>
                                </Grid>
                            )}
                            {venue.features.hasTraining && (
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <SchoolIcon color="action" sx={{ mr: 1 }} />
                                        <Typography variant="body2">Training</Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </Paper>

                    {/* Pricing */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Pricing
                        </Typography>
                        {venue.pricing.map((price, index) => (
                            <Box key={index} sx={{ mb: 2 }}>
                                <Typography variant="subtitle2">
                                    {price.description}
                                </Typography>
                                <Typography variant="h6" color="primary">
                                    {price.amount} {price.currency} / {price.type.toLowerCase().replace('_', ' ')}
                                </Typography>
                                {price.peakHours && (
                                    <Typography variant="body2" color="text.secondary">
                                        Peak hours ({price.peakHours.start} - {price.peakHours.end}):
                                        {' '}{price.amount * price.peakHours.multiplier} {price.currency}
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}; 