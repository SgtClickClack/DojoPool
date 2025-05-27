import React from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Icon,
  Flex, // Used for icon and text alignment
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaArrowUp, FaInfoCircle } from 'react-icons/fa'; // Added FaInfoCircle for default
import { IconType } from 'react-icons'; // For typing the icon map

// --- Interface ---
interface PerformanceInsight {
  id: string; // Added for unique key prop and stable identity
  type: 'strength' | 'weakness' | 'improvement' | 'neutral'; // Added 'neutral' as a possible type
  title: string;
  description: string;
  metrics?: Record<string, string | number>; // Allow string values for metrics too
}

interface PerformanceInsightsProps {
  insights: PerformanceInsight[];
  title?: string; // Optional title override
}

const MotionBox = motion(Box);

// --- Icon and Color Mapping (Alternative: Object Lookup) ---
const insightVisuals: Record<
  PerformanceInsight['type'],
  { icon: IconType; color: string; }
> = {
  strength: { icon: FaCheckCircle, color: 'green.500' },
  weakness: { icon: FaExclamationTriangle, color: 'red.500' },
  improvement: { icon: FaArrowUp, color: 'blue.500' },
  neutral: { icon: FaInfoCircle, color: 'gray.500' }, // Added neutral type
};

const PerformanceInsights: React.FC<PerformanceInsightsProps> = ({
  insights,
  title = "Performance Insights", // Default title
}) => {
  const cardBgColor = 'white';
  const cardBorderColor = 'gray.200';
  const descriptionColor = 'gray.600';

  if (!insights || insights.length === 0) {
    return (
      <Box mt={4}> {/* Added mt if this component might stand alone */}
        <Heading size="md" mb={4}>
          {title}
        </Heading>
        <div className="alert alert-info" style={{ borderRadius: 'md' }}>
          No performance insights available for this period or game.
        </div>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="md" mb={4}>
        {title}
      </Heading>
      <VStack align="stretch">
        {insights.map((insight, index) => {
          const visuals = insightVisuals[insight.type] || insightVisuals.neutral; // Fallback to neutral

          return (
            <MotionBox
              key={insight.id} // Use unique ID for key
              p={5} // Increased padding slightly
              bg={cardBgColor}
              borderWidth="1px"
              borderColor={cardBorderColor}
              borderRadius="lg" // Slightly larger radius
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              // Removed display="flex" and alignItems="center" as Flex component is used below
              boxShadow="sm" // Added a subtle shadow
            >
              <Flex alignItems="flex-start"> {/* Align icon to the top with text */}
                <div className="tooltip">
                  {/* Wrapping Icon in a Box allows tooltip to work reliably on it */}
                  <div className="tooltip-inner">
                    <Icon
                      as={visuals.icon}
                      color={visuals.color}
                      boxSize={6} // Maintained size
                      mr={4}
                      mt={1} // Align icon better with the title
                    />
                  </div>
                </div>
                <div className="tooltip-arrow"></div>
                <div className="tooltip-inner">
                  <Text fontSize="sm" color={descriptionColor} mb={insight.metrics ? 2 : 0}>
                    {insight.description}
                  </Text>
                </div>
              </Flex>
            </MotionBox>
          );
        })}
      </VStack>
    </Box>
  );
};

export default PerformanceInsights;