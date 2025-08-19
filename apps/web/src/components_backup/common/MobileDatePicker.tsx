import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Button,
  Text,
  Grid,
  GridItem,
  IconButton,
  useColorModeValue,
  Box,
} from '@chakra-ui/react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface MobileDatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

const MobileDatePicker: React.FC<MobileDatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() =>
    value ? new Date(value) : new Date()
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);

  const textColor = useColorModeValue('gray.700', 'gray.200');
  const selectedBg = useColorModeValue('blue.500', 'blue.300');
  const todayBg = useColorModeValue('gray.100', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1)
    );
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );

    if (minDate && newDate < minDate) return;
    if (maxDate && newDate > maxDate) return;

    setSelectedDate(newDate);
    onChange(newDate);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      selectedDate &&
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isDisabled = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return (minDate && date < minDate) || (maxDate && date > maxDate);
  };

  return (
    <VStack spacing={4} p={4} w="100%">
      <HStack justify="space-between" w="100%">
        <IconButton
          aria-label="Previous month"
          icon={<FaChevronLeft />}
          onClick={handlePrevMonth}
          variant="ghost"
        />
        <Text fontSize="lg" fontWeight="bold" color={textColor}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <IconButton
          aria-label="Next month"
          icon={<FaChevronRight />}
          onClick={handleNextMonth}
          variant="ghost"
        />
      </HStack>

      <Grid templateColumns="repeat(7, 1fr)" gap={1} w="100%">
        {weekDays.map((day) => (
          <GridItem key={day}>
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={textColor}
              textAlign="center"
            >
              {day}
            </Text>
          </GridItem>
        ))}

        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <GridItem key={`empty-${index}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const disabled = isDisabled(day);

          return (
            <GridItem key={day}>
              <motion.div whileTap={{ scale: disabled ? 1 : 0.95 }}>
                <Button
                  w="100%"
                  h="40px"
                  variant={isSelected(day) ? 'solid' : 'ghost'}
                  bg={
                    isSelected(day)
                      ? selectedBg
                      : isToday(day)
                        ? todayBg
                        : undefined
                  }
                  color={isSelected(day) ? 'white' : textColor}
                  _hover={{
                    bg: disabled
                      ? undefined
                      : isSelected(day)
                        ? selectedBg
                        : hoverBg,
                  }}
                  onClick={() => !disabled && handleDateSelect(day)}
                  opacity={disabled ? 0.5 : 1}
                  cursor={disabled ? 'not-allowed' : 'pointer'}
                >
                  {day}
                </Button>
              </motion.div>
            </GridItem>
          );
        })}
      </Grid>
    </VStack>
  );
};

export default MobileDatePicker;
