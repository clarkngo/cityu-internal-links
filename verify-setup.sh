#!/bin/bash

# CityU Internal Link Dashboard - Setup Verification Script
# Run this to verify everything is properly configured

echo "🔍 CityU Internal Link Dashboard - Setup Verification"
echo "====================================================="
echo ""

# Check Node version
echo "✓ Checking Node.js version..."
node --version
echo ""

# Check npm version
echo "✓ Checking npm version..."
npm --version
echo ""

# Check key files exist
echo "✓ Verifying key files..."
files=(
  "package.json"
  "vite.config.js"
  "tailwind.config.js"
  "postcss.config.js"
  "src/App.jsx"
  "src/components/Dashboard.jsx"
  "src/main.jsx"
  "public/links.json"
  "check-links.js"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ MISSING: $file"
  fi
done
echo ""

# Check dependencies
echo "✓ Checking installed dependencies..."
deps=(
  "react"
  "react-dom"
  "react-router-dom"
  "lucide-react"
  "tailwindcss"
  "vite"
)

for dep in "${deps[@]}"; do
  if grep -q "\"$dep\"" package.json; then
    echo "  ✅ $dep"
  else
    echo "  ❌ MISSING: $dep"
  fi
done
echo ""

# Count links in JSON
echo "✓ Checking links.json..."
link_count=$(grep -c '"id"' public/links.json)
echo "  Found $link_count links"
echo ""

# Check dist folder from build
echo "✓ Checking production build..."
if [ -d "dist" ]; then
  dist_size=$(du -sh dist | cut -f1)
  file_count=$(find dist -type f | wc -l)
  echo "  ✅ dist/ folder ($dist_size, $file_count files)"
else
  echo "  ⚠️  dist/ folder not found (run 'npm run build')"
fi
echo ""

echo "====================================================="
echo "✅ Setup Verification Complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start local development"
echo "2. Visit http://localhost:5173 in your browser"
echo "3. Try adding/deleting links in Management Mode"
echo "4. Run 'npm run check-links' to validate URLs"
echo "5. Read README.md for more information"
echo ""
echo "Happy coding! 🚀"
