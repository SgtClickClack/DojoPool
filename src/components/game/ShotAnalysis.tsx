import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Badge,
  Icon,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FaLightbulb,
  FaChartLine,
  FaExclamationTriangle,
} from "react-icons/fa";

interface ShotAnalysisProps {
  currentBall: number;
  targetBall: number;
  shotPower: number;
  shotAngle: number;
  shotSpin: number;
  onAnalysisComplete?: (analysis: ShotAnalysisResult) => void;
}

interface ShotAnalysisResult {
  successProbability: number;
  difficulty: "easy" | "medium" | "hard";
  recommendedPower: number;
  recommendedAngle: number;
  recommendedSpin: number;
  tips: string[];
  warnings: string[];
}

export const ShotAnalysis: React.FC<ShotAnalysisProps> = ({
  currentBall,
  targetBall,
  shotPower,
  shotAngle,
  shotSpin,
  onAnalysisComplete,
}) => {
  const [analysis, setAnalysis] = useState<ShotAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Colors based on theme
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const successColor = useColorModeValue("green.500", "green.300");
  const warningColor = useColorModeValue("yellow.500", "yellow.300");
  const errorColor = useColorModeValue("red.500", "red.300");

  useEffect(() => {
    analyzeShot();
  }, [currentBall, targetBall, shotPower, shotAngle, shotSpin]);

  const analyzeShot = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis (replace with actual API call)
      const result = await simulateShotAnalysis();
      setAnalysis(result);
      onAnalysisComplete?.(result);
    } catch (error) {
      console.error("Shot analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const simulateShotAnalysis = async (): Promise<ShotAnalysisResult> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Calculate success probability based on shot parameters
    const powerDiff = Math.abs(shotPower - 70) / 100;
    const angleDiff = Math.abs(shotAngle - 180) / 180;
    const spinDiff = Math.abs(shotSpin) / 100;

    const successProbability = Math.max(
      0,
      1 - (powerDiff + angleDiff + spinDiff) / 3,
    );

    return {
      successProbability,
      difficulty:
        successProbability > 0.7
          ? "easy"
          : successProbability > 0.4
            ? "medium"
            : "hard",
      recommendedPower: 70,
      recommendedAngle: 180,
      recommendedSpin: 0,
      tips: [
        "Keep your cue level for better accuracy",
        "Focus on the target ball, not the cue ball",
        "Maintain a steady stance",
      ],
      warnings: [
        "High spin may affect accuracy",
        "Power level might be too high",
        "Angle could be improved",
      ],
    };
  };

  if (isAnalyzing) {
    return (
      <Box
        p={4}
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
      >
        <VStack spacing={2}>
          <Text>Analyzing shot...</Text>
          <Progress size="sm" width="100%" isIndeterminate />
        </VStack>
      </Box>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <Box
      p={4}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
    >
      <VStack spacing={4} align="stretch">
        {/* Success Probability */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontWeight="bold">Success Probability</Text>
            <Badge
              colorScheme={
                analysis.successProbability > 0.7
                  ? "green"
                  : analysis.successProbability > 0.4
                    ? "yellow"
                    : "red"
              }
            >
              {Math.round(analysis.successProbability * 100)}%
            </Badge>
          </HStack>
          <Progress
            value={analysis.successProbability * 100}
            colorScheme={
              analysis.successProbability > 0.7
                ? "green"
                : analysis.successProbability > 0.4
                  ? "yellow"
                  : "red"
            }
            size="sm"
          />
        </Box>

        {/* Shot Difficulty */}
        <Box>
          <Text fontWeight="bold" mb={2}>
            Shot Difficulty
          </Text>
          <Badge
            colorScheme={
              analysis.difficulty === "easy"
                ? "green"
                : analysis.difficulty === "medium"
                  ? "yellow"
                  : "red"
            }
          >
            {analysis.difficulty.charAt(0).toUpperCase() +
              analysis.difficulty.slice(1)}
          </Badge>
        </Box>

        {/* Recommendations */}
        <Box>
          <Text fontWeight="bold" mb={2}>
            Recommendations
          </Text>
          <VStack spacing={2} align="stretch">
            <HStack>
              <Icon as={FaLightbulb} color={successColor} />
              <Text>Recommended Power: {analysis.recommendedPower}%</Text>
            </HStack>
            <HStack>
              <Icon as={FaLightbulb} color={successColor} />
              <Text>Recommended Angle: {analysis.recommendedAngle}°</Text>
            </HStack>
            <HStack>
              <Icon as={FaLightbulb} color={successColor} />
              <Text>Recommended Spin: {analysis.recommendedSpin}</Text>
            </HStack>
          </VStack>
        </Box>

        {/* Tips */}
        <Box>
          <Text fontWeight="bold" mb={2}>
            Tips
          </Text>
          <VStack spacing={2} align="stretch">
            {analysis.tips.map((tip, index) => (
              <HStack key={index}>
                <Icon as={FaChartLine} color={successColor} />
                <Text>{tip}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* Warnings */}
        <Box>
          <Text fontWeight="bold" mb={2}>
            Warnings
          </Text>
          <VStack spacing={2} align="stretch">
            {analysis.warnings.map((warning, index) => (
              <Tooltip key={index} label="Consider adjusting your shot">
                <HStack>
                  <Icon as={FaExclamationTriangle} color={warningColor} />
                  <Text>{warning}</Text>
                </HStack>
              </Tooltip>
            ))}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};
