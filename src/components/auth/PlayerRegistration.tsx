import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  useToast,
  Divider,
  HStack,
  IconButton,
  InputGroup,
  InputRightElement,
  FormErrorMessage,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FaGoogle,
  FaFacebook,
  FaTwitter,
  FaGithub,
  FaApple,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import {
  signUpWithEmail,
  signInWithGoogle,
  signInWithFacebook,
  signInWithTwitter,
  signInWithGithub,
  signInWithApple,
  createUserDocument,
  isNicknameUnique,
} from "../../firebase/auth";
import debounce from "lodash/debounce";

interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  playerNickname: string;
  skillLevel: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
  playerNickname?: string;
}

export const PlayerRegistration: React.FC = () => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    playerNickname: "",
    skillLevel: "beginner",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [socialUser, setSocialUser] = useState<any>(null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Debounced function to check nickname uniqueness
  const debouncedCheckNickname = debounce(async (nickname: string) => {
    if (!nickname) return;

    setIsCheckingNickname(true);
    try {
      const isUnique = await isNicknameUnique(nickname);
      if (!isUnique) {
        setErrors((prev) => ({
          ...prev,
          playerNickname: "This nickname is already taken",
        }));
      } else {
        setErrors((prev) => ({ ...prev, playerNickname: undefined }));
      }
    } catch (error: any) {
      console.error("Error checking nickname:", error);
      setErrors((prev) => ({
        ...prev,
        playerNickname: "Error checking nickname availability",
      }));
    } finally {
      setIsCheckingNickname(false);
    }
  }, 500);

  // Update nickname validation on change
  useEffect(() => {
    if (formData.playerNickname) {
      debouncedCheckNickname(formData.playerNickname);
    }
    return () => {
      debouncedCheckNickname.cancel();
    };
  }, [formData.playerNickname]);

  const validateForm = async (): Promise<boolean> => {
    const newErrors: ValidationErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.displayName) {
      newErrors.displayName = "Name is required";
    }

    if (!formData.playerNickname) {
      newErrors.playerNickname = "Player nickname is required";
    } else if (isCheckingNickname) {
      newErrors.playerNickname = "Checking nickname availability...";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleEmailRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validateForm())) return;

    setIsLoading(true);
    try {
      const result = await signUpWithEmail(
        formData.email,
        formData.password,
        formData.displayName,
        formData.playerNickname,
        formData.skillLevel,
      );

      if (result.success) {
        toast({
          title: "Registration successful!",
          description: "Welcome to DojoPool!",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        // Redirect to profile completion or dashboard
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: string) => {
    setIsLoading(true);
    try {
      let result;
      switch (provider) {
        case "google":
          result = await signInWithGoogle();
          break;
        case "facebook":
          result = await signInWithFacebook();
          break;
        case "twitter":
          result = await signInWithTwitter();
          break;
        case "github":
          result = await signInWithGithub();
          break;
        case "apple":
          result = await signInWithApple();
          break;
        default:
          throw new Error("Invalid provider");
      }

      if (result.success) {
        setSocialUser(result.user);
        setShowProfileCompletion(true);
        toast({
          title: "Sign in successful!",
          description: "Please complete your profile",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialUser) return;

    setIsLoading(true);
    try {
      await createUserDocument(socialUser, {
        playerNickname: formData.playerNickname,
        skillLevel: formData.skillLevel,
      });

      toast({
        title: "Profile completed!",
        description: "Welcome to DojoPool!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      // Redirect to dashboard
    } catch (error: any) {
      toast({
        title: "Profile completion failed",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update the nickname input field in both forms to show loading state
  const renderNicknameInput = (isProfileCompletion: boolean = false) => (
    <FormControl isInvalid={!!errors.playerNickname}>
      <FormLabel>Player Nickname</FormLabel>
      <InputGroup>
        <Input
          name="playerNickname"
          value={formData.playerNickname}
          onChange={handleInputChange}
          isDisabled={isCheckingNickname}
        />
        {isCheckingNickname && (
          <InputRightElement>
            <Text fontSize="sm" color="gray.500">
              Checking...
            </Text>
          </InputRightElement>
        )}
      </InputGroup>
      <FormErrorMessage>{errors.playerNickname}</FormErrorMessage>
    </FormControl>
  );

  if (showProfileCompletion) {
    return (
      <Box
        p={8}
        maxWidth="500px"
        borderWidth={1}
        borderRadius="lg"
        boxShadow="lg"
        bg={bgColor}
        borderColor={borderColor}
      >
        <VStack spacing={4} align="stretch">
          <Text fontSize="2xl" fontWeight="bold" textAlign="center">
            Complete Your Profile
          </Text>

          <form onSubmit={handleProfileCompletion}>
            <VStack spacing={4}>
              {renderNicknameInput(true)}
              <FormControl>
                <FormLabel>Skill Level</FormLabel>
                <select
                  name="skillLevel"
                  value={formData.skillLevel}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid",
                    borderColor: borderColor,
                  }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="professional">Professional</option>
                </select>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="100%"
                isLoading={isLoading}
              >
                Complete Profile
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      p={8}
      maxWidth="500px"
      borderWidth={1}
      borderRadius="lg"
      boxShadow="lg"
      bg={bgColor}
      borderColor={borderColor}
    >
      <VStack spacing={4} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          Join DojoPool
        </Text>

        <HStack spacing={2} justify="center">
          <IconButton
            aria-label="Sign in with Google"
            icon={<FaGoogle />}
            onClick={() => handleSocialSignIn("google")}
            isLoading={isLoading}
          />
          <IconButton
            aria-label="Sign in with Facebook"
            icon={<FaFacebook />}
            onClick={() => handleSocialSignIn("facebook")}
            isLoading={isLoading}
          />
          <IconButton
            aria-label="Sign in with Twitter"
            icon={<FaTwitter />}
            onClick={() => handleSocialSignIn("twitter")}
            isLoading={isLoading}
          />
          <IconButton
            aria-label="Sign in with GitHub"
            icon={<FaGithub />}
            onClick={() => handleSocialSignIn("github")}
            isLoading={isLoading}
          />
          <IconButton
            aria-label="Sign in with Apple"
            icon={<FaApple />}
            onClick={() => handleSocialSignIn("apple")}
            isLoading={isLoading}
          />
        </HStack>

        <Divider />

        <form onSubmit={handleEmailRegistration}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.displayName}>
              <FormLabel>Full Name</FormLabel>
              <Input
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
              />
              <FormErrorMessage>{errors.displayName}</FormErrorMessage>
            </FormControl>

            {renderNicknameInput()}

            <FormControl isInvalid={!!errors.password}>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <InputRightElement>
                  <IconButton
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                    onClick={() => setShowPassword(!showPassword)}
                    variant="ghost"
                    size="sm"
                  />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.password}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
              <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Skill Level</FormLabel>
              <select
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid",
                  borderColor: borderColor,
                }}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="professional">Professional</option>
              </select>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              width="100%"
              isLoading={isLoading}
            >
              Register
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};
