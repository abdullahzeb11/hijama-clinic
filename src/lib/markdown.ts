import "server-only";
import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: false,
});

// Minimal sanitizer for admin-authored content.
// Strips script/iframe/style blocks, on* event attributes, and javascript: URLs.
// Posts are written exclusively by authenticated admins, so this is
// defense-in-depth, not a security boundary.
function sanitize(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/(?:href|src)\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
    .replace(/(?:href|src)\s*=\s*'javascript:[^']*'/gi, "href='#'");
}

export async function renderMarkdown(md: string): Promise<string> {
  const raw = await marked.parse(md ?? "");
  return sanitize(raw);
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
