# Deploying to Render (Static Site)

This guide covers deploying the Valley Luz Vue 3 application to Render as a Static Site.

## Render Static Site Settings

When creating a new Static Site on Render, configure the following:

### Build Settings

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

### Environment Variables

No environment variables are required for basic deployment.

## SPA Routing Configuration

Since this is a Single Page Application (SPA) using Vue Router, you need to configure Render to handle client-side routing. When users refresh the page or navigate directly to routes like `/monthly-view` or `/daily-view`, Render must serve the `index.html` file instead of returning a 404.

### Adding a Rewrite Rule

1. In your Render Static Site dashboard, navigate to **Settings**
2. Scroll down to **Redirects/Rewrites** section
3. Add the following rewrite rule:

   ```
   /*    /index.html   200
   ```

   This rule tells Render to:
   - Match all paths (`/*`)
   - Rewrite them to `/index.html`
   - Return HTTP status 200 (not a redirect)

   This ensures all routes are handled by the Vue Router on the client side.

## Node Version

The project includes an `.nvmrc` file specifying Node.js version 22.

Render will automatically detect and use the Node version from `.nvmrc` during the build process.

If you need to override this, you can set the `NODE_VERSION` environment variable in Render's dashboard:

- Go to **Settings** → **Environment**
- Add: `NODE_VERSION=22` (or your preferred version)

## Build Process

1. Render will run `npm install` to install dependencies
2. Then execute `npm run build` to create the production build
3. The contents of the `dist` directory will be served as static files

## Verification

After deployment:

1. Verify the root URL loads correctly
2. Test navigation between routes (e.g., `/monthly-view` and `/daily-view`)
3. Test direct URL access (e.g., navigate directly to `/daily-view` in a new tab)
4. Verify the modal functionality works correctly

If direct route access returns a 404, ensure the rewrite rule is properly configured.
