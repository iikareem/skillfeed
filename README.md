# Skillfeed

**A tech reading feed ranked to your skills — powered by [Jev](https://www.langchain.com/blog/building-a-harness-with-jev).**

Skillfeed pulls today’s writing from Hacker News, Dev.to, Hashnode, and Lobsters, then scores each piece against a short summary of what you know and care about.

You describe your skills once. Skillfeed does the rest: fetch → match → sort.

---

## Powered by Jev (not a chat LLM)

Ranking is done with TypeSafe AI’s **[Jev](https://www.langchain.com/blog/building-a-harness-with-jev)** (`typesafe-ai/jev` on [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)) — a **System One** model built for fast, structured decisions.

Unlike traditional LLMs, Jev **does not use autoregressive text generation**. It does not write summaries or chat replies. You send it a **state** (your skill profile + article metadata) and typed **questions** (score / choice / boolean). It returns calibrated answers and probabilities your code can use directly.

That fits ranking perfectly: we need “how well does this match?” — not another paragraph of prose. TypeSafe reports up to **~200× faster** and **~400× cheaper** than comparable LLMs on classification-style work ([LangChain on Jev](https://www.langchain.com/blog/building-a-harness-with-jev)).

Skillfeed calls Jev through the Vercel AI SDK’s `experimental_evaluate` API, in batches so each request stays under the model’s context window.

---

## Why Skillfeed

Tech feeds are noisy. The same link hits every front page, and “top” rarely means “relevant to you.”

Skillfeed flips that:

1. **You write a skill summary** — one paragraph of what you build and care about (plus optional “avoid”).
2. **It fetches live metadata** — titles, descriptions, tags — not full article bodies.
3. **Jev scores in batches** — structured skill-match scores, not generated text; batches stay under the 32K context window.
4. **You get a ranked list** — strongest skill matches first, with live progress while it runs.

---

## Features

- **Jev skill matching** — System One scoring (poor → excellent), not autoregressive generation
- **Multi-source fetch** — HN, Dev.to, Hashnode, Lobsters in parallel
- **Live progress (SSE)** — Fetch → Match → Sort updates in the UI as work finishes
- **Provider adapter** — evaluation behind a factory/interface so you can swap AI backends later
- **Metadata-only pipeline** — cheap, fast classification without scraping full posts
- **Dark-first UI** — built for a focused “what should I read next?” loop

---

## Tech stack

| Layer | Choice |
|--------|--------|
| App | [Next.js](https://nextjs.org) (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Ranking | **[Jev](https://www.langchain.com/blog/building-a-harness-with-jev)** (`typesafe-ai/jev`) via [Vercel AI SDK](https://ai-sdk.dev) `experimental_evaluate` + [AI Gateway](https://vercel.com/docs/ai-gateway) |
| Validation | Zod |
| Progress | Server-Sent Events (`text/event-stream`) |

---

## Quick start

### 1. Clone & install

```bash
git clone https://github.com/iikareem/skillfeed.git
cd skillfeed
npm install
```

### 2. Configure environment

Copy the example env and add a [Vercel AI Gateway](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys) API key:

```bash
cp .env.example .env.local
```

```env
AI_GATEWAY_API_KEY=your_ai_gateway_api_key_here
EVALUATION_PROVIDER=vercel-gateway
```

> AI Gateway may require a payment method on file to unlock free credits. Requests only bill when they succeed.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste your skill summary, and rank.

---

## How ranking works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌────────┐
│ User profile│ ──▶ │ Fetch sources│ ──▶ │ Score in batches│ ──▶ │  Sort  │
│ summary+avoid│     │ (parallel)   │     │ experimental_   │     │ by score│
└─────────────┘     └──────────────┘     │ evaluate (jev)  │     └────────┘
                                         └─────────────────┘
```

1. **Collect** — up to `perSource` articles from each platform, deduped, capped at `maxArticles`.
2. **Batch** — articles are chunked (default UI: **7 per call**) so evaluate requests stay under ~32K tokens.
3. **Score with Jev** — each article gets a typed `score` question against your profile in `state` (no text generation).
4. **Sort** — highest skill-match first; usage and batch counts returned for transparency.

Progress events stream over SSE so the UI never sits on a blank spinner.

---

## API

### `POST /api/rank`

Streams Server-Sent Events. The last event is always `complete` (with ranked articles) or `error`.

**Request body**

```json
{
  "profile": {
    "summary": "Senior fullstack — TypeScript, Next.js, AI SDK, Postgres.",
    "avoid": "Crypto hype, engagement bait, no-code tutorials"
  },
  "perSource": 12,
  "maxArticles": 28,
  "batchSize": 7
}
```

| Field | Required | Description |
|--------|----------|-------------|
| `profile.summary` | yes | Skills / interests (min 8 chars) |
| `profile.avoid` | no | Topics to penalize |
| `perSource` | no | Articles per platform (default 15) |
| `maxArticles` | no | Cap after dedupe (default 40) |
| `batchSize` | no | Articles per evaluate call (default 8) |
| `sources` | no | Subset: `hacker-news`, `devto`, `hashnode`, `lobsters` |

**Example**

```bash
curl -N http://localhost:3000/api/rank \
  -H 'Content-Type: application/json' \
  -d '{
    "profile": {
      "summary": "Senior fullstack — TypeScript, Next.js, AI SDK.",
      "avoid": "Crypto hype, engagement bait"
    },
    "perSource": 12,
    "maxArticles": 28,
    "batchSize": 7
  }'
```

**SSE stages**

| Stage | Meaning |
|--------|---------|
| `fetching` | Pulling feeds |
| `fetched` | Collection done (+ counts) |
| `scoring` | Batch `completed` / `total` |
| `sorting` | Local sort by score |
| `complete` | Final `result` payload |
| `error` | Failure message |

### `GET /api/sources`

Debug helper — fetch metadata without ranking.

```bash
curl 'http://localhost:3000/api/sources?limit=10&source=devto'
```

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── rank/route.ts      # Thin SSE endpoint
│   │   └── sources/route.ts   # Metadata debug endpoint
│   ├── page.tsx               # Skillfeed UI
│   ├── layout.tsx
│   └── globals.css
├── sources/                   # One fetcher per platform
│   ├── hacker-news.ts
│   ├── devto.ts
│   ├── hashnode.ts
│   ├── lobsters.ts
│   └── index.ts               # Parallel fetchSources()
├── evaluation/                # Provider-agnostic evaluation
│   ├── types.ts               # EvaluationProvider interface
│   ├── create-provider.ts     # Factory
│   └── providers/
│       └── vercel-gateway.ts  # Vercel AI Gateway adapter
├── ranking/                   # Domain pipeline
│   ├── collect-articles.ts
│   ├── score-articles.ts      # Batch + toEvaluateRequest
│   ├── rank-articles.ts       # Orchestrator
│   ├── progress.ts            # Progress event types
│   ├── schema.ts              # Zod request schema
│   └── types.ts
└── lib/
    ├── env.ts                 # Safe AI_GATEWAY_API_KEY loading
    ├── http.ts
    └── chunk.ts
```

**Design notes**

- **Sources** never know about AI — they only return metadata.
- **Evaluation** is swappable: implement `EvaluationProvider`, register it in the factory.
- **Ranking** owns the pipeline and reports progress; the HTTP route only encodes SSE.

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
| `EVALUATION_PROVIDER` | no | Default: `vercel-gateway` |

Never commit `.env.local`. Use `.env.example` as the template.

---

## License

Private / personal project unless otherwise noted. Add a license if you open-source it.
