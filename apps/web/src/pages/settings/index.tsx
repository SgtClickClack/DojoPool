import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Button,
  useToast,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  useColorModeValue,
  Divider,
  Switch,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Badge,
  Progress,
  Tooltip,
  useColorMode,
  IconButton,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';
import { AuthenticatedLayout } from '../../components/layout/AuthenticatedLayout';
import {
  FiMail,
  FiLock,
  FiShield,
  FiBell,
  FiTrash2,
  FiDownload,
  FiUser,
  FiKey,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiSun,
  FiMoon,
} from 'react-icons/fi';

interface SettingsForm {
  displayName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  emailNotifications: boolean;
  securityAlerts: boolean;
  deleteAccountPassword: string;
}

interface ValidationErrors {
  displayName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  deleteAccountPassword?: string;
}

const SettingsPage: React.FC = () => {
  const {
    user,
    loading,
    updateUserProfile,
    sendVerification,
    checkEmailVerification,
    deleteUserAccount,
    signIn,
    exportAccountData,
    requestAccountDeletion,
    cancelAccountDeletion,
    getDeletionRequestStatus,
  } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [deleteRequestTime, setDeleteRequestTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [deletionStatus, setDeletionStatus] = useState<
    'pending' | 'completed' | 'cancelled' | null
  >(null);
  const [formData, setFormData] = useState<SettingsForm>({
    displayName: user?.displayName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    securityAlerts: true,
    deleteAccountPassword: '',
  });
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: ValidationErrors = {};

    if (!formData.displayName) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validateForm())) return;

    setIsLoading(true);
    try {
      const result = await updateUserProfile({
        displayName: formData.displayName,
        email: formData.email,
      });

      if (result.success) {
        toast({
          title: 'Settings updated!',
          description: 'Your account settings have been successfully updated.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to update settings',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const result = await sendVerification();
      if (result.success) {
        toast({
          title: 'Verification email sent!',
          description: 'Please check your inbox for the verification link.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to send verification email',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Check deletion status on mount and periodically
  useEffect(() => {
    if (!user) return;

    const checkStatus = async () => {
      const result = await getDeletionRequestStatus();
      if (result.success && result.status) {
        setDeletionStatus(result.status);
        if (result.status === 'pending' && result.scheduledFor) {
          const scheduledTime = new Date(result.scheduledFor);
          setDeleteRequestTime(scheduledTime);
          updateCountdown(scheduledTime);
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user]);

  // Update countdown timer
  useEffect(() => {
    if (!deleteRequestTime) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = deleteRequestTime.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown(0);
        return;
      }
      setCountdown(Math.ceil(diff / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deleteRequestTime]);

  const updateCountdown = (scheduledTime: Date) => {
    const now = new Date();
    const diff = scheduledTime.getTime() - now.getTime();
    setCountdown(Math.ceil(diff / 1000));
  };

  const handleDeleteAccount = async () => {
    if (!formData.deleteAccountPassword) {
      toast({
        title: 'Password required',
        description:
          'Please enter your current password to confirm account deletion.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      // First verify the password
      const signInResult = await signIn(
        user?.email || '',
        formData.deleteAccountPassword
      );
      if (!signInResult.success) {
        throw new Error('Incorrect password');
      }

      // Request account deletion
      const result = await requestAccountDeletion();
      if (result.success) {
        toast({
          title: 'Deletion requested',
          description:
            'Your account will be deleted after the cooldown period. You can cancel this request at any time.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to request account deletion',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const result = await cancelAccountDeletion();
      if (result.success) {
        setDeletionStatus(null);
        setDeleteRequestTime(null);
        setCountdown(0);
        toast({
          title: 'Deletion cancelled',
          description: 'Your account deletion request has been cancelled.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to cancel deletion',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      const result = await exportAccountData();
      if (result.success && 'data' in result) {
        // Create a blob from the data
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);

        // Create a temporary link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `dojo-pool-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: 'Data exported successfully',
          description: 'Your account data has been downloaded.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to export data',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <AuthenticatedLayout>
      <Box p={8} maxWidth="1200px" mx="auto" mt={8}>
        <Flex mb={8} align="center">
          <Heading size="lg">Account Settings</Heading>
          <Spacer />
          <Tooltip
            label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
          >
            <IconButton
              aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              onClick={toggleColorMode}
              variant="ghost"
              size="lg"
            />
          </Tooltip>
        </Flex>

        {!checkEmailVerification() && (
          <Card mb={8} bg="yellow.50" borderColor="yellow.200">
            <CardBody>
              <HStack>
                <AlertIcon color="yellow.500" />
                <Box>
                  <AlertTitle>Email not verified</AlertTitle>
                  <AlertDescription>
                    Please verify your email address to access all features.
                    <Button
                      variant="link"
                      colorScheme="yellow"
                      onClick={handleResendVerification}
                      ml={2}
                    >
                      Resend verification email
                    </Button>
                  </AlertDescription>
                </Box>
              </HStack>
            </CardBody>
          </Card>
        )}

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          {/* Profile Information Card */}
          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader>
              <HStack>
                <Icon as={FiUser} />
                <Heading size="md">Profile Information</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isInvalid={!!errors.displayName}>
                    <FormLabel>Display Name</FormLabel>
                    <Input
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      placeholder="Your display name"
                      _hover={{ bg: hoverBg }}
                    />
                    <FormErrorMessage>{errors.displayName}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.email}>
                    <FormLabel>Email</FormLabel>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Your email address"
                      _hover={{ bg: hoverBg }}
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="100%"
                    isLoading={isLoading}
                    leftIcon={<FiCheckCircle />}
                  >
                    Save Changes
                  </Button>
                </VStack>
              </form>
            </CardBody>
          </Card>

          {/* Security Settings Card */}
          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader>
              <HStack>
                <Icon as={FiShield} />
                <Heading size="md">Security Settings</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FormControl isInvalid={!!errors.currentPassword}>
                  <FormLabel>Current Password</FormLabel>
                  <Input
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your current password"
                    _hover={{ bg: hoverBg }}
                  />
                  <FormErrorMessage>{errors.currentPassword}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.newPassword}>
                  <FormLabel>New Password</FormLabel>
                  <Input
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your new password"
                    _hover={{ bg: hoverBg }}
                  />
                  <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.confirmPassword}>
                  <FormLabel>Confirm New Password</FormLabel>
                  <Input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your new password"
                    _hover={{ bg: hoverBg }}
                  />
                  <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Notification Settings Card */}
          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader>
              <HStack>
                <Icon as={FiBell} />
                <Heading size="md">Notification Settings</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Email Notifications</FormLabel>
                  <Switch
                    name="emailNotifications"
                    isChecked={formData.emailNotifications}
                    onChange={handleInputChange}
                    colorScheme="blue"
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Security Alerts</FormLabel>
                  <Switch
                    name="securityAlerts"
                    isChecked={formData.securityAlerts}
                    onChange={handleInputChange}
                    colorScheme="blue"
                  />
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Account Management Card */}
          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader>
              <HStack>
                <Icon as={FiKey} />
                <Heading size="md">Account Management</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {deletionStatus === 'pending' && (
                  <Card bg="red.50" borderColor="red.200">
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <HStack>
                          <AlertIcon color="red.500" />
                          <AlertTitle>Account Deletion Pending</AlertTitle>
                        </HStack>
                        <Box>
                          <Text mb={2}>Time remaining:</Text>
                          <HStack>
                            <Icon as={FiClock} color="red.500" />
                            <Text
                              fontSize="xl"
                              fontWeight="bold"
                              color="red.500"
                            >
                              {formatTime(countdown)}
                            </Text>
                          </HStack>
                        </Box>
                        <Progress
                          value={(countdown / (24 * 60 * 60)) * 100}
                          colorScheme="red"
                        />
                        <Button
                          colorScheme="red"
                          variant="outline"
                          onClick={handleCancelDeletion}
                          isLoading={isLoading}
                          leftIcon={<FiXCircle />}
                        >
                          Cancel Deletion
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {!deletionStatus && (
                  <>
                    <Button
                      colorScheme="blue"
                      variant="outline"
                      onClick={handleExportData}
                      isLoading={isLoading}
                      leftIcon={<FiDownload />}
                    >
                      Export Account Data
                    </Button>
                    <Button
                      colorScheme="red"
                      variant="outline"
                      onClick={onOpen}
                      isLoading={isLoading}
                      leftIcon={<FiTrash2 />}
                    >
                      Delete Account
                    </Button>
                  </>
                )}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Delete Account Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Delete Account</ModalHeader>
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                      This action cannot be undone. Your account will be
                      permanently deleted after a 24-hour cooldown period.
                    </AlertDescription>
                  </Box>
                </Alert>
                <FormControl isInvalid={!!errors.deleteAccountPassword}>
                  <FormLabel>Enter your password to confirm</FormLabel>
                  <Input
                    type="password"
                    name="deleteAccountPassword"
                    value={formData.deleteAccountPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your current password"
                    _hover={{ bg: hoverBg }}
                  />
                  <FormErrorMessage>
                    {errors.deleteAccountPassword}
                  </FormErrorMessage>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteAccount}
                isLoading={isLoading}
                leftIcon={<FiTrash2 />}
              >
                Request Deletion
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </AuthenticatedLayout>
  );
};

export default SettingsPage;
