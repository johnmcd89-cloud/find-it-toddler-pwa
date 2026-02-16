# Find It! (Toddler PWA)

Offline-first toddler-friendly web app built with **Vite + vanilla TypeScript**.

## Features

- Tap-to-start unlock for audio policies
- 2-card rounds (one target + one distractor)
- Correct answer advances round immediately
- Incorrect answer gives gentle feedback and repeats prompt
- Inactivity timer repeats current prompt (mode-based)
- Parent gate in top-right invisible hotspot (press & hold 2s) with visual progress ring
- Parent settings persisted in `localStorage`
- Web Speech API TTS with `voiceschanged`, cancel-before-speak, graceful fallback logging
- Round logic prevents immediate target repetition
- Responsive layout, foldable viewport-segment support, and reduced motion support
- PWA installable and offline-ready after first load via precache + runtime caching
- Vitest tests for round logic and settings persistence

## Project Structure

- `public/content/items.json` - content pack (46 toddler items)
- `public/icons/*` - app icons
- `public/manifest.webmanifest` - manifest file
- `src/core/*` - rounds, settings, types, TTS
- `src/ui/*` - UI template + app controller
- `src/pwa/register.ts` - service worker registration
- `tests/*` - unit tests
- `vite.config.ts` - Vite + PWA plugin + runtime cache policy

## Scripts

```bash
npm install
npm run dev
npm run test
npm run build
npm run preview
```

## Notes

- The game content is emoji-based for minimal asset size and instant offline behavior.
- First load caches assets and content; subsequent visits work offline.
