import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
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
  Fab,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { useEffect, useState } from 'react';

interface Promotion {
  id: string;
  contentId: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_ITEM';
  discountValue: number;
  minPurchase?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  startTime?: Date;
  endTime?: Date;
  targetUsers: string[];
  applicableItems: string[];
  createdBy: string;
  content: {
    title: string;
    description?: string;
    tags: string[];
  };
}

interface CreatePromotionData {
  title: string;
  description?: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_ITEM';
  discountValue: number;
  minPurchase?: number;
  maxUses?: number;
  isActive: boolean;
  startTime?: Date;
  endTime?: Date;
  targetUsers: string[];
  applicableItems: string[];
  tags: string[];
}

const PromotionManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null
  );
  const [formData, setFormData] = useState<CreatePromotionData>({
    title: '',
    description: '',
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    minPurchase: 0,
    maxUses: undefined,
    isActive: true,
    startTime: undefined,
    endTime: undefined,
    targetUsers: [],
    applicableItems: [],
    tags: [],
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call to /api/loms/promotions
      const mockPromotions: Promotion[] = [
        {
          id: '1',
          contentId: 'content-1',
          code: 'WELCOME10',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          minPurchase: 50,
          maxUses: 100,
          usedCount: 23,
          isActive: true,
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-12-31'),
          targetUsers: ['ALL'],
          applicableItems: ['ALL'],
          createdBy: 'admin',
          content: {
            title: 'Welcome Discount',
            description: '10% off your first purchase',
            tags: ['welcome', 'discount'],
          },
        },
      ];
      setPromotions(mockPromotions);
    } catch (err) {
      setError('Failed to fetch promotions');
      console.error('Error fetching promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromotion = async () => {
    try {
      // TODO: Replace with actual API call to POST /api/loms/promotions
      console.log('Creating promotion:', formData);
      await fetchPromotions(); // Refresh the list
      handleCloseDialog();
    } catch (err) {
      setError('Failed to create promotion');
      console.error('Error creating promotion:', err);
    }
  };

  const handleUpdatePromotion = async () => {
    if (!editingPromotion) return;

    try {
      // TODO: Replace with actual API call to PUT /api/loms/promotions/:id
      console.log('Updating promotion:', editingPromotion.id, formData);
      await fetchPromotions(); // Refresh the list
      handleCloseDialog();
    } catch (err) {
      setError('Failed to update promotion');
      console.error('Error updating promotion:', err);
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;

    try {
      // TODO: Replace with actual API call to DELETE /api/loms/promotions/:id
      console.log('Deleting promotion:', id);
      await fetchPromotions(); // Refresh the list
    } catch (err) {
      setError('Failed to delete promotion');
      console.error('Error deleting promotion:', err);
    }
  };

  const handleOpenCreateDialog = () => {
    setEditingPromotion(null);
    setFormData({
      title: '',
      description: '',
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      minPurchase: 0,
      maxUses: undefined,
      isActive: true,
      startTime: undefined,
      endTime: undefined,
      targetUsers: [],
      applicableItems: [],
      tags: [],
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      title: promotion.content.title,
      description: promotion.content.description || '',
      code: promotion.code,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      minPurchase: promotion.minPurchase,
      maxUses: promotion.maxUses,
      isActive: promotion.isActive,
      startTime: promotion.startTime,
      endTime: promotion.endTime,
      targetUsers: promotion.targetUsers,
      applicableItems: promotion.applicableItems,
      tags: JSON.parse(promotion.content.tags || '[]'),
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPromotion(null);
    setError(null);
  };

  const handleInputChange = (field: keyof CreatePromotionData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Loading promotions...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h6" component="h2">
            Promotion Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Create Promotion
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Usage</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Valid Until</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {promotions.map((promotion) => (
                <TableRow key={promotion.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {promotion.content.title}
                      </Typography>
                      {promotion.content.description && (
                        <Typography variant="body2" color="text.secondary">
                          {promotion.content.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={promotion.code}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {promotion.discountValue}
                      {promotion.discountType === 'PERCENTAGE' ? '%' : ' coins'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {promotion.discountType.replace('_', ' ').toLowerCase()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {promotion.usedCount}
                      {promotion.maxUses ? ` / ${promotion.maxUses}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={promotion.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={promotion.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {promotion.endTime ? (
                      <Typography variant="body2">
                        {promotion.endTime.toLocaleDateString()}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No expiry
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEditDialog(promotion)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeletePromotion(promotion.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Create/Edit Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Promotion Code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  required
                  helperText="Unique code for the promotion"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Discount Type</InputLabel>
                  <Select
                    value={formData.discountType}
                    label="Discount Type"
                    onChange={(e) =>
                      handleInputChange('discountType', e.target.value)
                    }
                  >
                    <MenuItem value="PERCENTAGE">Percentage</MenuItem>
                    <MenuItem value="FIXED_AMOUNT">Fixed Amount</MenuItem>
                    <MenuItem value="FREE_ITEM">Free Item</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Discount Value"
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) =>
                    handleInputChange(
                      'discountValue',
                      parseFloat(e.target.value)
                    )
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Minimum Purchase"
                  type="number"
                  value={formData.minPurchase || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'minPurchase',
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Maximum Uses"
                  type="number"
                  value={formData.maxUses || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'maxUses',
                      parseInt(e.target.value) || undefined
                    )
                  }
                  helperText="Leave empty for unlimited uses"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Start Time"
                  value={formData.startTime}
                  onChange={(date) => handleInputChange('startTime', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="End Time"
                  value={formData.endTime}
                  onChange={(date) => handleInputChange('endTime', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={
                editingPromotion ? handleUpdatePromotion : handleCreatePromotion
              }
              variant="contained"
            >
              {editingPromotion ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add promotion"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleOpenCreateDialog}
        >
          <AddIcon />
        </Fab>
      </Box>
    </LocalizationProvider>
  );
};

export default PromotionManagement;
