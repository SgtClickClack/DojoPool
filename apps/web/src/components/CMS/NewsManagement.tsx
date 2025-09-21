import { ContentStatus } from '@/types/content';
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
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div>Loading editor...</div>,
});

import 'react-quill/dist/quill.snow.css';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  summary?: string;
  category?: string;
  featuredImage?: string;
  isFeatured: boolean;
  author?: string;
  publishDate?: string;
  status: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface NewsFormData {
  title: string;
  description: string;
  content: string;
  summary: string;
  category: string;
  featuredImage: string;
  isFeatured: boolean;
  author: string;
  publishDate: Date | null;
  tags: string[];
  metadata: Record<string, unknown>;
}

const NewsManagement: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(
    null
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    description: '',
    content: '',
    summary: '',
    category: 'NEWS',
    featuredImage: '',
    isFeatured: false,
    author: '',
    publishDate: null,
    tags: [],
    metadata: {},
  });

  const categories = [
    'NEWS',
    'ANNOUNCEMENT',
    'UPDATE',
    'FEATURE',
    'GUIDE',
    'INTERVIEW',
  ];

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      // In real implementation, this would call the CMS API
      const response = await fetch('/api/cms/news');
      if (response.ok) {
        const data = await response.json();
        setArticles(data.content || []);
      } else {
        // Mock data for development
        setArticles([
          {
            id: '1',
            title: 'DojoPool Platform Update v2.1 Released',
            description:
              'Exciting new features and improvements in the latest update',
            content:
              "<h2>New Features</h2><p>We've added amazing new features...</p><h3>Improvements</h3><ul><li>Enhanced user interface</li><li>Better performance</li><li>New tournament formats</li></ul>",
            summary:
              'Version 2.1 brings enhanced UI, better performance, and new tournament formats.',
            category: 'UPDATE',
            featuredImage: '/images/update-banner.jpg',
            isFeatured: true,
            author: 'DojoPool Team',
            publishDate: '2025-01-15T10:00:00Z',
            status: 'APPROVED',
            tags: ['update', 'features', 'v2.1'],
            metadata: { version: '2.1', priority: 'high' },
            createdAt: '2025-01-14T15:00:00Z',
            updatedAt: '2025-01-15T10:00:00Z',
          },
          {
            id: '2',
            title: 'Championship Tournament Registration Now Open',
            description: 'Register now for the annual DojoPool Championship',
            content:
              '<p>The annual championship tournament is now accepting registrations...</p>',
            summary:
              'Annual championship tournament registration is now open with $10,000 prize pool.',
            category: 'ANNOUNCEMENT',
            isFeatured: false,
            author: 'Tournament Committee',
            publishDate: '2025-01-20T09:00:00Z',
            status: 'APPROVED',
            tags: ['tournament', 'championship', 'registration'],
            metadata: {
              prizePool: '$10,000',
              registrationDeadline: '2025-02-10',
            },
            createdAt: '2025-01-18T08:00:00Z',
            updatedAt: '2025-01-20T09:00:00Z',
          },
        ]);
      }
    } catch (err) {
      setError('Failed to fetch news articles');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = () => {
    setEditingArticle(null);
    setPreviewMode(false);
    setFormData({
      title: '',
      description: '',
      content: '',
      summary: '',
      category: 'NEWS',
      featuredImage: '',
      isFeatured: false,
      author: '',
      publishDate: null,
      tags: [],
      metadata: {},
    });
    setDialogOpen(true);
  };

  const handleEditArticle = (article: NewsArticle) => {
    setEditingArticle(article);
    setPreviewMode(false);
    setFormData({
      title: article.title,
      description: article.description,
      content: article.content || '',
      summary: article.summary || '',
      category: article.category || 'NEWS',
      featuredImage: article.featuredImage || '',
      isFeatured: article.isFeatured || false,
      author: article.author || '',
      publishDate: article.publishDate ? new Date(article.publishDate) : null,
      tags: article.tags || [],
      metadata: article.metadata || {},
    });
    setDialogOpen(true);
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const response = await fetch(`/api/cms/news/${articleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Article deleted successfully');
        fetchArticles();
      } else {
        setError('Failed to delete article');
      }
    } catch (err) {
      setError('Failed to delete article');
      console.error('Error deleting article:', err);
    }
  };

  const handleSubmit = async () => {
    try {
      const articleData = {
        ...formData,
        publishDate: formData.publishDate?.toISOString(),
        tags: formData.tags.filter((tag) => tag.trim() !== ''),
        metadata: {
          ...formData.metadata,
          category: formData.category,
          wordCount: formData.content.replace(/<[^>]*>/g, '').split(/\s+/)
            .length,
        },
      };

      const url = editingArticle
        ? `/api/cms/news/${editingArticle.id}`
        : '/api/cms/news';
      const method = editingArticle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      if (response.ok) {
        setSuccess(
          editingArticle
            ? 'Article updated successfully'
            : 'Article created successfully'
        );
        setDialogOpen(false);
        fetchArticles();
      } else {
        setError('Failed to save article');
      }
    } catch (err) {
      setError('Failed to save article');
      console.error('Error saving article:', err);
    }
  };

  const handlePreview = async () => {
    try {
      const previewData = {
        ...formData,
        publishDate: formData.publishDate?.toISOString(),
        tags: formData.tags.filter((tag) => tag.trim() !== ''),
        metadata: {
          ...formData.metadata,
          category: formData.category,
        },
      };

      const response = await fetch('/api/cms/preview/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(previewData),
      });

      if (response.ok) {
        setPreviewMode(true);
      } else {
        setError('Failed to generate preview');
      }
    } catch (err) {
      setError('Failed to generate preview');
      console.error('Error generating preview:', err);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingArticle(null);
    setPreviewMode(false);
  };

  const getStatusColor = (
    status: string
  ): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case ContentStatus.APPROVED:
        return 'success';
      case ContentStatus.PENDING:
        return 'warning';
      case ContentStatus.REJECTED:
        return 'error';
      case ContentStatus.ARCHIVED:
        return 'default';
      default:
        return 'default';
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const quillFormats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Loading news articles...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
            News Article Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateArticle}
          >
            Create Article
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Publish Date</TableCell>
                <TableCell>Featured</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {article.title}
                      </Typography>
                      {article.summary && (
                        <Typography variant="caption" color="text.secondary">
                          {article.summary.substring(0, 100)}...
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={article.category || 'NEWS'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={article.status}
                      size="small"
                      color={getStatusColor(article.status)}
                    />
                  </TableCell>
                  <TableCell>{article.author || 'Unknown'}</TableCell>
                  <TableCell>
                    {article.publishDate
                      ? new Date(article.publishDate).toLocaleDateString()
                      : 'Draft'}
                  </TableCell>
                  <TableCell>
                    {article.isFeatured && (
                      <Chip label="Featured" size="small" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEditArticle(article)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteArticle(article.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Create/Edit Article Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="lg"
          fullWidth
          sx={{ '& .MuiDialog-paper': { maxHeight: '90vh' } }}
        >
          <DialogTitle>
            {previewMode
              ? 'Article Preview'
              : editingArticle
                ? 'Edit Article'
                : 'Create New Article'}
          </DialogTitle>
          <DialogContent>
            {!previewMode ? (
              <Box
                sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="Title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        label="Category"
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Summary"
                  value={formData.summary}
                  onChange={(e) =>
                    setFormData({ ...formData, summary: e.target.value })
                  }
                  multiline
                  rows={2}
                  helperText="Brief summary for article previews"
                />

                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  multiline
                  rows={3}
                  required
                />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Content
                  </Typography>
                  <Box sx={{ border: '1px solid #ccc', borderRadius: 1 }}>
                    <ReactQuill
                      value={formData.content}
                      onChange={(content) =>
                        setFormData({ ...formData, content })
                      }
                      modules={quillModules}
                      formats={quillFormats}
                      className="quill-editor"
                    />
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Author"
                      value={formData.author}
                      onChange={(e) =>
                        setFormData({ ...formData, author: e.target.value })
                      }
                    />

                    <TextField
                      fullWidth
                      label="Featured Image URL"
                      value={formData.featuredImage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          featuredImage: e.target.value,
                        })
                      }
                      sx={{ mt: 2 }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isFeatured}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isFeatured: e.target.checked,
                            })
                          }
                        />
                      }
                      label="Featured Article"
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label="Publish Date"
                      value={formData.publishDate}
                      onChange={(date) =>
                        setFormData({ ...formData, publishDate: date })
                      }
                      slotProps={{ textField: { fullWidth: true } }}
                    />

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
                      sx={{ mt: 2 }}
                      helperText="Enter tags separated by commas"
                    />
                  </Grid>
                </Grid>
              </Box>
            ) : (
              // Preview Mode
              <Box sx={{ pt: 2 }}>
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h4" gutterBottom>
                    {formData.title}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    gutterBottom
                  >
                    {formData.summary}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label={formData.category} size="small" />
                    {formData.isFeatured && (
                      <Chip label="Featured" size="small" color="warning" />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      By {formData.author || 'Unknown Author'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {formData.description}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    p: 2,
                    minHeight: '300px',
                  }}
                  dangerouslySetInnerHTML={{ __html: formData.content }}
                />

                {formData.tags.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Tags:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {formData.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {!previewMode ? (
              <>
                <Button onClick={handleCloseDialog}>Cancel</Button>
                <Button onClick={handlePreview} variant="outlined">
                  Preview
                </Button>
                <Button onClick={handleSubmit} variant="contained">
                  {editingArticle ? 'Update' : 'Create'} Article
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setPreviewMode(false)}>
                  Back to Edit
                </Button>
                <Button onClick={handleSubmit} variant="contained">
                  Publish Article
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default NewsManagement;
