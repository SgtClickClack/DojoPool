import { FeedbackForm } from '@/components/Feedback';
import { Box, Breadcrumbs, Container, Link, Typography } from '@mui/material';
import { type NextPage } from 'next';
import { useRouter } from 'next/router';

const FeedbackPage: NextPage = () => {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirect to dashboard or show success message
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
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
        <Typography color="text.primary">Feedback</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Share Your Feedback
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Your feedback helps us improve Dojo Pool. Whether it&apos;s a bug
          report, feature suggestion, or general thoughts, we want to hear from
          you!
        </Typography>
      </Box>

      {/* Feedback Form */}
      <FeedbackForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </Container>
  );
};

export default FeedbackPage;
