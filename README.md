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
- **Required field validation** — client-side checks with accessible error messages
- **Checklist fields** — multi-item inspection checklist from schema
- **Dropdown options** — equipment type, inspection type, condition, and priority
- **Submitted data preview** — formatted JSON output after successful submit
- **Public-safe generic workflow** — no real data, credentials, or proprietary logic

## Privacy Note

This project is intentionally generic and does not include proprietary business logic, private product concepts, customer data, credentials, or backend services.

## How to Run

Open `index.html` in a browser.

No install step, build tools, or dependencies are required.

> **Tip:** If you serve the folder with a local web server, `app.js` will load `form-schema.json` directly. When opening the file locally, an embedded schema fallback is used automatically.

## Project Structure

```
field-service-inspection-form-demo/
├── index.html          # Page shell and layout
├── styles.css          # Responsive styling
├── app.js              # Schema loading, rendering, validation, submit handling
├── form-schema.json    # Form field definitions and validation rules
├── README.md           # Project documentation
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
