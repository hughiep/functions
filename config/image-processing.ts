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

export const SECURITY_CONFIG = {
  maxConcurrentUploads: 5,
  rateLimitPerMinute: 20,
  allowedDomains: ['*'], // Restrict if needed
  maxTotalSize: 20 * 1024 * 1024, // 20MB total
}

export const ENV_CONFIG = {
  isDev: process.env.NODE_ENV === 'development',
  maxFileSize:
    process.env.NODE_ENV === 'development'
      ? 10 * 1024 * 1024 // 10MB in dev
      : 5 * 1024 * 1024, // 5MB in prod
  debugMode: process.env.DEBUG === 'true',
}
