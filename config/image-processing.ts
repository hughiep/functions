export const IMAGE_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  supportedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  optimization: {
    quality: 80,
    maxWidth: 1200,
    maxHeight: 1200,
  },
  cache: {
    duration: 7 * 24 * 60 * 60, // 7 days in seconds
  },
}

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
}
