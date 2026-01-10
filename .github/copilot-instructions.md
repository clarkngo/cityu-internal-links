# Project Instructions for AI Assistants

## Data Preservation Rules

**CRITICAL**: When adding new features or metadata fields, **NEVER delete or overwrite existing data** in JSON files.

- Always preserve all existing properties and data
- Add new fields without removing current ones
- Ensure backward compatibility when introducing new metadata
- When modifying data structures, migrate existing data rather than replacing it

## Project Context

This is a React-based internal link management dashboard with:
- Separate JSON files for links, tags, workflows, and recently-deleted items
- Vite dev server with custom middleware for data persistence
- Four API endpoints: `/api/save-links`, `/api/save-deleted-links`, `/api/save-tags`, `/api/save-workflows`

## Code Conventions

- Use React hooks (useState, useEffect, useRef, etc.)
- Tailwind CSS for styling
- Lucide React for icons
- All timestamps use `Date.now()` for millisecond precision
- Tags are case-insensitively sorted alphabetically
- Workflows maintain user-defined order
