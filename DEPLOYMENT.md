# Deployment Guide

This application is configured for deployment on Vercel with automatic preview and production deployments.

## Vercel Configuration

The project includes a `vercel.json` configuration file that defines:

### Environments

- **Production**: Automatically deploys from the `main` branch
- **Preview**: Automatically creates preview deployments for all pull requests

### Build Configuration

- **Build Command**: `npm run build`
- **Output Directory**: `dist/public` (for static assets)
- **Dev Command**: `npm run dev`

### Routing

The application uses Vercel's rewrite rules to route all requests through the Express.js serverless function:

- `/api/*` routes → Express API routes
- All other routes → Express app (serves React SPA)

## Setting Up Vercel Deployment

### 1. Initial Setup

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository: `Quisharoo/revolut-calendar`
4. Vercel will auto-detect the configuration from `vercel.json`

### 2. Environment Variables

Add the following environment variables in Vercel Project Settings:

#### Required Variables
- `NODE_ENV`: Set to `production`
- `DATABASE_URL`: Your database connection string (if using a database)
- Add any other environment variables your app requires

#### Setting Environment Variables
1. Go to Project Settings → Environment Variables
2. Add variables for:
   - Production (main branch)
   - Preview (all preview deployments)
   - Development (local development)

### 3. Build Settings

The following settings should be automatically configured from `vercel.json`:

- **Framework Preset**: Other (custom Express + Vite setup)
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

### 4. GitHub Integration

Once connected, Vercel will automatically:

- Deploy to production on every push to `main` branch
- Create preview deployments for every pull request
- Add deployment status checks to pull requests
- Comment on pull requests with preview URLs

## Deployment Process

### Production Deployment

1. Push or merge changes to `main` branch
2. Vercel automatically triggers a build
3. After successful build, deploys to production URL
4. Production URL: `https://your-project.vercel.app`

### Preview Deployment

1. Create a pull request
2. Vercel automatically creates a preview deployment
3. Preview URL is posted as a comment on the PR
4. Each new commit to the PR updates the preview

### Manual Deployment

You can also trigger deployments manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Architecture Notes

### Serverless Function

The Express.js app runs as a Vercel serverless function:

- Entry point: `api/index.js` (references built `dist/index.js`)
- Runtime: Node.js 20.x
- Max duration: 10 seconds (can be adjusted in `vercel.json`)
- Region: IAD1 (Northern Virginia) - can be changed in `vercel.json`

### Static Assets

- Built by Vite to `dist/public`
- Served directly by Vercel's CDN
- Includes React app, CSS, images, etc.

### Build Process

1. `npm install` - Install dependencies
2. `npm run build` - Runs two builds:
   - `vite build` - Builds React frontend to `dist/public`
   - `esbuild server/index.ts` - Builds Express server to `dist/index.js`
3. Vercel packages the serverless function and deploys static assets

## Monitoring and Logs

- View deployment logs in Vercel Dashboard
- Real-time function logs available in Vercel
- Set up [Vercel Analytics](https://vercel.com/analytics) for performance monitoring
- Configure [Vercel Speed Insights](https://vercel.com/docs/speed-insights) for web vitals

## Custom Domain

To add a custom domain:

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS as instructed by Vercel
4. Automatic SSL certificates are provisioned

## Troubleshooting

### Build Fails

- Check build logs in Vercel Dashboard
- Verify all dependencies are in `package.json`
- Ensure build command succeeds locally: `npm run build`

### Runtime Errors

- Check Function Logs in Vercel Dashboard
- Verify environment variables are set correctly
- Check that database/external services are accessible from Vercel

### Static Assets Not Loading

- Verify `dist/public` contains built files
- Check that paths in your code use absolute paths (`/assets/...`)
- Clear Vercel cache and redeploy if needed

## Local Testing

Test the production build locally:

```bash
# Build the app
npm run build

# Start in production mode
npm run start
```

Visit `http://localhost:5000` to test the production build.

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Serverless Functions](https://vercel.com/docs/functions/serverless-functions)

