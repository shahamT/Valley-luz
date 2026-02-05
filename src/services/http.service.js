const DEFAULT_TIMEOUT = 10000 // 10 seconds
const DEFAULT_RETRIES = 2

/**
 * Creates a timeout promise that rejects after specified milliseconds
 */
function createTimeout(timeout) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeout)
  })
}

/**
 * Fetches with timeout and retry logic
 */
async function fetchWithRetry(url, options = {}, retries = DEFAULT_RETRIES, timeout = DEFAULT_TIMEOUT) {
  const fetchPromise = fetch(url, options)
  const timeoutPromise = createTimeout(timeout)

  try {
    const response = await Promise.race([fetchPromise, timeoutPromise])
    
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`)
      error.status = response.status
      error.statusText = response.statusText
      throw error
    }
    
    return response.json()
  } catch (error) {
    if (retries > 0 && !error.status) {
      // Retry on network errors, not HTTP errors
      return fetchWithRetry(url, options, retries - 1, timeout)
    }
    throw error
  }
}

const httpService = {
  async get(url, options = {}) {
    return fetchWithRetry(url, {
      ...options,
      method: 'GET',
    })
  },

  async post(url, data, options = {}) {
    return fetchWithRetry(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    })
  },

  async put(url, data, options = {}) {
    return fetchWithRetry(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    })
  },

  async delete(url, options = {}) {
    return fetchWithRetry(url, {
      ...options,
      method: 'DELETE',
    })
  },
}

export default httpService
