import React, { useState, useEffect } from 'react';
import {
    VStack,
    HStack,
    Button,
    Text,
    useColorModeValue,
    Box,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Select
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface MobileTimePickerProps {
    value: string;
    onChange: (time: string) => void;
    use24Hour?: boolean;
    minuteStep?: number;
}

const MobileTimePicker: React.FC<MobileTimePickerProps> = ({
    value,
    onChange,
    use24Hour = false,
    minuteStep = 5
}) => {
    const [hours, setHours] = useState<number>(() => {
        const [h] = value.split(':');
        return parseInt(h) || 12;
    });
    
    const [minutes, setMinutes] = useState<number>(() => {
        const [, m] = value.split(':');
        return parseInt(m) || 0;
    });
    
    const [period, setPeriod] = useState<'AM' | 'PM'>(() => {
        if (use24Hour) return 'AM';
        const hour = parseInt(value.split(':')[0]) || 0;
        return hour >= 12 ? 'PM' : 'AM';
    });
    
    const textColor = useColorModeValue('gray.700', 'gray.200');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    
    useEffect(() => {
        let hour = hours;
        
        if (!use24Hour) {
            if (period === 'PM' && hour < 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;
        }
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        onChange(timeString);
    }, [hours, minutes, period, use24Hour]);

    const handleHourChange = (value: string) => {
        const hour = parseInt(value);
        if (isNaN(hour)) return;
        
        if (use24Hour) {
            if (hour >= 0 && hour <= 23) setHours(hour);
        } else {
            if (hour >= 1 && hour <= 12) setHours(hour);
        }
    };

    const handleMinuteChange = (value: string) => {
        const minute = parseInt(value);
        if (isNaN(minute)) return;
        
        if (minute >= 0 && minute <= 59) {
            setMinutes(Math.floor(minute / minuteStep) * minuteStep);
        }
    };

    return (
        <VStack spacing={6} p={4} w="100%">
            <HStack spacing={4} w="100%" justify="center">
                <Box w="100px">
                    <Text fontSize="sm" mb={2} color={textColor}>
                        Hours
                    </Text>
                    <NumberInput
                        value={hours}
                        onChange={handleHourChange}
                        min={use24Hour ? 0 : 1}
                        max={use24Hour ? 23 : 12}
                        size="lg"
                    >
                        <NumberInputField textAlign="center" />
                        <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                        </NumberInputStepper>
                    </NumberInput>
                </Box>
                
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                    :
                </Text>
                
                <Box w="100px">
                    <Text fontSize="sm" mb={2} color={textColor}>
                        Minutes
                    </Text>
                    <NumberInput
                        value={minutes}
                        onChange={handleMinuteChange}
                        min={0}
                        max={59}
                        step={minuteStep}
                        size="lg"
                    >
                        <NumberInputField textAlign="center" />
                        <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                        </NumberInputStepper>
                    </NumberInput>
                </Box>
                
                {!use24Hour && (
                    <Box w="100px">
                        <Text fontSize="sm" mb={2} color={textColor}>
                            Period
                        </Text>
                        <Select
                            value={period}
                            onChange={e => setPeriod(e.target.value as 'AM' | 'PM')}
                            size="lg"
                        >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                        </Select>
                    </Box>
                )}
            </HStack>
            
            <VStack spacing={2} w="100%">
                <Text fontSize="sm" color={textColor}>
                    Quick Select
                </Text>
                <HStack wrap="wrap" justify="center" spacing={2}>
                    {['00:00', '06:00', '12:00', '18:00'].map(time => {
                        const [h, m] = time.split(':').map(Number);
                        const isSelected = hours === h && minutes === parseInt(m);
                        
                        return (
                            <motion.div
                                key={time}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button
                                    variant={isSelected ? 'solid' : 'outline'}
                                    colorScheme={isSelected ? 'blue' : undefined}
                                    size="sm"
                                    onClick={() => {
                                        setHours(h);
                                        setMinutes(parseInt(m));
                                        if (!use24Hour) {
                                            setPeriod(h >= 12 ? 'PM' : 'AM');
                                        }
                                    }}
                                >
                                    {time}
                                </Button>
                            </motion.div>
                        );
                    })}
                </HStack>
            </VStack>
        </VStack>
    );
};

export default MobileTimePicker; 