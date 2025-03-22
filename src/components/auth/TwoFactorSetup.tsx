import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Image,
  HStack,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useAuth } from '@/hooks/useAuth';

interface TwoFactorSetupProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const initialize2FA = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/2fa/setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to initialize 2FA');
        }
        
        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setStep('verify');
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to initialize 2FA setup',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    initialize2FA();
  }, [toast]);

  const handleVerification = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode }),
      });
      
      if (!response.ok) {
        throw new Error('Invalid verification code');
      }
      
      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setStep('backup');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid verification code',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to enable 2FA');
      }
      
      toast({
        title: 'Success',
        description: 'Two-factor authentication enabled successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to enable 2FA',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={6} maxW="md" mx="auto">
      <VStack spacing={6} align="stretch">
        {step === 'setup' && (
          <>
            <Text fontSize="xl" fontWeight="bold">
              Set Up Two-Factor Authentication
            </Text>
            <Text>
              Scan the QR code with your authenticator app to enable 2FA.
            </Text>
            {qrCode && (
              <Box p={4} borderWidth={1} borderRadius="md">
                <Image src={`data:image/png;base64,${qrCode}`} alt="2FA QR Code" />
                <Text mt={2} fontSize="sm" color="gray.500">
                  Manual entry code: {secret}
                </Text>
              </Box>
            )}
          </>
        )}

        {step === 'verify' && (
          <>
            <Text fontSize="xl" fontWeight="bold">
              Verify Setup
            </Text>
            <Text>
              Enter the code from your authenticator app to verify the setup.
            </Text>
            <FormControl>
              <FormLabel>Verification Code</FormLabel>
              <Input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </FormControl>
            <Button
              colorScheme="blue"
              onClick={handleVerification}
              isLoading={loading}
            >
              Verify
            </Button>
          </>
        )}

        {step === 'backup' && (
          <>
            <Text fontSize="xl" fontWeight="bold">
              Backup Codes
            </Text>
            <Alert status="warning">
              <AlertIcon />
              <Box>
                <AlertTitle>Save these backup codes!</AlertTitle>
                <AlertDescription>
                  You can use these codes to access your account if you lose your
                  authenticator device. Each code can only be used once.
                </AlertDescription>
              </Box>
            </Alert>
            <Box
              p={4}
              borderWidth={1}
              borderRadius="md"
              bg="gray.50"
              fontFamily="monospace"
            >
              {backupCodes.map((code, index) => (
                <Text key={index} mb={2}>
                  {code}
                </Text>
              ))}
            </Box>
            <Button
              colorScheme="blue"
              onClick={handleComplete}
              isLoading={loading}
            >
              Complete Setup
            </Button>
          </>
        )}

        <Divider />

        <HStack justify="space-between">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}; 