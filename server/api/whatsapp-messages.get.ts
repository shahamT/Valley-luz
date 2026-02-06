import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || 200, 500)

  // Path to messages file (relative to project root)
  const messagesPath = join(process.cwd(), 'apps/wa-listener/data/messages.jsonl')

  // Return empty array if file doesn't exist
  if (!existsSync(messagesPath)) {
    return { messages: [] }
  }

  try {
    // Read file content
    const content = await readFile(messagesPath, 'utf-8')
    
    // Split by lines and filter empty lines
    const lines = content.split('\n').filter((line) => line.trim() !== '')
    
    // Parse each line as JSON
    const messages = []
    for (const line of lines) {
      try {
        const message = JSON.parse(line)
        messages.push(message)
      } catch (error) {
        // Skip invalid JSON lines
        console.error('[WhatsApp API] Error parsing line:', error)
      }
    }

    // Sort by timestamp (newest first) and limit
    messages.sort((a, b) => {
      // Handle both Unix timestamp (number) and ISO string
      const getTimestamp = (msg) => {
        if (typeof msg.timestamp === 'number') {
          return msg.timestamp
        }
        if (msg.timestampISO) {
          return new Date(msg.timestampISO).getTime()
        }
        if (msg.timestamp) {
          return new Date(msg.timestamp).getTime()
        }
        return 0
      }
      return getTimestamp(b) - getTimestamp(a)
    })

    return {
      messages: messages.slice(0, limit),
      total: messages.length,
    }
  } catch (error) {
    console.error('[WhatsApp API] Error reading messages:', error)
    return { messages: [], error: 'Failed to read messages' }
  }
})
