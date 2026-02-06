import OpenAI from 'openai'

// Initialize OpenAI client
// Ready for future OpenAI integrations
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
