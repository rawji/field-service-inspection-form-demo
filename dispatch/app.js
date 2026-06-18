/**
 * FieldOps Desk — JSON-driven dispatch triage demo.
 * Loads jobs, rules, and technicians from data/*.json with embedded fallbacks.
 */

(function () {
  "use strict";

  const PRIORITY_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };

  const EMBEDDED_JOBS = {
    jobs: [
      { id: "JOB-1042", customer: "Northgate Logistics", site: "Warehouse B — Bay 3", equipmentId: "CR-2201", issueType: "Mechanical", priority: "High", productionImpact: true, status: "In Progress", queue: "scheduled", technician: "A. Rivera", summary: "Overhead crane making grinding noise during lifts.", submittedAt: "2026-06-14T09:15:00Z" },
      { id: "JOB-1045", customer: "Summit Manufacturing", site: "Plant 2 — Line 4", equipmentId: "GEN-118", issueType: "Electrical", priority: "Critical", productionImpact: true, status: "Unassigned", queue: "urgent", technician: null, summary: "Backup generator failed during power transfer test.", submittedAt: "2026-06-15T14:30:00Z" },
      { id: "JOB-1048", customer: "Harborview Properties", site: "Roof — HVAC Zone C", equipmentId: "HVAC-44", issueType: "Performance", priority: "Medium", productionImpact: false, status: "Scheduled", queue: "scheduled", technician: "J. Kim", summary: "Cooling output below spec on rooftop unit.", submittedAt: "2026-06-15T11:00:00Z" },
      { id: "JOB-1051", customer: "Metro Construction", site: "Job Site 18", equipmentId: "LIFT-09", issueType: "Safety", priority: "High", productionImpact: false, status: "Unassigned", queue: "urgent", technician: null, summary: "Scissor lift emergency stop intermittently failing.", submittedAt: "2026-06-16T07:45:00Z" },
      { id: "JOB-1053", customer: "Clearwater Foods", site: "Cold Storage — Room 2", equipmentId: "COMP-77", issueType: "Mechanical", priority: "Low", productionImpact: false, status: "Complete", queue: "scheduled", technician: "M. Santos", summary: "Compressor belt replaced during PM visit.", submittedAt: "2026-06-13T16:20:00Z" },
    ],
  };

  const EMBEDDED_RULES = {
    name: "Field service routing rules",
    description: "JSON rules that determine queue placement, priority, and technician assignment suggestions.",
    rules: [
      { id: "critical-priority", label: "Critical priority", condition: { field: "priority", equals: "Critical" }, actions: { queue: "urgent", suggestedTeam: "Emergency Response", notify: "Dispatch lead", slaHours: 2 } },
      { id: "production-impact", label: "Production impact flagged", condition: { field: "productionImpact", equals: true }, actions: { queue: "urgent", suggestedTeam: "Operations Support", notify: "Site manager", slaHours: 4 } },
      { id: "safety-issue", label: "Safety-related issue", condition: { field: "issueType", equals: "Safety" }, actions: { queue: "urgent", suggestedTeam: "Safety & Compliance", notify: "Safety officer", slaHours: 4 } },
      { id: "high-priority", label: "High priority", condition: { field: "priority", equals: "High" }, actions: { queue: "scheduled", suggestedTeam: "Field Technicians", notify: "Dispatch", slaHours: 24 } },
      { id: "default", label: "Standard request", condition: { field: "default", equals: true }, actions: { queue: "scheduled", suggestedTeam: "Field Technicians", notify: "Dispatch", slaHours: 72 } },
    ],
  };

  const EMBEDDED_TECHS = {
    technicians: [
      { name: "A. Rivera", team: "Field Technicians", available: true },
      { name: "J. Kim", team: "Field Technicians", available: true },
      { name: "M. Santos", team: "Field Technicians", available: false },
      { name: "T. Chen", team: "Emergency Response", available: true },
      { name: "D. Brooks", team: "Safety & Compliance", available: true },
    ],
  };

  const jobListEl = document.getElementById("job-list");
  const rulesJsonEl = document.getElementById("rules-json");
  const detailContentEl = document.getElementById("detail-content");
  const mobileDetailEl = document.getElementById("mobile-detail");
  const mobileDetailContentEl = document.getElementById("mobile-detail-content");
  const detailPanelEl = document.getElementById("panel-detail");
  const formEl = document.getElementById("request-form");
  const formErrorEl = document.getElementById("form-error");
  const filterButtons = document.querySelectorAll(".filter");
  const statsRowEl = document.getElementById("stats-row");
  const activityLogEl = document.getElementById("activity-log");
  const searchInput = document.getElementById("job-search");
  const sortSelect = document.getElementById("job-sort");
  const rulePreviewEl = document.getElementById("rule-preview");
  const toastEl = document.getElementById("toast");
  const sidebarTabs = document.querySelectorAll(".sidebar-tab");

  let jobs = [];
  let rulesConfig = null;
  let technicians = [];
  let activityLog = [];
  let activeFilter = "all";
  let searchQuery = "";
  let sortBy = "newest";
  let selectedJobId = null;
  let nextJobNum = 1054;
  let toastTimer = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function loadJson(path, fallback) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error("fetch failed");
      return await res.json();
    } catch (_err) {
      return JSON.parse(JSON.stringify(fallback));
    }
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function slaDeadline(job) {
    if (!job.routing || !job.routing.slaHours) return null;
    const ms = new Date(job.submittedAt).getTime() + job.routing.slaHours * 3600000;
    return new Date(ms);
  }

  function slaLabel(job) {
    const deadline = slaDeadline(job);
    if (!deadline || job.status === "Complete") return { text: "", overdue: false };
    const hoursLeft = Math.round((deadline - Date.now()) / 3600000);
    if (hoursLeft <= 0) return { text: "SLA overdue", overdue: true };
    return { text: hoursLeft + "h left", overdue: false };
  }

  /** Keep sample job timestamps fresh so SLA badges stay meaningful. */
  function refreshSampleDates(jobList) {
    const offsets = [2, 6, 12, 20, 36];
    jobList.forEach(function (job, index) {
      const hoursAgo = offsets[index] || (index + 1) * 8;
      job.submittedAt = new Date(Date.now() - hoursAgo * 3600000).toISOString();
    });
  }

  function copyText(text, successMessage) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        showToast(successMessage);
      }).catch(function () {
        showToast("Copy failed — select text manually.");
      });
      return;
    }
    showToast("Copy requires HTTPS.");
  }

  function techniciansForJob(job) {
    const team = job.routing.suggestedTeam;
    let matches = technicians.filter(function (t) {
      return t.available && t.team === team;
    });
    if (!matches.length) {
      matches = technicians.filter(function (t) {
        return t.available && t.team === "Field Technicians";
      });
    }
    return matches;
  }

  function statusPill(job) {
    if (job.status === "Complete") return "pill-complete";
    if (job.status === "Unassigned") return "pill-unassigned";
    return job.queue === "urgent" ? "pill-urgent" : "pill-scheduled";
  }

  function statusLabel(job) {
    if (job.status === "Complete") return "Complete";
    if (job.status === "Unassigned") return "Unassigned";
    if (job.status === "In Progress") return "In progress";
    return job.queue === "urgent" ? "Urgent" : "Scheduled";
  }

  function priorityPill(priority) {
    if (priority === "Critical") return "pill-priority-critical";
    if (priority === "High") return "pill-priority-high";
    return "pill-sla";
  }

  function evaluateRules(request) {
    for (let i = 0; i < rulesConfig.rules.length; i++) {
      const rule = rulesConfig.rules[i];
      const cond = rule.condition;
      if (cond.field === "default") continue;
      if (request[cond.field] === cond.equals) {
        return { rule: rule, actions: rule.actions };
      }
    }
    const fallback = rulesConfig.rules.find(function (r) {
      return r.condition.field === "default";
    });
    return { rule: fallback, actions: fallback.actions };
  }

  function enrichJob(job) {
    const payload = {
      customer: job.customer,
      site: job.site,
      equipmentId: job.equipmentId,
      issueType: job.issueType,
      priority: job.priority,
      productionImpact: job.productionImpact,
      summary: job.summary,
    };
    const result = evaluateRules(payload);
    job.matchedRule = result.rule.label;
    job.matchedRuleId = result.rule.id;
    job.routing = result.actions;
    if (job.status !== "Complete") {
      job.queue = result.actions.queue;
    }
    return job;
  }

  function getFormRequest() {
    return {
      customer: document.getElementById("customer").value.trim(),
      site: document.getElementById("site").value.trim(),
      equipmentId: document.getElementById("equipmentId").value.trim(),
      issueType: document.getElementById("issueType").value,
      priority: document.getElementById("priority").value,
      productionImpact: document.getElementById("productionImpact").checked,
      summary: document.getElementById("summary").value.trim(),
    };
  }

  function updateRulePreview() {
    const req = getFormRequest();
    const hasInput = req.issueType || req.priority || req.productionImpact;

    if (!hasInput) {
      rulePreviewEl.className = "rule-preview is-empty muted";
      rulePreviewEl.textContent = "Fill in the form to preview which JSON rule will match.";
      return;
    }

    const result = evaluateRules(req);
    rulePreviewEl.className = "rule-preview";
    rulePreviewEl.innerHTML =
      "<strong>Preview match:</strong> " + escapeHtml(result.rule.label) +
      " → " + escapeHtml(result.actions.suggestedTeam) +
      ", SLA " + result.actions.slaHours + "h";
  }

  function filteredJobs() {
    let list = jobs.filter(function (job) {
      if (activeFilter === "urgent") return job.queue === "urgent" && job.status !== "Complete";
      if (activeFilter === "unassigned") return job.status === "Unassigned";
      return true;
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(function (job) {
        return (
          job.id.toLowerCase().includes(q) ||
          job.customer.toLowerCase().includes(q) ||
          job.site.toLowerCase().includes(q) ||
          job.equipmentId.toLowerCase().includes(q) ||
          job.summary.toLowerCase().includes(q)
        );
      });
    }

    list.sort(function (a, b) {
      if (sortBy === "priority") {
        return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
      }
      if (sortBy === "customer") {
        return a.customer.localeCompare(b.customer);
      }
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    });

    return list;
  }

  function updateStats() {
    const open = jobs.filter(function (j) { return j.status !== "Complete"; });
    const urgent = open.filter(function (j) { return j.queue === "urgent"; });
    const unassigned = open.filter(function (j) { return j.status === "Unassigned"; });

    statsRowEl.innerHTML =
      statCard("Open jobs", open.length, "") +
      statCard("Urgent queue", urgent.length, "stat-urgent") +
      statCard("Unassigned", unassigned.length, "stat-warn") +
      statCard("Routing rules", rulesConfig.rules.length, "");

    document.querySelectorAll(".filter-count").forEach(function (el) {
      const key = el.dataset.count;
      if (key === "all") el.textContent = "(" + jobs.length + ")";
      if (key === "urgent") el.textContent = "(" + urgent.length + ")";
      if (key === "unassigned") el.textContent = "(" + unassigned.length + ")";
    });
  }

  function statCard(label, value, extraClass) {
    return "<div class=\"stat-card " + extraClass + "\"><span class=\"stat-label\">" +
      escapeHtml(label) + "</span><span class=\"stat-value\">" + value + "</span></div>";
  }

  function renderJobs() {
    const list = filteredJobs();
    jobListEl.innerHTML = "";

    if (!list.length) {
      jobListEl.innerHTML = "<p class=\"muted\">No jobs match your search or filter.</p>";
      return;
    }

    list.forEach(function (job) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "job-card" + (job.id === selectedJobId ? " is-selected" : "");
      btn.dataset.queue = job.queue || "scheduled";

      const sla = slaLabel(job);
      btn.innerHTML =
        "<div class=\"job-top\"><span class=\"job-id\">" + escapeHtml(job.id) + "</span>" +
        "<span class=\"pill " + statusPill(job) + "\">" + escapeHtml(statusLabel(job)) + "</span></div>" +
        "<span class=\"job-customer\">" + escapeHtml(job.customer) + "</span>" +
        "<span class=\"job-meta\">" + escapeHtml(job.site) + " · " + escapeHtml(job.equipmentId) + "</span>" +
        "<span class=\"job-summary\">" + escapeHtml(job.summary) + "</span>" +
        "<div class=\"job-footer\">" +
        "<span class=\"pill " + priorityPill(job.priority) + "\">" + escapeHtml(job.priority) + "</span>" +
        (job.technician ? "<span class=\"pill pill-sla\">" + escapeHtml(job.technician) + "</span>" : "") +
        (sla.text ? "<span class=\"pill " + (sla.overdue ? "pill-overdue" : "pill-sla") + "\">" + escapeHtml(sla.text) + "</span>" : "") +
        "</div>";

      btn.addEventListener("click", function () {
        selectedJobId = job.id;
        renderJobs();
        showJobDetail(job);
        switchTab("detail");
        scrollToDetail();
      });
      jobListEl.appendChild(btn);
    });
  }

  function buildInternalSummary(job) {
    return "<p><strong>Dispatch record</strong> — " + escapeHtml(job.customer) + " at " + escapeHtml(job.site) + ".</p>" +
      "<p>Equipment " + escapeHtml(job.equipmentId) + " (" + escapeHtml(job.issueType) + ", " + escapeHtml(job.priority) + " priority).</p>" +
      "<p>Queue: " + (job.queue === "urgent" ? "Urgent" : "Scheduled") + ". Team: " + escapeHtml(job.routing.suggestedTeam) + ". Notify: " + escapeHtml(job.routing.notify) + ".</p>" +
      (job.technician ? "<p>Assigned to " + escapeHtml(job.technician) + ".</p>" : "<p>Awaiting technician assignment.</p>");
  }

  function buildCustomerSummary(job) {
    return "<p>We received your service request for equipment " + escapeHtml(job.equipmentId) + " at " + escapeHtml(job.site) + ".</p>" +
      "<p><strong>Issue:</strong> " + escapeHtml(job.summary) + "</p>" +
      "<p>Priority: " + escapeHtml(job.priority) + ". Target response within " + job.routing.slaHours + " hours.</p>";
  }

  function buildDetailHtml(job) {
    const deadline = slaDeadline(job);
    const availableTechs = techniciansForJob(job);
    const sla = slaLabel(job);

    let assignHtml = "";
    if (job.status === "Unassigned") {
      if (availableTechs.length) {
        assignHtml = "<div class=\"assign-block\"><label>Assign technician</label><div class=\"assign-row\">" +
          "<select class=\"assign-select\"><option value=\"\">Select technician…</option>" +
          availableTechs.map(function (t) {
            return "<option value=\"" + escapeHtml(t.name) + "\">" + escapeHtml(t.name) + " (" + escapeHtml(t.team) + ")</option>";
          }).join("") +
          "</select><button type=\"button\" class=\"btn btn-primary btn-sm assign-btn\">Assign</button></div></div>";
      } else {
        assignHtml = "<div class=\"assign-block\"><p class=\"muted no-margin\">No available technicians for " +
          escapeHtml(job.routing.suggestedTeam) + ". Dispatch will assign manually.</p></div>";
      }
    }

    return (
      "<div class=\"detail-header\"><h3>" + escapeHtml(job.id) + " · " + escapeHtml(job.customer) + "</h3>" +
      "<p class=\"detail-sub\">" + escapeHtml(job.summary) + "</p></div>" +
      "<div class=\"rule-hit\"><span class=\"rule-hit-title\">Matched rule: " + escapeHtml(job.matchedRule) + "</span>" +
      "Queue → " + escapeHtml(job.queue) + " · Team → " + escapeHtml(job.routing.suggestedTeam) +
      " · SLA → " + job.routing.slaHours + "h" +
      (sla.text ? " · " + escapeHtml(sla.text) : "") +
      (deadline && job.status !== "Complete" ? " · Due " + formatDate(deadline.toISOString()) : "") +
      "</div>" +
      assignHtml +
      "<div class=\"result-block\">" +
      row("Status", job.status) +
      row("Issue type", job.issueType) +
      row("Priority", job.priority) +
      row("Production impact", job.productionImpact ? "Yes" : "No") +
      row("Technician", job.technician || "Unassigned") +
      row("Submitted", formatDate(job.submittedAt)) +
      "</div>" +
      "<div class=\"summary-box summary-internal\"><h4>Internal summary</h4>" + buildInternalSummary(job) + "</div>" +
      "<div class=\"summary-box summary-customer\"><h4>Customer summary</h4>" + buildCustomerSummary(job) + "</div>" +
      "<div class=\"detail-actions\">" +
      "<button type=\"button\" class=\"btn btn-secondary btn-sm copy-job-btn\">Copy job JSON</button>" +
      "</div>"
    );
  }

  function bindDetailActions(job, rootEl) {
    const assignBtn = rootEl.querySelector(".assign-btn");
    if (assignBtn) {
      assignBtn.addEventListener("click", function () {
        const select = rootEl.querySelector(".assign-select");
        if (!select || !select.value) {
          showToast("Select a technician first.");
          return;
        }
        assignTechnician(job.id, select.value);
      });
    }

    rootEl.querySelectorAll(".copy-job-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        copyText(JSON.stringify(job, null, 2), "Job JSON copied.");
      });
    });
  }

  function scrollToDetail() {
    const target = isMobileLayout() ? mobileDetailEl : detailPanelEl;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function showJobDetail(job) {
    const html = buildDetailHtml(job);
    detailContentEl.innerHTML = html;
    detailContentEl.classList.remove("detail-welcome");
    mobileDetailContentEl.innerHTML = html;
    mobileDetailEl.hidden = !isMobileLayout();
    bindDetailActions(job, detailContentEl);
    bindDetailActions(job, mobileDetailContentEl);
  }

  function row(label, value) {
    return "<div class=\"result-row\"><span class=\"result-label\">" + escapeHtml(label) +
      "</span><span class=\"result-value\">" + escapeHtml(value) + "</span></div>";
  }

  function assignTechnician(jobId, techName) {
    const job = jobs.find(function (j) { return j.id === jobId; });
    if (!job) return;
    job.technician = techName;
    job.status = "Scheduled";
    logActivity("Assigned " + techName + " to " + jobId);
    showToast(techName + " assigned to " + jobId);
    updateStats();
    renderJobs();
    showJobDetail(job);
  }

  function logActivity(message) {
    activityLog.unshift({ time: new Date().toISOString(), message: message });
    if (activityLog.length > 6) activityLog.pop();
    renderActivity();
  }

  function renderActivity() {
    if (!activityLog.length) {
      activityLogEl.innerHTML = "<li>No activity yet — route or assign a job to begin.</li>";
      return;
    }
    activityLogEl.innerHTML = activityLog.map(function (entry) {
      return "<li><time>" + formatTime(entry.time) + "</time>" + escapeHtml(entry.message) + "</li>";
    }).join("");
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.add("hidden");
    }, 2800);
  }

  function isMobileLayout() {
    return window.matchMedia("(max-width: 979px)").matches;
  }

  function switchTab(tabId) {
    if (isMobileLayout() && tabId === "detail") {
      if (selectedJobId) {
        const job = jobs.find(function (j) { return j.id === selectedJobId; });
        if (job) showJobDetail(job);
      }
      scrollToDetail();
      return;
    }

    sidebarTabs.forEach(function (tab) {
      const active = tab.dataset.tab === tabId;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll(".tab-panel").forEach(function (panel) {
      const isActive = panel.id === "panel-" + tabId;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  }

  function ensureSidebarTabForViewport() {
    if (isMobileLayout()) {
      const detailPanel = document.getElementById("panel-detail");
      if (detailPanel && detailPanel.classList.contains("is-active")) {
        switchTab("simulate");
      }
      if (selectedJobId) {
        const job = jobs.find(function (j) { return j.id === selectedJobId; });
        if (job) showJobDetail(job);
      }
      return;
    }

    mobileDetailEl.hidden = true;
    if (selectedJobId) {
      switchTab("detail");
      const job = jobs.find(function (j) { return j.id === selectedJobId; });
      if (job) showJobDetail(job);
    }
  }

  function routeRequest(request) {
    const result = evaluateRules(request);
    const actions = result.actions;

    const job = enrichJob({
      id: "JOB-" + nextJobNum++,
      customer: request.customer,
      site: request.site,
      equipmentId: request.equipmentId,
      issueType: request.issueType,
      priority: request.priority,
      productionImpact: request.productionImpact,
      status: "Unassigned",
      queue: actions.queue,
      technician: null,
      summary: request.summary,
      submittedAt: new Date().toISOString(),
    });

    jobs.unshift(job);
    selectedJobId = job.id;
    activeFilter = "all";
    filterButtons.forEach(function (btn) {
      btn.classList.toggle("is-active", btn.dataset.filter === "all");
    });

    logActivity("Routed " + job.id + " via \"" + result.rule.label + "\"");
    showToast(job.id + " routed to " + (actions.queue === "urgent" ? "urgent" : "scheduled") + " queue");
    updateStats();
    renderJobs();
    showJobDetail(job);
    switchTab("detail");
    scrollToDetail();
    formEl.reset();
    updateRulePreview();
  }

  function fillDemoRequest() {
    document.getElementById("customer").value = "Riverside Industrial";
    document.getElementById("site").value = "Plant 1 — Compressor Yard";
    document.getElementById("equipmentId").value = "COMP-412";
    document.getElementById("issueType").value = "Safety";
    document.getElementById("priority").value = "Critical";
    document.getElementById("productionImpact").checked = true;
    document.getElementById("summary").value = "Pressure relief valve alarm triggered during startup.";
    formErrorEl.classList.add("hidden");
    updateRulePreview();
    switchTab("simulate");
  }

  sidebarTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      switchTab(tab.dataset.tab);
    });
  });

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      activeFilter = btn.dataset.filter;
      filterButtons.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      renderJobs();
    });
  });

  searchInput.addEventListener("input", function () {
    searchQuery = searchInput.value.trim();
    renderJobs();
  });

  sortSelect.addEventListener("change", function () {
    sortBy = sortSelect.value;
    renderJobs();
  });

  formEl.querySelectorAll("input, select, textarea").forEach(function (el) {
    el.addEventListener("input", updateRulePreview);
    el.addEventListener("change", updateRulePreview);
  });

  formEl.addEventListener("submit", function (e) {
    e.preventDefault();
    formErrorEl.classList.add("hidden");
    const request = getFormRequest();

    const missing = [];
    if (!request.customer) missing.push("customer");
    if (!request.site) missing.push("site");
    if (!request.equipmentId) missing.push("equipment ID");
    if (!request.issueType) missing.push("issue type");
    if (!request.priority) missing.push("priority");
    if (!request.summary) missing.push("summary");

    if (missing.length) {
      formErrorEl.textContent = "Complete all required fields: " + missing.join(", ") + ".";
      formErrorEl.classList.remove("hidden");
      return;
    }

    routeRequest(request);
  });

  document.getElementById("demo-fill").addEventListener("click", fillDemoRequest);

  document.getElementById("copy-rules").addEventListener("click", function () {
    copyText(JSON.stringify(rulesConfig, null, 2), "Routing rules copied.");
  });

  document.getElementById("run-demo").addEventListener("click", function () {
    fillDemoRequest();
    routeRequest(getFormRequest());
  });

  function pickDefaultJob() {
    const open = jobs.filter(function (j) { return j.status !== "Complete"; });
    const unassigned = open.filter(function (j) { return j.status === "Unassigned"; });
    unassigned.sort(function (a, b) {
      return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
    });
    return unassigned[0] || open[0] || jobs[0];
  }

  async function init() {
    try {
      const jobsData = await loadJson("data/jobs.json", EMBEDDED_JOBS);
      rulesConfig = await loadJson("data/routing-rules.json", EMBEDDED_RULES);
      const techData = await loadJson("data/technicians.json", EMBEDDED_TECHS);

      jobs = jobsData.jobs.slice();
      refreshSampleDates(jobs);
      jobs = jobs.map(enrichJob);
      technicians = techData.technicians;
      rulesJsonEl.textContent = JSON.stringify(rulesConfig, null, 2);

      logActivity("Loaded " + jobs.length + " sample jobs from JSON");
      updateStats();
      renderJobs();
      renderActivity();
      updateRulePreview();

      const defaultJob = pickDefaultJob();
      if (defaultJob) {
        selectedJobId = defaultJob.id;
        renderJobs();
        showJobDetail(defaultJob);
        if (isMobileLayout()) {
          switchTab("simulate");
        } else {
          switchTab("detail");
        }
      }

      document.body.classList.remove("app-loading");
      document.body.classList.add("is-ready");
    } catch (err) {
      document.body.classList.remove("app-loading");
      statsRowEl.innerHTML = "<div class=\"stat-card stat-urgent\"><span class=\"stat-label\">Error</span><span class=\"stat-value\" style=\"font-size:1rem\">Failed to load demo. Refresh the page.</span></div>";
      console.error(err);
    }
  }

  window.addEventListener("resize", ensureSidebarTabForViewport);

  init();
})();
