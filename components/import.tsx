'use client'

import React, { useMemo, CSSProperties, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'

const baseStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  borderWidth: 2,
  borderRadius: 8,
  borderColor: '#eeeeee',
  borderStyle: 'dashed',
  backgroundColor: '#fafafa',
  color: '#bdbdbd',
  outline: 'none',
  transition: 'all 0.3s ease-in-out',
  minHeight: '200px',
  justifyContent: 'center',
}

const focusedStyle: CSSProperties = {
  borderColor: '#2196f3',
  backgroundColor: '#f8f9ff',
  transform: 'scale(1.01)',
}

const acceptStyle: CSSProperties = {
  borderColor: '#00e676',
  backgroundColor: '#f6fff9',
}

const rejectStyle: CSSProperties = {
  borderColor: '#ff1744',
  backgroundColor: '#fff6f6',
}

interface ProcessedImage {
  originalName: string
  size: number
  type: string
  dimensions: {
    width: number
    height: number
  }
  metadata: {
    format: string
    space: string
    hasAlpha: boolean
    channels: number
  }
  optimizedSize: number
  compressionRatio: number
  processedImage: string
  cdnUrl?: string
}

interface ImageItem {
  id: string
  file: File
  preview: string
  processedData: ProcessedImage | null
  status: 'pending' | 'processing' | 'complete' | 'error'
  error?: string
}

export default function Import() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const processImage = async (imageItem: ImageItem) => {
    const formData = new FormData()
    formData.append('image', imageItem.file)

    try {
      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to process image')
      }

      const result = await response.json()
      return result
    } catch (err) {
      throw err
    }
  }

  const onDrop = async (acceptedFiles: File[]) => {
    const newImages: ImageItem[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      processedData: null,
      status: 'pending',
    }))

    setImages((prev) => [...prev, ...newImages])
    setIsProcessing(true)

    for (const imageItem of newImages) {
      try {
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageItem.id ? { ...img, status: 'processing' } : img,
          ),
        )

        const processedData = await processImage(imageItem)

        setImages((prev) =>
          prev.map((img) =>
            img.id === imageItem.id
              ? { ...img, processedData, status: 'complete' }
              : img,
          ),
        )
      } catch (error) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageItem.id
              ? {
                  ...img,
                  status: 'error',
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Processing failed',
                }
              : img,
          ),
        )
      }
    }

    setIsProcessing(false)
  }

  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({
      accept: { 'image/*': [] },
      onDrop,
      maxFiles: 5,
      maxSize: 5 * 1024 * 1024, // 5MB
    })

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject],
  )

  useEffect(() => {
    return () => {
      // Cleanup object URLs on unmount
      images.forEach((image) => {
        URL.revokeObjectURL(image.preview)
      })
    }
  }, [images])

  const downloadImage = async (image: ImageItem) => {
    if (!image.processedData) return

    try {
      const url =
        image.processedData.cdnUrl || image.processedData.processedImage
      const response = await fetch(url)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `compressed-${image.processedData.originalName}`
      link.click()

      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  return (
    <div className="container">
      {isProcessing && (
        <div className="processing-banner">Processing images...</div>
      )}
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <div className="content-wrapper">
          <div className="drop-message fade-in">
            <p>Drag & drop up to 5 images here, or click to select</p>
            <p className="hint-text">Max size: 5MB per image</p>
          </div>
        </div>
      </div>

      <div className="image-grid">
        {images.map((image) => (
          <div key={image.id} className="image-item">
            <img
              src={image.preview}
              alt={image.file.name}
              className="preview-image"
            />
            <div className="image-info">
              {image.status === 'processing' && (
                <div className="skeleton-wrapper">
                  <div className="skeleton-text pulse" />
                </div>
              )}
              {image.status === 'complete' && image.processedData && (
                <>
                  <img
                    src={image.processedData.cdnUrl || image.preview}
                    alt={image.file.name}
                    className="preview-image"
                  />
                  <button
                    onClick={() => downloadImage(image)}
                    className="download-button"
                  >
                    Download
                  </button>
                </>
              )}
              {image.status === 'error' && (
                <p className="error-text">{image.error}</p>
              )}
              <button
                onClick={() => {
                  setImages((prev) => prev.filter((img) => img.id !== image.id))
                  URL.revokeObjectURL(image.preview)
                }}
                className="remove-button"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .content-wrapper {
          text-align: center;
          transition: all 0.3s ease;
        }

        .fade-in {
          animation: fadeIn 0.3s ease-in;
        }

        .hint-text {
          font-size: 0.8em;
          color: #999;
          margin-top: 8px;
          transition: color 0.3s ease;
        }

        .spinner {
          display: none;
        }

        .remove-button {
          margin-top: 12px;
          padding: 8px 16px;
          background-color: #ff1744;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(255, 23, 68, 0.2);
        }

        .remove-button:hover {
          background-color: #f01540;
          transform: translateY(-1px);
          box-shadow: 0 3px 6px rgba(255, 23, 68, 0.3);
        }

        .remove-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(255, 23, 68, 0.2);
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .preview-container,
        .loading-container,
        .drop-message {
          transition: all 0.3s ease;
        }

        .skeleton-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .skeleton-image {
          width: 200px;
          height: 150px;
          background: #eee;
          border-radius: 4px;
        }

        .skeleton-text {
          width: 140px;
          height: 16px;
          background: #eee;
          border-radius: 4px;
        }

        .pulse {
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .metadata {
          margin-top: 12px;
          padding: 8px;
          background: #f5f5f5;
          border-radius: 4px;
          width: 100%;
          max-width: 200px;
        }

        .error-text {
          color: #ff1744;
          font-size: 0.9em;
          margin-top: 8px;
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 20px;
        }

        .image-item {
          border: 1px solid #eee;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .image-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .preview-image {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        .image-info {
          padding: 12px;
        }

        .filename {
          font-size: 0.9em;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .metadata {
          font-size: 0.8em;
          color: #666;
          margin: 4px 0;
        }

        .processing-banner {
          background: #2196f3;
          color: white;
          padding: 8px;
          text-align: center;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .download-button {
          background: #4caf50;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          margin-top: 8px;
        }
      `}</style>
    </div>
  )
}
