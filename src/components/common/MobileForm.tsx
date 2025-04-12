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
    useToast,
    VisuallyHidden
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
    submitText?: string;
    resetText?: string;
    isLoading?: boolean;
    error?: string;
    successMessage?: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    showReset?: boolean;
    showSubmit?: boolean;
    submitButtonProps?: any;
    resetButtonProps?: any;
    formProps?: any;
    fieldProps?: any;
    formId?: string;
}

const MobileForm: React.FC<MobileFormProps> = ({
    fields,
    onSubmit,
    submitText = 'Submit',
    resetText = 'Reset',
    isLoading = false,
    error,
    successMessage,
    onSuccess,
    onError,
    validateOnChange = true,
    validateOnBlur = true,
    showReset = true,
    showSubmit = true,
    submitButtonProps,
    resetButtonProps,
    formProps,
    fieldProps,
    formId = 'mobile-form'
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

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const field = fields.find(f => f.name === e.target.name);
        if (field && validateOnBlur) {
            const error = validateField(field, e.target.value);
            setErrors(prev => ({
                ...prev,
                [field.name]: error || ''
            }));
        }
    };

    const handleReset = () => {
        setValues(() => {
            const initialValues: Record<string, any> = {};
            fields.forEach(field => {
                initialValues[field.name] = field.defaultValue || '';
            });
            return initialValues;
        });
        setErrors({});
    };

    const renderField = (field: FormField) => {
        const error = errors[field.name];
        const isInvalid = !!error;
        const isRequired = field.validation?.required;
        const fieldId = `${formId}-${field.name}`;
        const helperId = `${fieldId}-helper`;
        const errorId = `${fieldId}-error`;

        const commonProps = {
            id: fieldId,
            name: field.name,
            value: values[field.name] || '',
            onChange: handleChange,
            onBlur: handleBlur,
            isInvalid,
            'aria-invalid': isInvalid,
            'aria-describedby': `${helperId} ${isInvalid ? errorId : ''}`,
            'aria-required': isRequired,
            ...fieldProps
        };

        switch (field.type) {
            case 'text':
            case 'email':
            case 'password':
                return (
                    <FormControl isInvalid={isInvalid} isRequired={isRequired}>
                        <FormLabel htmlFor={fieldId}>{field.label}</FormLabel>
                        <InputGroup>
                            <Input
                                type={field.type}
                                placeholder={field.placeholder}
                                {...commonProps}
                            />
                            {field.type === 'password' && (
                                <InputRightElement>
                                    <IconButton
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                                        variant="ghost"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    />
                                </InputRightElement>
                            )}
                        </InputGroup>
                        {field.helperText && (
                            <FormHelperText id={helperId}>
                                {field.helperText}
                            </FormHelperText>
                        )}
                        {isInvalid && (
                            <FormErrorMessage id={errorId}>
                                {error}
                            </FormErrorMessage>
                        )}
                    </FormControl>
                );

            case 'number':
                return (
                    <FormControl isInvalid={isInvalid} isRequired={isRequired}>
                        <FormLabel htmlFor={fieldId}>{field.label}</FormLabel>
                        <NumberInput
                            value={values[field.name]}
                            onChange={(value) => handleChange({ target: { name: field.name, value } })}
                            min={field.validation?.min}
                            max={field.validation?.max}
                            {...commonProps}
                        >
                            <NumberInputField id={fieldId} />
                            <NumberInputStepper>
                                <NumberIncrementStepper aria-label="Increase value" />
                                <NumberDecrementStepper aria-label="Decrease value" />
                            </NumberInputStepper>
                        </NumberInput>
                        {field.helperText && (
                            <FormHelperText id={helperId}>
                                {field.helperText}
                            </FormHelperText>
                        )}
                        {isInvalid && (
                            <FormErrorMessage id={errorId}>
                                {error}
                            </FormErrorMessage>
                        )}
                    </FormControl>
                );

            case 'select':
                return (
                    <FormControl isInvalid={isInvalid} isRequired={isRequired}>
                        <FormLabel htmlFor={fieldId}>{field.label}</FormLabel>
                        <Select
                            placeholder={field.placeholder || 'Select an option'}
                            {...commonProps}
                        >
                            {field.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                        {field.helperText && (
                            <FormHelperText id={helperId}>
                                {field.helperText}
                            </FormHelperText>
                        )}
                        {isInvalid && (
                            <FormErrorMessage id={errorId}>
                                {error}
                            </FormErrorMessage>
                        )}
                    </FormControl>
                );

            case 'textarea':
                return (
                    <FormControl isInvalid={isInvalid} isRequired={isRequired}>
                        <FormLabel htmlFor={fieldId}>{field.label}</FormLabel>
                        <Textarea
                            placeholder={field.placeholder}
                            {...commonProps}
                        />
                        {field.helperText && (
                            <FormHelperText id={helperId}>
                                {field.helperText}
                            </FormHelperText>
                        )}
                        {isInvalid && (
                            <FormErrorMessage id={errorId}>
                                {error}
                            </FormErrorMessage>
                        )}
                    </FormControl>
                );

            case 'switch':
                return (
                    <FormControl isInvalid={isInvalid} isRequired={isRequired}>
                        <HStack>
                            <Switch
                                id={fieldId}
                                isChecked={values[field.name]}
                                onChange={(e) => handleChange({ target: { name: field.name, value: e.target.checked } })}
                                {...commonProps}
                            />
                            <FormLabel htmlFor={fieldId} mb="0">
                                {field.label}
                            </FormLabel>
                        </HStack>
                        {field.helperText && (
                            <FormHelperText id={helperId}>
                                {field.helperText}
                            </FormHelperText>
                        )}
                        {isInvalid && (
                            <FormErrorMessage id={errorId}>
                                {error}
                            </FormErrorMessage>
                        )}
                    </FormControl>
                );

            case 'date':
                return (
                    <FormControl isInvalid={isInvalid} isRequired={isRequired}>
                        <FormLabel htmlFor={fieldId}>{field.label}</FormLabel>
                        <InputGroup>
                            <Input
                                value={values[field.name]}
                                placeholder={field.placeholder || 'Select date'}
                                isInvalid={isInvalid}
                                readOnly
                                onClick={() => {
                                    setActiveField(field.name);
                                    onDatePickerOpen();
                                }}
                                {...commonProps}
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
                                    tabIndex={-1}
                                />
                            </InputRightElement>
                        </InputGroup>
                        <Modal 
                            isOpen={isDatePickerOpen && activeField === field.name} 
                            onClose={onDatePickerClose}
                            aria-labelledby={`${fieldId}-modal-title`}
                        >
                            <ModalOverlay />
                            <ModalContent>
                                <ModalHeader id={`${fieldId}-modal-title`}>Select Date</ModalHeader>
                                <ModalCloseButton />
                                <ModalBody>
                                    {/* Implement mobile-friendly date picker */}
                                </ModalBody>
                            </ModalContent>
                        </Modal>
                        {field.helperText && (
                            <FormHelperText id={helperId}>
                                {field.helperText}
                            </FormHelperText>
                        )}
                        {isInvalid && (
                            <FormErrorMessage id={errorId}>
                                {error}
                            </FormErrorMessage>
                        )}
                    </FormControl>
                );

            case 'time':
                return (
                    <FormControl isInvalid={isInvalid} isRequired={isRequired}>
                        <FormLabel htmlFor={fieldId}>{field.label}</FormLabel>
                        <InputGroup>
                            <Input
                                value={values[field.name]}
                                placeholder={field.placeholder || 'Select time'}
                                isInvalid={isInvalid}
                                readOnly
                                onClick={() => {
                                    setActiveField(field.name);
                                    onTimePickerOpen();
                                }}
                                {...commonProps}
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
                                    tabIndex={-1}
                                />
                            </InputRightElement>
                        </InputGroup>
                        <Modal 
                            isOpen={isTimePickerOpen && activeField === field.name} 
                            onClose={onTimePickerClose}
                            aria-labelledby={`${fieldId}-modal-title`}
                        >
                            <ModalOverlay />
                            <ModalContent>
                                <ModalHeader id={`${fieldId}-modal-title`}>Select Time</ModalHeader>
                                <ModalCloseButton />
                                <ModalBody>
                                    {/* Implement mobile-friendly time picker */}
                                </ModalBody>
                            </ModalContent>
                        </Modal>
                        {field.helperText && (
                            <FormHelperText id={helperId}>
                                {field.helperText}
                            </FormHelperText>
                        )}
                        {isInvalid && (
                            <FormErrorMessage id={errorId}>
                                {error}
                            </FormErrorMessage>
                        )}
                    </FormControl>
                );

            default:
                return null;
        }
    };

    return (
        <Box
            as="form"
            onSubmit={handleSubmit}
            id={formId}
            role="form"
            aria-label="Mobile form"
            {...formProps}
        >
            <VStack spacing={4} align="stretch">
                {fields.map((field) => (
                    <Box key={field.name}>
                        {renderField(field)}
                    </Box>
                ))}

                {(showSubmit || showReset) && (
                    <HStack spacing={4} justify="flex-end">
                        {showReset && (
                            <Button
                                type="button"
                                onClick={handleReset}
                                isDisabled={isLoading}
                                {...resetButtonProps}
                            >
                                {resetText}
                            </Button>
                        )}
                        {showSubmit && (
                            <Button
                                type="submit"
                                colorScheme="blue"
                                isLoading={isLoading}
                                {...submitButtonProps}
                            >
                                {submitText}
                            </Button>
                        )}
                    </HStack>
                )}

                {error && (
                    <Alert status="error" role="alert">
                        <AlertIcon />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {successMessage && (
                    <Alert status="success" role="alert">
                        <AlertIcon />
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                )}
            </VStack>
        </Box>
    );
};

export default MobileForm; 