import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Heading,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from "next/router";

const schema = yup.object().shape({
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    )
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

type FormData = {
  password: string;
  confirmPassword: string;
};

export default function ResetPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const { token } = router.query;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setIsValidToken(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/validate-reset-token?token=${token}`,
        );
        setIsValidToken(response.ok);
      } catch (error) {
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      toast({
        title: "Password reset successful",
        description: "You can now log in with your new password.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      router.push("/auth/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <Container maxW="container.sm" py={10}>
        <Text>Validating reset token...</Text>
      </Container>
    );
  }

  if (!isValidToken) {
    return (
      <Container maxW="container.sm" py={10}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Text>
            Invalid or expired reset token. Please request a new password reset
            link.
          </Text>
        </Alert>
        <Button
          mt={4}
          colorScheme="blue"
          onClick={() => router.push("/auth/forgot-password")}
        >
          Request New Reset Link
        </Button>
      </Container>
    );
  }

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={4}>
            Reset Password
          </Heading>
          <Text color="gray.600">Please enter your new password below.</Text>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.password}>
              <FormLabel>New Password</FormLabel>
              <Input
                type="password"
                {...register("password")}
                placeholder="Enter new password"
                size="lg"
              />
              <Text color="red.500" fontSize="sm" mt={1}>
                {errors.password?.message}
              </Text>
            </FormControl>

            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel>Confirm New Password</FormLabel>
              <Input
                type="password"
                {...register("confirmPassword")}
                placeholder="Confirm new password"
                size="lg"
              />
              <Text color="red.500" fontSize="sm" mt={1}>
                {errors.confirmPassword?.message}
              </Text>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              isLoading={isSubmitting}
            >
              Reset Password
            </Button>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
}
