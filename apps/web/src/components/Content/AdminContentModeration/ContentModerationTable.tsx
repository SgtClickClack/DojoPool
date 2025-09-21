import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Archive as ArchiveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import React from 'react';
import {
  Content,
  ContentStatus,
  ContentType,
  ContentVisibility,
} from '@/types/content';

const statusColors = {
  [ContentStatus.PENDING]: {
    bg: 'warning.light',
    color: 'warning.contrastText',
  },
  [ContentStatus.APPROVED]: {
    bg: 'success.light',
    color: 'success.contrastText',
  },
  [ContentStatus.REJECTED]: { bg: 'error.light', color: 'error.contrastText' },
  [ContentStatus.ARCHIVED]: { bg: 'grey.400', color: 'grey.contrastText' },
} as const;

const contentTypeLabels = {
  [ContentType.MATCH_REPLAY]: '🎮 Match',
  [ContentType.CUSTOM_ITEM]: '🎨 Custom',
  [ContentType.HIGH_SCORE]: '🏆 Score',
  [ContentType.ACHIEVEMENT]: '🎯 Achievement',
  [ContentType.TOURNAMENT_HIGHLIGHT]: '🏟️ Tournament',
  [ContentType.VENUE_REVIEW]: '🏢 Venue',
  [ContentType.GENERAL]: '💬 General',
  [ContentType.EVENT]: '📅 Event',
  [ContentType.NEWS_ARTICLE]: '📰 News',
  [ContentType.SYSTEM_MESSAGE]: '📢 System',
};

const visibilityLabels = {
  [ContentVisibility.PUBLIC]: '🌐 Public',
  [ContentVisibility.FRIENDS_ONLY]: '👥 Friends',
  [ContentVisibility.PRIVATE]: '🔒 Private',
};

interface ContentModerationTableProps {
  content: Content[];
  onModerate: (content: Content, status: ContentStatus) => void;
  onViewContent: (content: Content) => void;
}

const ContentModerationTable: React.FC<ContentModerationTableProps> = ({
  content,
  onModerate,
  onViewContent,
}) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Content</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Visibility</TableCell>
            <TableCell>Stats</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {content.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Box>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.title}
                  </Typography>
                  {item.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                      }}
                    >
                      {item.description}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={item.user.avatarUrl}
                    sx={{ width: 32, height: 32, mr: 1 }}
                  >
                    {item.user.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2">
                    {item.user.username}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={contentTypeLabels[item.contentType]}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={item.status.replace('_', ' ')}
                  size="small"
                  sx={{
                    bgcolor: statusColors[item.status].bg,
                    color: statusColors[item.status].color,
                  }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="caption">
                  {visibilityLabels[item.visibility]}
                </Typography>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="caption" display="block">
                    ❤️ {item.likes} 👍 {item.shares}
                  </Typography>
                  <Typography variant="caption" display="block">
                    👁️ {item.views}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="caption">
                  {new Date(item.createdAt).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => onViewContent(item)}
                    disabled={!item.fileUrl}
                  >
                    <ViewIcon />
                  </IconButton>

                  {item.status === ContentStatus.PENDING && (
                    <>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => onModerate(item, ContentStatus.APPROVED)}
                      >
                        <ApproveIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onModerate(item, ContentStatus.REJECTED)}
                      >
                        <RejectIcon />
                      </IconButton>
                    </>
                  )}

                  {item.status === ContentStatus.APPROVED && (
                    <IconButton
                      size="small"
                      color="default"
                      onClick={() => onModerate(item, ContentStatus.ARCHIVED)}
                    >
                      <ArchiveIcon />
                    </IconButton>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ContentModerationTable;
