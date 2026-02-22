# Security and API Budget

## API secret (production)

The Nuxt API routes `/api/whatsapp-messages` and `/api/whatsapp-media/[filename]` are protected by an optional API secret.

- **Env:** `API_SECRET` (server-side, e.g. in `.env` or deployment env).
- **Behavior:** If `API_SECRET` is set, every request to these routes must send the same value via:
  - Header: `X-API-Key: <your-secret>`
  - Or query: `?apiKey=<your-secret>`
- **Recommendation:** In production, always set `API_SECRET`. If it is not set, these routes are reachable by anyone (only rate-limited). Set a strong random value and keep it out of client-side code.

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
