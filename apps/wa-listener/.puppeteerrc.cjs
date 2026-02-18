const { join } = require('path')

/**
 * Configure Puppeteer to store Chrome inside the project directory.
 * This ensures the browser persists between Render's build and runtime phases.
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
}
