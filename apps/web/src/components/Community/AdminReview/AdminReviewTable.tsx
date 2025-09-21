import {
  Avatar,
  Box,
  Checkbox,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Edit as EditIcon, Visibility as ViewIcon } from '@mui/icons-material';
import React from 'react';

interface CosmeticItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  designFileUrl?: string;
  previewImageUrl?: string;
  status: string;
  rejectionReason?: string;
  likes: number;
  views: number;
  creator: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  reviewer?: {
    id: string;
    username: string;
  };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminReviewTableProps {
  items: CosmeticItem[];
  selectedItems: Set<string>;
  onSelectItem: (itemId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onReviewItem: (item: CosmeticItem) => void;
}

const AdminReviewTable: React.FC<AdminReviewTableProps> = ({
  items,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onReviewItem,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'REQUIRES_CHANGES':
        return 'info';
      default:
        return 'default';
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      CUE_SKIN: 'Cue Skin',
      BALL_SET: 'Ball Set',
      TABLE_THEME: 'Table Theme',
      TABLE_CLOTH: 'Table Cloth',
      AVATAR_FRAME: 'Avatar Frame',
      PARTICLE_EFFECT: 'Particle Effect',
      SOUND_PACK: 'Sound Pack',
      OTHER: 'Other',
    };
    return categories[category] || category;
  };

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={selectedItems.size === items.length && items.length > 0}
                indeterminate={
                  selectedItems.size > 0 && selectedItems.size < items.length
                }
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </TableCell>
            <TableCell>Submission</TableCell>
            <TableCell>Creator</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Stats</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedItems.has(item.id)}
                  onChange={(e) => onSelectItem(item.id, e.target.checked)}
                />
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {item.title}
                  </Typography>
                  {item.description && (
                    <Typography variant="caption" color="text.secondary">
                      {item.description.substring(0, 60)}...
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={item.creator.avatarUrl}
                    sx={{ width: 32, height: 32 }}
                  >
                    {item.creator.username[0].toUpperCase()}
                  </Avatar>
                  <Typography variant="body2">
                    {item.creator.username}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={getCategoryLabel(item.category)}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={item.status}
                  size="small"
                  color={getStatusColor(item.status) as any}
                />
                {item.rejectionReason && (
                  <Tooltip title={`Rejection: ${item.rejectionReason}`}>
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ ml: 1 }}
                    >
                      ⚠️
                    </Typography>
                  </Tooltip>
                )}
              </TableCell>
              <TableCell>
                {new Date(item.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Typography variant="caption">
                  ❤️ {item.likes} | 👁️ {item.views}
                </Typography>
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => onReviewItem(item)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
                {item.designFileUrl && (
                  <IconButton
                    size="small"
                    href={item.designFileUrl}
                    target="_blank"
                    color="info"
                  >
                    <ViewIcon />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AdminReviewTable;
