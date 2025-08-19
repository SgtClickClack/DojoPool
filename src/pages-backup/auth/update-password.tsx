import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  useToast,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Link as ChakraLink,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../firebase/config';

const UpdatePasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValidCode, setIsValidCode] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const verifyCode = async () => {
      const { oobCode } = router.query;
      if (!oobCode || typeof oobCode !== 'string') {
        setError('Invalid or missing reset code');
        return;
      }

      try {
        await verifyPasswordResetCode(auth, oobCode);
        setIsValidCode(true);
      } catch (error: any) {
        setError('Invalid or expired reset code');
        toast({
          title: 'Invalid Reset Link',
          description: 'This password reset link is invalid or has expired.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    if (router.isReady) {
      verifyCode();
    }
  }, [router.isReady, router.query, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    const { oobCode } = router.query;
    if (!oobCode || typeof oobCode !== 'string') {
      setError('Invalid reset code');
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      toast({
        title: 'Password updated successfully',
        description: 'You can now sign in with your new password.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      router.push('/auth/login');
    } catch (error: any) {
      setError(error.message);
      toast({
        title: 'Failed to update password',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidCode) {
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
        <VStack spacing={4}>
          <Heading size="lg" textAlign="center">
            Invalid Reset Link
          </Heading>
          <Text textAlign="center" color="gray.600">
            This password reset link is invalid or has expired.
          </Text>
          <Link href="/auth/reset-password" passHref>
            <ChakraLink color="blue.500">Request a new reset link</ChakraLink>
          </Link>
        </VStack>
      </Box>
    );
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
      <VStack spacing={6} align="stretch">
        <Heading size="lg" textAlign="center">
          Set New Password
        </Heading>

        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!error}>
              <FormLabel>New Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
              <FormErrorMessage>{error}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Confirm New Password</FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              width="100%"
              isLoading={isLoading}
            >
              Update Password
            </Button>

            <Text textAlign="center">
              Remember your password?{' '}
              <Link href="/auth/login" passHref>
                <ChakraLink color="blue.500">Sign in</ChakraLink>
              </Link>
            </Text>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default UpdatePasswordPage;
