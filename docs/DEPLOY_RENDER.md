# Deploying to Render

This guide covers deploying both parts of the Galiluz monorepo to Render:

1. **galiluz-web** – Nuxt 3 SSR app (Web Service)
2. **galiluz-wa** – WhatsApp listener (Background Worker)

Both services deploy from the `main` branch only.
Development happens on the `develop` branch and is merged into `main` via PR when ready.

---

## Quick Start (Blueprint)

The repo includes a `render.yaml` Blueprint file.
In the Render dashboard go to **Blueprints → New Blueprint Instance**, connect this repo, and Render will create both services + env groups automatically.

You still need to fill in the secret values (marked `sync: false`) in the dashboard after the first sync.

---

## Git Branching

| Branch | Purpose | Render |
|---------|---------|--------|
| `main` | Production – protected, PR-only merges | Auto-deploys both services |
| `develop` | Active development | Not deployed |
| `feature/*` | Feature branches → PR into `develop` | Not deployed |

Workflow: `feature/xyz` → PR → `develop` → PR → `main` → Render auto-deploys.

---

## Service 1: Nuxt Web App

### Render Settings

| Setting | Value |
|---------|-------|
| Type | Web Service |
| Runtime | Node |
| Branch | `main` |
| Root Directory | *(repo root – leave empty)* |
| Build Command | `npm install && npm run build` |
| Start Command | `node .output/server/index.mjs` |
| Health Check Path | `/` |
| Node Version | 22 (auto-detected from `.nvmrc`) |

### Environment Variables

Set these in the **galiluz-shared** environment group (shared with the WA worker):

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `MONGODB_DB_NAME` | MongoDB database name | Yes |

Optional overrides (service-level):

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_COLLECTION_EVENTS` | `events` | Events collection name |
| `MONGODB_COLLECTION_RAW_MESSAGES` | `raw_messages` | Raw messages collection name |

### Verification

1. Root URL loads the calendar
2. Navigate between `/` and `/daily-view/YYYY-MM-DD`
3. API responds: `/api/events`, `/api/categories`
4. Event modal opens and shares correctly

---

## Service 2: WhatsApp Listener (Background Worker)

### Render Settings

| Setting | Value |
|---------|-------|
| Type | Background Worker |
| Runtime | Node |
| Branch | `main` |
| Root Directory | `apps/wa-listener` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Persistent Disk | Mount: `/var/data`, Size: 1 GB |

### Environment Variables

**From galiluz-shared group** (shared with the web app):

| Variable | Required |
|----------|----------|
| `MONGODB_URI` | Yes |
| `MONGODB_DB_NAME` | Yes |

**From galiluz-wa-secrets group** (worker only):

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | `development` for first run (QR), then `production` | Yes |
| `WA_DISCOVERY_MODE` | `true` for first run, then `false` | Yes |
| `WHATSAPP_GROUP_IDS` | Target group IDs (comma-separated) | Yes (prod) |
| `WHATSAPP_CONFIRMATION_GROUP_IDS` | Confirmation group IDs | No |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |

**Service-level** (set directly, not in a group):

| Variable | Value | Why |
|----------|-------|-----|
| `WA_AUTH_PATH` | `/var/data/auth` | Points to the persistent disk so the WhatsApp session survives restarts |
| `NODE_VERSION` | `22` | Ensures correct Node runtime |

### First-Time Setup (QR Authentication)

The WhatsApp client requires a one-time QR scan to authenticate.
On Render there is no interactive terminal, so we do this through the logs:

1. **Deploy the worker** with these initial env vars:
   - `NODE_ENV=development`
   - `WA_DISCOVERY_MODE=true`
   - `WHATSAPP_GROUP_IDS=` *(empty)*
   - All MongoDB + Cloudinary vars filled in
   - `WA_AUTH_PATH=/var/data/auth`

2. **Open the worker's Logs** in the Render dashboard.

3. The ASCII QR code will appear in the logs. **Scan it** with WhatsApp → Settings → Linked Devices → Link a Device.
   > If the QR is hard to read in the log viewer, try copying the log block into a fixed-width text editor.

4. Wait for the **"Client is ready!"** log message.

5. If using discovery mode, send a test message in your target WhatsApp group and copy the Group ID from the logs.

6. **Update env vars** to production settings:
   - `NODE_ENV=production`
   - `WA_DISCOVERY_MODE=false`
   - `WHATSAPP_GROUP_IDS=120363...@g.us` *(your group ID)*

7. **Restart** the worker from the Render dashboard. The session is stored on the persistent disk at `/var/data/auth`, so no QR scan is needed on restart.

### Monitoring & Crash Recovery

| Concern | How Render Handles It |
|---------|-----------------------|
| **Process crashes** | Render automatically restarts the worker |
| **Deploy failures** | Render keeps the previous version running |
| **Logs** | Available in dashboard → Logs (searchable, filterable) |
| **Notifications** | Configure email/Slack alerts in Render workspace settings |

The persistent disk ensures the WhatsApp session and any cached data survive across restarts and redeploys.

### Re-authenticating

If WhatsApp invalidates the session (rare, but possible):

1. Set `NODE_ENV=development` temporarily
2. Restart the worker
3. Scan the new QR from logs
4. Set `NODE_ENV=production` and restart again

---

## Environment Groups Summary

| Group | Used By | Variables |
|-------|---------|-----------|
| `galiluz-shared` | Web + Worker | `MONGODB_URI`, `MONGODB_DB_NAME` |
| `galiluz-wa-secrets` | Worker only | `NODE_ENV`, `WA_DISCOVERY_MODE`, `WHATSAPP_GROUP_IDS`, `OPENAI_API_KEY`, Cloudinary keys, `CLOUDINARY_FOLDER` |

---

## Render Dashboard Checklist

- [ ] Create Blueprint from repo (or create services manually)
- [ ] Fill in all `sync: false` env var values in both groups
- [ ] Set `WA_AUTH_PATH=/var/data/auth` on the worker service
- [ ] Verify persistent disk is attached to the worker
- [ ] First deploy: WA worker in development mode, scan QR
- [ ] Switch WA worker to production mode
- [ ] Verify Nuxt web app loads and APIs respond
- [ ] Enable notifications for service health

---

## Renaming from Valley Luz (Render, MongoDB, Cloudinary)

If you previously had services and env groups named `valleyluz-*`, do the following.

### Render dashboard

- **Option A – New Blueprint**: Create a **new Blueprint Instance** from this repo. Render will create `galiluz-web`, `galiluz-wa`, `galiluz-shared`, and `galiluz-wa-secrets`. Copy env var values from your old groups into the new ones, then delete the old Blueprint instance (or leave it stopped).
- **Option B – Rename existing**: If your Render plan allows it, rename the existing services to `galiluz-web` and `galiluz-wa`, and rename env groups to `galiluz-shared` and `galiluz-wa-secrets`. Then re-sync the Blueprint or re-connect the repo so the YAML matches. If Render does not allow renaming, use Option A.

### MongoDB

- **MONGODB_URI** and **MONGODB_DB_NAME** are set only in env (Render groups and local `.env`). There is no hardcoded value in the repo.
- If you create a new MongoDB cluster or database for Galiluz (e.g. `galiluz_app` / `galiluz_app_dev`): set `MONGODB_URI` and `MONGODB_DB_NAME` in **galiluz-shared** (and in `galiluz-wa-secrets` if you use a separate worker env) and in your local `apps/wa-listener/.env`.
- If you keep using the same cluster and database, no change is required; only the Render service/group names change.

### Cloudinary

- **CLOUDINARY_FOLDER** is set only in env (e.g. in `galiluz-wa-secrets` and in `apps/wa-listener/.env`). There is no hardcoded value in the repo.
- To use a new folder for Galiluz uploads: set `CLOUDINARY_FOLDER=galiluz` (or your chosen name) in the worker’s env. New uploads will go there; existing assets stay in the previous folder unless you move them in Cloudinary.
