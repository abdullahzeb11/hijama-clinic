"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  Mail,
  MessageCircle,
  CheckCircle2,
  Reply,
  Archive,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { updateMessageStatus, deleteMessage } from "@/app/actions/messages";
import { cn } from "@/lib/utils";

type Status = "NEW" | "READ" | "REPLIED" | "ARCHIVED";

export type MessageCardData = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  subject: string | null;
  message: string;
  status: Status;
  source: string | null;
  createdAt: string; // ISO
};

const STATUS_BADGE: Record<Status, string> = {
  NEW: "bg-gold/20 text-gold-foreground border border-gold/30 dark:text-gold",
  READ: "bg-muted text-foreground border border-border",
  REPLIED: "bg-primary/12 text-primary border border-primary/20",
  ARCHIVED: "bg-secondary text-muted-foreground border border-border",
};

export function MessageCard({ message }: { message: MessageCardData }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const created = new Date(message.createdAt);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function changeStatus(next: Status) {
    setBusy(next);
    try {
      await updateMessageStatus({ id: message.id, status: next });
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Could not update status.");
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    if (!confirm(`Delete the message from ${message.name}?`)) return;
    setBusy("delete");
    try {
      await deleteMessage(message.id);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Could not delete.");
      setBusy(null);
    }
  }

  const waNumber = message.phone?.replace(/[^\d]/g, "") ?? null;

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-soft transition-colors",
        message.status === "NEW"
          ? "border-gold/30 bg-gradient-to-br from-gold/5 to-transparent"
          : "border-border",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold leading-tight text-foreground">
              {message.name}
            </h3>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                STATUS_BADGE[message.status],
              )}
            >
              {message.status.toLowerCase()}
            </span>
            {message.source && message.source !== "landing" ? (
              <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {message.source}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {message.phone ? (
              <a
                href={`tel:${message.phone}`}
                className="inline-flex items-center gap-1.5 hover:text-primary"
                dir="ltr"
              >
                <Phone className="h-3 w-3" />
                {message.phone}
              </a>
            ) : null}
            {message.email ? (
              <a
                href={`mailto:${message.email}`}
                className="inline-flex items-center gap-1.5 hover:text-primary"
              >
                <Mail className="h-3 w-3" />
                {message.email}
              </a>
            ) : null}
            <span>{fmt.format(created)}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {waNumber ? (
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                `As-salamu alaykum ${message.name}, this is Al-Shifa Hijama Center responding to your message.`,
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              title="Reply on WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          ) : null}
        </div>
      </header>

      <p className="mt-4 whitespace-pre-line rounded-xl border border-border/70 bg-background p-4 text-sm leading-relaxed text-foreground">
        {message.message}
      </p>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <div className="flex flex-wrap items-center gap-1">
          {message.status === "NEW" ? (
            <ActionBtn
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              label="Mark read"
              onClick={() => changeStatus("READ")}
              busy={busy === "READ"}
            />
          ) : null}
          {message.status !== "REPLIED" ? (
            <ActionBtn
              icon={<Reply className="h-3.5 w-3.5" />}
              label="Mark replied"
              onClick={() => changeStatus("REPLIED")}
              busy={busy === "REPLIED"}
              variant="primary"
            />
          ) : null}
          {message.status !== "ARCHIVED" ? (
            <ActionBtn
              icon={<Archive className="h-3.5 w-3.5" />}
              label="Archive"
              onClick={() => changeStatus("ARCHIVED")}
              busy={busy === "ARCHIVED"}
            />
          ) : (
            <ActionBtn
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              label="Restore"
              onClick={() => changeStatus("READ")}
              busy={busy === "READ"}
            />
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy !== null}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </footer>
    </article>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  busy,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  busy: boolean;
  variant?: "default" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors disabled:opacity-50",
        variant === "primary"
          ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
          : "border-border bg-background text-foreground hover:border-primary/30 hover:text-primary",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
