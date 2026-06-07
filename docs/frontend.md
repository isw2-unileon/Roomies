# Frontend Architecture

## Tech Stack

| Layer       | Technology                                |
|-------------|-------------------------------------------|
| Framework   | React 19                                  |
| Language    | TypeScript 5.7                            |
| Build tool  | Vite 6                                    |
| Routing     | React Router v7                           |
| Styling     | Tailwind CSS 4 + shadcn/ui (Radix UI)     |
| Maps        | MapLibre GL                               |
| Icons       | Heroicons + Lucide React                  |
| i18n        | i18next + react-i18next                   |
| HTTP        | Custom `apiFetch` wrapper                 |
| Testing     | Vitest + Testing Library + happy-dom      |

## Project Structure

```text
frontend/src/
├── api.ts                   # Base fetch wrapper with auth cookie handling
├── App.tsx                  # Root component with router
├── main.tsx                 # Entry point
├── index.css                # Tailwind imports + global styles
│
├── components/
│   ├── auth/                # LoginForm, RegisterForm, etc.
│   ├── common/              # InviteDialog, LanguageSwitcher, SegmentedLevelField, etc.
│   ├── map/                 # MapLibre GL wrapper component
│   ├── owner/               # Owner-specific components
│   │   ├── owner_applications/
│   │   ├── owner_messages/
│   │   ├── owner_profile/
│   │   ├── owner_properties/
│   │   └── owner_publish_property/
│   ├── tenant/              # Tenant-specific components
│   │   ├── tenant_applications/
│   │   ├── tenant_explore_details/
│   │   ├── tenant_groups/
│   │   ├── tenant_interested/
│   │   ├── tenant_onboarding/
│   │   ├── tenant_profile/
│   │   └── tenants_explore/
│   ├── OwnerLayout.tsx      # Owner layout with sidebar
│   └── TenantLayout.tsx     # Tenant layout with sidebar
│
├── hooks/                   # Custom React hooks
│   ├── useAppMetadata.ts
│   └── useNotice.ts
│
├── i18n/                    # Translation files
│   ├── index.ts             # i18next initialization
│   ├── es.ts                # Spanish (default)
│   ├── en.ts                # English
│   ├── fr.ts                # French
│   └── de.ts                # German
│
├── lib/
│   └── utils.ts             # Utility functions
│
├── mocks/                   # Mock data for tests
│   ├── ownerData.ts
│   └── tenantData.ts
│
├── pages/
│   ├── auth/                # LoginPage, RegisterPage, AuthCallbackPage, ResetPasswordPage
│   ├── owner/               # OwnerDashboard, OwnerApplications, OwnerMessages, etc.
│   └── tenant/              # TenantOnboarding, TenantExplore, TenantGroups, etc.
│
├── routes/
│   ├── index.tsx            # Route definitions
│   ├── ProtectedRoute.tsx   # Auth + role guard component
│   └── postAuthRedirect.ts  # Post-login redirect logic
│
├── services/                # API service modules
│   ├── authService.ts
│   ├── tenantService.ts
│   ├── ownerService.ts
│   └── messageService.ts
│
├── styles/                  # CSS modules (per-component)
│   └── *.module.css
│
└── types/                   # TypeScript type definitions
    ├── tenant.ts
    └── owner.ts
```

## Routing & Access Control

Routes are defined in `src/routes/index.tsx` with role-based protection via `ProtectedRoute`:

| Path                       | Access        | Component               |
|----------------------------|---------------|-------------------------|
| `/login`                   | public        | LoginPage               |
| `/register`                | public        | RegisterPage            |
| `/auth/callback`           | public        | AuthCallbackPage        |
| `/reset-password`          | public        | ResetPasswordPage       |
| `/onboarding/tenant`       | tenant (pending) | TenantOnboarding     |
| `/tenant/*`                | tenant        | TenantLayout + children |
| `/owner/*`                 | owner         | OwnerLayout + children  |
| `*` (catch-all)            | authenticated | Redirect based on role  |

The `ProtectedRoute` component:
1. Checks for an auth cookie
2. If missing → redirects to `/login`
3. If present → calls `GET /api/profile/status`
4. Redirects based on role + onboarding state
5. Renders children only if role matches

## API Layer

`src/api.ts` provides a thin wrapper around `fetch`:

- Automatically includes credentials (cookies)
- Handles JSON serialization/deserialization
- Throws on non-OK responses
- Supports file uploads (multipart)

Service modules (`authService.ts`, `tenantService.ts`, etc.) build on top of `apiFetch` with domain-specific methods:

```typescript
// src/services/tenantService.ts
export async function getTenantApartments(filters: ApartmentFilters) {
  const params = new URLSearchParams(filters as any);
  return apiFetch<Apartment[]>(`/api/tenant/apartments?${params}`);
}
```

## State Management

There is no global state library. State is managed locally with:

- **React useState/useReducer** — component-local state
- **URL search params** — filter state (explore page)
- **localStorage** — language preference (i18n)

## Internationalization (i18n)

Configured in `src/i18n/index.ts`:

- **Library**: i18next + react-i18next
- **Languages**: Spanish (`es`), English (`en`), French (`fr`), German (`de`)
- **Default**: Spanish
- **Persistence**: Language choice saved in `localStorage`
- **Usage**: `import { useTranslation } from 'react-i18next'`

```typescript
const { t } = useTranslation();
return <h1>{t('explore.title')}</h1>;
```

## Component Libraries

### shadcn/ui

UI primitives from [shadcn/ui](https://ui.shadcn.com/) are used for:
- Dialogs, buttons, inputs
- Cards, badges, tabs
- Selects, toasts

Components are copied into the project (not a dependency) and customized as needed.

### MapLibre GL

The map component wraps [MapLibre GL JS](https://maplibre.org/) to provide:
- Interactive map with apartment markers
- Radius-based search circle
- Compatibility score indicators

## Testing

- **Vitest** — test runner
- **@testing-library/react** — component testing
- **happy-dom** — DOM environment
- **Mock data** — in `src/mocks/` for consistent test fixtures

```bash
npm run test        # Run tests
npx tsc --noEmit    # Type-check
```

## Build & Dev

```bash
npm run dev         # Vite dev server (port 5173)
npm run build       # Production build → dist/
npm run preview     # Preview production build
```

## Related Docs

- [Architecture overview](architecture.md)
- [API reference](api-reference.md)
- [Data model](data-model.md)
- [Testing guide](testing.md)
