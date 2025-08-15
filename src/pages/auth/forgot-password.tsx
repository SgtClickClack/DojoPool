import { useState } from "react";
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
import Link from "next/link";

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
});

type FormData = {
  email: string;
};

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to send recovery email");
      }

      toast({
        title: "Recovery email sent",
        description: "Please check your email for password reset instructions.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      router.push("/auth/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send recovery email. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={4}>
            Forgot Password
          </Heading>
          <Text color="gray.600">
            Enter your email address and we'll send you instructions to reset
            your password.
          </Text>
        </Box>

        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Text>
            For security reasons, we don't reveal whether an email address is
            registered or not.
          </Text>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email Address</FormLabel>
              <Input
                type="email"
                {...register("email")}
                placeholder="Enter your email"
                size="lg"
              />
              <Text color="red.500" fontSize="sm" mt={1}>
                {errors.email?.message}
              </Text>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              isLoading={isSubmitting}
            >
              Send Recovery Email
            </Button>

            <Link href="/auth/login" passHref>
              <Button variant="link" colorScheme="blue">
                Back to Login
              </Button>
            </Link>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
}
