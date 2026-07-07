import assert from "node:assert/strict";
import { test } from "node:test";
import { formatReport } from "../../scripts/web_analytics_report.mjs";

function unescapedPipeCount(line) {
  let count = 0;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === "|" && line[index - 1] !== "\\") count += 1;
  }
  return count;
}

test("analytics report escapes markdown table cells", () => {
  const report = formatReport({
    days: 7,
    results: {
      totals: { results: [["site_search_performed", 2]] },
      pages: { results: [] },
      searches: {
        results: [
          ["alpha|beta\r\nnext\tcell", 24, 3, 1],
          [null, null, 0, undefined]
        ]
      },
      sections: { results: [] },
      outbound: { results: [] },
      scroll: { results: [] }
    }
  });

  const escapedSearchLine = report.split("\n").find((line) => line.includes("alpha\\|beta"));
  assert.ok(escapedSearchLine);
  assert.match(escapedSearchLine, /\| alpha\\\|beta next cell \| 24 \| 3 \| 1 \|/u);
  assert.equal(unescapedPipeCount(escapedSearchLine), 5);
  assert.doesNotMatch(escapedSearchLine, /[\r\n\t]/u);

  const emptySearchLine = report.split("\n").find((line) => line === "|  |  | 0 |  |");
  assert.ok(emptySearchLine);
  assert.equal(unescapedPipeCount(emptySearchLine), 5);
});
