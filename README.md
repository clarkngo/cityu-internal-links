# Vite React GitHub Pages

I got really annoyed on configuring a new Vite React GitHub Pages Static Site.

So here's a template repo.

## Install
```
npm install
```

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