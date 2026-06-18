/**
 * Workflow Requirements Map — requirements traceability demo.
 * Loads map data from requirements-map.json with embedded fallback.
 */

(function () {
  "use strict";

  const WORKFLOW_ORDER = [
    { id: "fieldServiceInspection", label: "Field Service Inspection" },
    { id: "dispatchTriage", label: "Dispatch Triage" },
    { id: "maintenanceRequest", label: "Maintenance Request" },
  ];

  const EMBEDDED_MAP = {
    workflows: {
      fieldServiceInspection: {
        name: "Field Service Inspection",
        description: "On-site equipment inspection workflow with checklist, condition rating, and customer sign-off.",
        requirements: [
          {
            operationalRequirement: "Technician must identify the customer and job site.",
            formFieldOrBehavior: "Customer Name and Job Site fields.",
            validationRule: "Customer Name and Job Site are required.",
            outputSummaryImpact: "Submitted JSON includes customer and location context for internal tracking.",
          },
          {
            operationalRequirement: "Technician must record equipment and job context.",
            formFieldOrBehavior: "Equipment Type, Inspection Type, Service Date, and Technician Name fields.",
            validationRule: "Core job context fields are required.",
            outputSummaryImpact: "Internal summary identifies what was inspected, when, and by whom.",
          },
          {
            operationalRequirement: "Inspection results must be captured consistently.",
            formFieldOrBehavior: "Condition Rating and inspection checklist.",
            validationRule: "Condition Rating and required checklist items must be completed.",
            outputSummaryImpact: "Internal summary reflects pass, needs attention, or fail status.",
          },
          {
            operationalRequirement: "Failed or concerning inspections should create follow-up context.",
            formFieldOrBehavior: "Priority, Technician Notes, and condition status.",
            validationRule: "Priority and notes support review when issues are found.",
            outputSummaryImpact: "Internal summary flags follow-up needs and operational risk.",
          },
          {
            operationalRequirement: "Customer sign-off should be captured when the work is complete.",
            formFieldOrBehavior: "Customer Sign-Off section.",
            validationRule: "Required before final submission if configured.",
            outputSummaryImpact: "Submitted JSON records customer acknowledgment.",
          },
          {
            operationalRequirement: "Recruiters and reviewers should see structured output.",
            formFieldOrBehavior: "Submitted JSON preview.",
            validationRule: "Generated only after successful form validation.",
            outputSummaryImpact: "Shows how form data could feed downstream systems.",
          },
          {
            operationalRequirement: "Operations teams need a quick internal summary.",
            formFieldOrBehavior: "Internal Summary generated after submission.",
            validationRule: "Generated from submitted inspection data.",
            outputSummaryImpact: "Helps internal users understand inspection status quickly.",
          },
          {
            operationalRequirement: "Customers need a plain-language explanation.",
            formFieldOrBehavior: "Customer Summary generated after submission.",
            validationRule: "Generated from submitted inspection data.",
            outputSummaryImpact: "Provides a nontechnical customer-facing result summary.",
          },
        ],
      },
      dispatchTriage: {
        name: "Dispatch Triage",
        description: "JSON-driven dispatch board for routing, prioritizing, and assigning field service jobs.",
        requirements: [
          {
            operationalRequirement: "Operations teams need to prioritize incoming service requests.",
            formFieldOrBehavior: "Triage board with job priority/status indicators.",
            validationRule: "Jobs must include priority or urgency context.",
            outputSummaryImpact: "Internal users can quickly identify which work needs attention first.",
          },
          {
            operationalRequirement: "Dispatchers need technician and job context.",
            formFieldOrBehavior: "Technician, job, and routing data displayed from JSON.",
            validationRule: "Required dispatch fields must exist in the demo data.",
            outputSummaryImpact: "Structured data supports routing and assignment decisions.",
          },
          {
            operationalRequirement: "Routing decisions should be rule-based and explainable.",
            formFieldOrBehavior: "Routing rules JSON drives job assignment or recommendation logic.",
            validationRule: "Rules must map to visible routing outcomes.",
            outputSummaryImpact: "Reviewer can see how business logic becomes operational output.",
          },
          {
            operationalRequirement: "High-priority work should be visually clear.",
            formFieldOrBehavior: "Priority badges, status labels, or highlighted rows/cards.",
            validationRule: "Priority values must map to UI indicators.",
            outputSummaryImpact: "Internal summary helps teams reduce missed urgent work.",
          },
          {
            operationalRequirement: "Data should remain public-safe and generic.",
            formFieldOrBehavior: "Sample JSON uses fake jobs, fake technicians, and no real customer records.",
            validationRule: "No credentials, private data, or backend calls.",
            outputSummaryImpact: "Demo can be safely shared on GitHub.",
          },
        ],
      },
      maintenanceRequest: {
        name: "Maintenance Request",
        description: "Equipment maintenance intake with conditional escalation for critical or production-impacting issues.",
        requirements: [
          {
            operationalRequirement: "Requestor and location must be captured.",
            formFieldOrBehavior: "Requestor Name and Location fields.",
            validationRule: "Requestor Name and Location are required.",
            outputSummaryImpact: "Submitted data identifies who made the request and where the issue is located.",
          },
          {
            operationalRequirement: "Equipment ID and category must be captured.",
            formFieldOrBehavior: "Equipment ID field and Equipment Category dropdown.",
            validationRule: "Equipment ID and Equipment Category are required.",
            outputSummaryImpact: "Internal summary identifies the affected equipment.",
          },
          {
            operationalRequirement: "Issue type and priority must be categorized.",
            formFieldOrBehavior: "Issue Type dropdown and Priority dropdown.",
            validationRule: "Issue Type and Priority are required.",
            outputSummaryImpact: "Internal summary highlights the issue category and urgency.",
          },
          {
            operationalRequirement: "Critical or production-impacting requests must require escalation contact.",
            formFieldOrBehavior: "Escalation Contact appears when Priority is Critical or Production Impact is checked.",
            validationRule: "Escalation Contact is required when triggered.",
            outputSummaryImpact: "Internal summary flags urgent requests needing escalation.",
          },
          {
            operationalRequirement: "Internal summary should highlight urgency.",
            formFieldOrBehavior: "Internal summary generated from submitted request data.",
            validationRule: "Generated from priority and production impact fields.",
            outputSummaryImpact: "Operations team can quickly identify urgent maintenance needs.",
          },
          {
            operationalRequirement: "Customer summary should acknowledge request status clearly.",
            formFieldOrBehavior: "Customer-facing summary generated from request data.",
            validationRule: "Generated from submitted workflow data.",
            outputSummaryImpact: "Customer receives a clear acknowledgment of the maintenance request.",
          },
        ],
      },
    },
  };

  const selectorEl = document.getElementById("workflow-selector");
  const workflowTitleEl = document.getElementById("workflow-title");
  const workflowDescEl = document.getElementById("workflow-description");
  const tableBodyEl = document.getElementById("requirements-body");
  const rowCountEl = document.getElementById("row-count");
  const jsonPreviewEl = document.getElementById("json-preview");
  const copyJsonBtn = document.getElementById("copy-json-btn");

  let mapData = null;
  let activeWorkflowId = "fieldServiceInspection";

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function loadMap() {
    try {
      const res = await fetch("requirements-map.json");
      if (!res.ok) throw new Error("fetch failed");
      return await res.json();
    } catch (_err) {
      return JSON.parse(JSON.stringify(EMBEDDED_MAP));
    }
  }

  function renderWorkflow(workflowId) {
    const workflow = mapData.workflows[workflowId];
    if (!workflow) return;

    activeWorkflowId = workflowId;
    workflowTitleEl.textContent = workflow.name;
    workflowDescEl.textContent = workflow.description;
    rowCountEl.textContent = workflow.requirements.length + " requirements mapped";

    tableBodyEl.innerHTML = workflow.requirements.map(function (row, index) {
      return (
        "<tr>" +
        "<td data-label=\"Requirement\"><span class=\"row-num\">" + (index + 1) + "</span> " +
        escapeHtml(row.operationalRequirement) + "</td>" +
        "<td data-label=\"Form field / behavior\">" + escapeHtml(row.formFieldOrBehavior) + "</td>" +
        "<td data-label=\"Validation rule\">" + escapeHtml(row.validationRule) + "</td>" +
        "<td data-label=\"Output impact\">" + escapeHtml(row.outputSummaryImpact) + "</td>" +
        "</tr>"
      );
    }).join("");

    jsonPreviewEl.textContent = JSON.stringify(workflow, null, 2);

    selectorEl.querySelectorAll(".workflow-btn").forEach(function (btn) {
      const active = btn.dataset.workflow === workflowId;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function bindSelector() {
    selectorEl.innerHTML = WORKFLOW_ORDER.map(function (item) {
      return (
        "<button type=\"button\" class=\"workflow-btn\" data-workflow=\"" + item.id + "\" " +
        "aria-pressed=\"false\">" + escapeHtml(item.label) + "</button>"
      );
    }).join("");

    selectorEl.querySelectorAll(".workflow-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        renderWorkflow(btn.dataset.workflow);
      });
    });
  }

  copyJsonBtn.addEventListener("click", function () {
    const workflow = mapData.workflows[activeWorkflowId];
    const text = JSON.stringify(workflow, null, 2);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        copyJsonBtn.textContent = "Copied!";
        setTimeout(function () { copyJsonBtn.textContent = "Copy workflow JSON"; }, 1800);
      });
      return;
    }
    copyJsonBtn.textContent = "Copy requires HTTPS";
  });

  async function init() {
    mapData = await loadMap();
    bindSelector();
    renderWorkflow(activeWorkflowId);
  }

  init();
})();
