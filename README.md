# CityU Internal Link Dashboard

A modern, searchable, and sortable hub for CityU institutional links. Built with React, Vite, and Tailwind CSS.

## Features

✨ **Dual-Mode Functionality**
- **Production (GitHub Pages)**: Read-only dashboard with filtering, sorting, and favorites
- **Local Development**: Management Mode for CRUD operations on links

🔗 **Link Management**
- Add, edit, and delete links locally
- Mark links as favorites
- Automatic status detection (active/broken)
- Tag-based filtering
- Workflow-based views (Advising, Curriculum, Admin)

🚀 **Developer Experience**
- Fast HMR (Hot Module Replacement)
- Local API endpoint for persisting changes
- Broken link checker script
- Responsive design with Tailwind CSS

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` and you'll see the dashboard with Management Mode enabled (Add/Delete buttons).

### 3. Check Broken Links
```bash
npm run check-links
```

This scans all URLs in `public/links.json` and updates their status.

### 4. Build for Production
```bash
npm run build
```

## Project Structure

```
cityu-internal-links/
├── src/
│   ├── components/
│   │   └── Dashboard.jsx      # Main dashboard component
│   ├── App.jsx                # Router setup
│   ├── main.jsx               # Entry point
│   ├── App.css                # Component styles
│   └── index.css              # Global styles (Tailwind)
├── public/
│   └── links.json             # Links database (Single Source of Truth)
├── check-links.js             # Broken link checker utility
├── package.json               # Dependencies
├── vite.config.js             # Vite configuration with local API middleware
├── tailwind.config.js         # Tailwind CSS configuration
└── postcss.config.js          # PostCSS configuration
```

## Link Schema

Each link object in `links.json`:

```json
{
  "id": 1,
  "title": "CityU Student Portal",
  "url": "https://myportal.cityu.edu.hk",
  "description": "Official student portal for course registration and grades",
  "tags": ["student", "enrollment", "advising"],
  "workflow": "Advising",
  "isFavorite": true,
  "status": "active"
}
```

### Fields
- **id**: Unique identifier
- **title**: Display name
- **url**: Full URL
- **description**: Brief description
- **tags**: Searchable tags
- **workflow**: "Advising", "Curriculum", or "Admin"
- **isFavorite**: Favorite indicator
- **status**: "active" or "broken"

## How It Works: Local CRUD

When running locally, the Vite middleware intercepts POST requests to `/api/save-links`:

1. User clicks "Add Link" → Form submits
2. Middleware receives request → Updates `public/links.json`
3. Component state updates → UI reflects changes

**This is local-only and only works during development.** On GitHub Pages, the dashboard is read-only.

## Broken Link Checker

Run before deployment to ensure all links are valid:

```bash
npm run check-links
```

The script:
- Tests each URL with a 5-second timeout
- Marks unreachable links as "broken"
- Retries failed checks up to 2 times
- Saves results back to `links.json`

## Dashboard Features

### Filtering
- Click any tag to filter
- Select multiple tags for combined filtering
- Click "Clear filters" to reset

### Sorting
- **Title**: Alphabetical (A-Z)
- **Favorites**: Starred links first
- **Status**: Active first, broken at bottom

### Interaction
- ❤️ **Heart icon**: Toggle favorite
- 🔗 **External link icon**: Visual indicator
- 🚫 **Red border**: Broken link indicator
- 🗑️ **Delete button** (local dev only): Remove links

## Routing & Workflows

Hash routes for workflow-specific dashboards:

- `/` - All links
- `/#/dashboard/advising` - Advising only
- `/#/dashboard/curriculum` - Curriculum only
- `/#/dashboard/admin` - Admin only

## GitHub Pages Deployment

### 1. Configure Base Path

If deploying to a subdirectory like `clarkngo.github.io/cityu-internal-links/`:

Update `vite.config.js`:
```javascript
export default defineConfig({
  base: '/cityu-internal-links/',
  // ...
});
```

For root domain deployment, keep `base: '/'`.

### 2. Deploy

**Option A: Manual**
```bash
npm run build
git add dist/
git commit -m "Deploy"
git push
```

**Option B: GitHub Actions (Recommended)**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Then push and GitHub Actions will auto-deploy.

## Customization

### Adding New Workflows

In `Dashboard.jsx`, update the workflow select:
```javascript
<option value="Registrar">Registrar</option>
```

In `App.jsx`, add the route:
```javascript
<Route path="/dashboard/registrar" element={<Dashboard workflow="Registrar" />} />
```

### Tailwind CSS Theme

Edit `tailwind.config.js` to customize colors:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#003366', // CityU blue
    },
  },
},
```

### Icons

Using [Lucide React](https://lucide.dev). Replace in `Dashboard.jsx` as needed:
- `Heart` - Favorites
- `AlertCircle` - Broken links
- `ExternalLink` - URLs
- `Trash2` - Delete
- `Plus` - Add link

## Troubleshooting

**"Cannot POST /api/save-links" Error**
- Only works during `npm run dev`
- GitHub Pages is read-only by design

**Links Not Persisting**
- Verify `public/links.json` exists
- Check console for errors

**Import Errors**
- Run `npm install`
- Clear node_modules and reinstall if needed

## Technologies

- React 19
- Vite 7
- React Router 7
- Tailwind CSS 3
- Lucide React

## License

Part of the CityU Internal Tools suite.

## Run locally
```
npm run dev
```

## Create Build
```
npm run build
```

## Preview Build
```
npm run preview
```

# More Info
## vite.config.js
```
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { viteSingleFile } from 'vite-plugin-singlefile'; 

export default defineConfig({
  plugins: [
    // Include the necessary framework plugin
    react(), 
    // Add the vite-plugin-singlefile plugin to inline all CSS and JS into index.html
    viteSingleFile(),
    svgr(),
  ],
  
  build: {
    // Ensure this is set to your build folder
    outDir: 'dist', 
  },
});

```
## .github/workflows/static.yml
```
# Simple workflow for deploying static content to GitHub Pages
name: Deploy static content to Pages

on:
  # Runs on pushes targeting the default branch
  push:
    branches: ["main"]

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

# Sets permissions of the GITHUB_TOKEN to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Allow only one concurrent deployment, skipping runs queued between the run in-progress and latest queued.
# However, do NOT cancel in-progress runs as we want to allow these production deployments to complete.
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  # Single deploy job since we're just deploying
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          # Upload entire repository
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```


## Plugin Installs
```
npm install -D vite-plugin-singlefile
npm install -D vite-plugin-svgr
```