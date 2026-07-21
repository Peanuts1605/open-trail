# Open Trail

Open Trail turns a funded-project identifier into an inspectable OpenAIRE Graph
trail: project record, linked output counts, source-bearing example records,
and a clear boundary between what was observed, what was connected by the
Graph, and what was not inferred.

It is a small Theme C / Theme B candidate for the OpenAIRE AI Hackathon. It is
not a generic research chat and it does not claim research impact from output
counts alone.

## Run locally

```bash
npm test
npm run lint
npm run serve
```

Then open `http://127.0.0.1:4178`.

The default official sample is the MARmaED Horizon 2020 project. The browser
retrieves public Graph V3 project and research-product responses directly from
`https://api.openaire.eu/graph/v3`.

## Product boundary

- Observed: API-returned project and research-product records.
- Connected: results returned by `relProjectId`.
- Inferred: none until a human inspects the records and makes a separate claim.

## License

The code is available under the [MIT License](./LICENSE). The contest story is
licensed separately under CC BY 4.0 at
[`docs/OPEN_TRAIL_CC_BY_STORY_2026-07-21.md`](./docs/OPEN_TRAIL_CC_BY_STORY_2026-07-21.md).
