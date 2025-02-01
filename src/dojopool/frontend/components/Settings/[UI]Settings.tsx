import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Switch,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

export const Settings: React.FC = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: false,
        darkMode: false,
        soundEffects: true,
        autoJoinTournaments: false,
        showRealTimeStats: true,
    });

    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const handleSettingChange = (setting: keyof typeof settings) => {
        setSettings(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordSubmit = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
            return;
        }
        try {
            // TODO: Implement password change API call
            setOpenPasswordDialog(false);
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setPasswordError(null);
        } catch (error) {
            setPasswordError('Failed to change password');
        }
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Settings
            </Typography>

            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Account Settings
                </Typography>
                <List>
                    <ListItem>
                        <ListItemText
                            primary="Email"
                            secondary={user?.email}
                        />
                    </ListItem>
                    <Divider />
                    <ListItem>
                        <ListItemText
                            primary="Change Password"
                            secondary="Update your account password"
                        />
                        <ListItemSecondaryAction>
                            <Button
                                variant="outlined"
                                onClick={() => setOpenPasswordDialog(true)}
                            >
                                Change
                            </Button>
                        </ListItemSecondaryAction>
                    </ListItem>
                </List>
            </Paper>

            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Preferences
                </Typography>
                <List>
                    <ListItem>
                        <ListItemText
                            primary="Email Notifications"
                            secondary="Receive email updates about tournaments and matches"
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.emailNotifications}
                                onChange={() => handleSettingChange('emailNotifications')}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                    <ListItem>
                        <ListItemText
                            primary="Push Notifications"
                            secondary="Receive push notifications on your device"
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.pushNotifications}
                                onChange={() => handleSettingChange('pushNotifications')}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                    <ListItem>
                        <ListItemText
                            primary="Dark Mode"
                            secondary="Toggle dark theme"
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.darkMode}
                                onChange={() => handleSettingChange('darkMode')}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                    <ListItem>
                        <ListItemText
                            primary="Sound Effects"
                            secondary="Play sound effects during games"
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.soundEffects}
                                onChange={() => handleSettingChange('soundEffects')}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                    <ListItem>
                        <ListItemText
                            primary="Auto-join Tournaments"
                            secondary="Automatically join tournaments when eligible"
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.autoJoinTournaments}
                                onChange={() => handleSettingChange('autoJoinTournaments')}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                    <ListItem>
                        <ListItemText
                            primary="Real-time Statistics"
                            secondary="Show real-time game statistics"
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.showRealTimeStats}
                                onChange={() => handleSettingChange('showRealTimeStats')}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                </List>
            </Paper>

            <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    {passwordError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {passwordError}
                        </Alert>
                    )}
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Current Password"
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="New Password"
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Confirm New Password"
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPasswordDialog(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handlePasswordSubmit} variant="contained">
                        Change Password
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 