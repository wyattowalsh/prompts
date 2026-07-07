#!/usr/bin/env node

const DEFAULT_DAYS = 7;
const DEFAULT_HOST = "https://us.posthog.com";
const EVENT_NAMES = [
  "site_page_view",
  "site_search_performed",
  "site_search_result_click",
  "site_section_dwell",
  "site_scroll_depth",
  "site_outbound_click",
  "site_source_click",
  "site_copy_interaction"
];

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function cleanHost(value) {
  return String(value || DEFAULT_HOST).replace(/\/+$/u, "");
}

function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function escapeSqlLiteral(value) {
  return String(value).replaceAll("'", "''");
}

function eventListSql() {
  return EVENT_NAMES.map((name) => `'${escapeSqlLiteral(name)}'`).join(", ");
}

function queries(days) {
  const since = `timestamp >= now() - interval ${days} day`;
  return {
    totals: `
      select event, count() as events
      from events
      where ${since} and event in (${eventListSql()})
      group by event
      order by events desc
    `,
    pages: `
      select properties.page_path as page_path, count() as views
      from events
      where ${since} and event = 'site_page_view'
      group by page_path
      order by views desc
      limit 20
    `,
    searches: `
      select
        coalesce(nullif(properties.search_query, ''), properties.search_query_hash) as query_key,
        any(properties.search_query_length) as query_length,
        count() as searches,
        sum(if(properties.search_zero_results = true, 1, 0)) as zero_result_searches
      from events
      where ${since} and event = 'site_search_performed'
      group by query_key
      order by searches desc
      limit 25
    `,
    sections: `
      select
        properties.section_id as section_id,
        any(properties.section_title) as section_title,
        count() as views,
        round(avg(toFloat(properties.visible_ms))) as avg_visible_ms
      from events
      where ${since} and event = 'site_section_dwell'
      group by section_id
      order by avg_visible_ms desc
      limit 25
    `,
    outbound: `
      select event, properties.target_host as target_host, count() as clicks
      from events
      where ${since} and event in ('site_outbound_click', 'site_source_click')
      group by event, target_host
      order by clicks desc
      limit 25
    `,
    scroll: `
      select properties.scroll_depth_percent as scroll_depth_percent, count() as events
      from events
      where ${since} and event = 'site_scroll_depth'
      group by scroll_depth_percent
      order by toInt(scroll_depth_percent) asc
    `
  };
}

async function runQuery({ host, projectId, token, name, query }) {
  const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: {
        kind: "HogQLQuery",
        query
      },
      name
    })
  });
  if (!response.ok) {
    throw new Error(`PostHog query "${name}" failed with HTTP ${response.status}.`);
  }
  return response.json();
}

function rows(data) {
  return Array.isArray(data?.results) ? data.results : [];
}

function table(headers, tableRows) {
  if (tableRows.length === 0) return "_No matching events._\n";
  const header = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = tableRows.map((row) => `| ${row.map((value) => String(value ?? "")).join(" | ")} |`);
  return [header, divider, ...body, ""].join("\n");
}

function section(title, headers, tableRows) {
  return [`## ${title}`, "", table(headers, tableRows)].join("\n");
}

function formatReport({ days, results }) {
  return [
    `# Web Analytics Report (${days} days)`,
    "",
    section("Event Totals", ["Event", "Count"], rows(results.totals)),
    section("Top Pages", ["Path", "Views"], rows(results.pages)),
    section(
      "Searches",
      ["Query or Hash", "Query Length", "Searches", "Zero Results"],
      rows(results.searches)
    ),
    section(
      "Section Dwell",
      ["Section ID", "Title", "Views", "Avg Visible ms"],
      rows(results.sections)
    ),
    section("Outbound and Source Clicks", ["Event", "Host", "Clicks"], rows(results.outbound)),
    section("Scroll Depth", ["Depth %", "Events"], rows(results.scroll))
  ].join("\n");
}

async function main() {
  const provider = String(
    process.env.WEB_ANALYTICS_PROVIDER || argValue("--provider") || "posthog"
  );
  if (provider !== "posthog") {
    throw new Error("web_analytics_report currently supports PostHog aggregate reports only.");
  }

  const days = positiveInt(
    argValue("--days") || process.env.WEB_ANALYTICS_REPORT_DAYS,
    DEFAULT_DAYS
  );
  const host = cleanHost(
    argValue("--host") || process.env.POSTHOG_HOST || process.env.POSTHOG_APP_HOST
  );
  const projectId = argValue("--project-id") || requiredEnv("POSTHOG_PROJECT_ID");
  const token = requiredEnv("POSTHOG_PERSONAL_API_KEY");
  const queryMap = queries(days);
  const results = {};
  for (const [name, query] of Object.entries(queryMap)) {
    results[name] = await runQuery({ host, projectId, token, name: `prompts web ${name}`, query });
  }
  console.log(formatReport({ days, results }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export { formatReport, queries };
