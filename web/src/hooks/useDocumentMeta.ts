import { createContext, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { buildDocumentMetadata, normalizeSiteBaseUrl } from "../lib/document-meta";
import type { PageRouteDescriptor } from "../lib/route-descriptors.js";

export interface DocumentMetaOptions {
  /** False emits noindex,nofollow for client-rendered absence/error views. */
  indexable?: boolean;
  /** Override the current path, or pass null to remove canonical/URL metadata. */
  canonicalPath?: string | null;
}

/** Known-route metadata inherited by lazy page components. */
export const DocumentMetaRouteContext = createContext<PageRouteDescriptor | null>(null);

function uniqueHeadElement<T extends Element>(selector: string, create: () => T): T {
  const matches = Array.from(document.head.querySelectorAll<T>(selector));
  const element = matches.shift() ?? create();
  for (const duplicate of matches) duplicate.remove();
  if (!element.isConnected) document.head.appendChild(element);
  return element;
}

function setMetaByName(name: string, content: string) {
  const meta = uniqueHeadElement<HTMLMetaElement>(`meta[name="${name}"]`, () =>
    document.createElement("meta")
  );
  meta.setAttribute("name", name);
  meta.setAttribute("content", content);
}

function setMetaByProperty(property: string, content: string) {
  const meta = uniqueHeadElement<HTMLMetaElement>(`meta[property="${property}"]`, () =>
    document.createElement("meta")
  );
  meta.setAttribute("property", property);
  meta.setAttribute("content", content);
}

function removeHeadElements(selector: string) {
  for (const element of document.head.querySelectorAll(selector)) element.remove();
}

function siteBaseUrlForDocument() {
  const declared = document.documentElement.dataset.siteBaseUrl;
  if (declared) {
    try {
      return normalizeSiteBaseUrl(declared);
    } catch {
      // A malformed build stamp must not produce a cross-origin or invalid canonical.
    }
  }
  return `${window.location.origin}/`;
}

/** Apply route metadata without stale unmount cleanup or duplicate head elements. */
export function useDocumentMeta(
  titleOrDescriptor: string | PageRouteDescriptor,
  description?: string,
  options: DocumentMetaOptions = {}
) {
  const { pathname } = useLocation();
  const inheritedDescriptor = useContext(DocumentMetaRouteContext);
  const explicitDescriptor = typeof titleOrDescriptor === "string" ? null : titleOrDescriptor;
  const descriptor = explicitDescriptor ?? inheritedDescriptor;
  const title = descriptor?.title ?? String(titleOrDescriptor);
  const resolvedDescription = descriptor?.description ?? description;
  const indexable = descriptor?.indexable ?? options.indexable ?? true;
  const canonicalPath = descriptor?.path ?? options.canonicalPath;

  useEffect(() => {
    const metadata = buildDocumentMetadata({
      title,
      description: resolvedDescription,
      pathname,
      baseUrl: siteBaseUrlForDocument(),
      indexable,
      canonicalPath
    });

    document.title = metadata.title;
    setMetaByName("description", metadata.description);
    setMetaByName("robots", metadata.robots);
    setMetaByProperty("og:title", metadata.title);
    setMetaByProperty("og:description", metadata.description);
    setMetaByProperty("og:image", metadata.socialImageUrl);
    setMetaByProperty("og:image:alt", metadata.socialImageAlt);
    setMetaByName("twitter:title", metadata.title);
    setMetaByName("twitter:description", metadata.description);
    setMetaByName("twitter:image", metadata.socialImageUrl);
    setMetaByName("twitter:image:alt", metadata.socialImageAlt);

    if (metadata.canonicalUrl) {
      const canonical = uniqueHeadElement<HTMLLinkElement>('link[rel="canonical"]', () =>
        document.createElement("link")
      );
      canonical.setAttribute("rel", "canonical");
      canonical.setAttribute("href", metadata.canonicalUrl);
      setMetaByProperty("og:url", metadata.canonicalUrl);
    } else {
      removeHeadElements('link[rel="canonical"]');
      removeHeadElements('meta[property="og:url"]');
    }
  }, [canonicalPath, indexable, pathname, resolvedDescription, title]);
}
