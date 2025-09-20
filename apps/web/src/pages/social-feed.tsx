import { SocialFeed } from '@/components/Content';
import { type Content } from '@/types/content';
import { Add as AddIcon } from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Container,
  Fab,
  Link,
  Typography,
} from '@mui/material';
import { type NextPage } from 'next';
import { useRouter } from 'next/router';

const SocialFeedPage: NextPage = () => {
  const router = useRouter();

  const handleContentClick = (content: Content) => {
    router.push(`/content/${content.id}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/dashboard">
          Dashboard
        </Link>
        <Typography color="text.primary">Social Feed</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Social Feed
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Discover and share amazing content from the Dojo Pool community.
          </Typography>
        </Box>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="share content"
          onClick={() => router.push('/share-content')}
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* Social Feed Component */}
      <SocialFeed onContentClick={handleContentClick} />
    </Container>
  );
};

export default SocialFeedPage;
