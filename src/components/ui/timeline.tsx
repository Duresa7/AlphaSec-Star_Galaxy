import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id?: string;
  date: string;
  title: string;
  description?: string;
  content?: ReactNode;
  href?: string;
  icon?: ReactNode;
  type?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  initialCount?: number;
  dateFormat?: Intl.DateTimeFormatOptions;
  className?: string;
  showMoreText?: string;
  showLessText?: string;
  dotClassName?: string;
  lineClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  dateClassName?: string;
  buttonVariant?: ButtonProps["variant"];
  buttonSize?: "default" | "sm" | "lg";
  animationDuration?: number;
  animationDelay?: number;
  showAnimation?: boolean;
}

function formatTimelineDate(
  value: string,
  dateFormat?: Intl.DateTimeFormatOptions,
): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...dateFormat,
  });
}

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function renderTimelineContent(content: ReactNode) {
  if (typeof content === "string") {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }

  return content;
}

function TimelineEntry({
  item,
  expanded,
  onToggle,
  dotClassName,
  lineClassName,
  titleClassName,
  descriptionClassName,
  dateClassName,
  dateFormat,
  animationDuration,
}: {
  item: TimelineItem;
  expanded: boolean;
  onToggle: () => void;
  dotClassName?: string;
  lineClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  dateClassName?: string;
  dateFormat?: Intl.DateTimeFormatOptions;
  animationDuration: number;
}) {
  const displayDate = formatTimelineDate(item.date, dateFormat);
  const hasContent = Boolean(item.content);
  const hasHref = Boolean(item.href);
  const isInteractive = hasContent || hasHref;
  const toneClass = item.type ? `timeline-tone--${item.type}` : "";
  const dotToneClass = item.type ? `timeline-shell__dot--${item.type}` : "";

  const renderTypeBadge = (className?: string) =>
    item.type ? (
      <span className={cn("timeline-tone", toneClass, className)}>{item.type}</span>
    ) : null;

  const renderDate = (className?: string) => (
    <span
      className={cn(
        "font-[var(--news-font-ui)] text-xs uppercase tracking-[0.16em] text-[var(--news-text-muted)]",
        className,
        dateClassName,
      )}
    >
      {displayDate}
    </span>
  );

  const card = (
    <div
      className={cn(
        "timeline-shell__card min-w-0 border px-6 py-6 text-left md:px-8 md:py-7",
        hasContent && expanded && "timeline-shell__card--expanded",
      )}
      data-open={hasContent ? expanded : undefined}
    >
      <div className="timeline-shell__mobile-meta flex items-center justify-between gap-3 md:hidden">
        {renderDate("text-[11px]")}
        {renderTypeBadge()}
      </div>

      <div className="timeline-shell__card-head flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="timeline-shell__desktop-meta hidden md:flex md:items-center md:gap-2">
            {renderTypeBadge()}
          </div>
          <h3
            className={cn(
              "font-[var(--news-font-ui)] text-lg font-semibold tracking-[-0.02em] text-[var(--news-text)] md:text-xl",
              titleClassName,
            )}
          >
            {item.title}
          </h3>
          {item.description ? (
            <p
              className={cn(
                "mt-2 max-w-2xl font-[var(--news-font-body)] text-[15px] leading-7 text-[var(--news-text-secondary)]",
                descriptionClassName,
              )}
            >
              {item.description}
            </p>
          ) : null}
        </div>

        {hasContent ? (
          <span className="timeline-shell__entry-action shrink-0">
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </span>
        ) : hasHref ? (
          <span className="timeline-shell__entry-action shrink-0">
            <ExternalLink className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {hasContent && expanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: animationDuration }}
            className="overflow-hidden"
          >
            <div className="timeline-shell__content mt-4 border-t pt-4">
              <div className="timeline-shell__markdown font-[var(--news-font-body)] text-[15px] leading-7 text-[var(--news-text-secondary)]">
                {renderTimelineContent(item.content)}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );

  const header = (
    <>
      <div className="timeline-shell__desktop-date hidden md:flex md:justify-end">
        {renderDate("text-right")}
      </div>
      <div className="relative hidden md:flex md:justify-center">
        <div
          aria-hidden="true"
          className={cn(
            "timeline-shell__line absolute inset-y-0 left-1/2 w-px -translate-x-1/2",
            lineClassName,
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            "timeline-shell__dot timeline-shell__dot--desktop relative flex h-8 w-8 items-center justify-center rounded-full",
            dotToneClass,
            dotClassName,
          )}
        >
          {item.icon ? (
            <span className="timeline-shell__dot-icon">{item.icon}</span>
          ) : null}
        </div>
      </div>
      <div className="hidden min-w-0 md:block">{card}</div>

      <div className="relative md:hidden">
        <div
          aria-hidden="true"
          className={cn(
            "timeline-shell__line absolute bottom-0 left-[1.1rem] top-0 w-px",
            lineClassName,
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            "timeline-shell__dot absolute left-[0.1rem] top-8 flex h-8 w-8 items-center justify-center rounded-full",
            dotToneClass,
            dotClassName,
          )}
        >
          {item.icon ? (
            <span className="timeline-shell__dot-icon">{item.icon}</span>
          ) : null}
        </div>
        <div className="timeline-shell__mobile-card">{card}</div>
      </div>
    </>
  );

  if (hasContent) {
    return (
      <div className="grid gap-4 md:grid-cols-[170px_56px_minmax(0,1fr)] md:gap-6">
        <button
          type="button"
          className={cn(
            "group grid gap-4 text-left md:grid-cols-[170px_56px_minmax(0,1fr)] md:gap-6",
            "md:contents",
            isInteractive && "w-full",
          )}
          onClick={onToggle}
          aria-expanded={expanded}
        >
          {header}
        </button>
      </div>
    );
  }

  if (hasHref && item.href) {
    const sharedClassName =
      "group grid gap-4 text-left md:grid-cols-[170px_56px_minmax(0,1fr)] md:gap-6";

    if (isExternalHref(item.href)) {
      return (
        <a
          href={item.href}
          className={sharedClassName}
          target="_blank"
          rel="noreferrer"
        >
          {header}
        </a>
      );
    }

    return <Link to={item.href} className={sharedClassName}>{header}</Link>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-[170px_56px_minmax(0,1fr)] md:gap-6">
      {header}
    </div>
  );
}

export function Timeline({
  items,
  initialCount = 5,
  dateFormat,
  className,
  showMoreText = "Show More",
  showLessText = "Show Less",
  dotClassName,
  lineClassName,
  titleClassName,
  descriptionClassName,
  dateClassName,
  buttonVariant = "ghost",
  buttonSize = "sm",
  animationDuration = 0.3,
  animationDelay = 0.08,
  showAnimation = true,
}: TimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [items],
  );

  const initialItems = sortedItems.slice(0, initialCount);
  const remainingItems = sortedItems.slice(initialCount);

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => ({ ...current, [id]: !current[id] }));
  };

  const renderItem = (item: TimelineItem, index: number) => {
    const key = item.id ?? `${item.title}-${item.date}-${index}`;
    const expanded = Boolean(expandedIds[key]);

    return (
      <motion.li
        key={key}
        initial={showAnimation ? { opacity: 0, y: 16 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{
          duration: animationDuration,
          delay: index * animationDelay,
        }}
        className="timeline-shell__item"
      >
        <TimelineEntry
          item={item}
          expanded={expanded}
          onToggle={() => toggleExpanded(key)}
          dotClassName={dotClassName}
          lineClassName={lineClassName}
          titleClassName={titleClassName}
          descriptionClassName={descriptionClassName}
          dateClassName={dateClassName}
          dateFormat={dateFormat}
          animationDuration={animationDuration}
        />
      </motion.li>
    );
  };

  return (
    <div className={cn("timeline-shell mx-auto max-w-4xl", className)}>
      <ul className="timeline-shell__list">
        {initialItems.map(renderItem)}
        <AnimatePresence initial={false}>
          {showAll ? remainingItems.map((item, index) => renderItem(item, index + initialItems.length)) : null}
        </AnimatePresence>
      </ul>

      {remainingItems.length > 0 ? (
        <motion.div
          initial={showAnimation ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          className="mt-8 flex justify-center"
        >
          <Button
            variant={buttonVariant}
            size={buttonSize}
            className="timeline-shell__toggle gap-2 rounded-full px-4"
            onClick={() => setShowAll((current) => !current)}
          >
            {showAll ? showLessText : showMoreText}
            <motion.span
              animate={{ rotate: showAll ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </Button>
        </motion.div>
      ) : null}
    </div>
  );
}
