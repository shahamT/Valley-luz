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
WA_DATA_PATH=./data
WA_MESSAGES_FILE=messages.jsonl
WHATSAPP_GROUP_IDS=
WA_DISCOVERY_MODE=true
WA_LOG_LEVEL=info

# Note: WHATSAPP_GROUP_IDS can be comma-separated for multiple groups
# Example: WHATSAPP_GROUP_IDS=120363425326487718@g.us,120363425326487719@g.us
```

3. Run the listener:
```bash
npm run dev
```

See `docs/WHATSAPP_POC.md` for full documentation.
