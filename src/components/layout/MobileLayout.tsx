import React, { useState } from "react";
import {
  Box,
  Flex,
  VStack,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  useBreakpointValue,
  useColorModeValue,
  Text,
  Avatar,
  Badge,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Icon,
  useToast,
} from "@chakra-ui/react";
import {
  FaBars,
  FaTrophy,
  FaChartLine,
  FaUsers,
  FaCog,
  FaBell,
  FaSignOutAlt,
  FaHome,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface MobileLayoutProps {
  children: React.ReactNode;
  currentUser?: {
    username: string;
    avatar: string;
    notifications: number;
  };
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  currentUser,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showNotifications, setShowNotifications] = useState(false);
  const toast = useToast();

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.400");

  const isMobile = useBreakpointValue({ base: true, md: false });

  const navigationItems = [
    { icon: FaHome, label: "Home", path: "/" },
    { icon: FaTrophy, label: "Tournaments", path: "/tournaments" },
    { icon: FaChartLine, label: "Analysis", path: "/analysis" },
    { icon: FaUsers, label: "Social", path: "/social" },
  ];

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleLogout = () => {
    // Implement logout logic
    toast({
      title: "Logged out successfully",
      status: "success",
      duration: 3000,
    });
  };

  const renderMobileHeader = () => (
    <Flex
      as="header"
      position="fixed"
      top={0}
      left={0}
      right={0}
      height="60px"
      px={4}
      align="center"
      justify="space-between"
      bg={bgColor}
      borderBottomWidth={1}
      borderColor={borderColor}
      zIndex={1000}
    >
      <IconButton
        aria-label="Menu"
        icon={<FaBars />}
        variant="ghost"
        onClick={onOpen}
      />

      {currentUser && (
        <Flex align="center" gap={2}>
          <IconButton
            aria-label="Notifications"
            icon={<FaBell />}
            variant="ghost"
            onClick={handleNotificationClick}
            position="relative"
          >
            {currentUser.notifications > 0 && (
              <Badge
                position="absolute"
                top={1}
                right={1}
                colorScheme="red"
                borderRadius="full"
                minW={5}
              >
                {currentUser.notifications}
              </Badge>
            )}
          </IconButton>

          <Menu>
            <MenuButton
              as={IconButton}
              icon={
                <Avatar
                  size="sm"
                  src={currentUser.avatar}
                  name={currentUser.username}
                />
              }
              variant="ghost"
            />
            <MenuList>
              <MenuItem icon={<FaCog />}>Settings</MenuItem>
              <MenuItem icon={<FaSignOutAlt />} onClick={handleLogout}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      )}
    </Flex>
  );

  const renderSideNav = () => (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth={1}>DojoPool</DrawerHeader>

        <DrawerBody>
          <VStack spacing={4} align="stretch" mt={4}>
            {navigationItems.map((item, index) => (
              <Button
                key={index}
                leftIcon={<Icon as={item.icon} />}
                variant="ghost"
                justifyContent="flex-start"
                size="lg"
                width="100%"
                onClick={() => {
                  // Implement navigation
                  onClose();
                }}
              >
                {item.label}
              </Button>
            ))}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );

  const renderNotifications = () => (
    <AnimatePresence>
      {showNotifications && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: "fixed",
            top: "60px",
            right: 0,
            width: "100%",
            maxWidth: "400px",
            zIndex: 1000,
          }}
        >
          <Box
            bg={bgColor}
            borderWidth={1}
            borderColor={borderColor}
            borderRadius="md"
            boxShadow="lg"
            maxH="400px"
            overflowY="auto"
            m={2}
          >
            <VStack spacing={0} align="stretch">
              <Box p={4} borderBottomWidth={1}>
                <Text fontWeight="bold">Notifications</Text>
              </Box>

              {/* Example notifications */}
              {[1, 2, 3].map((_, i) => (
                <Box
                  key={i}
                  p={4}
                  borderBottomWidth={1}
                  _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}
                  cursor="pointer"
                >
                  <Text fontSize="sm">New tournament starting in 1 hour!</Text>
                  <Text fontSize="xs" color={textColor} mt={1}>
                    2 minutes ago
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <Box>
      {renderMobileHeader()}
      {renderSideNav()}
      {renderNotifications()}

      <Box
        as="main"
        pt="60px"
        minH="100vh"
        bg={useColorModeValue("gray.50", "gray.900")}
      >
        <Box maxW={isMobile ? "100%" : "1200px"} mx="auto" px={4} py={6}>
          {children}
        </Box>
      </Box>

      {isMobile && (
        <Flex
          as="nav"
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          height="60px"
          bg={bgColor}
          borderTopWidth={1}
          borderColor={borderColor}
          justify="space-around"
          align="center"
          px={4}
        >
          {navigationItems.map((item, index) => (
            <IconButton
              key={index}
              aria-label={item.label}
              icon={<Icon as={item.icon} boxSize={5} />}
              variant="ghost"
              onClick={() => {
                // Implement navigation
              }}
            />
          ))}
        </Flex>
      )}
    </Box>
  );
};

export default MobileLayout;
