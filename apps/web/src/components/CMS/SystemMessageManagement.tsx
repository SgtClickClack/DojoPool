import {
  Add as AddIcon,
  Announcement as AnnouncementIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface SystemMessage {
  id: string;
  title: string;
  message: string;
  messageType: string;
  priority: string;
  expiresAt?: string;
  isActive: boolean;
  targetAudience?: string;
  targetUserIds?: string[];
  status: string;
  tags?: string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface SystemMessageFormData {
  title: string;
  message: string;
  messageType: string;
  priority: string;
  expiresAt: string;
  isActive: boolean;
  targetAudience: string;
  targetUserIds: string[];
  tags: string[];
  metadata: any;
}

const SystemMessageManagement: React.FC = () => {
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<SystemMessage | null>(
    null
  );
  const [formData, setFormData] = useState<SystemMessageFormData>({
    title: '',
    message: '',
    messageType: 'INFO',
    priority: 'NORMAL',
    expiresAt: '',
    isActive: true,
    targetAudience: 'ALL_USERS',
    targetUserIds: [],
    tags: [],
    metadata: {},
  });

  const messageTypes = [
    { value: 'INFO', label: 'Info', icon: InfoIcon, color: 'info' },
    { value: 'WARNING', label: 'Warning', icon: WarningIcon, color: 'warning' },
    { value: 'ERROR', label: 'Error', icon: ErrorIcon, color: 'error' },
    {
      value: 'MAINTENANCE',
      label: 'Maintenance',
      icon: AnnouncementIcon,
      color: 'default',
    },
    {
      value: 'ANNOUNCEMENT',
      label: 'Announcement',
      icon: AnnouncementIcon,
      color: 'success',
    },
  ];

  const priorities = [
    { value: 'LOW', label: 'Low', color: 'default' },
    { value: 'NORMAL', label: 'Normal', color: 'info' },
    { value: 'HIGH', label: 'High', color: 'warning' },
    { value: 'CRITICAL', label: 'Critical', color: 'error' },
  ];

  const targetAudiences = [
    { value: 'ALL_USERS', label: 'All Users' },
    { value: 'ADMINS_ONLY', label: 'Admins Only' },
    { value: 'VENUE_OWNERS', label: 'Venue Owners' },
    { value: 'PREMIUM_USERS', label: 'Premium Users' },
    { value: 'SPECIFIC_USERS', label: 'Specific Users' },
  ];

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      // In real implementation, this would call the CMS API
      const response = await fetch('/api/cms/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.content || []);
      } else {
        // Mock data for development
        setMessages([
          {
            id: '1',
            title: 'Scheduled Maintenance Tonight',
            message:
              'The platform will be undergoing scheduled maintenance from 2:00 AM to 4:00 AM EST. Some features may be temporarily unavailable.',
            messageType: 'MAINTENANCE',
            priority: 'HIGH',
            expiresAt: '2025-01-16T04:00:00Z',
            isActive: true,
            targetAudience: 'ALL_USERS',
            status: 'APPROVED',
            tags: ['maintenance', 'downtime'],
            metadata: {
              duration: '2 hours',
              affectedServices: ['tournaments', 'chat'],
            },
            createdAt: '2025-01-15T12:00:00Z',
            updatedAt: '2025-01-15T12:00:00Z',
          },
          {
            id: '2',
            title: 'New Tournament Format Available',
            message:
              'Try our new "Blitz" tournament format - faster games, bigger prizes!',
            messageType: 'ANNOUNCEMENT',
            priority: 'NORMAL',
            isActive: true,
            targetAudience: 'ALL_USERS',
            status: 'APPROVED',
            tags: ['tournament', 'new-feature'],
            metadata: { feature: 'blitz-mode', launchDate: '2025-01-20' },
            createdAt: '2025-01-14T09:00:00Z',
            updatedAt: '2025-01-14T09:00:00Z',
          },
          {
            id: '3',
            title: 'Security Alert: Password Update Required',
            message:
              'Due to recent security enhancements, all users are required to update their passwords within 7 days.',
            messageType: 'WARNING',
            priority: 'CRITICAL',
            expiresAt: '2025-01-25T23:59:59Z',
            isActive: true,
            targetAudience: 'ALL_USERS',
            status: 'APPROVED',
            tags: ['security', 'password', 'urgent'],
            metadata: { deadline: '2025-01-25', actionRequired: true },
            createdAt: '2025-01-10T08:00:00Z',
            updatedAt: '2025-01-10T08:00:00Z',
          },
        ]);
      }
    } catch (err) {
      setError('Failed to fetch system messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMessage = () => {
    setEditingMessage(null);
    setFormData({
      title: '',
      message: '',
      messageType: 'INFO',
      priority: 'NORMAL',
      expiresAt: '',
      isActive: true,
      targetAudience: 'ALL_USERS',
      targetUserIds: [],
      tags: [],
      metadata: {},
    });
    setDialogOpen(true);
  };

  const handleEditMessage = (message: SystemMessage) => {
    setEditingMessage(message);
    setFormData({
      title: message.title,
      message: message.message,
      messageType: message.messageType,
      priority: message.priority,
      expiresAt: message.expiresAt || '',
      isActive: message.isActive,
      targetAudience: message.targetAudience || 'ALL_USERS',
      targetUserIds: message.targetUserIds || [],
      tags: message.tags || [],
      metadata: message.metadata || {},
    });
    setDialogOpen(true);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this system message?'))
      return;

    try {
      const response = await fetch(`/api/cms/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('System message deleted successfully');
        fetchMessages();
      } else {
        setError('Failed to delete system message');
      }
    } catch (err) {
      setError('Failed to delete system message');
      console.error('Error deleting message:', err);
    }
  };

  const handleSubmit = async () => {
    try {
      const messageData = {
        ...formData,
        expiresAt: formData.expiresAt || undefined,
        tags: formData.tags.filter((tag) => tag.trim() !== ''),
        metadata: {
          ...formData.metadata,
          messageType: formData.messageType,
          priority: formData.priority,
          targetAudience: formData.targetAudience,
        },
      };

      const url = editingMessage
        ? `/api/cms/messages/${editingMessage.id}`
        : '/api/cms/messages';
      const method = editingMessage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setSuccess(
          editingMessage
            ? 'Message updated successfully'
            : 'Message created successfully'
        );
        setDialogOpen(false);
        fetchMessages();
      } else {
        setError('Failed to save system message');
      }
    } catch (err) {
      setError('Failed to save system message');
      console.error('Error saving message:', err);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMessage(null);
  };

  const getMessageTypeIcon = (type: string) => {
    const messageType = messageTypes.find((mt) => mt.value === type);
    return messageType ? messageType.icon : InfoIcon;
  };

  const getMessageTypeColor = (type: string) => {
    const messageType = messageTypes.find((mt) => mt.value === type);
    return messageType ? messageType.color : 'default';
  };

  const getPriorityColor = (priority: string) => {
    const priorityObj = priorities.find((p) => p.value === priority);
    return priorityObj ? priorityObj.color : 'default';
  };

  const toggleMessageStatus = async (
    messageId: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(`/api/cms/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        setSuccess(
          `Message ${!currentStatus ? 'activated' : 'deactivated'} successfully`
        );
        fetchMessages();
      } else {
        setError('Failed to update message status');
      }
    } catch (err) {
      setError('Failed to update message status');
      console.error('Error updating message status:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Loading system messages...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" component="h2">
          System Message Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateMessage}
        >
          Create Message
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.map((message) => {
              const IconComponent = getMessageTypeIcon(message.messageType);
              return (
                <TableRow key={message.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconComponent
                        sx={{
                          color: `${getMessageTypeColor(message.messageType)}.main`,
                        }}
                      />
                      <Chip
                        label={message.messageType}
                        size="small"
                        color={getMessageTypeColor(message.messageType) as any}
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {message.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {message.message.substring(0, 80)}...
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={message.priority}
                      size="small"
                      color={getPriorityColor(message.priority) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Switch
                        checked={message.isActive}
                        onChange={() =>
                          toggleMessageStatus(message.id, message.isActive)
                        }
                        size="small"
                      />
                      <Typography variant="body2">
                        {message.isActive ? 'Active' : 'Inactive'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={message.targetAudience || 'ALL_USERS'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {message.expiresAt
                      ? new Date(message.expiresAt).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEditMessage(message)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteMessage(message.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Message Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingMessage ? 'Edit System Message' : 'Create New System Message'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />

            <TextField
              fullWidth
              label="Message"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              multiline
              rows={4}
              required
              helperText="The main message content that will be displayed to users"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Message Type</InputLabel>
                  <Select
                    value={formData.messageType}
                    label="Message Type"
                    onChange={(e) =>
                      setFormData({ ...formData, messageType: e.target.value })
                    }
                  >
                    {messageTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <type.icon sx={{ color: `${type.color}.main` }} />
                          <Typography>{type.label}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Priority"
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                  >
                    {priorities.map((priority) => (
                      <MenuItem key={priority.value} value={priority.value}>
                        <Chip
                          label={priority.label}
                          size="small"
                          color={priority.color as any}
                          sx={{ minWidth: 60 }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Target Audience</InputLabel>
                  <Select
                    value={formData.targetAudience}
                    label="Target Audience"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetAudience: e.target.value,
                      })
                    }
                  >
                    {targetAudiences.map((audience) => (
                      <MenuItem key={audience.value} value={audience.value}>
                        {audience.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Expiration Date (optional)"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText="Leave empty for no expiration"
                />
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
              }
              label="Message is Active"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, ml: 4 }}
            >
              Inactive messages won&apos;t be displayed to users
            </Typography>

            <TextField
              fullWidth
              label="Tags (comma-separated)"
              value={formData.tags.join(', ')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: e.target.value
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter((tag) => tag),
                })
              }
              helperText="Enter tags separated by commas"
            />

            {formData.targetAudience === 'SPECIFIC_USERS' && (
              <TextField
                fullWidth
                label="Target User IDs (comma-separated)"
                value={formData.targetUserIds.join(', ')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetUserIds: e.target.value
                      .split(',')
                      .map((id) => id.trim())
                      .filter((id) => id),
                  })
                }
                helperText="Enter specific user IDs separated by commas"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingMessage ? 'Update' : 'Create'} Message
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemMessageManagement;
