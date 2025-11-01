const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

export const uploadToCloudinary = async (file: File, resourceType: 'image' | 'video' = 'image'): Promise<string> => {
  console.log(`Starting upload for ${file.name}, type: ${resourceType}, size: ${file.size}`);
  
  // Validate file size for videos (2GB limit)
  if (resourceType === 'video' && file.size > 2 * 1024 * 1024 * 1024) {
    throw new Error('Video file size must be less than 2GB');
  }

  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary cloud name not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default'); // Try default preset first
  
  console.log(`Uploading to: https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`);
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    console.log('Upload response status:', response.status);
    
    const data = await response.json();
    console.log('Upload response data:', data);

    if (!response.ok) {
      console.error('Cloudinary error details:', data);
      throw new Error(data.error?.message || `Upload failed with status ${response.status}`);
    }

    console.log('Upload successful, URL:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error for file:', file.name, error);
    throw error;
  }
};

export const validateFile = (file: File, type: 'image' | 'video'): string | null => {
  console.log(`Validating file: ${file.name}, type: ${type}, size: ${file.size}, mimeType: ${file.type}`);
  
  if (type === 'image') {
    if (!file.type.startsWith('image/')) {
      return 'Please select a valid image file';
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit for images
      return 'Image size must be less than 10MB';
    }
  }

  if (type === 'video') {
    // Accept mp4, webm, and other common video formats
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/quicktime'];
    if (!validVideoTypes.some(validType => file.type.includes(validType.split('/')[1]))) {
      return 'Supported video formats: MP4, WebM, AVI, MOV';
    }
    if (file.size > 2 * 1024 * 1024 * 1024) { // 2GB limit
      return 'Video size must be less than 2GB';
    }
  }

  console.log('File validation passed');
  return null;
};
