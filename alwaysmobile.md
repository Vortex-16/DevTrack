# Always Mobile — Session Log

Last updated: 2026-04-28

Purpose: a single-file session tracker for mobile work. I will update this file at the end of each chat so you and I can quickly see the last actions.

## Entries

- 2026-04-28  — Created tracking file and started initial scan of the codebase.

## Next steps

- Scan the repo for mobile-related files and paste results below.
- Add suggestions and planned small fixes.
 
## Scan results (2026-04-28)

Found these mobile-related files/paths:
- mobile/tsconfig.json
- mobile/task.md
- mobile/src/theme/index.ts
- mobile/src/theme/colors.ts
- mobile/src/store/index.ts
- mobile/src/services/notifications.ts
- mobile/src/services/api.js
- mobile/src/hooks/useWarmUpBrowser.ts
- mobile/src/components/ui/index.tsx
- mobile/babel.config.js
- mobile/.gitignore
- mobile/.easignore
- mobile/package.json
- mobile/package-lock.json
- mobile/google-services.json
- mobile/expo-env.d.ts
- mobile/eas.json
- mobile/.npmrc
- mobile/app.json
- mobile/app.md
- mobile/app/_layout.tsx
- mobile/app/index.tsx
- mobile/app/+not-found.tsx
- mobile/assets/adaptive-icon.png
- mobile/assets/favicon.png
- mobile/assets/DevTrack.png
- mobile/assets/icon.png
- mobile/assets/splash.png
- mobile/app/(auth)/_layout.tsx
- mobile/app/(auth)/showcase/index.tsx
- mobile/app/(auth)/settings/index.tsx
- mobile/app/(auth)/resume/index.tsx
- mobile/app/(auth)/github-insights/index.tsx
- mobile/app/(auth)/projects/index.tsx
- mobile/app/(auth)/dashboard/index.tsx
- mobile/app/(auth)/chat/index.tsx
- mobile/src/components/chat/FloatingAIChatButton.tsx
- mobile/app/(auth)/learning/index.tsx

## Actions taken

- Created this tracking file `alwaysmobile.md`.
- Scanned the repo and recorded mobile-related files.

## Next steps

- Propose 3 small, high-impact mobile improvements.
- Implement the top-priority small improvement after confirmation.

## Changes implemented (2026-04-28)

- Implemented: Make API base URL configurable in `mobile/src/services/api.js`
	- Uses `Constants.expoConfig.extra.API_URL` or `process.env.API_URL` with fallback.

- Implemented: Cache TTL for offline cached GET responses in `mobile/src/services/api.js`
	- Default TTL: 24 hours, configurable via `Constants.expoConfig.extra.API_CACHE_TTL_MS` or `process.env.API_CACHE_TTL_MS`.

- Implemented: Glass blur tab bar in `mobile/app/(auth)/_layout.tsx`
	- Uses `expo-blur` to create a floating, translucent navbar.

- Implemented: Glass project controls in `mobile/app/(auth)/projects/index.tsx`
	- Search and filter controls now sit inside a glass shell with more spacing.

- Implemented: `liveUrl` persistence in server project APIs
	- Added validation in `server/src/middleware/validation.js` and create/update support in `server/src/controllers/projectController.js`.

- Implemented: Expo Go-safe push notification loading in `mobile/app/(auth)/settings/index.tsx`
	- Notifications module is now lazy-loaded and skipped in Expo Go, so startup no longer trips the expo-notifications error.

- Implemented: `expo-blur` installed in the mobile workspace
	- Added via `npx expo install expo-blur` so the tab bar and project controls use the SDK-matched native blur package.

- Implemented: Project type alias cleanup in `mobile/src/store/index.ts`
	- Added `repositoryUrl` and `technologies` so the mobile edit form matches backend payloads without TypeScript errors.

- Implemented: Reusable frosted glass surface in `mobile/src/components/ui/GlassCard.tsx`
	- Used on the projects controls shell and AI chat header/composer for a consistent modern surface.

- Implemented: Pill-shaped navbar and chat tab hiding in `mobile/app/(auth)/_layout.tsx`
	- The bottom tab bar is now more rounded/frosted and hidden while the chat route is open.

- Implemented: AI chat input clutter cleanup in `mobile/app/(auth)/chat/index.tsx`
	- Header, suggestions, and composer now use glass cards and the composer sits in a cleaner floating surface.

- Tweaked: Stronger blur/opacity for glass surfaces
	- Increased default frosted strength in `mobile/src/components/ui/GlassCard.tsx` and the pill navbar in `mobile/app/(auth)/_layout.tsx` so background items are less visible.

- Tweaked: iOS-style material tuning
	- Shifted the shared glass card and navbar toward a softer Apple-like frosted look with rounder surfaces and lighter chrome.

## Proposed improvements (choose one to implement next)

1. **Auth persistence & token refresh**: Ensure long-lived token persistence with `expo-secure-store` and automatic token refresh on 401 responses. This would reduce re-auth flows and allow background syncs to re-auth transparently.
2. **Optimistic UI for tasks/logs**: Add optimistic updates for creating/updating logs and toggling tasks to improve perceived latency. Revert changes on failure and show inline error toasts.


