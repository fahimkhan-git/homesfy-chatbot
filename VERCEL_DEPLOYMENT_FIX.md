# Vercel Deployment Fix Guide

## Problem
Vercel is looking for a server entrypoint (`app.js`, `index.js`, `server.js`) but the widget is static files.

## Solution

### Option 1: Update Vercel Project Settings (Recommended)

1. Go to your Widget project in Vercel dashboard
2. Go to **Settings** → **General**
3. Under **Build & Development Settings**, set:
   - **Framework Preset:** `Other`
   - **Root Directory:** (leave empty if deploying from root, or set to `apps/widget` if separate project)
   - **Build Command:** `npm run build:widget` (if root) or `npm run build` (if apps/widget)
   - **Output Directory:** `apps/widget/dist` (if root) or `dist` (if apps/widget)
   - **Install Command:** `npm install`
4. **IMPORTANT:** Make sure **"Override"** is checked for Build Command and Output Directory
5. Click **Save**
6. Go to **Deployments** tab and click **Redeploy**

### Option 2: Create index.html in dist (Workaround)

If Vercel still requires an entrypoint, create a simple index.html:

```bash
# After build, create index.html in dist
echo '<!DOCTYPE html><html><head><title>Widget</title></head><body><script src="/widget.js"></script></body></html>' > apps/widget/dist/index.html
```

But this shouldn't be necessary with correct settings.

### Option 3: Use Vercel CLI to Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy widget (from root)
vercel --prod --cwd apps/widget

# Or deploy from root with correct settings
vercel --prod
```

## Current Configuration

- ✅ `vercel.json` in root (for root deployment)
- ✅ `apps/widget/vercel.json` (for widget-specific deployment)
- ✅ Build outputs: `widget.js`, `style.css`, `widget.js.map`

## Verification

After deployment, these URLs should work:
- `https://your-widget.vercel.app/widget.js` → Should return JavaScript file
- `https://your-widget.vercel.app/style.css` → Should return CSS file

If you get 404, the Output Directory is wrong.
If you get "No entrypoint found", Vercel thinks it's a serverless function.

## Quick Fix Checklist

- [ ] Framework Preset set to "Other" (not Vite, not Node.js)
- [ ] Output Directory matches actual build output location
- [ ] Build Command is correct
- [ ] "Override" is checked for Build/Output settings
- [ ] Redeploy after changing settings

