# DEPLOYMENT GUIDE
# CityU Internal Link Dashboard

## Pre-Deployment Checklist

- [ ] Run `npm run check-links` to validate all URLs
- [ ] Test on `npm run dev` locally
- [ ] Review links.json for accuracy
- [ ] Update `vite.config.js` base path if deploying to subdirectory
- [ ] Test in production mode with `npm run preview`
- [ ] Verify no console errors in browser DevTools

## GitHub Pages Setup

### 1. Automatic Deployment (GitHub Actions) - RECOMMENDED

The easiest way! GitHub Actions will automatically build and deploy when you push.

#### Setup Steps:

1. **Create `.github/workflows/deploy.yml`:**
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [main]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: 18
         - run: npm ci
         - run: npm run check-links
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

2. **Enable GitHub Pages in repository settings:**
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: gh-pages
   - Folder: /root

3. **Push to main:**
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add GitHub Pages workflow"
   git push
   ```

4. **Monitor the deployment:**
   - Go to Actions tab
   - Watch the workflow run
   - Site will be live at: `clarkngo.github.io/cityu-internal-links/` (adjust repo name)

### 2. Manual Deployment

For occasional updates or testing:

```bash
# Build the project
npm run build

# Check links are valid
npm run check-links

# Create/switch to gh-pages branch
git checkout -b gh-pages

# Copy dist contents to root
cp -r dist/* .
git add .
git commit -m "Deploy build"
git push -u origin gh-pages

# Switch back to main
git checkout main
```

## Configuration for Your Repository

### Update Base Path in vite.config.js

If your repo is NOT at the root of your domain:

```javascript
// Example for clarkngo.github.io/cityu-internal-links/
export default defineConfig({
  base: '/cityu-internal-links/',
  // ...
});
```

If deploying to your root domain (clarkngo.github.io/):

```javascript
export default defineConfig({
  base: '/',
  // ...
});
```

## Post-Deployment

1. **Test the live site:**
   - Visit your deployed URL
   - Test filtering and sorting
   - Click a few links to ensure they work

2. **Monitor broken links:**
   - Run `npm run check-links` regularly
   - Commit updated links.json to main
   - GitHub Actions will redeploy automatically

3. **Update links in the future:**
   - Make changes in `public/links.json` directly OR
   - Run locally with `npm run dev`, use the Management Mode UI
   - Run `npm run check-links`
   - Commit and push

## Continuous Updates

Set up a monthly link health check:

1. **Create `.github/workflows/check-links.yml`:**
   ```yaml
   name: Check Links Monthly
   
   on:
     schedule:
       - cron: '0 9 1 * *'  # 1st of every month at 9am UTC
   
   jobs:
     check:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: 18
         - run: npm ci
         - run: npm run check-links
         - uses: actions/upload-artifact@v3
           with:
             name: links-report
             path: public/links.json
   ```

2. This will:
   - Run automatically every month
   - Update broken link status
   - Generate a report

## Environment-Specific Behavior

### Local Development (npm run dev)
- Management Mode ENABLED
- Add/Delete/Edit buttons visible
- `/api/save-links` endpoint active
- Changes saved to `public/links.json`
- ✅ Full CRUD operations

### Production (GitHub Pages)
- Management Mode DISABLED
- Add/Delete buttons hidden
- Dashboard is read-only
- Filter, sort, and favorite features work
- ❌ No CRUD operations

### Production Preview (npm run preview)
- Simulates production build
- Read-only dashboard
- No Management Mode
- Use this to test before deployment

## Troubleshooting Deployment

### Site not live after push
- Check Actions tab for workflow errors
- Verify repository settings → Pages
- Ensure branch is `gh-pages` or `main`

### Assets not loading (404 errors)
- Verify `base` path in `vite.config.js`
- Run `npm run build` locally to test
- Check browser console for specific errors

### Links not updating
- Ensure you ran `npm run check-links` locally
- Commit updated `public/links.json`
- Push to trigger GitHub Actions

### Site is read-only
- This is expected on GitHub Pages
- Use `npm run dev` locally to edit links
- Changes made locally can be committed to main

## Performance Optimization

The dashboard is already optimized, but you can further enhance it:

### 1. Compress images
```bash
# If adding any images
npx imagemin src/assets --out-dir=src/assets
```

### 2. Monitor bundle size
```bash
npm run build
npm run preview
```

The build report shows exact file sizes.

### 3. Cache busting
Vite handles this automatically with content-hashed filenames.

## Need Help?

### Common Issues

**"Cannot POST /api/save-links"**
- You're on GitHub Pages (read-only)
- Use `npm run dev` locally to edit

**Links disappear after refresh**
- You're in production mode, changes aren't saved
- Use local dev mode to persist changes

**Broken link checker timeout**
- Some servers block automated requests
- Increase TIMEOUT in `check-links.js`
- Manually mark unreachable links as "broken"

**GitHub Actions failing**
- Check Actions tab for error logs
- Verify Node.js version is 18+
- Ensure `public/links.json` is committed

---

**Questions or Issues?**
- Review the main README.md
- Check GitHub Actions logs
- Test locally with `npm run dev` first

**Version**: 1.0.0
**Last Updated**: January 2026
