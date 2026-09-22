"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  RankProgressEvent,
  RankResult,
  RankedArticle,
  SourceSummary,
} from "@/ranking";

const DEFAULT_SUMMARY =
  "Senior fullstack engineer — TypeScript, Next.js, AI SDK. Building evaluation-driven products and developer tools.";

const DEFAULT_AVOID = "Crypto hype, engagement bait, generic listicles";

const TIPS = [
  "Metadata only — titles, briefs, and tags. No full-page scrape.",
  "Scores use a poor → excellent rubric against your skill summary.",
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

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`skillfeed-brand ${className}`}>
      Skill<span className="feed">feed</span>
    </span>
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
      className="anim-rise grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 border-b border-line py-6 sm:grid-cols-[3.25rem_1fr_auto] sm:gap-x-6"
      style={{ animationDelay: `${0.04 * rank}s` }}
    >
      <div className="font-display text-2xl font-bold tabular-nums text-muted/80">
        {String(rank).padStart(2, "0")}
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          <span>{article.source.replace("-", " ")}</span>
          {article.author ? <span>{article.author}</span> : null}
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-display text-xl font-semibold leading-snug tracking-tight text-ink transition-colors hover:text-signal sm:text-2xl"
        >
          {article.title}
        </a>
        {article.description ? (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
            {article.description}
          </p>
        ) : null}
        {article.tags.length > 0 ? (
          <p className="mt-3 text-xs text-muted">
            {article.tags.slice(0, 6).join(" · ")}
          </p>
        ) : null}
      </div>

      <div className="col-span-2 sm:col-span-1 sm:self-start sm:justify-self-end">
        <ScoreMeter score={article.verdict.score} index={rank} />
      </div>
    </article>
  );
}

function RankingProgress({ progress }: { progress: LiveProgress }) {
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
        <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {progress.sources.map((source) => (
            <li key={source.source}>
              {source.source.replace("-", " ")}{" "}
              <span className="text-ink-soft">{source.count}</span>
              {source.error ? " !" : ""}
            </li>
          ))}
        </ul>
      ) : null}

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
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<LiveProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RankResult | null>(null);

  const canSubmit = useMemo(() => summary.trim().length >= 8, [summary]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setError("Add a short summary of your skills.");
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
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-6 sm:px-8">
        <BrandMark className="text-lg font-bold text-ink" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          ranked to your skills
        </p>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-10 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-14 lg:pt-16">
          <div>
            <p className="anim-rise mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-signal">
              Daily reading, skill-matched
            </p>
            <h1 className="anim-rise anim-rise-delay-1 text-[clamp(3.2rem,8.5vw,5.8rem)] font-extrabold text-ink">
              <BrandMark />
            </h1>
            <p className="anim-rise anim-rise-delay-2 mt-5 max-w-md text-lg leading-relaxed text-ink-soft sm:text-xl">
              A feed ranked to your skills. Tell Skillfeed what you know—and
              what to skip—then get today&apos;s best matches first.
            </p>
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

            <div className="anim-rise anim-rise-delay-3 flex flex-wrap items-center gap-4 pt-1">
              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="btn-primary"
              >
                {loading ? "Ranking…" : "Rank my feed"}
              </button>
              <span className="text-sm text-muted">
                HN · Dev.to · Hashnode · Lobsters
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
              <RankingProgress progress={progress} />
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
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  {result.sources.map((f) => (
                    <li key={f.source}>
                      {f.source.replace("-", " ")} {f.count}
                      {f.error ? " !" : ""}
                    </li>
                  ))}
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
            <div className="panel rounded-xl px-5 py-6">
              <p className="max-w-lg text-sm leading-relaxed text-muted">
                Write your skills once.{" "}
                <span className="text-ink-soft">Skillfeed</span> scores
                today&apos;s writing against that summary—and pushes down
                anything you want to avoid.
              </p>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
