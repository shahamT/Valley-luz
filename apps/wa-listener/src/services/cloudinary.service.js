import { v2 as cloudinary } from 'cloudinary'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { LOG_PREFIXES } from '../consts/index.js'

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
})

/**
 * Uploads media buffer to Cloudinary
 * @param {Buffer} buffer - Media file buffer
 * @param {string} filename - Filename for the upload
 * @param {string} mimetype - MIME type of the media
 * @returns {Promise<{url: string, secure_url: string, public_id: string}|null>} Cloudinary upload result or null if failed
 */
export async function uploadMediaToCloudinary(buffer, filename, mimetype) {
  // Validate Cloudinary configuration
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    logger.error(LOG_PREFIXES.CLOUDINARY, 'Missing Cloudinary configuration. Check .env file.')
    return null
  }

  try {
    // Determine resource type from mimetype
    let resourceType = 'auto'
    if (mimetype.startsWith('image/')) {
      resourceType = 'image'
    } else if (mimetype.startsWith('video/')) {
      resourceType = 'video'
    } else if (mimetype.startsWith('audio/')) {
      resourceType = 'video' // Cloudinary treats audio as video
    } else {
      resourceType = 'raw'
    }

    // Create public_id with folder path
    const publicId = `${config.cloudinary.folder}/${filename.replace(/\.[^/.]+$/, '')}`

    // Upload buffer directly to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: config.cloudinary.folder,
          public_id: publicId,
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        }
      )

      // Write buffer to upload stream
      uploadStream.end(buffer)
    })

    if (config.logLevel === 'info') {
      logger.info(LOG_PREFIXES.CLOUDINARY, `Uploaded media: ${result.secure_url}`)
    }

    return {
      url: result.url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.CLOUDINARY, `Error uploading media: ${errorMsg}`)
    return null
  }
}
