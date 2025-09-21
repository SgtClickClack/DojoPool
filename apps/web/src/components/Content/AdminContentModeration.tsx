import {
  getAllContent,
  getContentStats,
  moderateContent,
} from '@/services/APIService';
import {
  type Content,
  type ContentFilter,
  type ContentListResponse,
  type ContentStats,
  ContentStatus,
  type ModerateContentRequest,
} from '@/types/content';
import { Alert, Box, CircularProgress, Pagination, Paper, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { withErrorBoundary } from '@/components/ErrorBoundary/withErrorBoundary';
import ContentModerationStats from './AdminContentModeration/ContentModerationStats';
import ContentModerationFilters from './AdminContentModeration/ContentModerationFilters';
import ContentModerationTable from './AdminContentModeration/ContentModerationTable';
import ContentModerationDialog from './AdminContentModeration/ContentModerationDialog';

interface AxiosError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface AdminContentModerationProps {
  onContentUpdated?: () => void;
}

export const AdminContentModeration: React.FC<AdminContentModerationProps> = ({
  onContentUpdated,
}) => {
  const [content, setContent] = useState<ContentListResponse | null>(null);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ContentFilter>({});
  const [page, setPage] = useState(1);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [moderateDialogOpen, setModerateDialogOpen] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [moderationData, setModerationData] = useState<ModerateContentRequest>({
    status: ContentStatus.APPROVED,
    moderationNotes: '',
  });

  const loadContent = async () => {
    try {
      setLoading(true);
      const [contentResponse, statsResponse] = await Promise.all([
        getAllContent(filters, page, 20),
        getContentStats(),
      ]);
      setContent(contentResponse);
      setStats(statsResponse);
      setError(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as AxiosError).response?.data?.message ||
            'Failed to load content'
          : 'Failed to load content';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [filters, page]);

  const handleModerate = async () => {
    if (!selectedContent) return;

    setModerating(true);
    try {
      const updatedContent = await moderateContent(
        selectedContent.id,
        moderationData
      );
      setContent((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.map((c) =>
                c.id === selectedContent.id ? updatedContent : c
              ),
            }
          : null
      );
      setModerateDialogOpen(false);
      setSelectedContent(null);
      setModerationData({
        status: ContentStatus.APPROVED,
        moderationNotes: '',
      });
      onContentUpdated?.();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as AxiosError).response?.data?.message ||
            'Failed to moderate content'
          : 'Failed to moderate content';
      setError(errorMessage);
    } finally {
      setModerating(false);
    }
  };

  const openModerateDialog = (content: Content, status: ContentStatus = ContentStatus.APPROVED) => {
    setSelectedContent(content);
    setModerationData({
      status,
      moderationNotes: '',
    });
    setModerateDialogOpen(true);
  };

  const handleViewContent = (content: Content) => {
    if (content.fileUrl) {
      window.open(content.fileUrl, '_blank');
    }
  };

  if (loading && !content) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Content Moderation Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {stats && <ContentModerationStats stats={stats} />}

      <ContentModerationFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      <Paper>
        <ContentModerationTable
          content={content?.content || []}
          onModerate={openModerateDialog}
          onViewContent={handleViewContent}
        />
      </Paper>

      {content && content.pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={content.pagination.totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      <ContentModerationDialog
        open={moderateDialogOpen}
        onClose={() => setModerateDialogOpen(false)}
        onSubmit={handleModerate}
        selectedContent={selectedContent}
        moderationData={moderationData}
        onModerationDataChange={setModerationData}
        moderating={moderating}
      />
    </Box>
  );
};

export default withErrorBoundary(AdminContentModeration, {
  componentName: 'AdminContentModeration',
  showRetry: true,
  showHome: true,
  showReport: true,
});