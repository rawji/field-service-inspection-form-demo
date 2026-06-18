# Field Service Portfolio Demos

Two public portfolio demos showing how operational field service requirements become **JSON-driven workflows** — an inspection form and a dispatch triage board.

| Demo | URL | What it shows |
| --- | --- | --- |
| **Inspection form** | [Live demo (root)](https://rawji.github.io/field-service-inspection-form-demo/) | JSON schema → dynamic form, validation, checklist, JSON export |
| **Dispatch triage** (FieldOps Desk) | [Live demo (`/dispatch/`)](https://rawji.github.io/field-service-inspection-form-demo/dispatch/) | JSON routing rules → job queue, triage, assignment, simulation |

---

# Field Service Inspection Form Demo

A small, public portfolio demo that translates operational field service requirements into a working customer-facing inspection form.

## Purpose

This project demonstrates how structured requirements can become a usable form workflow using JSON configuration, semantic HTML, CSS, and vanilla JavaScript — without proprietary systems, backends, or customer data.

## Why This Was Built

I created this demo for a **Jr. Solutions Engineer** application to show that I can:

- Read operational requirements and turn them into structured form behavior
- Document workflows clearly for technical and non-technical reviewers
- Build customer-facing interfaces that are simple, validated, and easy to review
- Work in a GitHub-ready, AI-assisted development workflow

## Role Alignment

This demo maps directly to Jr. Solutions Engineer responsibilities:

| Responsibility | How this demo shows it |
| --- | --- |
| JSON | `form-schema.json` defines fields, types, options, and validation rules |
| HTML | Semantic page structure with accessible labels and form sections |
| CSS | Clean, responsive card layout without external frameworks |
| Custom forms | Inspection workflow with dropdowns, checklist, notes, and priority |
| Requirements → behavior | Schema drives rendering, validation, and submitted data shape |
| Customer-facing forms | Professional layout suitable for field technicians |
| Internal tool thinking | JSON preview shows structured output for downstream systems |
| Documentation | This README explains purpose, usage, and next steps |
| Git workflow | Small, reviewable repo ready to push to GitHub |
| AI-assisted workflow | Built with Cursor/Claude-style tooling for fast iteration |

## What the Demo Shows

- JSON-based form schema as a configurable source of truth
- Dynamic form rendering from schema definitions
- Required field validation with clear inline error messages
- Checklist fields for operational inspection steps
- Dropdown options for equipment, inspection type, condition, and priority
- Submitted data preview as formatted JSON (demo only — no backend)
- Public-safe, generic field service workflow

## Tech Used

- HTML
- CSS
- JavaScript
- JSON
- Git / GitHub
- AI-assisted workflow using Cursor / Claude-style tools

## Features

- **JSON-based form schema** — human-readable field definitions in `form-schema.json`
- **Industry-style checklist** — Pass / Fail / N/A per item (common in equipment inspection apps)
- **Job context panel** — work order, status, and live completion tracking
- **Visual status cards** — Pass, Needs Attention, Fail condition ratings
- **Customer sign-off** — name + completion confirmation before submit
- **Sample data loader** — one-click demo for recruiters (`Load sample data`)
- **Draft auto-save** — local browser storage between sessions
- **Required field validation** — inline errors with accessible messaging
- **Submitted data preview** — formatted JSON with copy-to-clipboard
- **Public-safe generic workflow** — no real data, credentials, or proprietary logic

## Live Demo

- **Inspection form:** [rawji.github.io/field-service-inspection-form-demo](https://rawji.github.io/field-service-inspection-form-demo/)
- **Dispatch triage:** [rawji.github.io/field-service-inspection-form-demo/dispatch](https://rawji.github.io/field-service-inspection-form-demo/dispatch/)

Open `index.html` locally, or view on GitHub Pages after enabling Pages for the `main` branch in repo settings.

**Recruiter tip:** Click **Load sample data**, then **Submit Inspection** to see the full workflow in under 10 seconds.

## Privacy Note

This project is intentionally generic and does not include proprietary business logic, private product concepts, customer data, credentials, or backend services.

## How to Run

Open `index.html` in a browser.

No install step, build tools, or dependencies are required.

> **Tip:** If you serve the folder with a local web server, `app.js` will load `form-schema.json` directly. When opening the file locally, an embedded schema fallback is used automatically.

## Project Structure

```
field-service-inspection-form-demo/
├── index.html          # Inspection form demo (root)
├── styles.css
├── app.js
├── form-schema.json
├── dispatch/           # FieldOps Desk — dispatch triage demo
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── data/
│       ├── jobs.json
│       ├── routing-rules.json
│       └── technicians.json
├── README.md
└── .gitignore
```

## What I Would Improve Next

- Render all fields dynamically from JSON without an embedded fallback
- Add save/export to CSV
- Add role-based form templates (technician vs. supervisor)
- Add backend persistence (API or database)
- Add an admin form builder UI
- Add automated test coverage

## About the Candidate

I built this demo to show how I translate operational requirements into structured forms, documentation, and working interfaces. My background includes IT infrastructure, SaaS support, cloud systems, endpoint operations, identity access, troubleshooting, workflow documentation, and customer-facing support.
