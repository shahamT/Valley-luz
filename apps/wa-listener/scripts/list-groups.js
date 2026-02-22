/**
 * Standalone script: list all WhatsApp groups (name + id) for the connected account.
 * Uses the same auth as the main listener. No MongoDB required.
 * Run from apps/wa-listener: npm run list-groups
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join, isAbsolute } from 'path'
import { existsSync, mkdirSync } from 'fs'
import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'
import P from 'pino'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const waListenerRoot = join(__dirname, '..')

dotenv.config({ path: join(waListenerRoot, '.env') })

const authPathRaw = process.env.WA_AUTH_PATH || 'auth'
const authPath = isAbsolute(authPathRaw) ? authPathRaw : join(waListenerRoot, authPathRaw)

if (!existsSync(authPath)) {
  mkdirSync(authPath, { recursive: true })
}

const INIT_TIMEOUT_MS = 90000
const HEBREW_ARABIC_RANGE = /[\u0590-\u05FF\u0600-\u06FF]/

const baileysLogger = P({ level: 'silent' })

function isPredominantlyRtl(str) {
  if (!str || !str.length) return false
  let rtl = 0
  let total = 0
  for (const c of str) {
    if (/\p{L}/u.test(c)) {
      total += 1
      if (HEBREW_ARABIC_RANGE.test(c)) rtl += 1
    }
  }
  return total > 0 && rtl / total >= 0.5
}

function displayName(name) {
  return isPredominantlyRtl(name) ? [...name].reverse().join('') : name
}

function log(msg) {
  console.log(msg)
}

function logError(msg, err) {
  console.error(msg, err != null ? err : '')
}

async function run() {
  log('Listing all groups...')
  log(`Auth path: ${authPath}`)
  log('Tip: If the main listener (npm run dev:wa) is running, stop it first so this script can use the session.')
  log('')

  const { state, saveCreds } = await useMultiFileAuthState(authPath)
  const { version } = await fetchLatestBaileysVersion()
  log(`Using WA Web version: ${version.join('.')}`)
  log('')

  const sock = makeWASocket({
    version,
    logger: baileysLogger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
    },
    generateHighQualityLinkPreview: false,
  })

  return new Promise((resolve, reject) => {
    const initTimeout = setTimeout(() => {
      reject(new Error(`Connection timeout after ${INIT_TIMEOUT_MS / 1000} seconds`))
    }, INIT_TIMEOUT_MS)

    sock.ev.process(async (events) => {
      if (events['connection.update']) {
        const { connection, lastDisconnect, qr } = events['connection.update']

        if (qr) {
          log('=== WhatsApp QR Code (scan to authenticate) ===')
          log('')
          qrcode.generate(qr, { small: true })
          log('')
          log('=== Raw QR Data (paste into any online QR generator if you cannot scan) ===')
          log(qr)
          log('=== End Raw QR Data ===')
        }

        if (connection === 'open') {
          clearTimeout(initTimeout)
          log('Connected.')
          log('')
          await new Promise((r) => setTimeout(r, 1500))

          try {
            const groups = await sock.groupFetchAllParticipating()
            const groupList = Object.values(groups)

            if (groupList.length === 0) {
              log('No groups found.')
            } else {
              log(`=== ${groupList.length} group(s) ===`)
              log('')
              groupList.forEach((group, index) => {
                const name = group.subject || 'Unknown'
                const id = group.id || ''
                log(`${index + 1}. ${displayName(name)}`)
                log(`   ID: ${id}`)
                log('')
              })
              const ids = groupList.map((g) => g.id).filter(Boolean)
              if (ids.length > 0) {
                log('=== Copy to .env ===')
                log(`WHATSAPP_GROUP_IDS=${ids.join(',')}`)
                log('')
              }
            }

            log('Done.')
          } catch (err) {
            logError('Error fetching groups:', err)
            reject(err)
            return
          }

          try {
            sock.end(undefined)
          } catch (_) {
            /* ignore */
          }
          resolve()
          return
        }

        if (connection === 'close') {
          clearTimeout(initTimeout)
          const statusCode = (lastDisconnect?.error)?.output?.statusCode
          const loggedOut = statusCode === DisconnectReason.loggedOut
          if (loggedOut) {
            logError('Logged out. Delete the auth folder and run again to re-authenticate.')
            reject(new Error('WhatsApp logged out'))
          } else if (statusCode === 440) {
            logError('Connection closed (440). The same WhatsApp session is likely in use by another process (e.g. the main listener). Stop "npm run dev:wa" and run this script again.')
            reject(new Error('Connection closed (440)'))
          } else {
            logError(`Connection closed. Status: ${statusCode}`)
            reject(new Error('Connection closed'))
          }
        }
      }

      if (events['creds.update']) {
        await saveCreds()
      }
    })
  })
}

run()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    logError('Failed:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  })
