# ADR-005: React 19 + TypeScript + Vite for the Frontend

## Status

Accepted

## Date

2026-02-16

## Context

The frontend needs to be a rich single-page application with:
- Role-based routing (tenant vs owner)
- Interactive map (MapLibre GL)
- Real-time compatibility scores
- Internationalization (4 languages)
- Responsive design for mobile and desktop
- Accessible UI components

The team needed to choose a framework, build tool, styling approach, and component library.

## Decision

| Concern | Choice |
|---------|--------|
| Framework | React 19 |
| Language | TypeScript 5.7 |
| Build tool | Vite 6 |
| Routing | React Router v7 |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui (Radix UI primitives) |
| Maps | MapLibre GL |
| i18n | i18next + react-i18next |
| Icons | Heroicons + Lucide React |
| Testing | Vitest + Testing Library |

**Rationale:**
- **React** provides the largest ecosystem and the team has prior experience
- **TypeScript** for type safety and better developer experience
- **Vite** for fast HMR and build times compared to Create React App / Webpack
- **shadcn/ui** provides accessible, customizable components without the bundle size of a full library (components are copied into the project)
- **Tailwind CSS** for rapid, consistent styling
- **MapLibre GL** as a free, open-source alternative to Google Maps

## Consequences

**Positive:**
- Fast development iteration with Vite HMR
- Type safety catches bugs at build time
- Accessible UI out of the box with Radix primitives
- No vendor lock-in for maps (open-source MapLibre)
- Easy theming with Tailwind utility classes

**Negative:**
- No global state management library (reduces boilerplate but may be needed as the app grows)
- shadcn/ui components are copied, not imported — updating them requires manual effort
- React Router v7 has a different API than v6, requiring some learning
- Multiple icon libraries (Heroicons + Lucide) adds inconsistency risk
