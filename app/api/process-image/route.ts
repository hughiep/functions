import { NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 },
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 },
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Process image with Sharp
    const image = sharp(buffer)
    const metadata = await image.metadata()

    // Optimize image
    const processedBuffer = await image
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer()

    // Convert buffer to base64
    const base64Image = processedBuffer.toString('base64')

    const processedResult = {
      originalName: file.name,
      size: processedBuffer.length,
      type: file.type,
      dimensions: {
        width: metadata.width || 0,
        height: metadata.height || 0,
      },
      metadata: {
        format: metadata.format,
        space: metadata.space,
        hasAlpha: metadata.hasAlpha,
        channels: metadata.channels,
      },
      optimizedSize: processedBuffer.length,
      compressionRatio: buffer.length / processedBuffer.length,
      processedImage: `data:image/jpeg;base64,${base64Image}`,
    }

    return NextResponse.json(processedResult)
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
    responseLimit: '8mb',
  },
}
