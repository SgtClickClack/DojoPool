import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Image,
  VStack,
  useToast,
  Progress,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onUploadComplete: (url: string) => void;
  maxSize?: number; // in MB
  aspectRatio?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onUploadComplete,
  maxSize = 5,
  aspectRatio = 1,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${maxSize}MB`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const fileName = `profile-pictures/${timestamp}-${file.name}`;
      const storageRef = ref(storage, fileName);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          toast({
            title: 'Upload failed',
            description: 'Failed to upload image. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          onUploadComplete(downloadUrl);
          setIsUploading(false);
          setUploadProgress(0);
          toast({
            title: 'Upload successful',
            description: 'Your profile picture has been updated.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        }
      );
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box
        position="relative"
        width="200px"
        height={`${200 / aspectRatio}px`}
        mx="auto"
        borderWidth={2}
        borderStyle="dashed"
        borderColor={borderColor}
        borderRadius="lg"
        overflow="hidden"
        bg={bgColor}
        cursor="pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          style={{ display: 'none' }}
          disabled={isUploading}
        />
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Profile preview"
            objectFit="cover"
            width="100%"
            height="100%"
          />
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100%"
          >
            <Text color="gray.500">Click to upload</Text>
          </Box>
        )}
      </Box>

      {isUploading && (
        <Box width="100%">
          <Progress value={uploadProgress} size="sm" />
          <Text fontSize="sm" textAlign="center" mt={2}>
            Uploading... {Math.round(uploadProgress)}%
          </Text>
        </Box>
      )}

      <Text fontSize="sm" textAlign="center" color="gray.500">
        Maximum file size: {maxSize}MB
      </Text>
    </VStack>
  );
};

export default ImageUpload; 