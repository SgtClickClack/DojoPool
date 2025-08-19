import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Dojo, UpdateDojoData } from '../../services/dojo.service';

interface EditDojoModalProps {
  dojo: Dojo | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedDojo: Dojo) => void;
}

const EditDojoModal: React.FC<EditDojoModalProps> = ({
  dojo,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<UpdateDojoData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dojo) {
      setFormData({
        name: dojo.name,
        location: dojo.location,
        status: dojo.status,
        owner: dojo.owner,
      });
      setError(null);
    }
  }, [dojo]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dojo) return;

    setLoading(true);
    setError(null);

    try {
      // Import the service dynamically to avoid circular dependencies
      const { dojoService } = await import('../../services/dojo.service');
      const updatedDojo = await dojoService.updateDojo(dojo.id, formData);
      onUpdate(updatedDojo);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dojo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setError(null);
    setLoading(false);
    onClose();
  };

  if (!dojo) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Dojo: {dojo.name}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Dojo Name"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              required
              fullWidth
            />

            <TextField
              label="Location"
              name="location"
              value={formData.location || ''}
              onChange={handleInputChange}
              required
              fullWidth
            />

            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status || ''}
                onChange={(e) => handleSelectChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Owner"
              name="owner"
              value={formData.owner || ''}
              onChange={handleInputChange}
              required
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Updating...' : 'Update Dojo'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditDojoModal;
