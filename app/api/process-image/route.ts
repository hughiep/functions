import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary'
import { IMAGE_CONFIG, CLOUDINARY_CONFIG } from '@/config/image-processing'

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CONFIG.cloudName,
  api_key: CLOUDINARY_CONFIG.apiKey,
  api_secret: CLOUDINARY_CONFIG.apiSecret,
  secure: true,
})

// Add basic analytics
interface UploadStats {
  totalUploads: number
  totalSize: number
  averageSize: number
  errors: Record<string, number>
}

const stats: UploadStats = {
  totalUploads: 0,
  totalSize: 0,
  averageSize: 0,
  errors: {},
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    // Enhanced validation
    if (!file) {
      return NextResponse.json(
        {
          error: 'No image file provided',
          code: 'NO_FILE',
        },
        { status: 400 },
      )
    }

    if (!IMAGE_CONFIG.supportedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}`,
          code: 'INVALID_TYPE',
          supportedTypes: IMAGE_CONFIG.supportedTypes,
        },
        { status: 400 },
      )
    }

    if (file.size > IMAGE_CONFIG.maxFileSize) {
      return NextResponse.json(
        {
          error: 'File too large',
          code: 'FILE_TOO_LARGE',
          maxSize: IMAGE_CONFIG.maxFileSize,
          actualSize: file.size,
        },
        { status: 400 },
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload directly to Cloudinary
    let cdnUrl = null
    if (CLOUDINARY_CONFIG.cloudName) {
      const uploadResponse = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: 'optimized-images',
                resource_type: 'image',
                transformation: [
                  { width: IMAGE_CONFIG.optimization.maxWidth },
                  { height: IMAGE_CONFIG.optimization.maxHeight },
                  { crop: 'fit' },
                  { quality: IMAGE_CONFIG.optimization.quality },
                  { fetch_format: 'auto' },
                  { progressive: true },
                ],
              },
              (
                err: UploadApiErrorResponse | undefined,
                result: UploadApiResponse | undefined,
              ) => {
                if (err) reject(err)
                else if (!result) reject(new Error('No upload result'))
                else resolve(result)
              },
            )
            .end(buffer)
        },
      )
      cdnUrl = uploadResponse.secure_url
    }

    const response = NextResponse.json({
      originalName: file.name,
      size: buffer.length,
      type: file.type,
      optimizedUrl: cdnUrl,
    })

    response.headers.set(
      'Cache-Control',
      `public, max-age=${IMAGE_CONFIG.cache.duration}, immutable`,
    )
    response.headers.set(
      'ETag',
      `"${Buffer.from(file.name + file.size).toString('base64')}"`,
    )

    // Update stats in the POST handler
    stats.totalUploads++
    stats.totalSize += file.size
    stats.averageSize = stats.totalSize / stats.totalUploads

    return response
  } catch (error) {
    console.error('Error processing image:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 },
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
}
