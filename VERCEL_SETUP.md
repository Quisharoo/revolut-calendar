# Vercel Setup Guide

Complete guide for setting up your Transaction Calendar application on Vercel.

## Initial Vercel Setup

### 1. Connect Repository to Vercel

1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `Quisharoo/revolut-calendar`
4. Vercel will detect the `vercel.json` configuration automatically

### 2. Project Settings

Vercel will auto-configure based on `vercel.json`, but verify these settings:

#### General Settings
- **Project Name**: `transaction-calendar` (or your preferred name)
- **Framework Preset**: Other
- **Root Directory**: `./` (leave as root)
- **Node.js Version**: 20.x

#### Build & Development Settings
- **Build Command**: `npm run build` (auto-configured)
- **Output Directory**: `dist/public` (auto-configured)
- **Install Command**: `npm install` (auto-configured)
- **Development Command**: `npm run dev` (auto-configured)

### 3. Environment Variables

Go to: **Project Settings → Environment Variables**

#### Required Variables

Add these for all environments (Production, Preview, Development):

```
NODE_ENV=production
```

#### Database Configuration

If using Neon or another PostgreSQL provider:

```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

**Important**: 
- Use Neon serverless Postgres or another serverless-compatible provider
- Enable connection pooling for better performance
- For Neon: use the connection string from your Neon dashboard

#### Session Secret

```
SESSION_SECRET=generate-a-long-random-string-here
```

Generate a secure random string (32+ characters). You can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Optional Variables

```
# For custom configurations
PORT=5000
```

### 4. Git Integration Settings

Go to: **Project Settings → Git**

#### Automatic Deployments
- ✅ **Production Branch**: `main`
- ✅ **Deploy Previews**: All branches (recommended)

#### GitHub App Permissions
Ensure these are enabled:
- ✅ Read access to code
- ✅ Read and write access to pull requests
- ✅ Read access to deployments

### 5. Domain Configuration (Optional)

Go to: **Project Settings → Domains**

1. Add your custom domain
2. Configure DNS:
   - Type: `CNAME`
   - Name: `www` (or `@` for root domain)
   - Value: `cname.vercel-dns.com`
3. Wait for DNS propagation (usually 5-30 minutes)
4. SSL certificate is automatically provisioned

## GitHub Actions Setup (Optional)

The included GitHub Actions workflow provides additional CI/CD capabilities.

### Required Secrets

Add these to your GitHub repository: **Settings → Secrets and variables → Actions**

1. **VERCEL_TOKEN**
   - Get from: [Vercel Account Tokens](https://vercel.com/account/tokens)
   - Create a new token with appropriate scope
   - Add as repository secret

2. **VERCEL_ORG_ID**
   - Get from: Vercel Project Settings → General
   - Or from `.vercel/project.json` after running `vercel link`
   - Add as repository secret

3. **VERCEL_PROJECT_ID**
   - Get from: Vercel Project Settings → General
   - Or from `.vercel/project.json` after running `vercel link`
   - Add as repository secret

### Workflow Features

The GitHub Actions workflow will:
- ✅ Run type checking on every push
- ✅ Run tests on every push
- ✅ Deploy to Vercel preview on PR
- ✅ Deploy to Vercel production on main branch push
- ✅ Comment PR with deployment URL

## Database Setup

### Using Neon (Recommended)

1. Create account at [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to Vercel environment variables as `DATABASE_URL`
5. Run database migrations:

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations locally
npm run db:push
```

### Database Schema

The database schema is defined in `shared/schema.ts` using Drizzle ORM.

To push schema changes:
```bash
npm run db:push
```

## Deployment Workflow

### Automatic Deployments

#### Production (main branch)
```bash
git checkout main
git pull origin main
# Make your changes
git add .
git commit -m "Your changes"
git push origin main
```
→ Automatically deploys to production

#### Preview (feature branches)
```bash
git checkout -b feature/new-feature
# Make your changes
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
# Create pull request on GitHub
```
→ Automatically creates preview deployment
→ Preview URL posted as PR comment

### Manual Deployment via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Monitoring & Debugging

### View Logs

1. Go to Vercel Dashboard → Your Project
2. Click on a deployment
3. Click "Functions" tab
4. View real-time logs for each serverless function

### Common Issues

#### Build Fails

**Error**: Dependencies not found
**Solution**: Ensure all dependencies are in `package.json`, not just `devDependencies`

**Error**: Type errors during build
**Solution**: Run `npm run check` locally and fix TypeScript errors

#### Runtime Errors

**Error**: Database connection fails
**Solution**: 
- Verify `DATABASE_URL` is set correctly
- Ensure database allows connections from Vercel IPs
- For Neon: enable "Allow access from anywhere"

**Error**: Session errors
**Solution**: Set `SESSION_SECRET` environment variable

#### Static Assets Not Loading

**Error**: 404 on static files
**Solution**: 
- Verify build completed successfully
- Check `dist/public` contains built assets
- Ensure asset paths use absolute paths (`/assets/...`)

### Performance Monitoring

Enable Vercel Analytics:
1. Go to Project Settings → Analytics
2. Enable "Speed Insights"
3. Enable "Web Analytics"
4. View metrics in your dashboard

### Logs and Errors

Enable Vercel Log Drains for external monitoring:
1. Go to Project Settings → Log Drains
2. Add integration (Datadog, LogFlare, etc.)
3. Configure log forwarding

## Testing the Deployment

### Test Production Build Locally

```bash
# Build the project
npm run build

# Start in production mode
NODE_ENV=production npm start

# Visit http://localhost:5000
```

### Test Vercel Deployment

After deploying, test these endpoints:

- **Homepage**: `https://your-app.vercel.app/`
- **API Health**: `https://your-app.vercel.app/api/health` (if implemented)
- **Static Assets**: Check that CSS and JS load correctly

## Rollback

If a deployment has issues:

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" tab
3. Find a previous working deployment
4. Click "..." menu → "Promote to Production"

## Cost Optimization

### Free Tier Limits
- 100GB bandwidth/month
- 6,000 minutes build time/month
- 100GB-hours serverless function execution

### Optimize Costs
- ✅ Use efficient database queries
- ✅ Implement caching where possible
- ✅ Minimize serverless function duration
- ✅ Use edge caching for static assets

## Advanced Configuration

### Custom Regions

Edit `vercel.json` to change serverless function region:

```json
{
  "regions": ["iad1"]  // Northern Virginia
}
```

Available regions: `iad1`, `sfo1`, `bom1`, `fra1`, etc.

### Increase Function Timeout

Edit `vercel.json`:

```json
{
  "functions": {
    "api/index.js": {
      "maxDuration": 10  // Increase up to 60s on Pro plan
    }
  }
}
```

### Custom Headers

Add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Neon Documentation](https://neon.tech/docs)

## Checklist

Before deploying, ensure:

- [ ] Repository connected to Vercel
- [ ] Environment variables configured
- [ ] Database created and accessible
- [ ] Build passes locally (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Type check passes (`npm run check`)
- [ ] GitHub Actions secrets configured (if using)
- [ ] Domain configured (if using custom domain)

Your application should now be successfully deployed on Vercel! 🚀

