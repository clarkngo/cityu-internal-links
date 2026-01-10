# DEVELOPMENT TIPS & REFERENCE
# CityU Internal Link Dashboard

## Local Development Workflow

### Daily Development

```bash
# Start development server with hot reload
npm run dev

# Open http://localhost:5173 in browser
# You'll see Management Mode with Add/Delete buttons
```

### Making Changes

1. **Add/Edit Links via UI**
   - Click "Add Link" button
   - Fill in title, URL, description
   - Select workflow and status
   - Click tags to assign
   - Click "Save Link"
   - Changes automatically save to `public/links.json`

2. **Direct JSON Edits**
   - Edit `public/links.json` directly
   - Vite will hot-reload automatically
   - No need to restart dev server

3. **Test Broken Link Checker**
   ```bash
   npm run check-links
   ```
   - Validates all URLs
   - Updates status in `links.json`
   - Handy before deployment

## Component Architecture

### Dashboard.jsx - Main Component

Located: `src/components/Dashboard.jsx`

**Key State:**
- `links` - All links from JSON
- `filteredLinks` - Links after filtering/sorting
- `selectedTags` - Active tag filters
- `sortBy` - Current sort method
- `allTags` - Extracted unique tags
- `newLink` - Form state for adding links
- `isManagementMode` - Dev mode check

**Key Functions:**
- `toggleFavorite(id)` - Star/unstar links
- `deleteLink(id)` - Remove link
- `addLink()` - Create new link
- `saveLinks(updatedLinks)` - POST to /api/save-links
- `handleTagToggle(tag)` - Filter by tag
- `handleTagInputChange(tag, action)` - Add/remove tags in form

### App.jsx - Router Setup

Located: `src/App.jsx`

Currently uses **HashRouter** for GitHub Pages compatibility.

Routes available:
- `/` - All links
- `/#/dashboard/advising` - Advising workflow
- `/#/dashboard/curriculum` - Curriculum workflow
- `/#/dashboard/admin` - Admin workflow

To add a new route:
```javascript
<Route path="/dashboard/newworkflow" element={<Dashboard workflow="NewWorkflow" />} />
```

## API Endpoints (Local Dev Only)

### POST /api/save-links

Saves updated links to `public/links.json`

**Request:**
```javascript
fetch('/api/save-links', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify([
    { id: 1, title: "Link 1", ... },
    { id: 2, title: "Link 2", ... }
  ])
})
```

**Response:**
```json
{ "success": true, "message": "Links saved successfully" }
```

**Note:** This endpoint only works during `npm run dev`. It's disabled in production.

## Vite Configuration Details

### Middleware for Local CRUD

In `vite.config.js`, the `customLinksMiddleware` plugin:

1. Listens for POST requests to `/api/save-links`
2. Parses the JSON body
3. Writes to `public/links.json`
4. Returns success/error response

This is a development-only middleware and won't be included in the production build.

### Base Path Configuration

For GitHub Pages at subdirectory:
```javascript
base: '/cityu-internal-links/',
```

For root domain:
```javascript
base: '/',
```

Update this based on your deployment URL.

## Tailwind CSS Utilities Used

Common classes you'll see in Dashboard.jsx:

```
Layout:
  max-w-7xl mx-auto       - Center with max width
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 - Responsive grid
  flex gap-2              - Flexbox with spacing
  sticky top-0            - Sticky header

Colors:
  bg-white bg-gray-50     - Backgrounds
  text-gray-900           - Text colors
  border border-gray-300  - Borders

Spacing:
  px-4 py-6               - Padding
  mb-8 mt-4               - Margins
  gap-2 gap-6             - Grid/flex gaps

Transitions:
  transition hover:        - Smooth state changes
  group group-hover:       - Group hover effects

States:
  focus:outline-none focus:ring-2 - Custom focus styles
  disabled: opacity-50    - Disabled states
```

## Icons from Lucide React

Currently used icons:
- `Heart` - Favorite toggle (filled when active)
- `AlertCircle` - Broken link indicator
- `ExternalLink` - URL indicator
- `Trash2` - Delete button
- `Plus` - Add link button

To use different icons:
```javascript
import { Heart, Star, Trash } from 'lucide-react';

// Use in JSX
<Heart size={20} className="text-red-500" />
```

Browse all available: https://lucide.dev

## Styling Patterns

### Button Styles
```javascript
// Primary button
className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"

// Secondary button
className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition"

// Danger button
className="text-red-500 hover:text-red-700 transition"
```

### Link Card
```javascript
className={clsx(
  'group bg-white rounded-lg shadow-md hover:shadow-lg transition p-6',
  link.status === 'broken' && 'border-l-4 border-red-500'
)}
```

### Tag Pills
```javascript
className={clsx(
  'px-3 py-1 rounded-full text-sm transition',
  active
    ? 'bg-blue-600 text-white'
    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
)}
```

## Testing Locally

### 1. Test Filtering
- Click different tags
- Click multiple tags
- Click "Clear filters"
- Verify only matching links show

### 2. Test Sorting
- Click "Title" - should alphabetize
- Click "Favorites" - starred links first
- Click "Status" - active links first

### 3. Test Management Mode (Dev Only)
- Click "Add Link" button
- Fill form and save
- Verify link appears
- Click trash icon to delete
- Verify changes persist after page refresh

### 4. Test Broken Link Checker
```bash
npm run check-links
```
- Watch for status updates
- Verify links.json is updated

### 5. Test Production Build
```bash
npm run build
npm run preview
```
- Verify no "Add Link" button
- Verify no delete icons
- Verify filtering/sorting still works

## Debugging Tips

### View Network Requests
```javascript
// In browser console
fetch('/api/save-links', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify([])
}).then(r => r.json()).then(console.log)
```

### Check Component State
Add to Dashboard.jsx temporarily:
```javascript
useEffect(() => {
  console.log('Filtered links:', filteredLinks);
  console.log('Sort by:', sortBy);
  console.log('Selected tags:', selectedTags);
}, [filteredLinks, sortBy, selectedTags]);
```

### Monitor File Changes
```bash
# Watch for changes to links.json
ls -la public/links.json
```

### React DevTools
Install Chrome/Firefox extension to inspect component hierarchy and state.

## Performance Optimization

### Current Optimizations
- ✅ Tailwind CSS (only used classes in build)
- ✅ Code splitting (routes can be lazy-loaded)
- ✅ Image optimization (Lucide icons are SVG)
- ✅ No external API calls (self-contained)

### Potential Future Improvements
```javascript
// Lazy load Dashboard
const Dashboard = lazy(() => import('./components/Dashboard'));

// Memoize filtered results
const filteredLinks = useMemo(() => {
  // expensive filtering logic
}, [links, selectedTags, sortBy]);

// Virtual scrolling for very large lists
// (install react-window)
```

## Common Edits

### Add New Workflow
1. `Dashboard.jsx` - Add to select options
2. `App.jsx` - Add route
3. Update filter logic if needed

### Change Colors
1. Edit `tailwind.config.js` for global colors
2. Or add custom classes in component

### Add New Icon
1. Import from lucide-react
2. Use in component: `<NewIcon size={20} />`

### Modify Link Schema
1. Edit `links.json` with new field
2. Update `Dashboard.jsx` form to handle it
3. Update API save logic if needed

## Git Workflow

```bash
# Start feature branch
git checkout -b feature/add-feature

# Make changes
npm run dev
# ... test locally ...

# Check links
npm run check-links

# Commit changes
git add .
git commit -m "Add feature X"

# Push and create PR
git push origin feature/add-feature

# After review/merge, run preview to test
npm run preview

# Deploy
git push origin main  # Triggers GitHub Actions
```

## Resources

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide React](https://lucide.dev)
- [React Router](https://reactrouter.com)

---

**Questions?** Check the main README.md or DEPLOYMENT.md

**Version**: 1.0.0
