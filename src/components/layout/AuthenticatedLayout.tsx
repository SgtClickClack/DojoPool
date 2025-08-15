import React from "react";
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  useColorModeValue,
  Text,
  Avatar,
} from "@chakra-ui/react";
import { FaUser, FaSignOutAlt, FaCog } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/router";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  children,
}) => {
  const { user, signOutUser } = useAuth();
  const router = useRouter();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const handleSignOut = async () => {
    const result = await signOutUser();
    if (result.success) {
      router.push("/auth/login");
    }
  };

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
      <Box
        as="nav"
        position="fixed"
        top="0"
        zIndex="sticky"
        w="100%"
        bg={bgColor}
        borderBottom="1px"
        borderColor={borderColor}
        px={4}
      >
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <Text fontSize="xl" fontWeight="bold">
            DojoPool
          </Text>

          <HStack spacing={4}>
            <Menu>
              <MenuButton
                as={Button}
                rounded="full"
                variant="link"
                cursor="pointer"
              >
                <Avatar
                  size="sm"
                  name={user?.displayName || "User"}
                  src={user?.photoURL || undefined}
                />
              </MenuButton>
              <MenuList>
                <MenuItem
                  icon={<FaUser />}
                  onClick={() => router.push("/profile")}
                >
                  Profile
                </MenuItem>
                <MenuItem
                  icon={<FaCog />}
                  onClick={() => router.push("/settings")}
                >
                  Settings
                </MenuItem>
                <MenuItem icon={<FaSignOutAlt />} onClick={handleSignOut}>
                  Sign Out
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      <Box pt={16}>{children}</Box>
    </Box>
  );
};
