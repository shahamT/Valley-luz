# WhatsApp Group Listener - PoC Documentation

## Overview

This is a Proof of Concept (PoC) integration for listening to WhatsApp group messages. The listener runs as a separate Node.js service and writes incoming messages to a JSONL file, which can be viewed via a Nuxt API endpoint and frontend page.

**⚠️ Important**: This is a PoC only. Do not use in production without proper security review.

## Architecture

- **WhatsApp Listener**: Separate Node.js service in `apps/wa-listener/`
- **Nuxt API**: Endpoint at `/api/whatsapp-messages` to read messages
- **Frontend Page**: PoC page at `/poc/whatsapp` to view messages

## Local Setup

### 1. Install Dependencies

```bash
cd apps/wa-listener
npm install
```

### 2. Configure Environment

```bash
cd apps/wa-listener
cp .env.example .env
```

Edit `.env` and configure:
- `NODE_ENV=development`
- `WA_DISCOVERY_MODE=true` (initially)
- Leave `WHATSAPP_GROUP_IDS` empty initially
- **Cloudinary Configuration** (required for media uploads):
  - `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name (from dashboard)
  - `CLOUDINARY_API_KEY` - Your Cloudinary API key (from dashboard)
  - `CLOUDINARY_API_SECRET` - Your Cloudinary API secret (from dashboard)
  - `CLOUDINARY_FOLDER=whatsapp-listener` (optional, defaults to this)

### 3. Run the Listener

```bash
# From apps/wa-listener directory
npm run dev

# Or from root directory
npm run dev:wa
```

### 4. Authenticate

1. A QR code will appear in the terminal
2. Open WhatsApp on your phone
3. Go to Settings → Linked Devices → Link a Device
4. Scan the QR code from the terminal
5. Wait for "Client is ready!" message

## Discovery Mode

Discovery mode helps you find the correct group ID.

### Step 1: Enable Discovery Mode

In `apps/wa-listener/.env`:
```
WA_DISCOVERY_MODE=true
WHATSAPP_GROUP_IDS=
```

### Step 2: Start the Listener

```bash
npm run dev
```

### Step 3: View Available Groups

When the client is ready, it will automatically list all your groups with their IDs.

### Step 4: Test Message

1. Send a test message in your target WhatsApp group
2. The listener will print group metadata:
   - Group Name
   - Group ID (ends with @g.us)
   - Sender name
   - **Note**: Message content is NOT displayed for privacy

### Step 5: Copy Group ID

Copy the Group ID from the console output (it ends with `@g.us`).

## Locked Mode

After discovering the group ID, switch to locked mode.

### Step 1: Update Configuration

In `apps/wa-listener/.env`:
```
WA_DISCOVERY_MODE=false
WHATSAPP_GROUP_IDS=120363123456789012@g.us
```

Replace `120363123456789012@g.us` with your actual group ID. For multiple groups, use comma-separated values:
```
WHATSAPP_GROUP_IDS=120363123456789012@g.us,120363123456789013@g.us
```

### Step 2: Restart Listener

```bash
# Stop the current listener (Ctrl+C)
# Then restart
npm run dev
```

### Step 3: Verify

- The listener should show: "Locked mode active - listening to group: [your-group-id]"
- Send a message in the target group
- Check `apps/wa-listener/data/messages.jsonl` - it should contain the message

## Viewing Messages

### Via API

```bash
curl http://localhost:3000/api/whatsapp-messages?limit=50
```

### Via Frontend

1. Start Nuxt dev server: `npm run dev:web` (or `npm run dev`)
2. Navigate to: `http://localhost:3000/poc/whatsapp`
3. Click "רענן" (Refresh) to load messages

## Running Both Services

### Option 1: Separate Terminals

```bash
# Terminal 1
npm run dev:web

# Terminal 2
npm run dev:wa
```

### Option 2: Manual Concurrent (if you have concurrently installed)

```bash
npm install -D concurrently
```

Then add to root `package.json`:
```json
"dev:all": "concurrently \"npm run dev:web\" \"npm run dev:wa\""
```

## Security Considerations

### Git Safety

**NEVER commit**:
- `apps/wa-listener/.env`
- `apps/wa-listener/auth/**` (WhatsApp session data)
- `apps/wa-listener/data/**` (message data)

These are automatically ignored by `.gitignore`.

### Production Safety

- **Fail Closed**: If `NODE_ENV=production` and `WHATSAPP_GROUP_IDS` is missing, the process will exit with an error
- **No Discovery in Production**: Discovery mode is disabled in production
- **No QR in Production**: QR codes are never displayed in production mode

### Privacy

- Discovery mode prints only group metadata, never message content
- Message content is only stored in the local JSONL file
- The JSONL file is gitignored and should not be committed

## Troubleshooting

### "Authentication failed"

**Solution**: Delete the auth folder and re-scan QR:
```bash
rm -rf apps/wa-listener/auth
# Then restart the listener
```

### "Multiple sessions detected"

**Solution**: Ensure only one listener process is running. Check for running Node processes:
```bash
# Windows
tasklist | findstr node

# Linux/Mac
ps aux | grep node
```

### "Group ID not found"

**Solution**: 
1. Verify the group ID is correct (ends with `@g.us`)
2. Make sure you're using the exact ID from discovery mode
3. Check that `WA_DISCOVERY_MODE=false` in `.env`

### Messages not appearing

**Check**:
1. Is the listener running?
2. Is `WA_DISCOVERY_MODE=false`?
3. Is `WHATSAPP_GROUP_IDS` set correctly?
4. Check `apps/wa-listener/data/messages.jsonl` exists and has content
5. Check console logs for errors
6. For media uploads: Is Cloudinary configured correctly?

### File Size Issues

The listener automatically rotates files when they exceed 10MB:
- Old file: `messages.jsonl` → `messages_YYYYMMDD.jsonl`
- New file: `messages.jsonl` (empty, ready for new messages)

## Message Format

Each message in the JSONL file contains raw WhatsApp data. For messages with media, the structure includes:

```json
{
  "id": {
    "_serialized": "true_120363123456789012@g.us_3EB0123456789ABCDE",
    "id": "3EB0123456789ABCDE"
  },
  "timestamp": 1770402917,
  "timestampISO": "2026-02-06T18:35:17.000Z",
  "from": "120363123456789012@g.us",
  "body": "Message text",
  "hasMedia": true,
  "type": "image",
  "chat": {
    "id": "120363123456789012@g.us",
    "name": "My Group",
    "isGroup": true
  },
  "cloudinaryUrl": "https://res.cloudinary.com/your-cloud/image/upload/whatsapp-listener/filename.jpg",
  "cloudinaryData": {
    "url": "http://res.cloudinary.com/...",
    "secure_url": "https://res.cloudinary.com/...",
    "public_id": "whatsapp-listener/filename",
    "format": "jpg",
    "bytes": 123456
  },
  "localMediaPath": "https://res.cloudinary.com/..." // For backward compatibility
}
```

**Note**: Media files are automatically uploaded to Cloudinary. The `cloudinaryUrl` field contains the HTTPS URL to access the media file.

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Node environment | `development` | No |
| `WA_AUTH_PATH` | Path for WhatsApp auth data | `./auth` | No |
| `WA_DATA_PATH` | Path for message data | `./data` | No |
| `WA_MESSAGES_FILE` | Messages filename | `messages.jsonl` | No |
| `WHATSAPP_GROUP_IDS` | Target group IDs (comma-separated) | (empty) | Yes (production) |
| `WA_DISCOVERY_MODE` | Enable discovery mode | `true` | No |
| `WA_LOG_LEVEL` | Logging level | `info` | No |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | (empty) | Yes (for media upload) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | (empty) | Yes (for media upload) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | (empty) | Yes (for media upload) |
| `CLOUDINARY_FOLDER` | Cloudinary folder for uploads | `whatsapp-listener` | No |

## Cleanup

To remove this PoC later:

1. Stop all running processes
2. Delete `apps/wa-listener/` directory
3. Delete `server/api/whatsapp-messages.get.ts`
4. Delete `pages/poc/whatsapp.vue`
5. Remove scripts from root `package.json`
6. Remove entries from `.gitignore`
7. Delete this documentation file

## Cloudinary Media Storage

Media files from WhatsApp messages are automatically uploaded to Cloudinary:

- **Automatic Upload**: All media (images, videos, audio, documents) is uploaded to Cloudinary
- **Folder Organization**: All files are stored in the `whatsapp-listener/` folder (configurable via `CLOUDINARY_FOLDER`)
- **Direct Access**: Media URLs are stored in the message data and accessible via HTTPS
- **No Local Storage**: Media files are not saved locally (except for backward compatibility with old messages)
- **Cloudinary Dashboard**: View all uploaded media in your Cloudinary dashboard under the configured folder

### Getting Your Cloudinary Cloud Name

1. Log in to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Your cloud name is displayed at the top of the dashboard
3. Add it to `.env` as `CLOUDINARY_CLOUD_NAME=your-cloud-name`

## Notes

- The listener processes all message types including media
- Media files are uploaded to Cloudinary automatically
- The JSONL file uses append-only writes for performance
- File rotation happens automatically at 10MB
- The frontend page is temporary and should be removed before production
- Old messages with local media paths will still work via the API endpoint
