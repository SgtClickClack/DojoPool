import { Add as AddIcon } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface CreateExperimentProps {
    onExperimentCreated?: () => void;
}

const CreateExperiment: React.FC<CreateExperimentProps> = ({ onExperimentCreated }) => {
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [trafficPercentage, setTrafficPercentage] = useState('50');
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [variant, setVariant] = useState('');
    const [variants, setVariants] = useState<string[]>(['control']);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { getToken } = useAuth();

    const handleAddVariant = () => {
        if (variant && !variants.includes(variant)) {
            setVariants([...variants, variant]);
            setVariant('');
        }
    };

    const handleRemoveVariant = (variantToRemove: string) => {
        if (variantToRemove !== 'control') {
            setVariants(variants.filter(v => v !== variantToRemove));
        }
    };

    const validateForm = () => {
        if (!id || !name || !description || !startDate || variants.length < 2) {
            setError('Please fill in all required fields and add at least one variant besides control');
            return false;
        }

        const traffic = parseFloat(trafficPercentage);
        if (isNaN(traffic) || traffic <= 0 || traffic > 100) {
            setError('Traffic percentage must be between 0 and 100');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!validateForm()) return;

        try {
            const token = await getToken();
            const response = await fetch('/api/experiments/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id,
                    name,
                    description,
                    variants,
                    traffic_percentage: parseFloat(trafficPercentage) / 100,
                    start_date: startDate?.toISOString(),
                    end_date: endDate?.toISOString() || null,
                    is_active: true,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create experiment');
            }

            setSuccess(true);
            onExperimentCreated?.();

            // Reset form
            setId('');
            setName('');
            setDescription('');
            setTrafficPercentage('50');
            setStartDate(new Date());
            setEndDate(null);
            setVariant('');
            setVariants(['control']);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    return (
        <Container maxWidth="md">
            <Box my={4}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Create New Experiment
                </Typography>

                <Card>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <Stack spacing={3}>
                                {error && <Alert severity="error">{error}</Alert>}
                                {success && <Alert severity="success">Experiment created successfully!</Alert>}

                                <TextField
                                    label="Experiment ID"
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                    required
                                    fullWidth
                                />

                                <TextField
                                    label="Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    fullWidth
                                />

                                <TextField
                                    label="Description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    fullWidth
                                    multiline
                                    rows={3}
                                />

                                <TextField
                                    label="Traffic Percentage"
                                    type="number"
                                    value={trafficPercentage}
                                    onChange={(e) => setTrafficPercentage(e.target.value)}
                                    required
                                    fullWidth
                                    inputProps={{ min: 0, max: 100 }}
                                />

                                <Box>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Variants
                                    </Typography>
                                    <Box display="flex" gap={1} mb={2}>
                                        {variants.map((v) => (
                                            <Chip
                                                key={v}
                                                label={v}
                                                onDelete={v === 'control' ? undefined : () => handleRemoveVariant(v)}
                                            />
                                        ))}
                                    </Box>
                                    <Box display="flex" gap={1}>
                                        <TextField
                                            label="Add Variant"
                                            value={variant}
                                            onChange={(e) => setVariant(e.target.value)}
                                            size="small"
                                        />
                                        <IconButton onClick={handleAddVariant} color="primary">
                                            <AddIcon />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <DatePicker
                                    label="Start Date"
                                    value={startDate}
                                    onChange={(date) => setStartDate(date)}
                                    slotProps={{
                                        textField: { required: true, fullWidth: true }
                                    }}
                                />

                                <DatePicker
                                    label="End Date (Optional)"
                                    value={endDate}
                                    onChange={(date) => setEndDate(date)}
                                    slotProps={{
                                        textField: { fullWidth: true }
                                    }}
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    fullWidth
                                >
                                    Create Experiment
                                </Button>
                            </Stack>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default CreateExperiment; 