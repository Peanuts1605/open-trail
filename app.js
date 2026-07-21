import {
  DEFAULT_PROJECT_ID,
  apiUrl,
  buildTrail,
  evidenceMarkdown,
  normalizeProjectId
} from "./open-trail-core.js";

const elements = {
  form: document.querySelector("#trail-form"),
  input: document.querySelector("#project-id"),
  run: document.querySelector("#run-trail"),
  sample: document.querySelector("#load-sample"),
  status: document.querySelector("#status"),
  empty: document.querySelector("#empty-state"),
  workspace: document.querySelector("#workspace"),
  error: document.querySelector("#error-state"),
  project: document.querySelector("#project-panel"),
  counts: document.querySelector("#count-grid"),
  review: document.querySelector("#review-brief"),
  outputs: document.querySelector("#output-list"),
  request: document.querySelector("#request-url"),
  export: document.querySelector("#export-evidence")
};

let currentTrail = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setStatus(message, tone = "neutral") {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function setLoading(loading) {
  elements.run.disabled = loading;
  elements.sample.disabled = loading;
  elements.run.textContent = loading ? "Tracing..." : "Run trail";
}

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`OpenAIRE returned ${response.status} for this request.`);
  }
  return response.json();
}

async function retrieveTrail(projectId) {
  const summaryUrl = apiUrl("research-products", {
    relProjectId: projectId,
    includeStats: "true",
    pageSize: 8
  });
  const [project, summary, datasets, software] = await Promise.all([
    getJson(apiUrl(`projects/${encodeURIComponent(projectId)}`)),
    getJson(summaryUrl),
    getJson(apiUrl("research-products", { relProjectId: projectId, type: "dataset", pageSize: 4 })),
    getJson(apiUrl("research-products", { relProjectId: projectId, type: "software", pageSize: 4 }))
  ]);
  return buildTrail({
    project,
    summary,
    typedResponses: { datasets, software },
    retrievedAt: new Date().toISOString()
  });
}

function renderProject(trail) {
  const project = trail.project;
  elements.project.innerHTML = `
    <div>
      <p class="eyebrow">Observed project</p>
      <h1>${escapeHtml(project.title)}</h1>
      <p class="project-summary">${escapeHtml(project.summary)}</p>
    </div>
    <dl class="project-meta">
      <div><dt>Project</dt><dd>${escapeHtml(project.acronym)} / ${escapeHtml(project.code)}</dd></div>
      <div><dt>Dates</dt><dd>${escapeHtml(project.dates)}</dd></div>
      <div><dt>Funder</dt><dd>${escapeHtml(project.funder)}</dd></div>
      <div><dt>Source</dt><dd><a href="${escapeHtml(project.source)}" target="_blank" rel="noreferrer">Open Graph record</a></dd></div>
    </dl>
  `;
}

function renderCounts(trail) {
  const rows = [
    ["Linked outputs", trail.totals.outputs, "Returned by the project relationship"],
    ["Publications", trail.totals.counts.publication, "Observed output type"],
    ["Datasets", trail.totals.counts.dataset, "Observed output type"],
    ["Software", trail.totals.counts.software, "Observed output type"]
  ];
  elements.counts.innerHTML = rows.map(([label, value, detail], index) => `
    <article class="metric metric-${index}">
      <p>${escapeHtml(label)}</p>
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(detail)}</span>
    </article>
  `).join("");
}

function renderReview(trail) {
  const review = trail.review;
  elements.review.innerHTML = `
    <div>
      <p class="eyebrow">${escapeHtml(review.title)}</p>
      <h2>Choose the next check from what the Graph actually returned.</h2>
    </div>
    <p>${escapeHtml(review.summary)}</p>
    <div class="review-next"><strong>Next</strong><span>${escapeHtml(review.next)}</span></div>
    <p class="review-boundary">${escapeHtml(review.boundary)}</p>
  `;
}

function renderOutputs(trail) {
  if (!trail.outputs.length) {
    elements.outputs.innerHTML = "<p class=\"muted\">No output records were returned for this project.</p>";
    return;
  }
  elements.outputs.innerHTML = trail.outputs.map((output) => `
    <article class="output-row">
      <div class="output-type type-${escapeHtml(output.type)}">${escapeHtml(output.type)}</div>
      <div class="output-copy">
        <h3>${escapeHtml(output.title)}</h3>
        <p>${escapeHtml(output.date)} | ${escapeHtml(output.collection)}</p>
      </div>
      <a class="record-link" href="${escapeHtml(output.source)}" target="_blank" rel="noreferrer">Record</a>
    </article>
  `).join("");
}

function renderTrail(trail) {
  currentTrail = trail;
  renderProject(trail);
  renderCounts(trail);
  renderReview(trail);
  renderOutputs(trail);
  elements.request.href = trail.sources.outputs;
  elements.request.textContent = "Open source request";
  elements.empty.hidden = true;
  elements.error.hidden = true;
  elements.workspace.hidden = false;
  setStatus(`Retrieved ${trail.totals.outputs} linked outputs from OpenAIRE Graph V3.`, "success");
}

async function runTrail(value) {
  let projectId;
  try {
    projectId = normalizeProjectId(value);
  } catch (error) {
    elements.error.textContent = error.message;
    elements.error.hidden = false;
    setStatus("A project ID is needed before a trail can run.", "error");
    return;
  }

  setLoading(true);
  setStatus("Retrieving source records from OpenAIRE Graph V3...", "loading");
  try {
    const trail = await retrieveTrail(projectId);
    renderTrail(trail);
  } catch (error) {
    currentTrail = null;
    elements.workspace.hidden = true;
    elements.error.textContent = `${error.message} No claim was generated from unavailable source data.`;
    elements.error.hidden = false;
    setStatus("The source trail could not be retrieved.", "error");
  } finally {
    setLoading(false);
  }
}

function downloadEvidence() {
  if (!currentTrail) return;
  const blob = new Blob([evidenceMarkdown(currentTrail)], { type: "text/markdown" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `open-trail-${currentTrail.project.acronym.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}.md`;
  link.click();
  URL.revokeObjectURL(href);
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  runTrail(elements.input.value);
});

elements.sample.addEventListener("click", () => {
  elements.input.value = DEFAULT_PROJECT_ID;
  runTrail(DEFAULT_PROJECT_ID);
});

elements.export.addEventListener("click", downloadEvidence);
elements.input.value = DEFAULT_PROJECT_ID;
runTrail(DEFAULT_PROJECT_ID);
