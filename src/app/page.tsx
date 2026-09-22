"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  SourceBadge,
  SourceIcon,
  SourcePicker,
  SourceStrip,
  SOURCE_META,
  SOURCE_ORDER,
} from "@/components/source-mark";
import type {
  RankProgressEvent,
  RankResult,
  RankedArticle,
  SourceSummary,
} from "@/ranking";
import type { ArticleSourceId } from "@/sources";

const DEFAULT_SUMMARY =
  "Senior fullstack engineer — TypeScript, Next.js, AI SDK. Building evaluation-driven products and developer tools.";

const DEFAULT_AVOID = "Crypto hype, engagement bait, generic listicles";

const TIPS = [
  "Metadata only — titles, briefs, and tags. No full-page scrape.",
  "Jev scores each article with typed questions against your skill summary.",
  "Batches keep each evaluate call under the 32K context window.",
  "Anything in Avoid is pushed down, not deleted from the list.",
  "HN often has empty descriptions — title + tags still count.",
];

type LiveProgress = {
  stage: RankProgressEvent["stage"];
  message: string;
  articleCount?: number;
  sources?: SourceSummary[];
  completed?: number;
  total?: number;
};

const STEPS = [
  { id: "fetching", label: "Fetch" },
  { id: "scoring", label: "Match" },
  { id: "sorting", label: "Sort" },
] as const;

const GITHUB_REPO = "https://github.com/iikareem/skillfeed";

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`skillfeed-brand ${className}`}>
      Skill<span className="feed">feed</span>
    </span>
  );
}

function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt=""
      width={32}
      height={32}
      className={`skillfeed-logo ${className}`}
      aria-hidden
    />
  );
}

function GitHubIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.68 7.68 0 0 1 8 4.14c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function ExternalArrow({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function stepState(
  stage: LiveProgress["stage"],
  stepId: (typeof STEPS)[number]["id"],
): { active: boolean; done: boolean } {
  const order = ["fetching", "fetched", "scoring", "sorting", "complete"] as const;
  const stageIndex = order.indexOf(
    stage === "error" ? "fetching" : (stage as (typeof order)[number]),
  );
  const stepIndex =
    stepId === "fetching" ? 0 : stepId === "scoring" ? 2 : 3;

  return {
    active:
      stageIndex === stepIndex ||
      (stepId === "fetching" && stage === "fetched"),
    done: stageIndex > stepIndex,
  };
}

function progressPercent(progress: LiveProgress | null): number {
  if (!progress) return 0;
  if (progress.stage === "fetching") return 12;
  if (progress.stage === "fetched") return 28;
  if (progress.stage === "scoring") {
    const total = Math.max(progress.total ?? 1, 1);
    const completed = progress.completed ?? 0;
    return 28 + Math.round((completed / total) * 62);
  }
  if (progress.stage === "sorting") return 94;
  if (progress.stage === "complete") return 100;
  return 8;
}

function scoreLabel(score: number): string {
  if (score >= 2.5) return "excellent";
  if (score >= 1.75) return "good";
  if (score >= 0.85) return "fair";
  return "poor";
}

function isSourceId(value: string): value is ArticleSourceId {
  return value in SOURCE_META;
}

function ScoreMeter({ score, index }: { score: number; index: number }) {
  const pct = Math.min(Math.max(score / 3, 0), 1) * 100;
  return (
    <div className="w-full max-w-[9.5rem]">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="font-display text-xl font-bold tabular-nums tracking-tight text-ink">
          {score.toFixed(2)}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-signal">
          {scoreLabel(score)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-sm bg-bg-deep">
        <div
          className="score-fill h-full rounded-sm bg-signal"
          style={{
            width: `${pct}%`,
            animationDelay: `${0.05 * index}s`,
          }}
        />
      </div>
    </div>
  );
}

function ResultRow({
  article,
  rank,
}: {
  article: RankedArticle;
  rank: number;
}) {
  return (
    <article
      className="result-row anim-rise grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 border-b border-line py-6 sm:grid-cols-[3.25rem_1fr_auto] sm:gap-x-6"
      style={{ animationDelay: `${0.04 * rank}s` }}
    >
      <div className="font-display text-2xl font-bold tabular-nums text-muted/70">
        {String(rank).padStart(2, "0")}
      </div>

      <div className="min-w-0">
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <SourceBadge source={article.source} size="sm" />
          {article.author ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              {article.author}
            </span>
          ) : null}
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex max-w-full items-start gap-2 font-display text-xl font-semibold leading-snug tracking-tight text-ink transition-colors hover:text-signal sm:text-2xl"
        >
          <span>{article.title}</span>
          <ExternalArrow className="mt-1.5 size-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
        {article.description ? (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
            {article.description}
          </p>
        ) : null}
        {article.tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {article.tags.slice(0, 6).map((tag) => (
              <li key={tag} className="tag-chip">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="col-span-2 sm:col-span-1 sm:self-start sm:justify-self-end">
        <ScoreMeter score={article.verdict.score} index={rank} />
      </div>
    </article>
  );
}

function RankingProgress({
  progress,
  selectedSources,
}: {
  progress: LiveProgress;
  selectedSources: ArticleSourceId[];
}) {
  const [tipIndex, setTipIndex] = useState(0);
  const pct = progressPercent(progress);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  const tip = TIPS[tipIndex];

  return (
    <div className="anim-rise panel rounded-xl px-4 py-5 sm:px-6" aria-live="polite">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{progress.message}</p>
        <span className="font-display text-sm font-bold tabular-nums text-signal">
          {pct}%
        </span>
      </div>

      <div className="progress-track mb-5">
        <span style={{ width: `${pct}%` }} />
      </div>

      <div className="mb-5 flex flex-wrap gap-5">
        {STEPS.map((step) => {
          const state = stepState(progress.stage, step.id);
          return (
            <div key={step.id} className="flex items-center gap-2">
              <span
                className="step-dot"
                data-active={state.active}
                data-done={state.done}
              />
              <span
                className={`text-xs font-semibold uppercase tracking-[0.14em] ${
                  state.active || state.done ? "text-ink" : "text-muted"
                }`}
              >
                {step.label}
                {step.id === "scoring" &&
                progress.stage === "scoring" &&
                progress.total
                  ? ` ${progress.completed ?? 0}/${progress.total}`
                  : ""}
              </span>
            </div>
          );
        })}
      </div>

      {progress.sources && progress.sources.length > 0 ? (
        <ul className="mb-4 flex flex-wrap gap-2">
          {progress.sources.map((source) =>
            isSourceId(source.source) ? (
              <li key={source.source}>
                <SourceBadge
                  source={source.source}
                  count={source.count}
                  error={source.error}
                />
              </li>
            ) : null,
          )}
        </ul>
      ) : (
        <ul className="mb-4 flex flex-wrap gap-3 opacity-70">
          {selectedSources.map((source) => (
            <li key={source} className="flex items-center gap-2">
              <SourceIcon source={source} className="size-5 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {SOURCE_META[source].label}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p
        key={tipIndex}
        className="tip-swap max-w-xl text-sm leading-relaxed text-muted"
      >
        <span className="mr-2 font-semibold text-ink-soft">While you wait</span>
        {tip}
      </p>
    </div>
  );
}

async function rankWithProgress(
  body: unknown,
  onEvent: (event: RankProgressEvent) => void,
): Promise<RankResult> {
  const res = await fetch("/api/rank", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    let message = "Ranking failed";
    try {
      const data = await res.json();
      message = data.error ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: RankResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part
        .split("\n")
        .find((entry) => entry.startsWith("data: "));
      if (!line) continue;

      const event = JSON.parse(line.slice(6)) as RankProgressEvent;
      onEvent(event);

      if (event.stage === "complete") result = event.result;
      if (event.stage === "error") throw new Error(event.error);
    }
  }

  if (!result) throw new Error("Ranking finished without a result");
  return result;
}

export default function HomePage() {
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [avoid, setAvoid] = useState(DEFAULT_AVOID);
  const [sources, setSources] = useState<ArticleSourceId[]>([...SOURCE_ORDER]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<LiveProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RankResult | null>(null);

  const canSubmit = useMemo(
    () => summary.trim().length >= 8 && sources.length > 0,
    [summary, sources],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setError(
        sources.length === 0
          ? "Pick at least one platform."
          : "Add a short summary of your skills.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress({
      stage: "fetching",
      message: "Starting — gathering today’s writing",
    });

    requestAnimationFrame(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    });

    try {
      const ranked = await rankWithProgress(
        {
          profile: {
            summary: summary.trim(),
            avoid: avoid.trim() || undefined,
          },
          sources,
          perSource: 12,
          maxArticles: 28,
          batchSize: 7,
        },
        (event) => {
          if (event.stage === "complete" || event.stage === "error") return;
          setProgress((prev) => ({
            stage: event.stage,
            message: event.message,
            articleCount:
              event.stage === "fetched"
                ? event.articleCount
                : prev?.articleCount,
            sources:
              event.stage === "fetched" ? event.sources : prev?.sources,
            completed:
              event.stage === "scoring" ? event.completed : prev?.completed,
            total: event.stage === "scoring" ? event.total : prev?.total,
          }));
        },
      );

      setResult(ranked);
      setProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ranking failed");
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="skillfeed-shell">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 pt-6 sm:px-8">
        <a href="/" className="brand-lockup" aria-label="Skillfeed home">
          <LogoMark className="size-8" />
          <BrandMark className="text-lg font-bold text-ink" />
        </a>
        <div className="flex items-center gap-4">
          <p className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-muted sm:block">
            ranked with Jev
          </p>
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
            aria-label="Skillfeed on GitHub"
          >
            <GitHubIcon className="size-4" />
            <span>GitHub</span>
          </a>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-10 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-14 lg:pt-16">
          <div>
            <p className="anim-rise mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-signal">
              Daily reading, skill-matched
            </p>
            <h1 className="anim-rise anim-rise-delay-1 flex flex-wrap items-center gap-4 text-[clamp(3.2rem,8.5vw,5.8rem)] font-extrabold text-ink">
              <LogoMark className="size-[clamp(2.75rem,7vw,4.5rem)]" />
              <BrandMark />
            </h1>
            <p className="anim-rise anim-rise-delay-2 mt-5 max-w-md text-lg leading-relaxed text-ink-soft sm:text-xl">
              A feed ranked to your skills. Tell Skillfeed what you know—and
              what to skip—then get today&apos;s best matches first.
            </p>
            <div className="anim-rise anim-rise-delay-3 mt-7">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                Selected sources
              </p>
              <SourceStrip sources={sources} />
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="anim-rise anim-rise-delay-2 panel flex flex-col gap-5 rounded-xl p-5 sm:p-6"
          >
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink">Your skills</span>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.currentTarget.value)}
                rows={4}
                disabled={loading}
                className="field"
                placeholder="Who you are and what you’re deep in—stack, role, topics that matter."
              />
            </label>

            <label className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-ink">Avoid</span>
                <span className="text-xs text-muted">optional</span>
              </div>
              <textarea
                value={avoid}
                onChange={(e) => setAvoid(e.currentTarget.value)}
                rows={2}
                disabled={loading}
                className="field"
                placeholder="Topics or formats to push down the list."
              />
            </label>

            <SourcePicker
              selected={sources}
              onChange={setSources}
              disabled={loading}
            />

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="btn-primary"
              >
                {loading ? "Ranking…" : "Rank my feed"}
              </button>
              <span className="text-sm text-muted">
                {sources.length} platform{sources.length === 1 ? "" : "s"} ·
                Jev batches of 7
              </span>
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-md border border-danger/40 bg-bg-deep px-3 py-2 text-sm text-danger"
              >
                {error}
              </p>
            ) : null}
          </form>
        </section>

        <section
          id="results"
          className="mx-auto w-full max-w-6xl px-5 pb-20 pt-2 sm:px-8"
        >
          {loading && progress ? (
            <div className="mb-10">
              <RankingProgress
                progress={progress}
                selectedSources={sources}
              />
            </div>
          ) : null}

          {result ? (
            <>
              <div className="mb-2 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
                <div>
                  <h2 className="skillfeed-brand text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                    Your skillfeed
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    {result.ranked.length} articles · {result.evaluation.batches}{" "}
                    eval batches
                    {result.evaluation.usage.inputTokens != null
                      ? ` · ${result.evaluation.usage.inputTokens} input tokens`
                      : ""}
                  </p>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {result.sources.map((f) =>
                    isSourceId(f.source) ? (
                      <li key={f.source}>
                        <SourceBadge
                          source={f.source}
                          count={f.count}
                          error={f.error}
                        />
                      </li>
                    ) : null,
                  )}
                </ul>
              </div>

              {result.ranked.length === 0 ? (
                <p className="py-12 text-ink-soft">
                  No articles came back. Try again in a moment.
                </p>
              ) : (
                <div>
                  {result.ranked.map((article, i) => (
                    <ResultRow
                      key={`${article.source}-${article.id}`}
                      article={article}
                      rank={i + 1}
                    />
                  ))}
                </div>
              )}
            </>
          ) : !loading ? (
            <div className="panel empty-panel rounded-xl px-5 py-7 sm:px-7">
              <div className="mb-4 flex items-center gap-2">
                {sources.map((source) => (
                  <SourceIcon
                    key={source}
                    source={source}
                    className="size-6 opacity-90"
                  />
                ))}
              </div>
              <p className="max-w-lg text-sm leading-relaxed text-muted">
                Write your skills once. Pick the platforms you want.{" "}
                <span className="text-ink-soft">Skillfeed</span> pulls from
                those sites, then{" "}
                <span className="text-ink-soft">Jev</span> scores today&apos;s
                writing against that summary—and pushes down anything you want
                to avoid.
              </p>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
