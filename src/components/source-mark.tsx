import type { ReactElement } from "react";
import type { ArticleSourceId } from "@/sources";

export const SOURCE_META: Record<
  ArticleSourceId,
  { label: string; short: string; accent: string }
> = {
  "hacker-news": {
    label: "Hacker News",
    short: "HN",
    accent: "#ff6600",
  },
  devto: {
    label: "Dev.to",
    short: "DEV",
    accent: "#a3b0a8",
  },
  hashnode: {
    label: "Hashnode",
    short: "HS",
    accent: "#2962ff",
  },
  lobsters: {
    label: "Lobsters",
    short: "LB",
    accent: "#ac130d",
  },
};

export const SOURCE_ORDER: ArticleSourceId[] = [
  "hacker-news",
  "devto",
  "hashnode",
  "lobsters",
];

type IconProps = {
  className?: string;
  title?: string;
};

function HackerNewsIcon({ className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <rect width="32" height="32" rx="4" fill="#ff6600" />
      <path
        d="M8.2 7.5h3.4l4.4 8.6 4.4-8.6h3.4l-6.3 11.4V24.5h-3v-5.6L8.2 7.5z"
        fill="#fff"
      />
    </svg>
  );
}

function DevtoIcon({ className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <rect width="32" height="32" rx="4" fill="#0a0a0a" />
      <rect x="1.5" y="1.5" width="29" height="29" rx="3" stroke="#e8ebe9" strokeWidth="1.5" fill="none" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fill="#e8ebe9"
        fontSize="9"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        letterSpacing="0.5"
      >
        DEV
      </text>
    </svg>
  );
}

function HashnodeIcon({ className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <rect width="32" height="32" rx="4" fill="#2962ff" />
      <path
        d="M16 6.2 25.8 16 16 25.8 6.2 16 16 6.2z"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
      />
      <circle cx="16" cy="16" r="3.4" fill="#fff" />
    </svg>
  );
}

function LobstersIcon({ className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <rect width="32" height="32" rx="4" fill="#ac130d" />
      <path
        d="M10.5 11.2c1.1-2.2 3.4-3.4 5.5-3.4 2.3 0 4.4 1.3 5.4 3.4.4.8.6 1.7.6 2.6 0 1.5-.5 2.8-1.4 3.8l1.8 1.7-1.5 1.5-1.7-1.6c-.8.4-1.7.6-2.7.6-1 0-1.9-.2-2.7-.6l-1.7 1.6-1.5-1.5 1.8-1.7c-.9-1-1.4-2.3-1.4-3.8 0-.9.2-1.8.5-2.6z"
        fill="#fff"
        opacity="0.95"
      />
      <circle cx="13.2" cy="13.4" r="1.1" fill="#ac130d" />
      <circle cx="18.8" cy="13.4" r="1.1" fill="#ac130d" />
      <path
        d="M12.2 22.8c1.2.9 2.5 1.3 3.8 1.3s2.6-.4 3.8-1.3"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ICONS: Record<ArticleSourceId, (props: IconProps) => ReactElement> = {
  "hacker-news": HackerNewsIcon,
  devto: DevtoIcon,
  hashnode: HashnodeIcon,
  lobsters: LobstersIcon,
};

export function SourceIcon({
  source,
  className = "size-5",
  title,
}: {
  source: ArticleSourceId;
  className?: string;
  title?: string;
}) {
  const Icon = ICONS[source];
  return <Icon className={className} title={title ?? SOURCE_META[source].label} />;
}

export function SourceBadge({
  source,
  count,
  error,
  size = "md",
}: {
  source: ArticleSourceId;
  count?: number;
  error?: string;
  size?: "sm" | "md";
}) {
  const meta = SOURCE_META[source];
  const iconSize = size === "sm" ? "size-4" : "size-5";

  return (
    <span
      className={`source-badge ${size === "sm" ? "source-badge-sm" : ""}`}
      title={error ? `${meta.label}: ${error}` : meta.label}
      data-error={Boolean(error)}
    >
      <SourceIcon source={source} className={iconSize} />
      <span className="source-badge-label">{meta.label}</span>
      {typeof count === "number" ? (
        <span className="source-badge-count">{count}</span>
      ) : null}
      {error ? <span className="source-badge-warn">!</span> : null}
    </span>
  );
}

export function SourceStrip({
  className = "",
  sources = SOURCE_ORDER,
}: {
  className?: string;
  sources?: ArticleSourceId[];
}) {
  return (
    <ul className={`source-strip ${className}`} aria-label="Article sources">
      {sources.map((source) => (
        <li key={source}>
          <SourceBadge source={source} size="sm" />
        </li>
      ))}
    </ul>
  );
}

export function SourcePicker({
  selected,
  onChange,
  disabled = false,
}: {
  selected: ArticleSourceId[];
  onChange: (next: ArticleSourceId[]) => void;
  disabled?: boolean;
}) {
  const allSelected = selected.length === SOURCE_ORDER.length;

  function toggle(source: ArticleSourceId) {
    if (disabled) return;

    if (selected.includes(source)) {
      if (selected.length === 1) return;
      onChange(selected.filter((id) => id !== source));
      return;
    }

    onChange(
      SOURCE_ORDER.filter((id) => id === source || selected.includes(id)),
    );
  }

  function selectAll() {
    if (disabled) return;
    onChange([...SOURCE_ORDER]);
  }

  return (
    <fieldset className="source-picker" disabled={disabled}>
      <div className="source-picker-head">
        <div>
          <legend className="text-sm font-semibold text-ink">
            Platforms to use
          </legend>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Tap to turn sources on or off. Only{" "}
            <span className="text-ink-soft">in use</span> platforms are fetched
            and scored.
          </p>
        </div>
        <div className="source-picker-actions">
          <span className="source-picker-count" aria-live="polite">
            {selected.length}/{SOURCE_ORDER.length} in use
          </span>
          <button
            type="button"
            className="source-picker-all"
            onClick={selectAll}
            disabled={disabled || allSelected}
          >
            Use all
          </button>
        </div>
      </div>

      <div
        className="source-picker-grid"
        role="group"
        aria-label="Choose platforms to include in ranking"
      >
        {SOURCE_ORDER.map((source) => {
          const active = selected.includes(source);
          const meta = SOURCE_META[source];
          const alone = active && selected.length === 1;

          return (
            <button
              key={source}
              type="button"
              className="source-toggle"
              aria-pressed={active}
              data-active={active}
              onClick={() => toggle(source)}
              disabled={disabled}
              title={
                alone
                  ? "Keep at least one platform on"
                  : active
                    ? `Turn off ${meta.label}`
                    : `Use ${meta.label}`
              }
            >
              <span className="source-toggle-main">
                <SourceIcon source={source} className="size-7" />
                <span className="source-toggle-copy">
                  <span className="source-toggle-name">{meta.label}</span>
                  <span className="source-toggle-state">
                    {active ? "In use" : "Off — tap to use"}
                  </span>
                </span>
              </span>
              <span className="source-toggle-check" aria-hidden>
                {active ? (
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none">
                    <path
                      d="M3.5 8.2 6.6 11.3 12.5 4.7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
