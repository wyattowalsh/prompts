import { useEffect } from "react";
import {
  DEFAULT_TITLE,
  formatDocumentTitle,
  truncateMetaDescription
} from "../lib/document-meta";

/**
 * Sets document.title (and optional meta description) for SPA routes.
 * SEO shells remain truthful static emit; this is client baseline polish only.
 */
export function useDocumentMeta(title: string, description?: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = formatDocumentTitle(title.trim() || DEFAULT_TITLE);

    let meta: HTMLMetaElement | null = null;
    let previousContent: string | null = null;
    if (description) {
      meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      previousContent = meta.getAttribute("content");
      meta.setAttribute("content", truncateMetaDescription(description));
    }

    return () => {
      document.title = previous;
      if (meta && previousContent !== null) {
        meta.setAttribute("content", previousContent);
      }
    };
  }, [title, description]);
}
