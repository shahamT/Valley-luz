# Deploying to Render (Web Service)

This guide covers deploying the Valley Luz Nuxt 3 application to Render as a Web Service.

## Render Web Service Settings

When creating a new Web Service on Render, configure the following:

### Build Settings

- **Build Command**: `npm run build`
- **Start Command**: `node .output/server/index.mjs`

### Environment Variables

No environment variables are required for basic deployment.

### Service Type

- **Environment**: Node.js
- **Region**: Choose your preferred region

## Node Version

The project includes an `.nvmrc` file specifying Node.js version 22.

Render will automatically detect and use the Node version from `.nvmrc` during the build process.

If you need to override this, you can set the `NODE_VERSION` environment variable in Render's dashboard:

- Go to **Settings** → **Environment**
- Add: `NODE_VERSION=22` (or your preferred version)

## Build Process

1. Render will run `npm install` to install dependencies
2. Then execute `npm run build` to create the production build
3. Nuxt generates the `.output/` directory with server and client files
4. The service starts using the start command

## Routing

Nuxt handles routing server-side, so no rewrite rules are needed. All routes are handled automatically by the Nuxt server.

## API Endpoints

The backend API is part of the same service:
- `/api/events` - GET endpoint for events data

## Verification

After deployment:

1. Verify the root URL loads correctly
2. Test navigation between routes (e.g., `/` and `/daily-view/2026-02-05`)
3. Test direct URL access (e.g., navigate directly to `/daily-view/2026-02-05` in a new tab)
4. Verify the API endpoint works: `https://your-service.onrender.com/api/events`
5. Verify the modal functionality works correctly

## Health Check

Render will automatically check the service health. The default health check path is `/`, which should return a 200 status.
