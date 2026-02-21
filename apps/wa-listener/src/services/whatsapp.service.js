/**
 * WhatsApp service barrel: wires message handler into client and re-exports public API.
 * Existing imports from './whatsapp.service.js' continue to work.
 */

import { initializeClient as initClient } from './whatsappClient.service.js'
import { handleIncomingMessage } from './whatsappMessageHandler.js'

export async function initializeClient() {
  return initClient({ onIncomingMessage: handleIncomingMessage })
}

export { getClient, destroyClient, downloadMedia } from './whatsappClient.service.js'
