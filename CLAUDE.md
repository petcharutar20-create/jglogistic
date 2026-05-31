# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (Turbopack, http://localhost:3000)
npm run build    # Production build (Turbopack)
npm run start    # Start production server
npm run lint     # Run ESLint (uses eslint CLI directly, not next lint)
```

There is no test suite configured.

## Architecture

This is a **Next.js 16** App Router project with **React 19** and **TypeScript**. Source lives under `src/app/`.

- `src/app/layout.tsx` — Root layout; loads Geist fonts via `next/font/google`
- `src/app/page.tsx` — Home page (Server Component by default)
- `src/app/globals.css` — Global styles
- `src/app/page.module.css` — CSS Modules scoped to the home page
- `public/` — Static assets served at `/`

Path alias: `@/*` resolves to `./src/*`.

**React Compiler** is enabled (`reactCompiler: true` in `next.config.ts`) — do not add manual `useMemo`/`useCallback` optimizations.

## Next.js 16 Breaking Changes

This is **not** the Next.js you know from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.

### Async Request APIs (breaking — no sync fallback)

`cookies()`, `headers()`, `draftMode()`, page/layout `params`, and page `searchParams` are **async only**. Synchronous access was removed entirely.

```tsx
// pages and layouts
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
}

// route handlers / server actions
import { cookies, headers } from 'next/headers'
const cookieStore = await cookies()
const headersList = await headers()
```

Run `npx next typegen` to generate `PageProps`/`LayoutProps`/`RouteContext` helper types.

### Proxy replaces Middleware

`middleware.ts` is deprecated. Use `proxy.ts` (or `src/proxy.ts`) with a named `proxy` export:

```ts
// proxy.ts
export function proxy(request: Request) { ... }
export const config = { matcher: '/protected/:path*' }
```

Config flags renamed too: e.g. `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`.

### Turbopack is the default bundler

`next dev` and `next build` now use Turbopack. Custom `webpack` configs in `next.config.ts` will cause `next build` to fail — migrate to Turbopack config or pass `--webpack` to opt out.

### ESLint config

Uses flat config (`eslint.config.mjs`) with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. Run via `eslint` CLI, not `next lint`.
