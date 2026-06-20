# XOC Implementation Skill

This document is the in-repo skill/playbook for implementing new features in XOC without breaking its technical, visual, and workflow patterns.

## Purpose

Use this guide whenever adding or changing frontend functionality so new work matches:
- the current architecture
- the current feature boundaries
- the current route and auth model
- the current visual language
- the existing service-driven data flow

## Project Identity

XOC is a React + TypeScript + Vite SPA for cyber operations and security monitoring.

Core visual identity:
- dark operational UI
- neon green and neon blue accents for client features
- red accent for superadmin
- heavy dashboard feel, not generic SaaS
- cards, glows, status badges, borders, and operational states

Core implementation identity:
- code organized by feature/domain
- shared layouts for each major area
- API access isolated in services
- local state with `useState` and `useEffect`
- route protection through auth context and route guards

## Canonical Structure

When building new functionality, follow this structure first.

### Client Features

Create new work under:
- `src/features/<domain>/`

Use:
- `src/features/dashboard/DashboardLayout.tsx` for normal authenticated client pages
- `src/components/layout/Header.tsx` and `src/components/layout/Sidebar.tsx` indirectly via the layout

Add supporting code in:
- `src/services/<domain>.service.ts`
- `src/types/` when contracts are reusable or shared
- `src/hooks/` only if logic is reused and stateful

Register routes in:
- `src/routes/AppRoutes.tsx`

### Superadmin Features

If the feature is global, tenant-spanning, or administrative, place it in:
- `src/features/superadmin/`

Use:
- `src/features/superadmin/SuperAdminLayout.tsx`
- `src/services/superadmin.service.ts`

Do not mix superadmin code into client feature folders unless it is truly shared.

## Standard Work Pattern

The dominant pattern in this repo is:

1. Feature page component owns page state.
2. Data loads via `load...()` functions.
3. `useEffect` triggers initial fetch.
4. API calls go through a service file.
5. UI renders loading, empty, success, and error-adjacent states.

Use this baseline shape:

```tsx
const [items, setItems] = useState<Type[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  loadItems();
}, []);

const loadItems = async () => {
  setIsLoading(true);
  try {
    const data = await domainService.getAll();
    setItems(data);
  } catch (error) {
    console.error('Failed to load items', error);
  } finally {
    setIsLoading(false);
  }
};
```

## Service Layer Rules

- Use `src/lib/axios.ts` through the exported `api` client.
- Keep backend calls out of view components when possible.
- Name service methods by intent: `getAll`, `getById`, `create`, `update`, `delete`, `rotateKey`, `getSessions`, etc.
- Normalize backend responses in the service when that reduces view complexity.
- Keep endpoint knowledge centralized in services.

Preferred pattern:
- component orchestrates state and user interaction
- service handles transport and response mapping
- types define contracts

## Routing And Access Rules

The app already has a clear auth split in `src/routes/AppRoutes.tsx`.

Respect these groups:
- public routes: login, register, public company info, superadmin login
- protected client routes: dashboard, incidents, sophia, voice, tickets, integrations, settings
- protected superadmin routes: superadmin dashboard and views

When adding a route:
- decide first if it is public, client-protected, or superadmin-only
- add it to the proper guarded branch
- preserve redirect behavior already used by the project

## Layout Rules

### Client Layout

Most authenticated client pages should be wrapped in:
- `DashboardLayout`

Expected behavior:
- page title and short operational subtitle at the top
- spacing based on `space-y-*`, `gap-*`, and `max-w-*`
- responsive grid for content cards

### Superadmin Layout

Superadmin screens should:
- stay inside `SuperAdminLayout`
- preserve the red-accent visual language
- feel denser and more administrative than the client dashboard

## UI Style System

The main tokens come from `src/index.css`.

### Color Direction

Client area:
- `bg-dark-bg`
- `bg-dark-card`
- `border-dark-border`
- `text-neon-green`
- `text-neon-blue`

Superadmin area:
- red accents
- dark neutral surfaces
- subtle alert/privileged styling

### Component Style Pattern

Reuse these traits:
- dark cards with soft borders
- rounded corners, usually `rounded-xl` or `rounded-2xl`
- glowing active states
- uppercase micro-labels for metadata
- bold or black titles for section identity
- visible state indicators for live/online/active systems

Avoid:
- flat white cards
- generic SaaS blue-only styling
- inconsistent accent colors without domain meaning
- plain browser dialogs for polished UX when extending major flows

## Content And Interaction Style

Use copy that feels operational and product-specific.

Good tone:
- security-focused
- direct
- system-oriented
- status-aware

Examples:
- "Centro de Integraciones"
- "Estado de Conexion"
- "Tablero de operaciones en tiempo real"

Avoid bland labels like:
- "My Page"
- "Manage Stuff"
- "General Settings"

## Feature Placement Rules

Use this decision guide.

### Add to `dashboard`

If the feature:
- summarizes operational data
- visualizes provider metrics
- belongs to the main user command center

### Add to `settings`

If the feature:
- configures agents
- manages credentials, keys, speech, routes, or capabilities
- changes tenant-specific behavior

### Add to `sophia`

If the feature:
- belongs to chat, AI conversation flow, session history, or live voice

### Add to `tickets`

If the feature:
- concerns incident tickets, status flow, triage, or ticket operations

### Add to `superadmin`

If the feature:
- affects multiple companies
- exposes privileged controls
- manages templates, audit data, users, or platform-wide operations

## Reusable Implementation Checklist

Before coding a new feature, verify:
- Which domain owns the feature?
- Which layout should contain it?
- Which service should own its API calls?
- Does it need new shared types?
- Is the route protected correctly?
- Does the UI match the XOC visual language?
- Are loading and empty states explicit?
- Is there a clear operational title and subtitle?

## Known Codebase Constraints

These are important when extending the app.

### Auth Token Caveat

`auth.service.ts` returns both access and refresh tokens, but `AuthContext.tsx` only persists the access token while `src/lib/axios.ts` expects `refreshToken` to exist.

Implication:
- do not assume refresh flow is reliable until this is fixed

### Large Components

Some files are already very large, especially in settings and Sophia flows.

Implication:
- prefer extracting subcomponents or hooks instead of extending giant files indefinitely

### Native Dialog Usage

Some current flows still use `alert`, `confirm`, and `prompt`.

Implication:
- for new significant UX, prefer integrated modals or inline panels over adding more native dialogs

### Avoid State Changes During Render

There is at least one risky render-time state update pattern in tickets.

Implication:
- keep state updates inside handlers, effects, or async flows, not render branches

## Golden Rules For New Implementations

1. Match the owning feature folder before writing code.
2. Use a service instead of scattering API calls.
3. Reuse the existing layout for the target area.
4. Keep the cyber-operations visual identity intact.
5. Show operational state clearly: loading, active, disabled, empty, error.
6. Prefer extension of existing patterns over inventing a parallel architecture.
7. If a file is already overloaded, split new logic into subcomponents or hooks.

## Recommended Template For New Feature Work

For most new client features, create:

- `src/features/<domain>/<FeatureName>.tsx`
- `src/services/<domain>.service.ts` if needed
- `src/types/<domain>.ts` if shared typing is needed
- route entry in `src/routes/AppRoutes.tsx`
- sidebar entry if the page should be navigable from the client shell

For most new superadmin features, create:

- `src/features/superadmin/views/<FeatureName>View.tsx`
- new methods in `src/services/superadmin.service.ts`
- types in `src/types/superadmin.ts` if shared

## How To Use This File

Before implementing any new work:
- read this file
- identify the target domain
- mirror an existing feature from the same domain
- keep naming, layout, loading flow, and color logic aligned with that domain

If there is doubt, prefer consistency with the closest existing feature over creating a new pattern.
