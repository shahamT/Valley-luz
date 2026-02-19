# WhatsApp Listener - Setup

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from below):
```bash
# Create .env file with these contents:
NODE_ENV=development
WA_AUTH_PATH=./auth
WHATSAPP_GROUP_IDS=
WHATSAPP_LOG_GROUP_ID=
WA_DISCOVERY_MODE=true
WA_LOG_LEVEL=info

# Cloudinary Configuration (required for media uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here
CLOUDINARY_FOLDER=whatsapp-listener

# MongoDB Configuration (required)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=your_database_name
MONGODB_COLLECTION_RAW_MESSAGES=raw_messages

# Note: WHATSAPP_GROUP_IDS can be comma-separated for multiple groups
# Example: WHATSAPP_GROUP_IDS=120363425326487718@g.us,120363425326487719@g.us
# WHATSAPP_LOG_GROUP_ID: single group that receives event-processing logs (confirmations) for all groups in WHATSAPP_GROUP_IDS. Optional.
```

3. Run the listener:
```bash
npm run dev
```

See `docs/WHATSAPP_SERVICE.md` for full documentation.
