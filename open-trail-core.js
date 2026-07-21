export const API_BASE = "https://api.openaire.eu/graph/v3";
export const DEFAULT_PROJECT_ID =
  "corda__h2020::615acafe6400aeb49d72df60d04d6feb";

const OUTPUT_TYPES = ["publication", "dataset", "software", "other"];

export function apiUrl(path, parameters = {}) {
  const url = new URL(`${API_BASE}/${path}`);
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function normalizeProjectId(value) {
  const projectId = String(value || "").trim();
  if (!projectId) {
    throw new Error("Enter an OpenAIRE project ID.");
  }
  if (projectId.length > 240) {
    throw new Error("That project ID is too long to query safely.");
  }
  return projectId;
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function firstUrl(record) {
  for (const instance of list(record.instances)) {
    const url = list(instance.urls).find(Boolean);
    if (url) return url;
  }
  return apiUrl(`research-products/${encodeURIComponent(record.id)}`);
}

function asOutput(record) {
  return {
    id: record.id,
    title: record.mainTitle || "Untitled research output",
    type: OUTPUT_TYPES.includes(record.type) ? record.type : "other",
    date: record.publicationDate || "Date unavailable",
    source: firstUrl(record),
    collection: list(record.collectedFrom)
      .map((item) => item.value)
      .filter(Boolean)
      .join(", ") || "Collection provenance unavailable"
  };
}

export function buildTrail({ project, summary, typedResponses = {}, retrievedAt }) {
  if (!project || !summary?.header) {
    throw new Error("OpenAIRE returned an incomplete trail response.");
  }

  const projectId = normalizeProjectId(project.id);
  const header = summary.header;
  const counts = Object.fromEntries(
    OUTPUT_TYPES.map((type) => [type, Number(header.countsByType?.[type] || 0)])
  );
  const deduped = new Map();
  for (const response of [summary, ...Object.values(typedResponses)]) {
    for (const record of list(response?.results)) {
      if (record?.id && !deduped.has(record.id)) {
        deduped.set(record.id, asOutput(record));
      }
    }
  }

  return {
    retrievedAt: retrievedAt || new Date().toISOString(),
    project: {
      id: projectId,
      title: project.title || project.acronym || projectId,
      acronym: project.acronym || "No acronym",
      code: project.code || "No project code",
      dates: [project.startDate, project.endDate].filter(Boolean).join(" to ") || "Dates unavailable",
      funder: project.funding?.funder?.name || project.fundings?.[0]?.name || "Funder unavailable",
      summary: project.summary || "Project summary unavailable",
      source: apiUrl(`projects/${encodeURIComponent(projectId)}`)
    },
    totals: {
      outputs: Number(header.numFound || 0),
      citations: Number(header.totalCitationsCount || 0),
      counts
    },
    sources: {
      project: apiUrl(`projects/${encodeURIComponent(projectId)}`),
      outputs: apiUrl("research-products", {
        relProjectId: projectId,
        includeStats: "true",
        pageSize: 8
      })
    },
    outputs: [...deduped.values()].sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title))
  };
}

export function evidenceMarkdown(trail) {
  const lines = [
    "# Open Trail evidence packet",
    "",
    `- Retrieved: ${trail.retrievedAt}`,
    `- Project: ${trail.project.title} (${trail.project.id})`,
    `- Observed output count: ${trail.totals.outputs}`,
    `- Counts by type: ${OUTPUT_TYPES.map((type) => `${type}=${trail.totals.counts[type]}`).join(", ")}`,
    "",
    "## Source requests",
    `- Project: ${trail.sources.project}`,
    `- Linked outputs: ${trail.sources.outputs}`,
    "",
    "## Evidence boundary",
    "- Observed: project and output records returned by OpenAIRE Graph V3.",
    "- Connected: outputs returned by the relProjectId relationship filter.",
    "- Inferred: none. Open Trail does not make an impact or causal claim from this retrieval.",
    "",
    "## Sample outputs"
  ];
  for (const output of trail.outputs.slice(0, 12)) {
    lines.push(`- [${output.type}] ${output.title} (${output.date}) - ${output.source}`);
  }
  return lines.join("\n");
}
