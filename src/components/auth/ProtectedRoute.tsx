import React from "react";
import { useRouter } from "next/router";
import { Box, Spinner, Center } from "@chakra-ui/react";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireVerification = true,
}) => {
  const { user, loading, checkEmailVerification } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else if (requireVerification && !checkEmailVerification()) {
        router.push("/auth/verify-email");
      }
    }
  }, [user, loading, router, requireVerification, checkEmailVerification]);

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

  if (requireVerification && !checkEmailVerification()) {
    return null;
  }

  return <Box>{children}</Box>;
};
