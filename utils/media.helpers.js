/**
 * Media URL helpers for display (gallery thumbnails, popup).
 * Used only on the frontend; does not change how events or media are stored.
 */

/**
 * Returns true when the URL looks like a Cloudinary video (path contains /video/upload/).
 * @param {string|null} url
 * @returns {boolean}
 */
export function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false
  return /\/video\/upload\//i.test(url)
}

/**
 * For Cloudinary video URLs, returns a URL that requests a single frame as an image (thumbnail).
 * Uses start offset so_0 and .jpg so Cloudinary returns an image. Non-Cloudinary or invalid URLs return the original URL as fallback.
 * @param {string} videoUrl - Cloudinary video URL
 * @returns {string} Thumbnail image URL or original URL if not transformable
 */
export function getCloudinaryVideoThumbnailUrl(videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string') return videoUrl || ''
  if (!/\/video\/upload\//i.test(videoUrl)) return videoUrl

  try {
    // Insert so_0 after /upload/ to get frame at 0s; change extension to .jpg for image output
    // e.g. .../video/upload/v1234/id.mp4 -> .../video/upload/so_0/v1234/id.jpg
    const uploadMatch = videoUrl.match(/^(.+\/video\/upload\/)(.+)$/i)
    if (!uploadMatch) return videoUrl
    const [, prefix, rest] = uploadMatch
    const [pathPart, ...queryParts] = rest.split('?')
    const query = queryParts.length ? '?' + queryParts.join('?') : ''
    const pathWithJpg = pathPart.replace(/\.[^.\/]+$/i, '.jpg')
    return `${prefix}so_0/${pathWithJpg}${query}`
  } catch {
    return videoUrl
  }
}
