import React, { useState, useEffect } from 'react';
import {
  Box,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMarkLabel,
  Button,
  VStack,
  HStack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';

interface GameControlsProps {
  onShot: (power: number, angle: number, spin: number) => void;
  isActive: boolean;
  maxPower?: number;
  onCancel?: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onShot,
  isActive,
  maxPower = 100,
  onCancel,
}) => {
  const [power, setPower] = useState(0);
  const [angle, setAngle] = useState(0);
  const [spin, setSpin] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [chargeInterval, setChargeInterval] = useState<NodeJS.Timeout | null>(null);

  // Colors based on theme
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    return () => {
      if (chargeInterval) {
        clearInterval(chargeInterval);
      }
    };
  }, [chargeInterval]);

  const startCharging = () => {
    if (!isActive || isCharging) return;
    
    setIsCharging(true);
    const interval = setInterval(() => {
      setPower(prev => {
        if (prev >= maxPower) {
          clearInterval(interval);
          setChargeInterval(null);
          setIsCharging(false);
          return maxPower;
        }
        return prev + 1;
      });
    }, 50);

    setChargeInterval(interval);
  };

  const stopCharging = () => {
    if (!isCharging) return;
    
    if (chargeInterval) {
      clearInterval(chargeInterval);
      setChargeInterval(null);
    }
    setIsCharging(false);
    
    // Execute shot with current values
    onShot(power, angle, spin);
    
    // Reset power
    setPower(0);
  };

  const handleCancel = () => {
    if (chargeInterval) {
      clearInterval(chargeInterval);
      setChargeInterval(null);
    }
    setIsCharging(false);
    setPower(0);
    onCancel?.();
  };

  return (
    <Box
      p={4}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      width="100%"
      maxW="400px"
    >
      <VStack spacing={4} align="stretch">
        {/* Power Control */}
        <Box>
          <Text mb={2}>Shot Power</Text>
          <Slider
            value={power}
            min={0}
            max={maxPower}
            onChange={setPower}
            isDisabled={isCharging}
          >
            <SliderMarkLabel value={0}>0%</SliderMarkLabel>
            <SliderMarkLabel value={maxPower}>100%</SliderMarkLabel>
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </Box>

        {/* Angle Control */}
        <Box>
          <Text mb={2}>Shot Angle</Text>
          <Slider
            value={angle}
            min={0}
            max={360}
            onChange={setAngle}
            isDisabled={isCharging}
          >
            <SliderMarkLabel value={0}>0°</SliderMarkLabel>
            <SliderMarkLabel value={360}>360°</SliderMarkLabel>
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </Box>

        {/* Spin Control */}
        <Box>
          <Text mb={2}>Ball Spin</Text>
          <Slider
            value={spin}
            min={-100}
            max={100}
            onChange={setSpin}
            isDisabled={isCharging}
          >
            <SliderMarkLabel value={-100}>Left</SliderMarkLabel>
            <SliderMarkLabel value={0}>Center</SliderMarkLabel>
            <SliderMarkLabel value={100}>Right</SliderMarkLabel>
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </Box>

        {/* Action Buttons */}
        <HStack spacing={4}>
          <Button
            colorScheme="blue"
            onMouseDown={startCharging}
            onMouseUp={stopCharging}
            onMouseLeave={stopCharging}
            isDisabled={!isActive || isCharging}
            flex={1}
          >
            {isCharging ? 'Charging...' : 'Take Shot'}
          </Button>
          <Button
            colorScheme="red"
            onClick={handleCancel}
            isDisabled={!isActive}
            flex={1}
          >
            Cancel
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}; 