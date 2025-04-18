import React from "react";
import {
  IconButton,
  useColorMode,
  useColorModeValue,
  Box,
  Tooltip,
} from "@chakra-ui/react";
import { FaSun, FaMoon } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const DarkModeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const iconColor = useColorModeValue("orange.500", "yellow.300");
  const bgColor = useColorModeValue("gray.100", "gray.700");

  return (
    <Tooltip
      label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
      placement="bottom"
    >
      <Box
        as={motion.div}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <IconButton
          aria-label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
          icon={
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={colorMode}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {colorMode === "light" ? (
                  <FaMoon color={iconColor} />
                ) : (
                  <FaSun color={iconColor} />
                )}
              </motion.div>
            </AnimatePresence>
          }
          onClick={toggleColorMode}
          variant="ghost"
          size="lg"
          bg={bgColor}
          _hover={{
            bg: useColorModeValue("gray.200", "gray.600"),
          }}
          borderRadius="full"
        />
      </Box>
    </Tooltip>
  );
};

export default DarkModeToggle;
