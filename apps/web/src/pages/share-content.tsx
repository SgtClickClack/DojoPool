import { ContentUpload } from '@/components/Content';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Button,
  Container,
  Link,
  Typography,
} from '@mui/material';
import { type NextPage } from 'next';
import { useRouter } from 'next/router';

const ShareContentPage: NextPage = () => {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirect to social feed after successful upload
    router.push('/social-feed');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/dashboard">
          Dashboard
        </Link>
        <Link color="inherit" href="/social-feed">
          Social Feed
        </Link>
        <Typography color="text.primary">Share Content</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Share Your Content
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}
        >
          Share your gaming achievements, match replays, custom items, and more
          with the Dojo Pool community.
        </Typography>

        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
          sx={{ mb: 2 }}
        >
          Back to Feed
        </Button>
      </Box>

      {/* Content Upload Component */}
      <ContentUpload onSuccess={handleSuccess} onCancel={handleCancel} />
    </Container>
  );
};

export default ShareContentPage;
