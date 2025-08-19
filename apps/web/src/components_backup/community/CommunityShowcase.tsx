import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  IconButton,
  Avatar,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Pagination,
} from '@mui/material';
import {
  Search,
  FilterList,
  Favorite,
  FavoriteBorder,
  Download,
  Share,
  Visibility,
  Star,
  TrendingUp,
  NewReleases,
  ThumbUp,
} from '@mui/icons-material';
import UseThisPromptButton from './UseThisPromptButton';

interface CommunityTexture {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  textureUrl: string;
  thumbnailUrl: string;
  prompt: string;
  style: 'realistic' | 'cartoon' | 'artistic' | 'cyberpunk';
  resolution: string;
  createdAt: string;
  likes: number;
  downloads: number;
  shares: number;
  views: number;
  featured: boolean;
  tags: string[];
  category: 'character' | 'environment' | 'object' | 'abstract' | 'other';
  usedByCount: number;
}

interface CommunityShowcaseProps {
  userId: string;
  avatarId: string;
}

const CommunityShowcase: React.FC<CommunityShowcaseProps> = ({
  userId,
  avatarId,
}) => {
  const theme = useTheme();
  const [textures, setTextures] = useState<CommunityTexture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [likedTextures, setLikedTextures] = useState<Set<string>>(new Set());

  // Cyberpunk neon colors
  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
    purple: '#8b00ff',
  };

  const tabs = [
    { label: 'All', value: 'all', icon: <FilterList /> },
    { label: 'Featured', value: 'featured', icon: <Star /> },
    { label: 'Trending', value: 'trending', icon: <TrendingUp /> },
    { label: 'New', value: 'newest', icon: <NewReleases /> },
  ];

  useEffect(() => {
    loadTextures();
  }, [selectedTab, searchQuery, selectedCategory, selectedStyle, sortBy, page]);

  const loadTextures = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams: Record<string, string> = {
        limit: '12',
        offset: ((page - 1) * 12).toString(),
      };

      // Add filters based on selected tab
      if (selectedTab === 1) queryParams.featured = 'true';
      if (selectedTab === 2) queryParams.sortBy = 'trending';
      if (selectedTab === 3) queryParams.sortBy = 'newest';
      if (selectedTab === 0 && sortBy !== 'newest') queryParams.sortBy = sortBy;

      if (searchQuery) queryParams.search = searchQuery;
      if (selectedCategory !== 'all') queryParams.category = selectedCategory;
      if (selectedStyle !== 'all') queryParams.style = selectedStyle;

      // Mock API call - in production this would be a GraphQL query
      const mockTextures: CommunityTexture[] = [
        {
          id: 'texture-1',
          userId: 'user-1',
          username: 'TextureMaster',
          userAvatar: '/avatars/user1.png',
          textureUrl: '/api/textures/community/texture-1.png',
          thumbnailUrl: '/api/textures/community/texture-1_thumb.png',
          prompt: 'cyberpunk neon texture with glowing circuits',
          style: 'cyberpunk',
          resolution: '1024x1024',
          createdAt: '2024-03-01T10:00:00Z',
          likes: 45,
          downloads: 123,
          shares: 12,
          views: 567,
          featured: true,
          tags: ['cyberpunk', 'neon', 'circuits', 'futuristic'],
          category: 'character',
          usedByCount: 89,
        },
        {
          id: 'texture-2',
          userId: 'user-2',
          username: 'CyberArtist',
          userAvatar: '/avatars/user2.png',
          textureUrl: '/api/textures/community/texture-2.png',
          thumbnailUrl: '/api/textures/community/texture-2_thumb.png',
          prompt: 'medieval leather armor with gold trim',
          style: 'realistic',
          resolution: '2048x2048',
          createdAt: '2024-03-02T14:30:00Z',
          likes: 67,
          downloads: 234,
          shares: 18,
          views: 890,
          featured: false,
          tags: ['medieval', 'leather', 'armor', 'gold', 'fantasy'],
          category: 'character',
          usedByCount: 156,
        },
        {
          id: 'texture-3',
          userId: 'user-1',
          username: 'TextureMaster',
          userAvatar: '/avatars/user1.png',
          textureUrl: '/api/textures/community/texture-3.png',
          thumbnailUrl: '/api/textures/community/texture-3_thumb.png',
          prompt: 'futuristic holographic material',
          style: 'artistic',
          resolution: '1024x1024',
          createdAt: '2024-03-03T09:15:00Z',
          likes: 89,
          downloads: 345,
          shares: 25,
          views: 1234,
          featured: true,
          tags: ['holographic', 'futuristic', 'material', 'sci-fi'],
          category: 'environment',
          usedByCount: 234,
        },
      ];

      setTextures(mockTextures);
      setTotalPages(Math.ceil(50 / 12)); // Mock total count
    } catch (error) {
      setError('Failed to load community textures');
      console.error('Error loading textures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (textureId: string) => {
    try {
      const response = await fetch('/api/community-showcase/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, textureId }),
      });

      if (response.ok) {
        setLikedTextures((prev) => new Set([...prev, textureId]));
        // Update texture likes count
        setTextures((prev) =>
          prev.map((texture) =>
            texture.id === textureId
              ? { ...texture, likes: texture.likes + 1 }
              : texture
          )
        );
      }
    } catch (error) {
      console.error('Error liking texture:', error);
    }
  };

  const handleDownload = async (textureId: string) => {
    try {
      const response = await fetch('/api/community-showcase/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, textureId }),
      });

      if (response.ok) {
        // Update texture downloads count
        setTextures((prev) =>
          prev.map((texture) =>
            texture.id === textureId
              ? { ...texture, downloads: texture.downloads + 1 }
              : texture
          )
        );
      }
    } catch (error) {
      console.error('Error downloading texture:', error);
    }
  };

  const handleShare = async (textureId: string, platform: string = 'link') => {
    try {
      const response = await fetch('/api/community-showcase/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, textureId, platform }),
      });

      if (response.ok) {
        // Update texture shares count
        setTextures((prev) =>
          prev.map((texture) =>
            texture.id === textureId
              ? { ...texture, shares: texture.shares + 1 }
              : texture
          )
        );
      }
    } catch (error) {
      console.error('Error sharing texture:', error);
    }
  };

  const getStyleColor = (style: string) => {
    switch (style) {
      case 'realistic':
        return neonColors.primary;
      case 'cartoon':
        return neonColors.warning;
      case 'artistic':
        return neonColors.purple;
      case 'cyberpunk':
        return neonColors.secondary;
      default:
        return neonColors.info;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Typography
        variant="h3"
        sx={{
          mb: 3,
          fontWeight: 'bold',
          background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.secondary} 90%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
        }}
      >
        Community Showcase
      </Typography>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => {
            setSelectedTab(newValue);
            setPage(1);
          }}
          sx={{
            '& .MuiTab-root': {
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: neonColors.primary,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: neonColors.primary,
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={tab.value}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search textures, prompts, or creators..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            InputProps={{
              startAdornment: (
                <Search sx={{ mr: 1, color: theme.palette.text.secondary }} />
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="character">Character</MenuItem>
              <MenuItem value="environment">Environment</MenuItem>
              <MenuItem value="object">Object</MenuItem>
              <MenuItem value="abstract">Abstract</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Style</InputLabel>
            <Select
              value={selectedStyle}
              onChange={(e) => {
                setSelectedStyle(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">All Styles</MenuItem>
              <MenuItem value="realistic">Realistic</MenuItem>
              <MenuItem value="cartoon">Cartoon</MenuItem>
              <MenuItem value="artistic">Artistic</MenuItem>
              <MenuItem value="cyberpunk">Cyberpunk</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="popular">Popular</MenuItem>
              <MenuItem value="trending">Trending</MenuItem>
              <MenuItem value="most_liked">Most Liked</MenuItem>
              <MenuItem value="most_downloaded">Most Downloaded</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: neonColors.primary }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <>
          {/* Texture Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {textures.map((texture) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={texture.id}>
                <Card
                  sx={{
                    background: alpha(theme.palette.background.paper, 0.95),
                    border: `1px solid ${alpha(neonColors.primary, 0.2)}`,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 25px ${alpha(neonColors.primary, 0.3)}`,
                      border: `1px solid ${alpha(neonColors.primary, 0.4)}`,
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={texture.thumbnailUrl}
                    alt={texture.prompt}
                    sx={{
                      objectFit: 'cover',
                      backgroundColor: alpha(
                        theme.palette.background.default,
                        0.1
                      ),
                    }}
                  />
                  <CardContent sx={{ p: 2 }}>
                    {/* User Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar
                        src={texture.userAvatar}
                        sx={{ width: 24, height: 24, mr: 1 }}
                      >
                        {texture.username[0]}
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        {texture.username}
                      </Typography>
                      {texture.featured && (
                        <Star
                          sx={{
                            ml: 'auto',
                            color: neonColors.warning,
                            fontSize: 16,
                          }}
                        />
                      )}
                    </Box>

                    {/* Prompt */}
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1,
                        fontWeight: 'medium',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {texture.prompt}
                    </Typography>

                    {/* Tags */}
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 0.5,
                        mb: 2,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Chip
                        size="small"
                        label={texture.style}
                        sx={{
                          backgroundColor: alpha(
                            getStyleColor(texture.style),
                            0.2
                          ),
                          color: getStyleColor(texture.style),
                          fontSize: '0.7rem',
                        }}
                      />
                      <Chip
                        size="small"
                        label={texture.category}
                        sx={{
                          backgroundColor: alpha(neonColors.info, 0.2),
                          color: neonColors.info,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>

                    {/* Stats */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2,
                        fontSize: '0.75rem',
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <ThumbUp sx={{ fontSize: 12 }} />
                        <span>{texture.likes}</span>
                      </Box>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <Download sx={{ fontSize: 12 }} />
                        <span>{texture.downloads}</span>
                      </Box>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <Visibility sx={{ fontSize: 12 }} />
                        <span>{texture.views}</span>
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <UseThisPromptButton
                        originalPrompt={texture.prompt}
                        originalStyle={texture.style}
                        originalCategory={texture.category}
                        userId={userId}
                        avatarId={avatarId}
                        variant="chip"
                        size="small"
                      />

                      <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleLike(texture.id)}
                          sx={{
                            color: likedTextures.has(texture.id)
                              ? neonColors.error
                              : theme.palette.text.secondary,
                          }}
                        >
                          {likedTextures.has(texture.id) ? (
                            <Favorite fontSize="small" />
                          ) : (
                            <FavoriteBorder fontSize="small" />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(texture.id)}
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          <Download fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleShare(texture.id)}
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          <Share fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: theme.palette.text.secondary,
                    '&.Mui-selected': {
                      backgroundColor: alpha(neonColors.primary, 0.2),
                      color: neonColors.primary,
                    },
                  },
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default CommunityShowcase;
