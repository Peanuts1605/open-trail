import assert from "node:assert/strict";
import test from "node:test";

import { apiUrl, buildTrail, evidenceMarkdown, normalizeProjectId } from "../open-trail-core.js";

const project = {
  id: "project::demo",
  acronym: "DEMO",
  code: "123",
  title: "Demo project",
  startDate: "2020-01-01",
  endDate: "2022-01-01",
  funding: { funder: { name: "Example funder" } }
};

const summary = {
  header: { numFound: 3, totalCitationsCount: 9, countsByType: { publication: 1, dataset: 1, software: 1 } },
  results: [
    { id: "record-1", mainTitle: "Publication", type: "publication", publicationDate: "2021-01-01" },
    { id: "record-2", mainTitle: "Dataset", type: "dataset", publicationDate: "2021-02-01" }
  ]
};

test("apiUrl keeps the Graph V3 base and encodes query parameters", () => {
  const url = new URL(apiUrl("research-products", { relProjectId: "project::demo", pageSize: 8 }));
  assert.equal(url.origin, "https://api.openaire.eu");
  assert.equal(url.pathname, "/graph/v3/research-products");
  assert.equal(url.searchParams.get("relProjectId"), "project::demo");
});

test("normalizeProjectId rejects a missing project ID", () => {
  assert.throws(() => normalizeProjectId("  "), /Enter an OpenAIRE project ID/);
});

test("buildTrail preserves type counts and never manufactures inference", () => {
  const trail = buildTrail({ project, summary, retrievedAt: "2026-07-21T00:00:00.000Z" });
  assert.equal(trail.totals.outputs, 3);
  assert.equal(trail.totals.counts.dataset, 1);
  assert.equal(trail.outputs.length, 2);
  assert.match(trail.review.next, /Inspect linked datasets and software records/);
  const packet = evidenceMarkdown(trail);
  assert.match(packet, /Inferred: none/);
  assert.match(packet, /Observed output count: 3/);
  assert.match(packet, /Human review next/);
});
