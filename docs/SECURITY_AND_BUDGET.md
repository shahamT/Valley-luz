# Security and API Budget

## API secret (production)

The Nuxt API routes `/api/whatsapp-messages` and `/api/whatsapp-media/[filename]` are protected by an API secret.

- **Env:** `API_SECRET` (server-side, e.g. in `.env` or deployment env).
- **Production:** In production (`NODE_ENV=production`), `API_SECRET` is **required**. If it is not set, requests to these routes receive **503 Service Unavailable** until the secret is configured.
- **How to send the secret (preferred):** Use the **header** `X-API-Key: <your-secret>` so the value is not logged in URLs or Referer. Avoid passing the secret in the query string (`?apiKey=...`); if you must, be aware it can appear in server logs, Referer headers, and browser history.
- **Value:** Use a long, random string (e.g. 32+ characters). Generate one with: `openssl rand -hex 32` or a password manager. Keep it out of client-side code and do not commit it to the repo.

### Where to set API_SECRET on Render

- **Environment group:** **galiluz-shared** (used by the Nuxt web service `galiluz-web`).
- **Steps:** Dashboard → Environment Groups → **galiluz-shared** → Add Variable (or edit if the key was added via the blueprint): key `API_SECRET`, value = your long random secret.
- **What the value should be:** A single random string, no spaces. Example: run `openssl rand -hex 32` in a terminal and paste the output (64 hex characters). Anyone calling `/api/whatsapp-messages` or `/api/whatsapp-media/...` must send that same value in the `X-API-Key` header.

## Monthly API budget (wa-listener)

To cap spending on OpenAI and Google Vision, the wa-listener can enforce monthly limits. When a limit is exceeded, the pipeline skips processing new messages and logs `BUDGET_LIMIT_EXCEEDED` (no API calls are made for that message).

- **Env (in `apps/wa-listener/.env`):**
  - `MONTHLY_OPENAI_CALL_LIMIT` – Max OpenAI API calls per calendar month (e.g. `1500`). `0` or unset = no limit.
  - `MONTHLY_GOOGLE_VISION_LIMIT` – Max Google Vision (document text detection) calls per calendar month (e.g. `7700`). `0` or unset = no limit.
- **Storage:** Usage is stored in MongoDB in the `api_usage` collection (or the name set by `MONGODB_COLLECTION_API_USAGE`). One document per month key (`YYYY-MM`) with `openaiCalls` and `googleVisionCalls`.
- **Behavior:** Before each pipeline run, the service checks current month usage. If adding one more message would exceed either limit, the message is skipped and a log line is written. Normal operation is unchanged until a limit is hit.

## Rate limit persistence (Nuxt server)

Rate limiting for `/api/events`, `/api/whatsapp-messages`, and `/api/whatsapp-media` is applied per IP (100 requests per 60 seconds). By default the state is in-memory and resets on deploy.

- **Env:** `RATE_LIMIT_FILE_PATH` – If set, rate limit state is read/written to this JSON file so it survives restarts. Use a path on a persistent disk (e.g. the same volume used for wa-listener auth): e.g. `/data/rateLimit.json` or `./.data/rateLimit.json`.
- **Note:** For multiple Nuxt instances, use a shared store (e.g. Redis) or proxy-level rate limiting; file-based persistence is for a single instance.

## Events API

- **GET /api/events** – Public, no auth. Responses are limited to 500 documents and rate-limited per IP (same 100/min as above).
