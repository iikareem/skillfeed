# Contributing to Skillfeed

Thanks for taking an interest in Skillfeed.

## Development

1. Fork and clone the repo.
2. `npm install`
3. Copy `.env.example` → `.env.local` and set `AI_GATEWAY_API_KEY`.
4. `npm run dev`

## Guidelines

- Keep changes focused — one concern per PR when possible.
- Prefer conventional commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Don’t commit secrets (`.env.local`, API keys).
- New sources: add a fetcher under `src/sources/` and register it in `src/sources/index.ts`.
- New AI backends: implement `EvaluationProvider` and register it in `createEvaluationProvider`.

## Pull requests

- Describe **what** changed and **why**.
- Note how you tested (local rank run, specific platforms, etc.).
- Keep the UI dark-first and accessible (keyboard + labels on controls).
