# Security Policy

## Supported versions

This project is under active development. Security fixes apply to the latest `main` branch.

## Secrets checklist (public repos)

Before opening the repository (or keeping it public), confirm:

- Real API keys live only in `.env.local` / Vercel env vars — **never** committed
- `.gitignore` ignores `.env*` (except `.env.example` placeholders)
- `.vercel/` and `node_modules/` are ignored
- If a key was ever committed by mistake, **rotate it** in the Vercel AI Gateway dashboard

The live demo uses server-side env vars. The public GitHub tree should contain only placeholders like `your_ai_gateway_api_key_here`.

## Abuse note

`POST /api/rank` is unauthenticated. On a public deployment, anyone who hits your URL can consume **your** AI Gateway credits. Consider Vercel Firewall / rate limits, Deployment Protection, or an auth gate if cost becomes an issue.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security-sensitive reports.

Contact the maintainer via GitHub: [@iikareem](https://github.com/iikareem).

Include:

- A short description of the issue
- Steps to reproduce (if safe to share)
- Impact assessment if known

We’ll aim to acknowledge reports promptly and coordinate a fix before any public disclosure.
