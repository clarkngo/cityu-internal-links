# GETTING STARTED GUIDE
# CityU Internal Link Dashboard

## 🎯 What You Have Built

A full-featured, modern dashboard for managing and displaying CityU institutional links with:

✅ **Dual-mode functionality** (local CRUD + GitHub Pages read-only)
✅ **React Router** for workflow-specific views
✅ **Tag filtering & sorting** with click-to-interact UI
✅ **Broken link detection** with automated checker
✅ **Responsive design** with Tailwind CSS
✅ **Hot module reload** for instant development feedback
✅ **Production-ready** with optimized builds

## 🚀 Quick Start (5 minutes)

### Step 1: Start Development Server
```bash
cd /Users/clark/cityu-internal-links
npm run dev
```

You'll see:
```
  ➜  local:   http://localhost:5173/
  ➜  press h to show help
```

### Step 2: Open in Browser
Visit: **http://localhost:5173**

You'll see the dashboard with:
- 5 sample CityU links
- "Add Link" button in header
- Delete icons on each card
- Filter and sort controls

### Step 3: Test Management Mode
1. Click "Add Link" button
2. Fill in form:
   - Title: "Your Link Name"
   - URL: "https://example.com"
   - Description: "What it does"
   - Select workflow (Advising/Curriculum/Admin)
   - Click tags to add
3. Click "Save Link"
4. See the new link appear immediately
5. Refresh page - link persists in `public/links.json`

### Step 4: Test Broken Link Checker
```bash
npm run check-links
```

Watch it validate all URLs and report status:
```
✅ ACTIVE   or   ❌ BROKEN
```

### Step 5: Build for Production
```bash
npm run build
```

Creates optimized files in `dist/` folder (260KB total, 76KB gzipped).

## 📁 Project Structure Explained

```
cityu-internal-links/
├── 📋 README.md              ← Main documentation
├── 📋 DEPLOYMENT.md          ← GitHub Pages setup guide
├── 📋 DEVELOPMENT.md         ← Deep dive technical reference
│
├── ⚙️  package.json           ← Dependencies & scripts
├── ⚙️  vite.config.js         ← Vite + middleware config
├── ⚙️  tailwind.config.js     ← Tailwind CSS config
├── ⚙️  postcss.config.js      ← PostCSS config
│
├── 🔧 check-links.js         ← Broken link checker
├── ✅ verify-setup.sh        ← Setup verification script
│
├── 📂 src/                   ← Source code
│   ├── 📄 main.jsx           ← React entry point
│   ├── 📄 App.jsx            ← Router setup
│   ├── 📄 index.css          ← Global styles (Tailwind)
│   ├── 📄 App.css            ← Component styles
│   └── 📂 components/
│       └── 📄 Dashboard.jsx   ← Main dashboard component
│
├── 📂 public/
│   └── 📄 links.json         ← Links database (Single Source of Truth)
│
└── 📂 dist/                  ← Production build (after npm run build)
    ├── index.html
    ├── assets/index-*.css
    └── assets/index-*.js
```

## 🎮 Dashboard Usage

### View Workflow-Specific Dashboards

Using hash routes (work on GitHub Pages):
- `http://localhost:5173/#/dashboard/advising` - Advising links only
- `http://localhost:5173/#/dashboard/curriculum` - Curriculum links only
- `http://localhost:5173/#/dashboard/admin` - Admin links only

### Filter by Tags

1. **Single tag**: Click any tag pill to filter
   - Shows only links with that tag
2. **Multiple tags**: Click multiple tags
   - Shows links with ALL selected tags (AND logic)
3. **Clear all**: Click "Clear filters" button

### Sort Results

- **Title**: A-Z alphabetical order
- **Favorites**: Starred links first
- **Status**: Active links first, broken at bottom

### Favorite Links

Click the ❤️ heart icon on any card to:
- Toggle favorite status
- Sort by "Favorites" to see starred links first
- Favorite status persists in `public/links.json`

### Mark Broken Links

Broken links show:
- Red left border on card
- ⚠️ Alert icon in top right
- Listed last when sorted by status

Use `npm run check-links` to automatically update status.

## 🔄 Local Development Workflow

### Common Tasks

#### Add a New Link
**Via UI:**
1. Click "Add Link" button
2. Fill form and save
3. Link added to `public/links.json`

**Via JSON:**
1. Edit `public/links.json` directly
2. Vite auto-reloads
3. Changes appear instantly

#### Edit a Link
1. Delete and re-add (currently)
2. Or edit `public/links.json` directly

#### Delete a Link
1. Find link card
2. Click 🗑️ trash icon
3. Link removed from `public/links.json`

#### Update Link Status
```bash
npm run check-links
```
Tests all URLs and updates status.

### Development Tips

**Hot Reload Works Automatically**
- Edit React components → instant update
- Edit `public/links.json` → instant reload
- No manual refresh needed

**Check Console for Errors**
- Open DevTools (F12 or Cmd+Option+I)
- Look for red error messages
- Network tab shows API requests

**Test Different States**
- Try editing `links.json` with invalid JSON to see error handling
- Test with no links to see empty state
- Test with long titles to see text truncation

## 🚀 Deploying to GitHub Pages

### Automatic (Recommended)

1. **Create GitHub Actions workflow:**
   ```bash
   mkdir -p .github/workflows
   ```

2. **Copy from DEPLOYMENT.md**
   - Create `.github/workflows/deploy.yml`
   - Add the workflow code (see DEPLOYMENT.md)

3. **Push to GitHub:**
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add deployment workflow"
   git push
   ```

4. **GitHub does the rest**
   - Automatically builds on every push
   - Deploys to `gh-pages` branch
   - Live at: `clarkngo.github.io/cityu-internal-links/`

### Manual Deployment

```bash
# Build
npm run build

# Go to GitHub Pages settings
# Source: gh-pages branch, /root folder
# Then push manually

git add dist/
git commit -m "Deploy build"
git push
```

## 📊 Data Management

### Single Source of Truth: links.json

All link data lives in `public/links.json`:
- Add new links → update this file
- Delete links → update this file  
- Update status → update this file
- Favorite status → stored here

**Always commit `public/links.json` to git** to preserve changes.

### Regular Maintenance

Run weekly:
```bash
npm run check-links
git add public/links.json
git commit -m "Check links - date"
git push
```

This keeps broken link status current.

## 🔐 Security & Limits

### What's Safe
✅ Managing links locally
✅ Adding URLs to external sites
✅ Filtering and sorting
✅ No user authentication needed (internal tool)

### Limitations
❌ No login/auth system (add if needed)
❌ GitHub Pages is public (restrict if needed)
❌ No user-specific data (shared for all users)
❌ CORS prevents external API calls from browser

## 🛠️ Customization

### Change Colors
Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#003366', // CityU blue
    },
  },
}
```

### Add New Workflow
1. Edit `Dashboard.jsx` - add to select
2. Edit `App.jsx` - add route
3. Test at `/#/dashboard/newworkflow`

### Modify Link Fields
1. Edit `links.json` schema
2. Update Dashboard form
3. Update Dashboard display

### Change Icons
1. Browse [lucide.dev](https://lucide.dev)
2. Import in `Dashboard.jsx`
3. Replace existing icons

## 📱 Responsive Design

The dashboard works on:
- 📱 Mobile (single column)
- 🖥️ Tablet (2 columns)
- 🖥️ Desktop (3 columns)
- 🖥️ Ultra-wide (3+ columns)

Tailwind CSS handles all responsive behavior automatically.

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Port 5173 is busy? Use different port:
npm run dev -- --port 3000
```

### Import Errors
```bash
# Reinstall dependencies:
rm -rf node_modules package-lock.json
npm install
```

### JSON Parse Errors
- Check `public/links.json` syntax
- Use online JSON validator
- Missing commas are common

### Links Not Saving
- Check browser console (F12)
- Verify `public/links.json` is writable
- Ensure you're in dev mode (`npm run dev`)

### GitHub Pages Not Updating
- Check Actions tab for build errors
- Verify `base` path in `vite.config.js`
- Clear browser cache or use incognito

## 📚 Learn More

- **React**: https://react.dev
- **Vite**: https://vitejs.dev
- **React Router**: https://reactrouter.com
- **Tailwind CSS**: https://tailwindcss.com
- **Lucide Icons**: https://lucide.dev

## 📝 Useful Scripts

```bash
npm run dev                # Start dev server
npm run build             # Build for production
npm run preview           # Preview production build
npm run check-links       # Validate all URLs
npm run lint              # Check code quality
bash verify-setup.sh      # Verify installation
```

## 🎓 Next Steps

1. ✅ **You've done this**: Project setup & verification
2. **Next**: Add your real CityU links to `public/links.json`
3. **Then**: Deploy to GitHub Pages (see DEPLOYMENT.md)
4. **Finally**: Share dashboard URL with CityU community

## 💡 Ideas for Enhancement

- Add search functionality
- User preferences (save favorite filters)
- Link usage analytics
- Department/college specific views
- QR codes for links
- Link descriptions with markdown
- Category icons instead of tags
- Dark mode toggle

## ❓ Questions?

1. Check relevant documentation:
   - `README.md` - Overview & features
   - `DEPLOYMENT.md` - GitHub Pages setup
   - `DEVELOPMENT.md` - Technical deep dive

2. Review code comments in:
   - `src/components/Dashboard.jsx`
   - `check-links.js`
   - `vite.config.js`

3. Test locally first:
   ```bash
   npm run dev
   ```

---

**You're all set!** 🎉

Start with:
```bash
npm run dev
```

Visit: http://localhost:5173

Enjoy building! 🚀

---

**Version**: 1.0.0  
**Created**: January 2026  
**Tech Stack**: React 19 + Vite 7 + Tailwind CSS 3
