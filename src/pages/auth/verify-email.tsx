import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  useToast,
  Icon,
  Center,
  Spinner,
} from '@chakra-ui/react';
import { FaEnvelope, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const VerifyEmailPage: React.FC = () => {
  const { user, loading, checkEmailVerification, sendVerification } = useAuth();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && checkEmailVerification()) {
      router.push('/dashboard');
    }
  }, [user, checkEmailVerification, router]);

  const handleResendVerification = async () => {
    const result = await sendVerification();
    if (result.success) {
      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox for the verification link.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Failed to send verification email',
        description: result.error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box
      p={8}
      maxWidth="500px"
      mx="auto"
      mt={8}
      borderWidth={1}
      borderRadius="lg"
      boxShadow="lg"
    >
      <VStack spacing={6} align="center">
        <Icon
          as={checkEmailVerification() ? FaCheckCircle : FaEnvelope}
          w={12}
          h={12}
          color={checkEmailVerification() ? 'green.500' : 'blue.500'}
        />

        <Heading size="lg" textAlign="center">
          {checkEmailVerification() ? 'Email Verified!' : 'Verify Your Email'}
        </Heading>

        <Text textAlign="center" color="gray.600">
          {checkEmailVerification()
            ? 'Your email has been successfully verified. You can now access all features.'
            : `We've sent a verification email to ${user.email}. Please check your inbox and click the verification link.`}
        </Text>

        {!checkEmailVerification() && (
          <Button
            colorScheme="blue"
            leftIcon={<FaEnvelope />}
            onClick={handleResendVerification}
            isLoading={loading}
          >
            Resend Verification Email
          </Button>
        )}

        {checkEmailVerification() && (
          <Button
            colorScheme="green"
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default VerifyEmailPage; 