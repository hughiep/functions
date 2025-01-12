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

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    // Basic validation
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
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

    return NextResponse.json({
      originalName: file.name,
      size: buffer.length,
      type: file.type,
      optimizedUrl: cdnUrl,
    })
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
