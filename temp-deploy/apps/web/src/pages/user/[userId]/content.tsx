import { SocialFeed } from '@/components/Content';
import {
  Alert,
  Box,
  Breadcrumbs,
  Container,
  Link,
  Typography,
} from '@mui/material';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

const UserContentPage: NextPage = () => {
  const router = useRouter();
  const { userId } = router.query;

  if (!userId || typeof userId !== 'string') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Invalid user ID</Alert>
      </Container>
    );
  }

  const handleContentClick = (content: any) => {
    router.push(`/content/${content.id}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/dashboard">
          Dashboard
        </Link>
        <Link color="inherit" href="/social-feed">
          Social Feed
        </Link>
        <Typography color="text.primary">User Content</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          User Content
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Explore content shared by this community member.
        </Typography>
      </Box>

      {/* User Content Feed */}
      <SocialFeed
        userId={userId}
        showFilters={false}
        onContentClick={handleContentClick}
      />
    </Container>
  );
};

export default UserContentPage;
