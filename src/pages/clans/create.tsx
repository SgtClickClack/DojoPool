import CreateClanForm from '@/components/clans/CreateClanForm';
import { Box, Container, Typography } from '@mui/material';
import React from 'react';

const CreateClanPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontWeight: 'bold', mb: 2 }}
        >
          Create New Clan
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Build your own community and lead players to victory in clan wars and
          territory battles.
        </Typography>
      </Box>

      <CreateClanForm />
    </Container>
  );
};

export default CreateClanPage;
