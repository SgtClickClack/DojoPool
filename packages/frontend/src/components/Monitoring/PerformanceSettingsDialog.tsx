import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert
} from '@mui/material';
import { GamePerformanceMonitor } from '../../services/monitoring/GamePerformanceMonitor';

interface PerformanceSettingsDialogProps {
    open: boolean;
    onClose: () => void;
}

export const PerformanceSettingsDialog: React.FC<PerformanceSettingsDialogProps> = ({
    open,
    onClose
}) => {
    const monitor = GamePerformanceMonitor.getInstance();
    const [thresholds, setThresholds] = useState(monitor.getThresholds());
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (open) {
            setThresholds(monitor.getThresholds());
            setError('');
        }
    }, [open]);

    const handleChange = (key: keyof typeof thresholds) => (
        event: React.ChangeEvent<HTMLInputElement> | Event,
        value: number | number[]
    ) => {
        const newValue = typeof value === 'number' ? value : parseFloat(event.target.value);
        if (!isNaN(newValue)) {
            setThresholds(prev => ({
                ...prev,
                [key]: newValue
            }));
            setError('');
        }
    };

    const validateThresholds = () => {
        if (thresholds.minFps <= 0) {
            setError('Minimum FPS must be greater than 0');
            return false;
        }
        if (thresholds.maxFrameTime <= 0) {
            setError('Maximum frame time must be greater than 0');
            return false;
        }
        if (thresholds.maxRenderTime <= 0) {
            setError('Maximum render time must be greater than 0');
            return false;
        }
        if (thresholds.maxPhysicsTime <= 0) {
            setError('Maximum physics time must be greater than 0');
            return false;
        }
        if (thresholds.maxNetworkLatency <= 0) {
            setError('Maximum network latency must be greater than 0');
            return false;
        }
        if (thresholds.maxMemoryUsage <= 0) {
            setError('Maximum memory usage must be greater than 0');
            return false;
        }
        return true;
    };

    const handleSave = () => {
        if (validateThresholds()) {
            monitor.setThresholds(thresholds);
            onClose();
        }
    };

    const presets = {
        low: {
            minFps: 30,
            maxFrameTime: 33.33,
            maxRenderTime: 20,
            maxPhysicsTime: 10,
            maxNetworkLatency: 150,
            maxMemoryUsage: 150 * 1024 * 1024
        },
        medium: {
            minFps: 45,
            maxFrameTime: 22.22,
            maxRenderTime: 16,
            maxPhysicsTime: 8,
            maxNetworkLatency: 100,
            maxMemoryUsage: 100 * 1024 * 1024
        },
        high: {
            minFps: 60,
            maxFrameTime: 16.67,
            maxRenderTime: 12,
            maxPhysicsTime: 6,
            maxNetworkLatency: 50,
            maxMemoryUsage: 75 * 1024 * 1024
        }
    };

    const handlePresetChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        const preset = event.target.value as keyof typeof presets;
        setThresholds(presets[preset]);
        setError('');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Performance Settings</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Preset Configuration</InputLabel>
                    <Select
                        label="Preset Configuration"
                        onChange={handlePresetChange}
                    >
                        <MenuItem value="low">Low-End Devices</MenuItem>
                        <MenuItem value="medium">Medium Performance</MenuItem>
                        <MenuItem value="high">High Performance</MenuItem>
                    </Select>
                </FormControl>

                <Typography variant="h6" gutterBottom>
                    Frame Rate
                </Typography>
                <Box sx={{ mb: 3 }}>
                    <Typography>Minimum FPS</Typography>
                    <Slider
                        value={thresholds.minFps}
                        onChange={handleChange('minFps')}
                        min={15}
                        max={120}
                        step={5}
                        marks={[
                            { value: 30, label: '30' },
                            { value: 60, label: '60' },
                            { value: 120, label: '120' }
                        ]}
                        valueLabelDisplay="auto"
                    />
                </Box>

                <Typography variant="h6" gutterBottom>
                    Timing Thresholds (ms)
                </Typography>
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        label="Maximum Frame Time"
                        type="number"
                        value={thresholds.maxFrameTime}
                        onChange={event => handleChange('maxFrameTime')(event, parseFloat(event.target.value))}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Maximum Render Time"
                        type="number"
                        value={thresholds.maxRenderTime}
                        onChange={event => handleChange('maxRenderTime')(event, parseFloat(event.target.value))}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Maximum Physics Time"
                        type="number"
                        value={thresholds.maxPhysicsTime}
                        onChange={event => handleChange('maxPhysicsTime')(event, parseFloat(event.target.value))}
                    />
                </Box>

                <Typography variant="h6" gutterBottom>
                    Network & Memory
                </Typography>
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        label="Maximum Network Latency (ms)"
                        type="number"
                        value={thresholds.maxNetworkLatency}
                        onChange={event => handleChange('maxNetworkLatency')(event, parseFloat(event.target.value))}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Maximum Memory Usage (MB)"
                        type="number"
                        value={thresholds.maxMemoryUsage / (1024 * 1024)}
                        onChange={event => handleChange('maxMemoryUsage')(event, parseFloat(event.target.value) * 1024 * 1024)}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 