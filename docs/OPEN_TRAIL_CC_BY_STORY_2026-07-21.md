# Open Trail: research evidence that remains inspectable

**License:** CC BY 4.0  
**Hackathon theme:** Theme C — Analyse (with a reusable Theme B tool surface)

## The question

A program manager has to brief a panel on a funded research project. They need
to answer a basic question quickly: *What traceable research outputs are
connected to this project, and where can the panel inspect them?*

That is not the same as asking whether the project was successful. A pile of
publication links does not prove scientific quality, social impact, or causal
effect. Yet a reviewer still needs a trustworthy starting point before they
can make those separate judgments.

Existing research interfaces often turn this moment into a keyword search,
spreadsheet export, or AI-written summary. The connection between a funded
project and the cited record becomes hard to see. The risk is subtle: a
convenient answer can sound like evidence while hiding its route.

## The approach

Open Trail is a small web app that turns an OpenAIRE project identifier into an
inspectable retrieval trail. It deliberately separates three kinds of claims:

1. **Observed** — the project and output records returned by OpenAIRE Graph V3.
2. **Connected** — outputs returned by Graph V3's `relProjectId` relationship.
3. **Inferred** — none. The app does not transform output totals into an impact
   score, research-quality verdict, or policy conclusion.

The default walkthrough uses the Horizon 2020 project **MARmaED**: *MARine
MAnagement and Ecosystem Dynamics under climate change*. The public Graph V3
response returned 91 linked outputs: 85 publications, 4 datasets, 1 software
record, and 1 other record. Open Trail keeps the request link beside the result
so a reviewer can reach the source API response, then opens individual records
for direct inspection.

## Why this is useful

The product is intentionally not a generic research chatbot. Its primary job
is to make a reviewer’s first evidence step faster and more honest:

- A funder can begin a project-output review without confusing retrieval with
  evaluation.
- A research office can hand a transparent trail to a colleague instead of a
  screenshot with lost provenance.
- A policy team can see where the evidence ends before it writes a narrative.

The most important user experience is the boundary, not the count. The screen
opens with a real project, shows the Graph relationship that created the list,
and states that no causal or impact claim has been generated. If a project ID
is missing, the app presents a visible error and generates no trail.

## Technical method and reproducibility

Open Trail is a static browser app. It sends direct public requests to the
documented OpenAIRE Graph V3 project and research-product endpoints. For a
selected project it fetches the project record, a typed summary of linked
outputs, and small dataset/software slices; it deduplicates only records with
the same Graph ID. No credentials, private source, external storage, or model
generated conclusion is needed for the core trail.

The evidence packet export captures the retrieval time, project ID, source
requests, observed type counts, sample record links, and the same three-part
evidence boundary. The app has unit tests for URL construction, blank project
IDs, type counts, and the no-inference rule. Desktop and 390-pixel mobile
browser replays both retrieved the MARmaED trail without overflow.

The hackathon page describes an OpenAIRE MCP route through Alien AI Gateway.
Open Trail does not claim to use that route. The proposal instead uses the
documented public Graph V3 API directly and is submitted as an app plus a
reproducible methodology: source request in, inspectable records out, no hidden
judgment added.

## What comes next

The next iteration is not a bigger dashboard. It is a focused applied case:
one policy or funding question, its project trail, an explicit human review
step, and a short explanation of what additional evidence would be required
before a conclusion could be made. That keeps the product useful under real
time pressure while preserving the difference between data retrieval and
responsible research interpretation.

