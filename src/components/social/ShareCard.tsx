import React, { useState } from "react";
import { Share } from "../../types/share";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Box,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
} from "@mui/icons-material";

interface ShareCardProps {
  share: Share;
  onDelete?: (shareId: number) => void;
}

export const ShareCard: React.FC<ShareCardProps> = ({ share, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(share.id);
    }
    handleMenuClose();
  };

  const handleShare = () => {
    setShowShareMenu(true);
    handleMenuClose();
  };

  const handleSocialShare = (platform: string) => {
    const shareData = {
      title: share.title,
      description: share.description || "",
      url: window.location.origin + `/share/${share.id}`,
    };

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.title)}&url=${encodeURIComponent(shareData.url)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.title)}`,
    };

    window.open(shareUrls[platform as keyof typeof shareUrls], "_blank");
    setShowShareMenu(false);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        action={
          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
        }
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6">{share.title}</Typography>
            <Chip
              label={share.content_type}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        }
        subheader={formatDistanceToNow(new Date(share.created_at), {
          addSuffix: true,
        })}
      />
      <CardContent>
        {share.description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {share.description}
          </Typography>
        )}
        {share.metadata && (
          <Box sx={{ mt: 1 }}>
            {Object.entries(share.metadata).map(([key, value]) => (
              <Chip
                key={key}
                label={`${key}: ${value}`}
                size="small"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        )}
      </CardContent>
      <CardActions>
        <IconButton onClick={handleShare}>
          <ShareIcon />
        </IconButton>
      </CardActions>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleShare}>
          <ShareIcon sx={{ mr: 1 }} /> Share
        </MenuItem>
        {onDelete && (
          <MenuItem onClick={handleDelete}>
            <DeleteIcon sx={{ mr: 1 }} /> Delete
          </MenuItem>
        )}
      </Menu>

      <Menu
        anchorEl={document.body}
        open={showShareMenu}
        onClose={() => setShowShareMenu(false)}
      >
        <MenuItem onClick={() => handleSocialShare("facebook")}>
          <FacebookIcon sx={{ mr: 1 }} /> Facebook
        </MenuItem>
        <MenuItem onClick={() => handleSocialShare("twitter")}>
          <TwitterIcon sx={{ mr: 1 }} /> Twitter
        </MenuItem>
        <MenuItem onClick={() => handleSocialShare("linkedin")}>
          <LinkedInIcon sx={{ mr: 1 }} /> LinkedIn
        </MenuItem>
      </Menu>
    </Card>
  );
};
