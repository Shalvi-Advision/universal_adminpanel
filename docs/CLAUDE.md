# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Material Kit React is a free React admin dashboard template built with Material-UI (MUI v7) and Vite. It provides a foundation for building admin panels and dashboards with pre-built pages and components.

**Tech Stack:**
- React 19.1.0
- TypeScript 5.8.2
- Material-UI (MUI) v7
- Vite 6.2.5 (build tool)
- React Router v7.4.1
- ApexCharts (for data visualization)

**Package Manager:** Yarn (v1.22.22) - use `yarn` commands, not `npm`

## Development Commands

```bash
# Install dependencies
yarn install

# Start development server (runs on http://localhost:3039)
yarn dev

# Type checking in watch mode (recommended to run alongside dev)
yarn tsc:watch

# Build for production (runs TypeScript compiler + Vite build)
yarn build

# Preview production build
yarn start

# Linting
yarn lint              # Check for lint errors
yarn lint:fix          # Auto-fix lint errors

# Formatting
yarn fm:check          # Check Prettier formatting
yarn fm:fix            # Auto-fix Prettier formatting

# Fix all (lint + format)
yarn fix:all

# Clean install (useful for troubleshooting)
yarn clean             # Remove node_modules and build artifacts
yarn re:dev            # Clean + install + dev
yarn re:build          # Clean + install + build
```

## Architecture

### Routing Structure

- **Entry Point:** `src/main.tsx` - Sets up the React app with `createBrowserRouter` and `RouterProvider`
- **Route Configuration:** `src/routes/sections.tsx` - Defines all application routes using React Router v7
- **Route Protection:** `src/routes/components/protected-route.tsx` - Handles authentication-based route protection
- **Lazy Loading:** Pages are lazy-loaded using React's `lazy()` for code splitting

Routes are organized with two main layout types:
- `AuthLayout` - For authentication pages (sign-in)
- `DashboardLayout` - For protected dashboard pages (dashboard, users)

### Layout System

Layouts are located in `src/layouts/`:

- **DashboardLayout** (`src/layouts/dashboard/`) - Main application layout with:
  - Navigation sidebar (`nav.tsx`)
  - Content area with header (`content.tsx`)
  - Responsive design with mobile/desktop breakpoints
  - Navigation configuration split into:
    - `nav-config-dashboard.tsx` - Main dashboard navigation
    - `nav-config-account.tsx` - Account-related navigation
    - `nav-config-workspace.tsx` - Workspace navigation

- **AuthLayout** (`src/layouts/auth/`) - Centered layout for authentication pages

### Theme System

Theme configuration in `src/theme/`:

- **ThemeProvider** (`theme-provider.tsx`) - Wraps the app and provides MUI theme
- **Theme Creation** (`create-theme.ts`) - Creates MUI theme with custom configuration
- **Theme Config** (`theme-config.ts`) - Contains theme customization options
- **Type Extensions** (`extend-theme-types.d.ts`) - TypeScript type definitions for custom theme properties
- **CSS Variables** (`core/`) - Theme uses MUI's CSS variables system for dynamic theming

### Component Structure

Components in `src/components/`:
- **chart/** - ApexCharts wrapper components with custom hooks
- **iconify/** - Iconify icon wrapper components
- **label/** - Badge/label components
- **logo/** - Application logo component
- **scrollbar/** - Custom scrollbar using simplebar-react
- **color-utils/** - Color manipulation utilities
- **svg-color/** - SVG color manipulation components

### Pages and Sections

- **Pages** (`src/pages/`) - Top-level route components that are lazy-loaded
- **Sections** (`src/sections/`) - Page-specific view components and sub-components:
  - `overview/` - Dashboard analytics widgets
  - `auth/` - Authentication views
  - `error/` - Error pages (404)

The pattern is: `Page` component imports a `View` component from `sections/`

### Mock Data

Mock data in `src/_mock/`:
- `_mock.ts` - Helper functions for generating mock data
- `_data.ts` - Static mock data used throughout the app

### Global Configuration

- **Config** (`src/config-global.ts`) - Global app configuration (app name, version)
- **Global Styles** (`src/global.css`) - Global CSS imports and resets

### Path Aliases

Vite is configured with path aliases in `vite.config.ts`:
- `src/*` - Maps to absolute imports from the src directory
- Example: `import { Iconify } from 'src/components/iconify'`

Always use the `src/` prefix for internal imports.

## Code Style and Conventions

### Import Sorting

This project uses `eslint-plugin-perfectionist` for strict import ordering. Imports must be ordered as follows:

1. Style imports
2. Side-effect imports
3. Type imports
4. Built-in and external packages
5. MUI imports
6. Routes
7. Hooks
8. Utils
9. Internal (other src/)
10. Components
11. Sections
12. Auth
13. Types
14. Parent/sibling/index imports

**Example:**
```typescript
import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import Box from '@mui/material/Box';

import { usePathname } from 'src/routes/hooks';

import { ThemeProvider } from 'src/theme/theme-provider';

import { Iconify } from 'src/components/iconify';
```

### TypeScript

- **Strict mode enabled** - All strict TypeScript checks are on
- **Type imports** - Use `import type` for type-only imports (enforced by ESLint)
- **No explicit any** - Avoid using `any` type (warning only, not error)

### Prettier Configuration

- Print width: 100 characters
- Single quotes
- 2-space indentation
- Semicolons required
- Trailing commas (ES5 style)

### React Patterns

- Use arrow functions for React components
- Self-closing tags when no children
- No unnecessary fragments (unless needed for keys)
- Props without curly braces when passing strings

## Material-UI (MUI) Guidelines

- Use MUI's CSS variables system (`theme.vars.palette.*`) for theming
- Import components from `@mui/material` individually (tree-shaking)
- Use the `sx` prop for styling instead of `styled()` when possible
- Color utilities from `minimal-shared/utils` (e.g., `varAlpha`) are available

## Common Patterns

### Adding a New Page

1. Create page component in `src/pages/[page-name].tsx`
2. Create view component in `src/sections/[section]/view/[view-name].tsx`
3. Add route in `src/routes/sections.tsx` with lazy import
4. Add navigation item in appropriate `nav-config-*.tsx` if needed

### Creating Dashboard Widgets

Dashboard widgets follow the pattern in `src/sections/overview/`:
- Each widget is a self-contained component
- Uses ApexCharts via `src/components/chart` wrapper
- Imports mock data from `src/_mock`

### Route Protection

Protected routes use the `ProtectedRoute` component wrapper:
```typescript
<ProtectedRoute>
  <DashboardLayout>
    <Outlet />
  </DashboardLayout>
</ProtectedRoute>
```

## Node Version

Requires Node.js >= 20
