import "server-only";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

marked.setOptions({
  gfm: true,
  breaks: false,
});

export async function renderMarkdown(md: string): Promise<string> {
  const raw = await marked.parse(md ?? "");
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ["target", "rel"],
  });
}

export function computeReadingMinutes(md: string): number {
  const words = (md ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function deriveExcerpt(md: string, max = 180): string {
  const plain = (md ?? "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}
