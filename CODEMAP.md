# Frontend Codemap

## Frontend Overview
- Responsibility: single-page client for discovery, purchase, reading, profile/community features, and author theming.
- Runtime entry: `frontend/src/main.tsx`.
- Main bottleneck: `frontend/src/App.tsx` is doing too much orchestration.

## `src/main.tsx`
- Creates the shared `QueryClient`.
- Mounts `HelmetProvider`, `GoogleOAuthProvider`, `QueryClientProvider`, and `BrowserRouter`.
- This is the app bootstrap boundary; it is clean and small.

## `src/App.tsx`
- Responsibility: route shell, top-level state container, and shared chrome.
- Holds auth session state, catalog/review loading, cart state, checkout flow, route mapping, and route rendering.
- Fetches session via `auth.getSession()`.
- Loads books, featured books, and reviews.
- Mounts the routed feature screens.
- Important substructures:
  - `Navbar`
  - `CartSidebar`
  - `HomePage`
  - `BooksPage`
  - `ReviewsPage`
  - `BookDetailRoute`
  - `BookDraftRoute`
- Architectural note: this file is acting as app controller, page registry, and state manager.

## `src/services/api.ts`
- Responsibility: primary backend gateway.
- Manages CSRF acquisition.
- Wraps requests with cookie credentials and refresh retry.
- Centralizes JSON/form handling and error normalization.
- Exposes all domain endpoints:
  - books/catalog
  - community
  - profile
  - library
  - wallet
  - orders
  - upload/update/delete book
  - reader manifest/page
  - reviews
  - publish
  - audit
  - theme
  - saved pages
  - reading position
- This is the strongest frontend abstraction and should remain the single API boundary.

## `src/services/auth.ts`
- Responsibility: auth lifecycle separate from general API endpoints.
- Builds CSRF headers.
- Performs the actual refresh.
- Coordinates refresh to prevent parallel refresh storms.
- Exposes `getSession`, `login`, `register`, `googleLogin`, `logout`.
- This file is tightly aligned with backend cookie JWT semantics.

## `src/types/`
- Responsibility: client DTO contracts.
- `src/types/index.ts` is the main shared contract file.
- Important types:
  - `User`
  - `Book`
  - `Review`
  - `CommunityPost`
  - `Order`
  - `MyBook`
  - `ReaderManifest`
  - `ReaderPageResponse`
- Specialized files like `bookTheme.ts`, `content.ts`, `chapter.ts`, `audit.ts` support isolated domains.

## `src/components/ReaderView.tsx`
- Responsibility: full reading experience container.
- Handles:
  - manifest loading
  - book loading
  - theme loading
  - page loading
  - session resume and backend reading position
  - saved page UI and bookmark panel
- Depends on:
  - `api`
  - `useSavedPages`
  - `useReadingSession`
  - `useReadingPosition`
  - `draftStudioTheme` helpers
  - `sanitizeBookHTML`
- This is effectively a feature module in one file.

## `src/components/BookDraftView.tsx`
- Responsibility: author-facing style editor for reader presentation.
- Loads persisted theme.
- Saves theme.
- Uses shared option tables from `src/constants/draftStudioTheme.ts`.
- Contains both preview rendering and control panel UI in one file.
- Closely paired with `ReaderView` through shared theme semantics.

## `src/constants/draftStudioTheme.ts`
- Responsibility: shared style vocabulary between draft editor and reader.
- Defines fonts, palettes, animations, paper effects, and background options.
- This file is a stable design contract and should stay centralized.

## `src/hooks/`
- Responsibility: persistence and feature helpers.

### `src/hooks/useSavedPages.ts`
- Backend-synced bookmarks for authenticated users.
- localStorage fallback for guests.
- Optimistic updates and rollback.

### `src/hooks/useReadingPosition.ts`
- Cross-device current page bookmark.
- Local cached fallback.
- Optimistic update flow.

### Supporting hooks
- `src/hooks/useReadingSession.ts` handles tab/session-scoped resume behavior.
- `src/hooks/useBookTheme.ts` and `src/hooks/useAutoSave.ts` support theming/editing behavior.
- This folder has good feature logic locality.

## `src/components/CommunityView.tsx`
- Responsibility: complete community feed feature.
- Owns:
  - auth session check
  - feed load and pagination
  - infinite scroll
  - modal post detail
  - save/like/mute/delete actions
- Nested feature pieces:
  - `CommentSection`
  - `PostComposer`
- Strong feature containment, but still very large.

## `src/components/ProfileView.tsx` and `src/pages/Profile.tsx`
- `src/pages/Profile.tsx` is a route wrapper.
- `src/components/ProfileView.tsx` owns:
  - order history loading
  - profile editing
  - avatar upload
  - settings modal
- Depends on `api.getOrders()` and `api.updateProfile()`.

## Frontend feature screens
- `src/components/BookPage.tsx`: book detail and purchase/read entrypoint.
- `src/components/LibraryView.tsx`: user library browsing.
- `src/components/WalletView.tsx`: wallet stats, transactions, deposits.
- `src/components/UploadBookView.tsx`: book creation and file upload flow.
- `src/components/MyBooksView.tsx`: author dashboard/list of owned books.
- `src/components/TermsView.tsx`: legal/info screen.

## `src/components/ui/`
- Responsibility: generic UI primitives.
- These are largely infrastructure components and not feature logic.
- Good place to keep untouched unless the design system changes.

## `src/contexts/BookThemeContext.tsx`
- Responsibility: intended theme context/provider abstraction.
- Current status: appears stale or secondary.
- References `getAccessToken`, which does not match the active service usage pattern seen elsewhere.
- Treat as legacy until reconciled.

## Frontend styles
- `src/index.css`: global base styles and typography setup.
- `src/styles/reader.css`: reader-specific layout rules.
- `src/styles/book-themes.css`: book theme-related styling.
- `src/styles/profile.css`: profile-specific styling.
- `src/styles/globals.css`: additional shared utilities/look-and-feel.

## Frontend tests
- `src/hooks/__tests__/useSavedPages.test.ts`: tests bookmark persistence behavior.
- `src/services/__tests__/community.api.test.ts`: tests service request behavior and API response handling.
- Coverage is decent at hook/service level, thinner at routed integration level.

## Frontend summary
- Best organized folders: `src/services/`, `src/hooks/`, `src/constants/`.
- Most overloaded files: `src/App.tsx`, `src/components/ReaderView.tsx`, `src/components/BookDraftView.tsx`, `src/components/CommunityView.tsx`.
- Best future refactor seam: split route containers from page UI, then move data loading to React Query.
