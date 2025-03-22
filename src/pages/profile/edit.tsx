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
  Select,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';
import { AuthenticatedLayout } from '../../components/layout/AuthenticatedLayout';
import ImageUpload from '../../components/common/ImageUpload';

interface ProfileData {
  playerNickname: string;
  skillLevel: string;
  preferredGameType: string;
  location: string;
  photoURL?: string | null;
}

interface ValidationErrors {
  playerNickname?: string;
  skillLevel?: string;
  preferredGameType?: string;
  location?: string;
}

const EditProfilePage: React.FC = () => {
  const { user, loading, updateUserProfile, fetchUserProfile } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<ProfileData>({
    playerNickname: '',
    skillLevel: '',
    preferredGameType: '',
    location: '',
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchProfileData = async () => {
        try {
          const data = await fetchUserProfile(user.uid) as ProfileData;
          setFormData({
            playerNickname: data.playerNickname || '',
            skillLevel: data.skillLevel || '',
            preferredGameType: data.preferredGameType || '',
            location: data.location || '',
          });
        } catch (error: any) {
          toast({
            title: 'Error fetching profile',
            description: error.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      };
      fetchProfileData();
    }
  }, [user, toast, fetchUserProfile]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: ValidationErrors = {};

    if (!formData.playerNickname) {
      newErrors.playerNickname = 'Player nickname is required';
    }

    if (!formData.skillLevel) {
      newErrors.skillLevel = 'Skill level is required';
    }

    if (!formData.preferredGameType) {
      newErrors.preferredGameType = 'Preferred game type is required';
    }

    if (!formData.location) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!await validateForm()) return;

    setIsLoading(true);
    try {
      const result = await updateUserProfile(formData);
      if (result.success) {
        toast({
          title: 'Profile updated!',
          description: 'Your profile has been successfully updated.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        router.push('/profile');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to update profile',
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
      <Box
        p={8}
        maxWidth="500px"
        mx="auto"
        mt={8}
        borderWidth={1}
        borderRadius="lg"
        boxShadow="lg"
        bg={bgColor}
        borderColor={borderColor}
      >
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Edit Profile</Heading>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.playerNickname}>
                <FormLabel>Player Nickname</FormLabel>
                <Input
                  name="playerNickname"
                  value={formData.playerNickname}
                  onChange={handleInputChange}
                  placeholder="Choose a unique nickname"
                />
                <FormErrorMessage>{errors.playerNickname}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.skillLevel}>
                <FormLabel>Skill Level</FormLabel>
                <Select
                  name="skillLevel"
                  value={formData.skillLevel}
                  onChange={handleInputChange}
                  placeholder="Select your skill level"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="professional">Professional</option>
                </Select>
                <FormErrorMessage>{errors.skillLevel}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.preferredGameType}>
                <FormLabel>Preferred Game Type</FormLabel>
                <Select
                  name="preferredGameType"
                  value={formData.preferredGameType}
                  onChange={handleInputChange}
                  placeholder="Select your preferred game type"
                >
                  <option value="8ball">8-Ball</option>
                  <option value="9ball">9-Ball</option>
                  <option value="straight">Straight Pool</option>
                  <option value="snooker">Snooker</option>
                </Select>
                <FormErrorMessage>{errors.preferredGameType}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.location}>
                <FormLabel>Location</FormLabel>
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter your city or region"
                />
                <FormErrorMessage>{errors.location}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="100%"
                isLoading={isLoading}
              >
                Save Changes
              </Button>

              <Button
                variant="ghost"
                width="100%"
                onClick={() => router.push('/profile')}
              >
                Cancel
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </AuthenticatedLayout>
  );
};

export default EditProfilePage; 