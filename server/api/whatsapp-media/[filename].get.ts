import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { createReadStream } from 'fs'

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')
  
  if (!filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Filename is required',
    })
  }

  // Security: prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid filename',
    })
  }

  // Path to media file
  const mediaPath = join(process.cwd(), 'apps/wa-listener/data/media', filename)

  // Check if file exists
  if (!existsSync(mediaPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Media file not found',
    })
  }

  // Determine content type from file extension
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mp3': 'audio/mpeg',
    'ogg': 'audio/ogg',
    'wav': 'audio/wav',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
  }

  const contentType = mimeTypes[ext || ''] || 'application/octet-stream'

  // Set headers and return file stream
  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Content-Disposition', `inline; filename="${filename}"`)
  
  return createReadStream(mediaPath)
})
