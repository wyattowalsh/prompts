import { LANE_KEYS } from "./schema.js";

const PLACEHOLDER_IN_PROMPT = /\{([a-z][a-z0-9_]*)\}/g;

/**
 * @param {Awaited<ReturnType<import("./load.js").loadCatalogPackage>>} pkg
 * @param {{ expectFullCounts?: boolean }} [opts]
 */
export function validateCatalogPackage(pkg, opts = {}) {
  const errors = [];
  const { index, prompts = [] } = pkg;
  const expectFull = opts.expectFullCounts === true;

  const promptBySlug = new Map();
  const promptLogoOwners = new Map();
  const promptTitleOwners = new Map();
  for (const prompt of prompts) {
    if (promptBySlug.has(prompt.slug)) {
      errors.push({ code: "DUPLICATE_SLUG", message: `Duplicate prompt slug ${prompt.slug}` });
    }
    promptBySlug.set(prompt.slug, prompt);
    const logoOwners = promptLogoOwners.get(prompt.badge?.logo) ?? [];
    logoOwners.push(prompt.slug);
    promptLogoOwners.set(prompt.badge?.logo, logoOwners);
    const titleOwners = promptTitleOwners.get(prompt.title) ?? [];
    titleOwners.push(prompt.slug);
    promptTitleOwners.set(prompt.title, titleOwners);
  }

  for (const [logo, owners] of promptLogoOwners) {
    if (logo && owners.length > 1) {
      errors.push({
        code: "DUPLICATE_PROMPT_BADGE_LOGO",
        message: `prompt badge logo ${logo} is shared by: ${owners.join(", ")}`
      });
    }
  }
  for (const [title, owners] of promptTitleOwners) {
    if (owners.length > 1) {
      errors.push({
        code: "DUPLICATE_PROMPT_TITLE",
        message: `prompt title ${JSON.stringify(title)} is shared by: ${owners.join(", ")}`
      });
    }
  }

  if (index.counts?.prompts != null && index.counts.prompts !== prompts.length) {
    errors.push({
      code: "COUNTS_MISMATCH",
      message: `index.counts.prompts=${index.counts.prompts} but loaded ${prompts.length}`
    });
  }

  if (expectFull) {
    if (index.counts?.prompts == null) {
      errors.push({
        code: "PROMPT_COUNT",
        message: "Full catalog index is missing counts.prompts"
      });
    } else if (index.counts.prompts !== prompts.length) {
      errors.push({
        code: "PROMPT_COUNT",
        message: `Expected ${index.counts.prompts} prompts, found ${prompts.length}`
      });
    }

    const presentLaneKeys = new Set((index.lanes ?? []).map((lane) => lane.key));
    const missingLaneKeys = LANE_KEYS.filter((key) => !presentLaneKeys.has(key));
    if (missingLaneKeys.length > 0) {
      errors.push({
        code: "INDEX_MISSING_LANE_KEYS",
        message: `Full catalog index is missing lane keys: ${missingLaneKeys.join(", ")}`
      });
    }
  }

  const indexPromptSlugs = (index.lanes ?? []).flatMap((lane) => lane.prompt_slugs ?? []);

  const laneKeys = new Set();
  const duplicateLaneKeys = new Set();
  for (const lane of index.lanes ?? []) {
    if (!LANE_KEYS.includes(lane.key)) {
      errors.push({
        code: "INDEX_INVALID_LANE_KEY",
        message: `index.lanes contains unsupported key ${lane.key}`
      });
    }
    if (laneKeys.has(lane.key)) duplicateLaneKeys.add(lane.key);
    laneKeys.add(lane.key);
  }
  for (const key of duplicateLaneKeys) {
    errors.push({
      code: "INDEX_DUPLICATE_LANE_KEY",
      message: `index.lanes contains duplicate key ${key}`
    });
  }

  const promptIndexOwners = new Map();
  for (const lane of index.lanes ?? []) {
    for (const slug of lane.prompt_slugs ?? []) {
      const owners = promptIndexOwners.get(slug) ?? [];
      owners.push(lane.key);
      promptIndexOwners.set(slug, owners);
    }
  }
  for (const [slug, owners] of promptIndexOwners) {
    if (owners.length > 1) {
      errors.push({
        code: "INDEX_DUPLICATE_PROMPT",
        message: `prompt ${slug} listed multiple times in index.lanes: ${owners.join(", ")}`
      });
    }
  }

  for (const lane of index.lanes ?? []) {
    const members = new Set(lane.prompt_slugs ?? []);
    for (const slug of lane.featured_prompt_slugs ?? []) {
      if (!members.has(slug)) {
        errors.push({
          code: "INDEX_FEATURED_PROMPT_NOT_IN_LANE",
          message: `featured prompt ${slug} is not listed in index lane ${lane.key}`
        });
      }
    }
  }

  const shortcutOwners = new Map();
  for (const shortcut of index.readme?.shortcuts ?? []) {
    const owners = shortcutOwners.get(shortcut.prompt_slug) ?? [];
    owners.push(shortcut.label);
    shortcutOwners.set(shortcut.prompt_slug, owners);
    if (!promptBySlug.has(shortcut.prompt_slug)) {
      errors.push({
        code: "README_SHORTCUT_MISSING_PROMPT",
        message: `README shortcut references missing prompt ${shortcut.prompt_slug}`
      });
    }
  }
  for (const [slug, labels] of shortcutOwners) {
    if (labels.length > 1) {
      errors.push({
        code: "README_DUPLICATE_SHORTCUT",
        message: `README shortcut prompt ${slug} is listed multiple times`
      });
    }
  }

  for (const slug of indexPromptSlugs) {
    if (!promptBySlug.has(slug)) {
      errors.push({
        code: "INDEX_MISSING_PROMPT",
        message: `index references missing prompt ${slug}`
      });
    }
  }
  for (const slug of promptBySlug.keys()) {
    if (!indexPromptSlugs.includes(slug)) {
      errors.push({
        code: "INDEX_ORPHAN_PROMPT",
        message: `prompt ${slug} not listed in index.lanes`
      });
    }
  }

  for (const prompt of prompts) {
    const relatedSeen = new Set();
    for (const relatedSlug of prompt.related ?? []) {
      if (relatedSlug === prompt.slug) {
        errors.push({
          code: "RELATED_SELF",
          message: `prompt ${prompt.slug}: related lists its own slug`,
          prompt: prompt.slug
        });
      } else if (!promptBySlug.has(relatedSlug)) {
        errors.push({
          code: "RELATED_MISSING",
          message: `prompt ${prompt.slug}: related references missing prompt ${relatedSlug}`,
          prompt: prompt.slug
        });
      }
      if (relatedSeen.has(relatedSlug)) {
        errors.push({
          code: "RELATED_DUPLICATE",
          message: `prompt ${prompt.slug}: related lists ${relatedSlug} more than once`,
          prompt: prompt.slug
        });
      }
      relatedSeen.add(relatedSlug);
    }

    const modeIds = new Set();
    let defaultCount = 0;
    for (const mode of prompt.modes ?? []) {
      if (modeIds.has(mode.id)) {
        errors.push({
          code: "DUPLICATE_MODE_ID",
          message: `prompt ${prompt.slug}: mode id ${mode.id} is declared multiple times`,
          prompt: prompt.slug
        });
      }
      modeIds.add(mode.id);
      if (mode.default) defaultCount += 1;

      const hasPrompt = Boolean(mode.prompt?.trim());
      const hasOmissionReason = Boolean(mode.template_omission_reason?.trim());
      if (hasPrompt === hasOmissionReason) {
        errors.push({
          code: "MODE_TEMPLATE_CONTRACT",
          message: `prompt ${prompt.slug} mode ${mode.id}: exactly one non-empty prompt or template_omission_reason is required`,
          prompt: prompt.slug,
          mode: mode.id
        });
      }

      const placeholderNames = new Set();
      for (const placeholder of mode.placeholders ?? []) {
        if (placeholderNames.has(placeholder.name)) {
          errors.push({
            code: "DUPLICATE_PLACEHOLDER",
            message: `prompt ${prompt.slug} mode ${mode.id}: placeholder {${placeholder.name}} is declared multiple times`,
            prompt: prompt.slug,
            mode: mode.id
          });
        }
        placeholderNames.add(placeholder.name);
      }

      if (hasPrompt) {
        const declared = new Set((mode.placeholders ?? []).map((item) => item.name));
        const used = new Set();
        for (const match of mode.prompt.matchAll(PLACEHOLDER_IN_PROMPT)) {
          used.add(match[1]);
        }
        for (const name of used) {
          if (!declared.has(name)) {
            errors.push({
              code: "UNDECLARED_PLACEHOLDER",
              message: `prompt ${prompt.slug} mode ${mode.id}: prompt uses {${name}} not in placeholders`,
              prompt: prompt.slug,
              mode: mode.id
            });
          }
        }
        for (const name of declared) {
          if (!used.has(name)) {
            errors.push({
              code: "UNUSED_PLACEHOLDER",
              message: `prompt ${prompt.slug} mode ${mode.id}: placeholder {${name}} unused in prompt`,
              prompt: prompt.slug,
              mode: mode.id
            });
          }
        }
      }
    }

    const modeCount = prompt.modes?.length ?? 0;
    if (modeCount < 1 || modeCount > 4) {
      errors.push({
        code: "MODE_COUNT",
        message: `prompt ${prompt.slug}: expected 1–4 modes, found ${modeCount}`,
        prompt: prompt.slug
      });
    }
    if (defaultCount !== 1) {
      errors.push({
        code: "MODE_DEFAULT_COUNT",
        message: `prompt ${prompt.slug}: expected exactly one default mode, found ${defaultCount}`,
        prompt: prompt.slug
      });
    }

    const lane = promptIndexOwners.get(prompt.slug)?.[0];
    if (lane && lane !== prompt.lane) {
      errors.push({
        code: "LANE_MISMATCH",
        message: `prompt ${prompt.slug}: lane ${prompt.lane} != index lane ${lane}`,
        prompt: prompt.slug
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    summary: {
      prompts: prompts.length
    }
  };
}
