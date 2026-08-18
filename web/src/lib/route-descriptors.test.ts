import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchRoutes } from "react-router-dom";
import catalogData from "../data/catalog.json" with { type: "json" };
import { buildDocumentMetadata } from "./document-meta.ts";
import {
  CLIENT_DETAIL_ROUTE_PATTERNS,
  canonicalSlashNavigation,
  clientRouteManifestFromDescriptors,
  clientRoutePatternMatchesPath,
  clientRouteRegistrationsFromManifest,
  indexableRouteDescriptors,
  normalizeRouteText,
  routeDescriptorsFromCatalog
} from "./route-descriptors.js";

describe("shared route descriptors", () => {
  const descriptors = routeDescriptorsFromCatalog(catalogData);

  it("truncates route text without splitting Unicode code points", () => {
    const value = normalizeRouteText(`${"a".repeat(153)}😀xy`, "fallback", 155);
    assert.equal(value, `${"a".repeat(153)}😀…`);
    assert.doesNotThrow(() => encodeURIComponent(value));
  });

  it("binds every live descriptor into the same manifest consumed by App", () => {
    const manifest = clientRouteManifestFromDescriptors(descriptors);
    assert.deepEqual(
      manifest.descriptorPaths,
      descriptors.map((descriptor) => descriptor.path)
    );
    assert.deepEqual(
      manifest.staticPages.map(({ pageType, canonicalPath }) => ({
        pageType,
        canonicalPath
      })),
      [
        { pageType: "home", canonicalPath: "/" },
        { pageType: "explore", canonicalPath: "/explore/" },
        { pageType: "recipes-index", canonicalPath: "/recipes/" },
        { pageType: "patterns-index", canonicalPath: "/patterns/" }
      ]
    );
    assert.deepEqual(
      manifest.detailPages.map(({ pageType, canonicalPattern, descriptorPaths }) => ({
        pageType,
        canonicalPattern,
        descriptorCount: descriptorPaths.length
      })),
      [
        {
          pageType: "recipe",
          canonicalPattern: CLIENT_DETAIL_ROUTE_PATTERNS.recipe,
          descriptorCount: 48
        },
        {
          pageType: "pattern",
          canonicalPattern: CLIENT_DETAIL_ROUTE_PATTERNS.pattern,
          descriptorCount: 43
        }
      ]
    );
    for (const binding of manifest.detailPages) {
      for (const path of binding.descriptorPaths) {
        assert.ok(clientRoutePatternMatchesPath(binding.canonicalPattern, path), path);
      }
    }
    assert.deepEqual(
      manifest.redirects.map(({ canonicalPath, redirectTo }) => ({
        canonicalPath,
        redirectTo
      })),
      [
        {
          canonicalPath: "/sources/",
          redirectTo: "/explore/?scope=sources"
        },
        {
          canonicalPath: "/research/",
          redirectTo: "/explore/"
        }
      ]
    );
    assert.equal(
      clientRoutePatternMatchesPath(CLIENT_DETAIL_ROUTE_PATTERNS.recipe, "/patterns/panel-review/"),
      false
    );
  });

  it("uses one real router registration and normalizes only the matched slashless location", () => {
    const registrations = clientRouteRegistrationsFromManifest(
      clientRouteManifestFromDescriptors(descriptors)
    );
    assert.deepEqual(
      registrations.map(({ path }) => path),
      [
        "/",
        "/explore/",
        "/recipes/",
        "/patterns/",
        "/recipes/:slug/",
        "/patterns/:slug/",
        "/sources/",
        "/research/"
      ]
    );
    const routerRoutes = registrations.map((registration, index) => ({
      id: String(index),
      path: registration.path,
      handle: registration
    }));
    const matchRegistration = (pathname: string) => {
      const match = matchRoutes(routerRoutes, pathname)?.at(-1);
      assert.ok(match, `no React Router match for ${pathname}`);
      return match.route.handle;
    };

    for (const [slashless, canonical] of [
      ["/recipes", "/recipes/"],
      ["/patterns", "/patterns/"],
      ["/explore", "/explore/"],
      ["/recipes/source-grounded-answer", "/recipes/source-grounded-answer/"]
    ]) {
      const slashlessRegistration = matchRegistration(slashless);
      const canonicalRegistration = matchRegistration(canonical);
      assert.equal(slashlessRegistration, canonicalRegistration);
      assert.notEqual(slashlessRegistration.kind, "redirect");
      assert.deepEqual(
        canonicalSlashNavigation({ pathname: slashless, search: "?view=all", hash: "#result" }),
        { pathname: canonical, search: "?view=all", hash: "#result" }
      );
      assert.equal(canonicalSlashNavigation({ pathname: canonical }), null);
    }

    for (const [path, redirectTo] of [
      ["/sources", "/explore/?scope=sources"],
      ["/sources/", "/explore/?scope=sources"],
      ["/research", "/explore/"],
      ["/research/", "/explore/"]
    ]) {
      const registration = matchRegistration(path);
      assert.equal(registration.kind, "redirect");
      assert.equal(registration.redirectTo, redirectTo);
      assert.equal(registration.normalizeTrailingSlash, false);
    }
  });

  it("fails closed when a descriptor is not covered by its registered pattern", () => {
    const recipe = descriptors.find((descriptor) => descriptor.pageType === "recipe");
    assert.ok(recipe);
    assert.throws(
      () =>
        clientRouteManifestFromDescriptors([
          ...descriptors.filter((descriptor) => descriptor !== recipe),
          { ...recipe, path: `/unregistered/${recipe.slug}/` }
        ]),
      /No client route binding covers descriptor/
    );
  });

  it("feeds every live descriptor into the same client metadata builder losslessly", () => {
    for (const descriptor of indexableRouteDescriptors(descriptors)) {
      const metadata = buildDocumentMetadata({
        title: descriptor.title,
        description: descriptor.description,
        pathname: descriptor.path,
        canonicalPath: descriptor.path,
        indexable: descriptor.indexable,
        baseUrl: "https://docs.example.com/"
      });
      const expectedTitle =
        descriptor.title === "prompts" ? "prompts" : `${descriptor.title} · prompts`;
      assert.equal(metadata.title, expectedTitle, descriptor.path);
      assert.equal(metadata.description, descriptor.description, descriptor.path);
      assert.equal(metadata.canonicalUrl, `https://docs.example.com${descriptor.path}`);
      assert.match(metadata.robots, /^index,follow/);
    }
  });
});
