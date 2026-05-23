"use client";

import * as React from "react";
import { Link as LinkIcon, MessageCircle, Twitter, Check } from "lucide-react";

export function PostShare({
  url,
  title,
  label,
  copyLabel,
  copiedLabel,
}: {
  url: string;
  title: string;
  label: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const waText = encodeURIComponent(`${title}\n${url}`);
  const xText = encodeURIComponent(title);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — clipboard might be unavailable
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <a
        href={`https://wa.me/?text=${waText}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
        aria-label="WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${xText}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
        aria-label="X / Twitter"
      >
        <Twitter className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" /> {copiedLabel}
          </>
        ) : (
          <>
            <LinkIcon className="h-3.5 w-3.5" /> {copyLabel}
          </>
        )}
      </button>
    </div>
  );
}
