/**
 * Customer Maintenance Request Portal — frontend-only intake demo.
 */

(function () {
  "use strict";

  const EMBEDDED_SCHEMA = {
    formId: "customer-maintenance-request",
    sampleData: {
      customerName: "Jordan Ellis",
      companySiteName: "Riverside Industrial — Plant 1",
      jobSiteAddress: "1200 Harbor Road, Building C, Bay 4",
      contactEmail: "j.ellis@example.com",
      contactPhone: "(555) 412-9081",
      equipmentType: "HVAC Unit",
      equipmentId: "HVAC-44",
      issueType: "Performance",
      urgency: "High",
      equipmentDown: true,
      safetyIssue: false,
      preferredServiceWindow: "As Soon As Possible",
      requestDescription: "Rooftop unit not maintaining setpoint. Production area temperature rising.",
      attachmentNote: "Photo of unit display available on request — demo only, no upload.",
      escalationContactName: "M. Chen",
      escalationContactPhone: "(555) 412-9000",
    },
  };

  const formEl = document.getElementById("request-form");
  const formErrorEl = document.getElementById("form-error");
  const escalationSection = document.getElementById("escalation-section");
  const resultsPlaceholder = document.getElementById("results-placeholder");
  const successPanel = document.getElementById("success-panel");
  const internalSummaryEl = document.getElementById("internal-summary");
  const customerSummaryEl = document.getElementById("customer-summary");
  const priorityRecEl = document.getElementById("priority-rec");
  const jsonPreviewEl = document.getElementById("json-preview");

  let lastSubmission = null;

  const FIELD_IDS = [
    "customerName", "companySiteName", "jobSiteAddress", "contactEmail", "contactPhone",
    "equipmentType", "equipmentId", "issueType", "urgency", "equipmentDown", "safetyIssue",
    "preferredServiceWindow", "requestDescription", "attachmentNote",
    "escalationContactName", "escalationContactPhone",
  ];

  async function loadSchema() {
    try {
      const res = await fetch("request-schema.json");
      if (!res.ok) throw new Error("fetch failed");
      return await res.json();
    } catch (_err) {
      return JSON.parse(JSON.stringify(EMBEDDED_SCHEMA));
    }
  }

  function needsEscalation(data) {
    return data.urgency === "Critical" || data.equipmentDown || data.safetyIssue;
  }

  function updateEscalationVisibility() {
    const data = collectFormData(false);
    const show = needsEscalation(data);
    escalationSection.classList.toggle("hidden", !show);
    escalationSection.querySelectorAll("input").forEach(function (input) {
      input.required = show;
    });
  }

  function collectFormData(includeEmpty) {
    const data = {
      customerName: document.getElementById("customerName").value.trim(),
      companySiteName: document.getElementById("companySiteName").value.trim(),
      jobSiteAddress: document.getElementById("jobSiteAddress").value.trim(),
      contactEmail: document.getElementById("contactEmail").value.trim(),
      contactPhone: document.getElementById("contactPhone").value.trim(),
      equipmentType: document.getElementById("equipmentType").value,
      equipmentId: document.getElementById("equipmentId").value.trim(),
      issueType: document.getElementById("issueType").value,
      urgency: document.getElementById("urgency").value,
      equipmentDown: document.getElementById("equipmentDown").checked,
      safetyIssue: document.getElementById("safetyIssue").checked,
      preferredServiceWindow: document.getElementById("preferredServiceWindow").value,
      requestDescription: document.getElementById("requestDescription").value.trim(),
      attachmentNote: document.getElementById("attachmentNote").value.trim(),
      escalationContactName: document.getElementById("escalationContactName").value.trim(),
      escalationContactPhone: document.getElementById("escalationContactPhone").value.trim(),
      submittedAt: new Date().toISOString(),
    };

    if (!includeEmpty && !data.equipmentId) delete data.equipmentId;
    if (!includeEmpty && !data.attachmentNote) delete data.attachmentNote;
    if (!needsEscalation(data)) {
      delete data.escalationContactName;
      delete data.escalationContactPhone;
    }

    return data;
  }

  function validateForm() {
    formErrorEl.classList.add("hidden");
    const missing = [];
    const data = collectFormData(true);

    if (!data.customerName) missing.push("Customer Name");
    if (!data.companySiteName) missing.push("Company / Site Name");
    if (!data.jobSiteAddress) missing.push("Job Site Address");
    if (!data.contactEmail) missing.push("Contact Email");
    if (!data.contactPhone) missing.push("Contact Phone");
    if (!data.equipmentType) missing.push("Equipment Type");
    if (!data.issueType) missing.push("Issue Type");
    if (!data.urgency) missing.push("Urgency");
    if (!data.preferredServiceWindow) missing.push("Preferred Service Window");
    if (!data.requestDescription) missing.push("Request Description");

    if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
      missing.push("valid Contact Email");
    }

    if (needsEscalation(data)) {
      if (!data.escalationContactName) missing.push("Escalation Contact Name");
      if (!data.escalationContactPhone) missing.push("Escalation Contact Phone");
    }

    if (missing.length) {
      formErrorEl.textContent = "Complete all required fields: " + missing.join(", ") + ".";
      formErrorEl.classList.remove("hidden");
      return null;
    }

    return collectFormData(false);
  }

  function priorityRecommendation(data) {
    if (data.urgency === "Critical" || data.safetyIssue) {
      return "Critical Dispatch Review";
    }
    if (data.urgency === "High" || data.equipmentDown) {
      return "High Priority Follow-Up";
    }
    if (data.urgency === "Medium") {
      return "Standard Scheduling";
    }
    return "Low Priority Queue";
  }

  function buildInternalSummary(data, priority) {
    const site = data.companySiteName;
    const equip = data.equipmentType + (data.equipmentId ? " (" + data.equipmentId + ")" : "");
    const flags = [];
    if (data.equipmentDown) flags.push("equipment marked down");
    if (data.safetyIssue) flags.push("safety issue flagged");
    if (data.urgency === "Critical") flags.push("critical urgency");

    let text = data.urgency + "-priority maintenance request submitted for " + equip + " at " + site + ".";
    text += " Issue type: " + data.issueType + ". Preferred window: " + data.preferredServiceWindow + ".";
    if (flags.length) {
      text += " " + flags.join(", ") + " — escalation contact review recommended before dispatch.";
    }
    text += " Priority recommendation: " + priority + ".";
    return text;
  }

  function buildCustomerSummary(data, priority) {
    let text = "Thank you. Your maintenance request has been received for " + data.equipmentType;
    if (data.equipmentId) text += " (" + data.equipmentId + ")";
    text += " at " + data.companySiteName + ".";
    text += " Based on the urgency selected (" + data.urgency + "), our team will review the request";
    if (priority === "Critical Dispatch Review" || priority === "High Priority Follow-Up") {
      text += " and prioritize follow-up";
    } else {
      text += " and coordinate the next service step";
    }
    text += ". Reference window: " + data.preferredServiceWindow + ".";
    return text;
  }

  function showResults(data) {
    const priority = priorityRecommendation(data);
    lastSubmission = data;

    priorityRecEl.innerHTML = "<strong>Priority recommendation:</strong> " + priority;
    internalSummaryEl.textContent = buildInternalSummary(data, priority);
    customerSummaryEl.textContent = buildCustomerSummary(data, priority);
    jsonPreviewEl.textContent = JSON.stringify(data, null, 2);

    resultsPlaceholder.hidden = true;
    resultsPlaceholder.classList.add("hidden");
    successPanel.hidden = false;
    successPanel.classList.remove("hidden");
    successPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetResults() {
    resultsPlaceholder.hidden = false;
    resultsPlaceholder.classList.remove("hidden");
    successPanel.hidden = true;
    successPanel.classList.add("hidden");
    lastSubmission = null;
  }

  function applySampleData(sample) {
    document.getElementById("customerName").value = sample.customerName || "";
    document.getElementById("companySiteName").value = sample.companySiteName || "";
    document.getElementById("jobSiteAddress").value = sample.jobSiteAddress || "";
    document.getElementById("contactEmail").value = sample.contactEmail || "";
    document.getElementById("contactPhone").value = sample.contactPhone || "";
    document.getElementById("equipmentType").value = sample.equipmentType || "";
    document.getElementById("equipmentId").value = sample.equipmentId || "";
    document.getElementById("issueType").value = sample.issueType || "";
    document.getElementById("urgency").value = sample.urgency || "";
    document.getElementById("equipmentDown").checked = !!sample.equipmentDown;
    document.getElementById("safetyIssue").checked = !!sample.safetyIssue;
    document.getElementById("preferredServiceWindow").value = sample.preferredServiceWindow || "";
    document.getElementById("requestDescription").value = sample.requestDescription || "";
    document.getElementById("attachmentNote").value = sample.attachmentNote || "";
    document.getElementById("escalationContactName").value = sample.escalationContactName || "";
    document.getElementById("escalationContactPhone").value = sample.escalationContactPhone || "";
    formErrorEl.classList.add("hidden");
    updateEscalationVisibility();
    resetResults();
  }

  function clearForm() {
    formEl.reset();
    formErrorEl.classList.add("hidden");
    updateEscalationVisibility();
    resetResults();
  }

  formEl.addEventListener("submit", function (e) {
    e.preventDefault();
    const data = validateForm();
    if (!data) return;
    showResults(data);
  });

  document.getElementById("urgency").addEventListener("change", updateEscalationVisibility);
  document.getElementById("equipmentDown").addEventListener("change", updateEscalationVisibility);
  document.getElementById("safetyIssue").addEventListener("change", updateEscalationVisibility);

  document.getElementById("load-sample-btn").addEventListener("click", function () {
    loadSchema().then(function (schema) {
      applySampleData(schema.sampleData || EMBEDDED_SCHEMA.sampleData);
    });
  });

  document.getElementById("clear-form-btn").addEventListener("click", clearForm);
  document.getElementById("new-request-btn").addEventListener("click", function () {
    clearForm();
    formEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("copy-json-btn").addEventListener("click", function () {
    if (!lastSubmission) return;
    const text = JSON.stringify(lastSubmission, null, 2);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        document.getElementById("copy-json-btn").textContent = "Copied!";
        setTimeout(function () {
          document.getElementById("copy-json-btn").textContent = "Copy JSON";
        }, 1800);
      });
    }
  });

  loadSchema().then(function () {
    updateEscalationVisibility();
  });
})();
