import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  useToast,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  useColorModeValue,
  Image,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';
import { AuthenticatedLayout } from '../../components/layout/AuthenticatedLayout';

interface ProfileData {
  playerNickname: string;
  skillLevel: string;
  preferredGameType: string;
  location: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

const ProfilePage: React.FC = () => {
  const { user, loading, fetchUserProfile } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        setIsLoading(true);
        try {
          const data = await fetchUserProfile(user.uid) as ProfileData;
          setProfileData(data);
        } catch (error: any) {
          toast({
            title: 'Error fetching profile',
            description: error.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchProfileData();
    }
  }, [user, toast, fetchUserProfile]);

  if (loading || isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <AuthenticatedLayout>
      <Box
        p={8}
        maxWidth="800px"
        mx="auto"
        mt={8}
        borderWidth={1}
        borderRadius="lg"
        boxShadow="lg"
        bg={bgColor}
        borderColor={borderColor}
      >
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Profile</Heading>

          <Box display="flex" justifyContent="center" mb={6}>
            <Image
              src={profileData?.photoURL || '/default-avatar.png'}
              alt="Profile picture"
              borderRadius="full"
              boxSize="150px"
              objectFit="cover"
              fallbackSrc="/default-avatar.png"
            />
          </Box>

          <Grid templateColumns="repeat(2, 1fr)" gap={6}>
            <GridItem>
              <Stat>
                <StatLabel>Player Nickname</StatLabel>
                <StatNumber>{profileData?.playerNickname || 'Not set'}</StatNumber>
                <StatHelpText>Your unique identifier in the game</StatHelpText>
              </Stat>
            </GridItem>

            <GridItem>
              <Stat>
                <StatLabel>Skill Level</StatLabel>
                <StatNumber>{profileData?.skillLevel || 'Not set'}</StatNumber>
                <StatHelpText>Your current skill rating</StatHelpText>
              </Stat>
            </GridItem>

            <GridItem>
              <Stat>
                <StatLabel>Preferred Game Type</StatLabel>
                <StatNumber>{profileData?.preferredGameType || 'Not set'}</StatNumber>
                <StatHelpText>Your favorite pool variant</StatHelpText>
              </Stat>
            </GridItem>

            <GridItem>
              <Stat>
                <StatLabel>Location</StatLabel>
                <StatNumber>{profileData?.location || 'Not set'}</StatNumber>
                <StatHelpText>Your city or region</StatHelpText>
              </Stat>
            </GridItem>
          </Grid>

          <Divider />

          <VStack spacing={4} align="stretch">
            <Heading size="md">Account Information</Heading>
            
            <Stat>
              <StatLabel>Email</StatLabel>
              <StatNumber>{user.email}</StatNumber>
              <StatHelpText>
                {user.emailVerified ? 'Verified' : 'Not verified'}
              </StatHelpText>
            </Stat>

            <Stat>
              <StatLabel>Display Name</StatLabel>
              <StatNumber>{user.displayName || 'Not set'}</StatNumber>
              <StatHelpText>Your public display name</StatHelpText>
            </Stat>
          </VStack>

          <Button
            colorScheme="blue"
            onClick={() => router.push('/profile/edit')}
            mt={4}
          >
            Edit Profile
          </Button>
        </VStack>
      </Box>
    </AuthenticatedLayout>
  );
};

export default ProfilePage; 