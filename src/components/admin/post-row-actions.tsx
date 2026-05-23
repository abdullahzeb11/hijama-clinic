"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ArchiveRestore, Send } from "lucide-react";
import { deletePost, togglePostStatus } from "@/app/actions/posts";

export function PostRowActions({
  id,
  status,
  title,
}: {
  id: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  title: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<null | "publish" | "archive" | "delete">(
    null,
  );

  async function onToggle(next: "PUBLISHED" | "DRAFT" | "ARCHIVED") {
    setBusy(next === "ARCHIVED" ? "archive" : "publish");
    try {
      await togglePostStatus({ id, status: next });
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Could not update status.");
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy("delete");
    try {
      await deletePost(id);
    } catch (e) {
      console.error(e);
      alert("Could not delete.");
      setBusy(null);
    }
  }

  return (
    <>
      {status === "PUBLISHED" ? (
        <button
          type="button"
          onClick={() => onToggle("ARCHIVED")}
          disabled={busy !== null}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          aria-label="Archive"
          title="Archive"
        >
          <ArchiveRestore className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onToggle("PUBLISHED")}
          disabled={busy !== null}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          aria-label="Publish"
          title="Publish"
        >
          <Send className="h-4 w-4" />
        </button>
      )}
      <Link
        href={`/admin/posts/${id}/edit`}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Edit"
        title="Edit"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy !== null}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
        aria-label="Delete"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </>
  );
}
