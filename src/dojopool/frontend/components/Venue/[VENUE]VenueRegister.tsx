import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    IconButton
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers';
import { TableType } from '../../types/venue';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export const VenueRegister: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
            coordinates: {
                latitude: 0,
                longitude: 0
            }
        },
        contact: {
            phone: '',
            email: '',
            website: ''
        },
        businessHours: Array.from({ length: 7 }, (_, i) => ({
            day: i,
            open: '09:00',
            close: '22:00',
            closed: i === 6 // Closed on Sundays by default
        })),
        tables: [
            {
                number: 1,
                type: TableType.STANDARD,
                size: '9ft',
                condition: 5
            }
        ],
        features: {
            hasParking: false,
            isWheelchairAccessible: false,
            hasFood: false,
            hasBar: false,
            hasTournaments: false,
            hasTraining: false
        },
        rules: {
            minimumAge: 18,
            dresscode: '',
            reservationRequired: false,
            membershipRequired: false
        },
        pricing: [
            {
                type: 'PER_HOUR',
                amount: 0,
                currency: 'USD',
                description: 'Standard rate'
            }
        ]
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                [name]: value
            }
        }));
    };

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            contact: {
                ...prev.contact,
                [name]: value
            }
        }));
    };

    const handleFeatureChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [name]: e.target.checked
            }
        }));
    };

    const handleTableAdd = () => {
        setFormData(prev => ({
            ...prev,
            tables: [
                ...prev.tables,
                {
                    number: prev.tables.length + 1,
                    type: TableType.STANDARD,
                    size: '9ft',
                    condition: 5
                }
            ]
        }));
    };

    const handleTableRemove = (index: number) => {
        setFormData(prev => ({
            ...prev,
            tables: prev.tables.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // TODO: Implement venue registration API call
            navigate('/venues');
        } catch (error) {
            console.error('Failed to register venue:', error);
        }
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Register Venue
            </Typography>
            <Paper sx={{ p: 3 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Basic Information */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Basic Information
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                label="Venue Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </Grid>

                        {/* Address */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Address
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                label="Street Address"
                                name="street"
                                value={formData.address.street}
                                onChange={handleAddressChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                label="City"
                                name="city"
                                value={formData.address.city}
                                onChange={handleAddressChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                label="State"
                                name="state"
                                value={formData.address.state}
                                onChange={handleAddressChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                label="Postal Code"
                                name="postalCode"
                                value={formData.address.postalCode}
                                onChange={handleAddressChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                label="Country"
                                name="country"
                                value={formData.address.country}
                                onChange={handleAddressChange}
                            />
                        </Grid>

                        {/* Contact Information */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Contact Information
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                label="Phone"
                                name="phone"
                                value={formData.contact.phone}
                                onChange={handleContactChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                required
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.contact.email}
                                onChange={handleContactChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Website"
                                name="website"
                                value={formData.contact.website}
                                onChange={handleContactChange}
                            />
                        </Grid>

                        {/* Tables */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">
                                    Pool Tables
                                </Typography>
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={handleTableAdd}
                                >
                                    Add Table
                                </Button>
                            </Box>
                        </Grid>
                        {formData.tables.map((table, index) => (
                            <Grid item xs={12} key={index}>
                                <Paper sx={{ p: 2 }}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} md={3}>
                                            <FormControl fullWidth>
                                                <InputLabel>Type</InputLabel>
                                                <Select
                                                    value={table.type}
                                                    label="Type"
                                                    onChange={(e) => {
                                                        const newTables = [...formData.tables];
                                                        newTables[index].type = e.target.value as TableType;
                                                        setFormData(prev => ({ ...prev, tables: newTables }));
                                                    }}
                                                >
                                                    {Object.values(TableType).map((type) => (
                                                        <MenuItem key={type} value={type}>
                                                            {type}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                fullWidth
                                                label="Size"
                                                value={table.size}
                                                onChange={(e) => {
                                                    const newTables = [...formData.tables];
                                                    newTables[index].size = e.target.value;
                                                    setFormData(prev => ({ ...prev, tables: newTables }));
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Condition"
                                                value={table.condition}
                                                inputProps={{ min: 1, max: 5 }}
                                                onChange={(e) => {
                                                    const newTables = [...formData.tables];
                                                    newTables[index].condition = Number(e.target.value);
                                                    setFormData(prev => ({ ...prev, tables: newTables }));
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleTableRemove(index)}
                                                disabled={formData.tables.length === 1}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        ))}

                        {/* Features */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Features
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.features.hasParking}
                                                onChange={handleFeatureChange('hasParking')}
                                            />
                                        }
                                        label="Parking Available"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.features.isWheelchairAccessible}
                                                onChange={handleFeatureChange('isWheelchairAccessible')}
                                            />
                                        }
                                        label="Wheelchair Accessible"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.features.hasFood}
                                                onChange={handleFeatureChange('hasFood')}
                                            />
                                        }
                                        label="Food Service"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.features.hasBar}
                                                onChange={handleFeatureChange('hasBar')}
                                            />
                                        }
                                        label="Bar Service"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.features.hasTournaments}
                                                onChange={handleFeatureChange('hasTournaments')}
                                            />
                                        }
                                        label="Tournaments"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.features.hasTraining}
                                                onChange={handleFeatureChange('hasTraining')}
                                            />
                                        }
                                        label="Training Programs"
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Submit */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/venues')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                >
                                    Register Venue
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Box>
    );
}; 