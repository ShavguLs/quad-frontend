# Frontend Design

## Purpose

The frontend is the React/Vite client for Quaduni, a Georgian-language bookstore and reading platform. It supports book discovery, book detail pages, checkout/library flows, reader pages, profile and wallet features, community interactions, and author-facing book/theme tooling.

## Product Principles

- Preserve Georgian interface copy unless a task explicitly changes localization.
- Keep the storefront, reader, and account flows fast on both desktop and mobile.
- Treat book content, reader progress, wallet data, and authentication state as user-critical data.
- Prefer small, clear UI changes over broad redesigns.
- Keep SEO-facing route, canonical, sitemap, and JSON-LD behavior aligned when URL behavior changes.

## Visual Direction

The current app uses a bold, high-contrast visual language: black surfaces, white text, sharp borders, mono/uppercase accents, bright yellow highlights, and deliberate motion. New screens should fit that system unless intentionally creating a distinct reader/book theme experience.

Core visual rules:

- Use strong hierarchy: large titles, compact metadata, and clear primary actions.
- Keep important actions visually obvious, especially purchase, read, login, save, and checkout actions.
- Maintain accessible contrast for Georgian text and long-form reading.
- Avoid generic card grids when a feature needs stronger editorial emphasis.
- Respect the existing mobile drawer/navigation patterns.

## Architecture

Entry and app shell:

- `src/main.tsx` mounts providers and routing.
- `src/App.tsx` owns top-level route rendering, shared chrome, auth session state, cart state, and several catalog/review flows.

Primary boundaries:

- `src/services/` is the API boundary. UI components should not make direct backend `fetch` calls.
- `src/types/` contains shared client contracts.
- `src/hooks/` contains reusable feature logic and persistence helpers.
- `src/components/ui/` contains generic UI primitives.
- Feature screens currently live mostly in `src/components/`.

The main architectural pressure point is `src/App.tsx`, which mixes routing, layout, data loading, and feature state. Future changes should avoid adding more unrelated responsibilities there when a smaller feature component, hook, or service function is enough.

## Data Flow

Backend calls should go through `src/services/api.ts` or `src/services/auth.ts`.

Service responsibilities:

- Attach `credentials: 'include'` for cookie-based auth.
- Preserve CSRF token behavior for unsafe methods.
- Refresh auth on eligible `401` responses.
- Normalize backend response fields before data reaches view components.
- Throw stable `Error` messages that callers can handle predictably.

Component responsibilities:

- Render state clearly: loading, empty, success, and error states.
- Keep request orchestration close to the feature unless shared by multiple features.
- Avoid duplicating API normalization logic in views.

## Routing And SEO

Routing uses `react-router-dom`. Book-facing URL behavior is SEO-sensitive, so route changes should be handled with care.

When changing public URLs or metadata:

- Update route parsing/building helpers together.
- Check canonical URL generation.
- Check JSON-LD output.
- Check sitemap/prerender behavior.
- Keep old route redirects only when there is an actual shipped URL compatibility need.

## Reader Design

Reader pages are a distinct product surface. They should prioritize readability, progress continuity, and low-friction navigation over storefront styling.

Reader-related behavior should preserve:

- Manifest/page loading contracts.
- Saved pages/bookmarks.
- Reading position persistence.
- Guest local fallback behavior where already implemented.
- Book theme rendering semantics shared with author/draft tooling.

## State Management

Use the smallest state mechanism that fits the feature:

- Local component state for isolated UI state.
- Custom hooks for reusable feature state or persistence.
- TanStack Query for server state where the surrounding code already uses or benefits from it.
- Zustand only for genuinely shared client state.

Do not introduce a new state layer for a single screen.

## Styling

Styles are primarily Tailwind classes with a few focused CSS files:

- `src/index.css` for global base styles.
- `src/styles/globals.css` for shared app styling.
- `src/styles/book-themes.css` for book theme presentation.
- `src/styles/profile.css` for profile-specific styles.

Prefer existing utility classes and UI primitives. Add CSS only when Tailwind classes would make the component hard to read or when styling is shared across a feature.

## TypeScript Conventions

- Keep strict TypeScript clean.
- Use `interface` for object contracts.
- Use `type` for unions and utility types.
- Use `import type` for type-only imports.
- Avoid `any`; narrow unknown values explicitly, especially in `catch` blocks.
- Keep exported prop and service payload types explicit.

## Testing And Validation

Use the smallest useful validation for the change.

Frontend commands:

```bash
npm run build
npm test
```

Single test file:

```bash
npm test -- src/components/__tests__/BookPage.test.tsx
```

Recommended validation by change type:

- UI component change: nearest component test plus `npm run build`.
- Hook change: nearest hook test plus `npm run build`.
- Service/API contract change: service tests plus backend contract check if payloads changed.
- Routing/SEO change: route tests, SEO metadata tests, and `npm run build`.

## Change Guidelines

- Read nearby code first and match local conventions.
- Touch the fewest files needed for the task.
- Keep frontend service types aligned with backend serializer/API fields.
- Do not silently rename API fields.
- Do not change auth cookie, CSRF, or refresh semantics unless the task requires it.
- Preserve existing Georgian copy and product tone.
- Prefer feature-local improvements before adding new shared abstractions.
