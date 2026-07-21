import assert from "node:assert/strict";
import test from "node:test";

function makeElement() {
  const listeners = new Map();
  return {
    dataset: {},
    disabled: false,
    hidden: false,
    href: "",
    innerHTML: "",
    textContent: "",
    value: "",
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    listener(type) {
      return listeners.get(type);
    }
  };
}

function response(body) {
  return { ok: true, json: async () => body };
}

test("an invalid project ID clears stale evidence and disables its export path", async () => {
  const nodes = Object.fromEntries([
    "#trail-form",
    "#project-id",
    "#run-trail",
    "#load-sample",
    "#status",
    "#empty-state",
    "#workspace",
    "#error-state",
    "#project-panel",
    "#count-grid",
    "#review-brief",
    "#output-list",
    "#request-url",
    "#export-evidence"
  ].map((selector) => [selector, makeElement()]));
  const originalDocument = globalThis.document;
  const originalFetch = globalThis.fetch;
  let downloadLinks = 0;

  globalThis.document = {
    querySelector(selector) {
      return nodes[selector];
    },
    createElement() {
      downloadLinks += 1;
      return { click() {} };
    }
  };
  globalThis.fetch = async (url) => {
    const text = String(url);
    if (text.includes("/projects/")) {
      return response({
        id: "project::demo",
        acronym: "DEMO",
        code: "123",
        title: "Demo project",
        funding: { funder: { name: "Example funder" } }
      });
    }
    return response({
      header: { numFound: 1, countsByType: { publication: 1 } },
      results: [{ id: "record-1", mainTitle: "Output", type: "publication" }]
    });
  };

  try {
    await import(new URL(`../app.js?app-state-test=${Date.now()}`, import.meta.url));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(nodes["#workspace"].hidden, false);

    nodes["#project-id"].value = " ";
    nodes["#trail-form"].listener("submit")({ preventDefault() {} });
    await Promise.resolve();

    assert.equal(nodes["#workspace"].hidden, true);
    assert.equal(nodes["#empty-state"].hidden, false);
    assert.match(nodes["#error-state"].textContent, /Enter an OpenAIRE project ID/);

    nodes["#export-evidence"].listener("click")();
    assert.equal(downloadLinks, 0);
  } finally {
    globalThis.document = originalDocument;
    globalThis.fetch = originalFetch;
  }
});
