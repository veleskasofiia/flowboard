# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
```

No lint or test scripts are configured.

## Architecture

**FlowBoard** is a Next.js App Router app that integrates multiple SaaS tools into a single dashboard with a visual schema editor and an AI chat assistant.

### Pages
- `/` — Landing page with animated connection-status tiles (Gmail, Slack, Notion, etc.) and a Supabase `todos` fetch
- `/connected` — ReactFlow graph showing app nodes + AI Flow Assistant chat panel side-by-side
- `/auth/login` and `/auth/signup` — Supabase email/password auth; login redirects to `/connected`

### Supabase client pattern
There are two Supabase client files — **use `lib/supabaseClient.ts`** (the singleton exported as `supabase`). The files under `utils/supabase/` are broken and should not be relied on:
- `utils/supabase/client.ts` references an undefined variable (`supabaseAnonKey` vs `supabaseKey`)
- `utils/supabase/server.ts` has a duplicate function name and mixed imports

Client-side pages import via `@/lib/supabaseClient` or `@/utils/supabase/client` (path alias `@/*` maps to the project root).

### AI Agent
`app/api/agent/route.ts` runs an agentic loop: it fetches Composio tools for Gmail, Google Calendar, Slack, Notion, and GitHub, then calls Claude (`claude-sonnet-4-6`) with tool use enabled. When Claude requests a tool, the route executes it via `ComposioToolSet.executeAction` and feeds the result back until Claude returns a final answer (max 10 steps). The `entityId` (Supabase user ID) is passed through so Composio uses the correct connected account per user.

Chat messages are persisted to the Supabase `messages` table (columns: `user_id`, `role`, `content`, `created_at`).

### Supabase tables in use
- `todos` — `id`, `name`, `completed`
- `messages` — `user_id`, `role`, `content`, `created_at`

### Environment variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
COMPOSIO_API_KEY=
```
