import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { AuditAction, AuditLogEntry } from "@/types";

type ActionTone = "create" | "update" | "delete" | "move";

const ACTION_LABELS: Record<string, string> = {
  system_created: "Created System",
  system_moved: "Moved System",
  system_deleted: "Deleted System",
  system_resized: "Resized System",
  fleet_created: "Created Fleet",
  fleet_moved: "Moved Fleet",
  fleet_deleted: "Deleted Fleet",
  fleet_resized: "Resized Fleet",
  fleet_updated: "Updated Fleet",
  planet_stats_updated: "Updated Planet",
  role_changed: "Changed Role",
  timeline_changed: "Updated Timeline",
  display_name_changed: "Updated Display Name",
  email_changed: "Updated Email",
  password_changed: "Updated Password",
  account_deleted: "Deleted Account",
  faction_created: "Created Faction",
  faction_updated: "Updated Faction",
  faction_deleted: "Deleted Faction",
};

const ENTITY_LABELS: Record<string, string> = {
  system: "System",
  fleet: "Fleet",
  user: "User",
  faction: "Faction",
};

function getActionTone(action: AuditAction): ActionTone {
  if (action.includes("deleted")) return "delete";
  if (action.includes("created")) return "create";
  if (action.includes("moved")) return "move";
  return "update";
}

function formatTimeShort(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatTimeFull(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function buildSummary(log: AuditLogEntry): string {
  const label = ACTION_LABELS[log.action] ?? log.action;
  if (log.entity_name) return `${label} · ${log.entity_name}`;
  return label;
}

interface AuditLogRowProps {
  log: AuditLogEntry;
  expanded: boolean;
  onToggle: () => void;
}

function AuditLogRow({ log, expanded, onToggle }: AuditLogRowProps) {
  const tone = getActionTone(log.action);
  const detailEntries = log.details ? Object.entries(log.details) : [];
  const entityLabel = ENTITY_LABELS[log.entity_type] ?? log.entity_type;
  const actionLabel = ACTION_LABELS[log.action] ?? log.action;

  return (
    <li className="audit-row">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="audit-row__summary"
      >
        <motion.span
          aria-hidden
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="audit-row__chevron"
        >
          <ChevronDown size={14} />
        </motion.span>

        <span
          className={`audit-row__tone audit-row__tone--${tone}`}
          aria-label={`Action tone ${tone}`}
        >
          {tone}
        </span>

        <time className="audit-row__time" dateTime={log.created_at}>
          {formatTimeShort(log.created_at)}
        </time>

        <span className="audit-row__service">{entityLabel}</span>

        <span className="audit-row__message" title={buildSummary(log)}>
          {buildSummary(log)}
        </span>

        <span className="audit-row__user" title={log.display_name || "Unknown"}>
          {log.display_name || "Unknown"}
        </span>

        <span
          className={`audit-row__status audit-row__status--${tone}`}
          aria-label={`Action ${actionLabel}`}
        >
          {actionLabel}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="audit-row__details-wrap"
          >
            <div className="audit-row__details">
              <div className="audit-row__field">
                <p className="audit-row__field-label">Action</p>
                <p className="audit-row__field-value audit-row__field-value--mono">
                  {actionLabel}
                  <span className="audit-row__field-muted"> ({log.action})</span>
                </p>
              </div>

              <div className="audit-row__grid">
                <div className="audit-row__field">
                  <p className="audit-row__field-label">User</p>
                  <p className="audit-row__field-value">
                    {log.display_name || "Unknown"}
                  </p>
                </div>
                <div className="audit-row__field">
                  <p className="audit-row__field-label">Entity</p>
                  <p className="audit-row__field-value">
                    {entityLabel}
                    {log.entity_name ? ` · ${log.entity_name}` : ""}
                  </p>
                </div>
                <div className="audit-row__field">
                  <p className="audit-row__field-label">Entity ID</p>
                  <p className="audit-row__field-value audit-row__field-value--mono">
                    {log.entity_id || "—"}
                  </p>
                </div>
                <div className="audit-row__field">
                  <p className="audit-row__field-label">Timestamp</p>
                  <p className="audit-row__field-value audit-row__field-value--mono">
                    {formatTimeFull(log.created_at)}
                  </p>
                </div>
              </div>

              {detailEntries.length > 0 && (
                <div className="audit-row__field">
                  <p className="audit-row__field-label">Details</p>
                  <dl className="audit-row__detail-list">
                    {detailEntries.map(([key, value]) => (
                      <div className="audit-row__detail-item" key={key}>
                        <dt>{key}</dt>
                        <dd>{formatDetailValue(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div className="audit-row__tags">
                <span className="audit-row__tag">{entityLabel.toLowerCase()}</span>
                <span className="audit-row__tag">{tone}</span>
                {log.action.split("_").map((part) => (
                  <span className="audit-row__tag" key={part}>
                    {part}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  isFiltered: boolean;
  isSearchActive: boolean;
  onPageChange: (page: number) => void;
}

export function AuditLogTable({
  logs,
  loading,
  total,
  page,
  pageSize,
  isFiltered,
  isSearchActive,
  onPageChange,
}: AuditLogTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (loading) {
    return <p className="admin-page__loading">Loading audit logs...</p>;
  }

  if (logs.length === 0) {
    return (
      <p className="admin-page__empty">
        {isSearchActive ? "No matching audit entries." : "No audit entries yet."}
      </p>
    );
  }

  return (
    <>
      <div className="audit-list-wrap">
        <div className="audit-list-header">
          <span className="audit-list-header__chevron" aria-hidden />
          <span className="audit-list-header__tone">Tone</span>
          <span className="audit-list-header__time">Time</span>
          <span className="audit-list-header__service">Entity</span>
          <span className="audit-list-header__message">Summary</span>
          <span className="audit-list-header__user">User</span>
          <span className="audit-list-header__status">Action</span>
        </div>
        <ul className="audit-list" role="list">
          <AnimatePresence initial={false} mode="popLayout">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, delay: Math.min(index * 0.015, 0.2) }}
              >
                <AuditLogRow
                  log={log}
                  expanded={expandedId === log.id}
                  onToggle={() =>
                    setExpandedId((current) =>
                      current === log.id ? null : log.id,
                    )
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      <div className="admin-page__pagination">
        <button
          type="button"
          disabled={page === 0 || loading}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          className="admin-page__page-btn"
        >
          Prev
        </button>
        <span className="admin-page__page-info">
          Page {page + 1} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page + 1 >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
          className="admin-page__page-btn"
        >
          Next
        </button>
      </div>

      {isFiltered && (
        <p className="admin-page__search-meta">
          Showing {logs.length} of {total} matching result
          {total === 1 ? "" : "s"}
        </p>
      )}
    </>
  );
}
