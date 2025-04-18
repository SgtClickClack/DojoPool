import React, { useState } from "react";
import {
  Box,
  Button,
  HStack,
  Icon,
  Text,
  useToast,
  Tooltip,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import {
  FaGoogle,
  FaFacebook,
  FaTwitter,
  FaGithub,
  FaApple,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";

interface SocialSignInProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const SocialSignIn: React.FC<SocialSignInProps> = ({
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  const toast = useToast();
  const {
    signInWithGooglePopup,
    signInWithFacebookPopup,
    signInWithTwitterPopup,
    signInWithGithubPopup,
    signInWithApplePopup,
  } = useAuth();

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  const handleSocialSignIn = async (
    provider: string,
    signInFunction: () => Promise<any>,
  ) => {
    if (loading) return;

    try {
      setLoading(provider);
      const result = await signInFunction();

      if (result.success) {
        toast({
          title: "Sign in successful!",
          description: "Please complete your profile",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        onSuccess?.();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      const currentRetries = retryCount[provider] || 0;

      if (currentRetries < MAX_RETRIES) {
        setRetryCount((prev) => ({ ...prev, [provider]: currentRetries + 1 }));
        setTimeout(() => {
          handleSocialSignIn(provider, signInFunction);
        }, RETRY_DELAY);
      } else {
        toast({
          title: "Sign in failed",
          description: error.message || "An error occurred during sign in",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        onError?.(error);
      }
    } finally {
      setLoading(null);
    }
  };

  const socialProviders = [
    {
      name: "Google",
      icon: FaGoogle,
      color: "red.500",
      onClick: () => handleSocialSignIn("google", signInWithGooglePopup),
    },
    {
      name: "Facebook",
      icon: FaFacebook,
      color: "blue.500",
      onClick: () => handleSocialSignIn("facebook", signInWithFacebookPopup),
    },
    {
      name: "Twitter",
      icon: FaTwitter,
      color: "blue.400",
      onClick: () => handleSocialSignIn("twitter", signInWithTwitterPopup),
    },
    {
      name: "GitHub",
      icon: FaGithub,
      color: "gray.700",
      onClick: () => handleSocialSignIn("github", signInWithGithubPopup),
    },
    {
      name: "Apple",
      icon: FaApple,
      color: "gray.800",
      onClick: () => handleSocialSignIn("apple", signInWithApplePopup),
    },
  ];

  return (
    <VStack spacing={4} width="100%">
      <Text fontSize="sm" color="gray.500">
        Or continue with
      </Text>
      <HStack spacing={2} justify="center" width="100%">
        {socialProviders.map((provider) => (
          <Tooltip
            key={provider.name}
            label={`Sign in with ${provider.name}`}
            placement="top"
          >
            <Button
              aria-label={`Sign in with ${provider.name}`}
              onClick={provider.onClick}
              isLoading={loading === provider.name.toLowerCase()}
              loadingText="Signing in..."
              spinner={<Spinner size="sm" />}
              variant="outline"
              size="lg"
              width="40px"
              height="40px"
              p={0}
              borderRadius="full"
              borderWidth={2}
              _hover={{
                bg: `${provider.color}`,
                color: "white",
                borderColor: provider.color,
              }}
              _active={{
                transform: "scale(0.95)",
              }}
              transition="all 0.2s"
            >
              <Icon as={provider.icon} boxSize={5} />
            </Button>
          </Tooltip>
        ))}
      </HStack>
      {Object.entries(retryCount).map(
        ([provider, count]) =>
          count > 0 && (
            <Text key={provider} fontSize="xs" color="gray.500">
              Retrying {provider} sign in... ({count}/{MAX_RETRIES})
            </Text>
          ),
      )}
    </VStack>
  );
};
