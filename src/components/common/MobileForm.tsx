import React, { useState } from 'react';
import {
    Box,
    VStack,
    FormControl,
    FormLabel,
    FormErrorMessage,
    FormHelperText,
    Input,
    Select,
    Textarea,
    Button,
    IconButton,
    useColorModeValue,
    useBreakpointValue,
    Text,
    HStack,
    Switch,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    InputGroup,
    InputRightElement,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useToast
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash, FaCalendar, FaClock } from 'react-icons/fa';

interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date' | 'time' | 'switch';
    placeholder?: string;
    helperText?: string;
    options?: { value: string; label: string }[];
    validation?: {
        required?: boolean;
        min?: number;
        max?: number;
        pattern?: RegExp;
        minLength?: number;
        maxLength?: number;
        customValidation?: (value: any) => string | undefined;
    };
    defaultValue?: any;
}

interface MobileFormProps {
    fields: FormField[];
    onSubmit: (values: Record<string, any>) => void;
    submitLabel?: string;
    isLoading?: boolean;
}

const MobileForm: React.FC<MobileFormProps> = ({
    fields,
    onSubmit,
    submitLabel = 'Submit',
    isLoading = false
}) => {
    const [values, setValues] = useState<Record<string, any>>(() => {
        const initialValues: Record<string, any> = {};
        fields.forEach(field => {
            initialValues[field.name] = field.defaultValue || '';
        });
        return initialValues;
    });
    
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
    const { isOpen: isDatePickerOpen, onOpen: onDatePickerOpen, onClose: onDatePickerClose } = useDisclosure();
    const { isOpen: isTimePickerOpen, onOpen: onTimePickerOpen, onClose: onTimePickerClose } = useDisclosure();
    const [activeField, setActiveField] = useState<string>('');
    const toast = useToast();
    
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const inputSize = useBreakpointValue({ base: 'lg', md: 'md' });

    const validateField = (field: FormField, value: any): string | undefined => {
        if (!field.validation) return undefined;
        
        if (field.validation.required && !value) {
            return `${field.label} is required`;
        }
        
        if (field.validation.min !== undefined && value < field.validation.min) {
            return `${field.label} must be at least ${field.validation.min}`;
        }
        
        if (field.validation.max !== undefined && value > field.validation.max) {
            return `${field.label} must be at most ${field.validation.max}`;
        }
        
        if (field.validation.pattern && !field.validation.pattern.test(value)) {
            return `${field.label} is invalid`;
        }
        
        if (field.validation.minLength && value.length < field.validation.minLength) {
            return `${field.label} must be at least ${field.validation.minLength} characters`;
        }
        
        if (field.validation.maxLength && value.length > field.validation.maxLength) {
            return `${field.label} must be at most ${field.validation.maxLength} characters`;
        }
        
        if (field.validation.customValidation) {
            return field.validation.customValidation(value);
        }
        
        return undefined;
    };

    const handleChange = (name: string, value: any) => {
        setValues(prev => ({ ...prev, [name]: value }));
        
        const field = fields.find(f => f.name === name);
        if (field) {
            const error = validateField(field, value);
            setErrors(prev => ({
                ...prev,
                [name]: error || ''
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate all fields
        const newErrors: Record<string, string> = {};
        let hasErrors = false;
        
        fields.forEach(field => {
            const error = validateField(field, values[field.name]);
            if (error) {
                newErrors[field.name] = error;
                hasErrors = true;
            }
        });
        
        setErrors(newErrors);
        
        if (!hasErrors) {
            onSubmit(values);
        } else {
            toast({
                title: 'Validation Error',
                description: 'Please check the form for errors',
                status: 'error',
                duration: 3000
            });
        }
    };

    const renderField = (field: FormField) => {
        const error = errors[field.name];
        
        switch (field.type) {
            case 'password':
                return (
                    <InputGroup size={inputSize}>
                        <Input
                            type={showPassword[field.name] ? 'text' : 'password'}
                            value={values[field.name]}
                            onChange={e => handleChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            isInvalid={!!error}
                        />
                        <InputRightElement>
                            <IconButton
                                aria-label={showPassword[field.name] ? 'Hide password' : 'Show password'}
                                icon={showPassword[field.name] ? <FaEyeSlash /> : <FaEye />}
                                variant="ghost"
                                onClick={() => setShowPassword(prev => ({
                                    ...prev,
                                    [field.name]: !prev[field.name]
                                }))}
                            />
                        </InputRightElement>
                    </InputGroup>
                );
            
            case 'select':
                return (
                    <Select
                        value={values[field.name]}
                        onChange={e => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        isInvalid={!!error}
                        size={inputSize}
                    >
                        {field.options?.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                );
            
            case 'textarea':
                return (
                    <Textarea
                        value={values[field.name]}
                        onChange={e => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        isInvalid={!!error}
                        size={inputSize}
                    />
                );
            
            case 'number':
                return (
                    <NumberInput
                        value={values[field.name]}
                        onChange={value => handleChange(field.name, value)}
                        min={field.validation?.min}
                        max={field.validation?.max}
                        isInvalid={!!error}
                        size={inputSize}
                    >
                        <NumberInputField placeholder={field.placeholder} />
                        <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                        </NumberInputStepper>
                    </NumberInput>
                );
            
            case 'date':
                return (
                    <>
                        <InputGroup size={inputSize}>
                            <Input
                                value={values[field.name]}
                                placeholder={field.placeholder || 'Select date'}
                                isInvalid={!!error}
                                readOnly
                                onClick={() => {
                                    setActiveField(field.name);
                                    onDatePickerOpen();
                                }}
                            />
                            <InputRightElement>
                                <IconButton
                                    aria-label="Select date"
                                    icon={<FaCalendar />}
                                    variant="ghost"
                                    onClick={() => {
                                        setActiveField(field.name);
                                        onDatePickerOpen();
                                    }}
                                />
                            </InputRightElement>
                        </InputGroup>
                        <Modal isOpen={isDatePickerOpen && activeField === field.name} onClose={onDatePickerClose}>
                            <ModalOverlay />
                            <ModalContent>
                                <ModalHeader>Select Date</ModalHeader>
                                <ModalCloseButton />
                                <ModalBody>
                                    {/* Implement mobile-friendly date picker */}
                                </ModalBody>
                            </ModalContent>
                        </Modal>
                    </>
                );
            
            case 'time':
                return (
                    <>
                        <InputGroup size={inputSize}>
                            <Input
                                value={values[field.name]}
                                placeholder={field.placeholder || 'Select time'}
                                isInvalid={!!error}
                                readOnly
                                onClick={() => {
                                    setActiveField(field.name);
                                    onTimePickerOpen();
                                }}
                            />
                            <InputRightElement>
                                <IconButton
                                    aria-label="Select time"
                                    icon={<FaClock />}
                                    variant="ghost"
                                    onClick={() => {
                                        setActiveField(field.name);
                                        onTimePickerOpen();
                                    }}
                                />
                            </InputRightElement>
                        </InputGroup>
                        <Modal isOpen={isTimePickerOpen && activeField === field.name} onClose={onTimePickerClose}>
                            <ModalOverlay />
                            <ModalContent>
                                <ModalHeader>Select Time</ModalHeader>
                                <ModalCloseButton />
                                <ModalBody>
                                    {/* Implement mobile-friendly time picker */}
                                </ModalBody>
                            </ModalContent>
                        </Modal>
                    </>
                );
            
            case 'switch':
                return (
                    <Switch
                        isChecked={values[field.name]}
                        onChange={e => handleChange(field.name, e.target.checked)}
                        size={inputSize === 'lg' ? 'lg' : 'md'}
                    />
                );
            
            default:
                return (
                    <Input
                        type={field.type}
                        value={values[field.name]}
                        onChange={e => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        isInvalid={!!error}
                        size={inputSize}
                    />
                );
        }
    };

    return (
        <Box
            as="form"
            onSubmit={handleSubmit}
            bg={bgColor}
            borderWidth={1}
            borderColor={borderColor}
            borderRadius="lg"
            p={6}
        >
            <VStack spacing={6} align="stretch">
                {fields.map(field => (
                    <FormControl key={field.name} isInvalid={!!errors[field.name]}>
                        <FormLabel>{field.label}</FormLabel>
                        {renderField(field)}
                        {field.helperText && !errors[field.name] && (
                            <FormHelperText>{field.helperText}</FormHelperText>
                        )}
                        {errors[field.name] && (
                            <FormErrorMessage>{errors[field.name]}</FormErrorMessage>
                        )}
                    </FormControl>
                ))}
                
                <Button
                    type="submit"
                    colorScheme="blue"
                    size={inputSize}
                    isLoading={isLoading}
                    loadingText="Submitting"
                >
                    {submitLabel}
                </Button>
            </VStack>
        </Box>
    );
};

export default MobileForm; 