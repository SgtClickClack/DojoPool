import React from 'react';
import { Box, Center } from '@chakra-ui/react';
import { PlayerRegistration } from '../../components/auth/PlayerRegistration';

const RegisterPage: React.FC = () => {
  return (
    <Box minH="100vh" py={10}>
      <Center>
        <PlayerRegistration />
      </Center>
    </Box>
  );
};

export default RegisterPage; 