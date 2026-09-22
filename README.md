# Skillfeed

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Vercel AI SDK](https://img.shields.io/badge/AI%20SDK-evaluate-000?logo=vercel&logoColor=white)](https://ai-sdk.dev)
[![Model](https://img.shields.io/badge/model-typesafe--ai%2Fjev-f0a45a)](https://www.langchain.com/blog/building-a-harness-with-jev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Deployed on Vercel](https://img.shields.io/badge/demo-live-3dba7c?logo=vercel&logoColor=white)](https://skillfeed-xi.vercel.app)

**A tech reading feed ranked to your skills — powered by [Jev](https://www.langchain.com/blog/building-a-harness-with-jev).**

Skillfeed pulls today’s writing from Hacker News, Dev.to, Hashnode, and Lobsters, then scores each piece against a short summary of what you know and care about. You pick the platforms, describe your skills once, and get the best matches first.

**[Live demo →](https://skillfeed-xi.vercel.app)** · **[GitHub](https://github.com/iikareem/skillfeed)**

---

## How Skillfeed uses the Jev model

[Jev](https://www.langchain.com/blog/building-a-harness-with-jev) (`typesafe-ai/jev`) is TypeSafe AI’s **System One** model: it evaluates a **state** against typed **questions** and returns scores and probabilities your app can use directly.

In Skillfeed that looks like this:

1. **State** — your skill summary (and optional avoid list) plus a batch of article metadata (title, description, tags).
2. **Questions** — one `score` question per article: how well does this match the user’s skills? (poor → excellent rubric).
3. **Answers** — calibrated skill-match scores. Skillfeed sorts the feed by those scores.

We call Jev through the Vercel AI SDK’s `experimental_evaluate` API on [AI Gateway](https://vercel.com/docs/ai-gateway). Articles are scored in **batches** (UI default: 7) so each request stays under the model’s 32K context window. Multiple questions in one request are evaluated together, which keeps ranking fast and cheap compared with generating long text for every article.

More background: [Building a Harness with Jev](https://www.langchain.com/blog/building-a-harness-with-jev) (LangChain).

---

## Features

- **Jev skill matching** — poor → excellent score rubric against your summary
- **Platform multi-select** — include only the sources you care about
- **Parallel metadata fetch** — titles, descriptions, tags (no full-page scrape)
- **Batched evaluate** — keeps each call under ~32K tokens (UI default: 7 articles)
- **SSE progress UI** — smart loading with live source counts
- **Provider adapter** — swap evaluation backends via factory
- **Dark-first UI** — source icons, ranked list, GitHub link in header

---

## Tech stack

| Layer | Choice |
|--------|--------|
| App | [Next.js](https://nextjs.org) 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Ranking | **[Jev](https://www.langchain.com/blog/building-a-harness-with-jev)** via [AI SDK](https://ai-sdk.dev) `experimental_evaluate` + [AI Gateway](https://vercel.com/docs/ai-gateway) |
| Validation | Zod |
| Progress | Server-Sent Events (`text/event-stream`) |
| Hosting | [Vercel](https://vercel.com) (frontend + API together) |

---

## Quick start

### Prerequisites

- Node.js 20+
- A [Vercel AI Gateway](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys) API key

### 1. Clone & install

```bash
git clone https://github.com/iikareem/skillfeed.git
cd skillfeed
npm install
```

### 2. Environment

```bash
cp .env.example .env.local
```

```env
AI_GATEWAY_API_KEY=your_ai_gateway_api_key_here
# Optional — defaults to vercel-gateway
EVALUATION_PROVIDER=vercel-gateway
```

> `EVALUATION_PROVIDER` is an **app** setting (which adapter to use), not a Vercel dashboard field. Today the only value is `vercel-gateway`.

AI Gateway may require a payment method to unlock free credits. Successful requests only.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy on Vercel

The UI and backend (`/api/rank`, `/api/sources`) are the same Next.js project — one deploy covers both.

1. Import [iikareem/skillfeed](https://github.com/iikareem/skillfeed) in [Vercel](https://vercel.com/new).
2. Set `AI_GATEWAY_API_KEY` in Project → Settings → Environment Variables.
3. Deploy.

Or from the CLI:

```bash
npx vercel
npx vercel env add AI_GATEWAY_API_KEY
npx vercel --prod
```

Live: [skillfeed-xi.vercel.app](https://skillfeed-xi.vercel.app)

---

## How ranking works

```
┌──────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌────────┐
│ User profile │ ──▶ │ Fetch sources│ ──▶ │ Score in batches│ ──▶ │  Sort  │
│ + platforms  │     │ (parallel)   │     │ experimental_   │     │ by score│
└──────────────┘     └──────────────┘     │ evaluate (Jev)  │     └────────┘
                                          └─────────────────┘
```

1. **Collect** — up to `perSource` from each selected platform, deduped, capped at `maxArticles`.
2. **Batch** — chunk articles (default UI: **7 per call**) for the 32K context window.
3. **Score with Jev** — typed `score` questions against `state.profile`.
4. **Sort** — highest skill-match first.

Progress streams over SSE so the UI never sits on a blank spinner.

---

## API

### `POST /api/rank`

Streams Server-Sent Events. Last event is always `complete` or `error`.

**Request body**

```json
{
  "profile": {
    "summary": "Senior fullstack — TypeScript, Next.js, AI SDK, Postgres.",
    "avoid": "Crypto hype, engagement bait, no-code tutorials"
  },
  "sources": ["hacker-news", "devto"],
  "perSource": 12,
  "maxArticles": 28,
  "batchSize": 7
}
```

| Field | Required | Description |
|--------|----------|-------------|
| `profile.summary` | yes | Skills / interests (min 8 chars) |
| `profile.avoid` | no | Topics to penalize |
| `sources` | no | `hacker-news`, `devto`, `hashnode`, `lobsters` (default: all) |
| `perSource` | no | Articles per platform (default 15) |
| `maxArticles` | no | Cap after dedupe (default 40) |
| `batchSize` | no | Articles per evaluate call (default 8) |

**Example**

```bash
curl -N https://skillfeed-xi.vercel.app/api/rank \
  -H 'Content-Type: application/json' \
  -d '{
    "profile": {
      "summary": "Senior fullstack — TypeScript, Next.js, AI SDK.",
      "avoid": "Crypto hype"
    },
    "sources": ["hacker-news", "devto"],
    "batchSize": 7
  }'
```

**SSE stages:** `fetching` → `fetched` → `scoring` → `sorting` → `complete` | `error`

### `GET /api/sources`

Debug metadata fetch (no ranking).

```bash
curl 'https://skillfeed-xi.vercel.app/api/sources?limit=10&source=devto'
```

---

## Project structure

```
src/
├── app/
│   ├── api/rank/              # SSE ranking endpoint
│   ├── api/sources/           # Metadata debug endpoint
│   └── page.tsx               # Skillfeed UI
├── components/
│   └── source-mark.tsx        # Source icons + platform picker
├── sources/                   # One fetcher per platform
├── evaluation/                # Provider interface + Vercel adapter
├── ranking/                   # Collect → score → sort
└── lib/                       # env, http, chunk helpers
```

- **Sources** never know about AI — metadata only.
- **Evaluation** is swappable via `EvaluationProvider` + factory.
- **Ranking** owns the pipeline; the HTTP route only encodes SSE.

---

## Scripts

```bash
npm run dev      # Local development
npm run build    # Production build
npm run start    # Run production server
npm run lint     # ESLint
```

---

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `AI_GATEWAY_API_KEY` | yes | Vercel AI Gateway API key |
| `EVALUATION_PROVIDER` | no | Adapter id — default `vercel-gateway` |

Never commit `.env.local`. Use [`.env.example`](./.env.example).

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup and PR expectations.

---

## License

[MIT](./LICENSE) © 2026 [iikareem](https://github.com/iikareem)
