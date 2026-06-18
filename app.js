/**
 * Field Service Inspection Form Demo
 *
 * Patterns inspired by leading field inspection apps (Fulcrum, Fluix, DigiDocs):
 * - Job-centric context panel
 * - Section progress tracking
 * - Pass / Fail / N/A checklist items
 * - Visual status cards and priority pills
 * - Conditional follow-up alerts
 * - Inline validation on blur
 */

const formElement = document.getElementById("inspection-form");
const successMessage = document.getElementById("success-message");
const jsonPreviewSection = document.getElementById("json-preview-section");
const jsonPreview = document.getElementById("json-preview");
const jobPanel = document.getElementById("job-panel");
const formStepper = document.getElementById("form-stepper");
const completionChip = document.getElementById("completion-chip");
const followUpAlert = document.getElementById("follow-up-alert");
const submitSummary = document.getElementById("submit-summary");
const stickySubmit = document.getElementById("sticky-submit");

const FORM_STEPS = [
  { id: "job-details", label: "Job Details", sectionIndex: 0 },
  { id: "equipment", label: "Equipment", sectionIndex: 1 },
  { id: "checklist", label: "Checklist", sectionIndex: 2 },
  { id: "assessment", label: "Assessment", sectionIndex: 3 },
];

const FORM_SECTIONS = [
  {
    step: "Step 1",
    title: "Job Details",
    description: "Customer, site, and service assignment",
    twoColumn: true,
    fieldIds: ["customerName", "jobSiteLocation", "technicianName", "serviceDate"],
  },
  {
    step: "Step 2",
    title: "Equipment & Service",
    description: "Equipment type and inspection category",
    twoColumn: true,
    fieldIds: ["equipmentType", "inspectionType"],
  },
  {
    step: "Step 4",
    title: "Assessment & Notes",
    description: "Overall condition, priority, and documentation",
    twoColumn: false,
    fieldIds: ["conditionRating", "priority", "technicianNotes", "photoRequired"],
  },
];

/**
 * Embedded schema fallback for file:// usage where fetch may be blocked.
 * Mirrors form-schema.json — keep both in sync when updating fields.
 */
const EMBEDDED_SCHEMA = {
  formId: "field-service-inspection",
  formTitle: "Field Service Inspection",
  version: "1.1.0",
  demoJob: {
    workOrder: "WO-20481",
    status: "In Progress",
    syncLabel: "Ready to sync",
  },
  fields: [
    {
      id: "customerName",
      label: "Customer Name",
      type: "text",
      required: true,
      placeholder: "Enter customer or company name",
      validation: { minLength: 2, message: "Customer name is required (at least 2 characters)." },
    },
    {
      id: "jobSiteLocation",
      label: "Job Site Location",
      type: "text",
      required: true,
      placeholder: "Street address, city, or site identifier",
      validation: { minLength: 3, message: "Job site location is required." },
    },
    {
      id: "technicianName",
      label: "Technician Name",
      type: "text",
      required: true,
      placeholder: "Technician completing this inspection",
      validation: { minLength: 2, message: "Technician name is required." },
    },
    {
      id: "serviceDate",
      label: "Service Date",
      type: "date",
      required: true,
      defaultToday: true,
      validation: { message: "Service date is required." },
    },
    {
      id: "equipmentType",
      label: "Equipment Type",
      type: "select",
      required: true,
      placeholder: "Select equipment type",
      options: [
        { value: "crane", label: "Crane" },
        { value: "hvac", label: "HVAC Unit" },
        { value: "lift", label: "Lift" },
        { value: "compressor", label: "Compressor" },
        { value: "other", label: "Other" },
      ],
      validation: { message: "Please select an equipment type." },
    },
    {
      id: "inspectionType",
      label: "Inspection Type",
      type: "select",
      required: true,
      placeholder: "Select inspection type",
      options: [
        { value: "routine", label: "Routine Inspection" },
        { value: "repair-follow-up", label: "Repair Follow-Up" },
        { value: "safety-check", label: "Safety Check" },
        { value: "preventive-maintenance", label: "Preventive Maintenance" },
      ],
      validation: { message: "Please select an inspection type." },
    },
    {
      id: "conditionRating",
      label: "Overall Condition",
      type: "status-cards",
      required: true,
      options: [
        { value: "pass", label: "Pass", description: "Equipment meets inspection standards", tone: "success" },
        { value: "needs-attention", label: "Needs Attention", description: "Minor issues — schedule follow-up", tone: "warning" },
        { value: "fail", label: "Fail", description: "Critical issue — immediate action required", tone: "danger" },
      ],
      validation: { message: "Select an overall condition rating." },
    },
    {
      id: "priority",
      label: "Priority Level",
      type: "priority-pills",
      required: true,
      options: [
        { value: "low", label: "Low", tone: "neutral" },
        { value: "medium", label: "Medium", tone: "info" },
        { value: "high", label: "High", tone: "warning" },
        { value: "critical", label: "Critical", tone: "danger" },
      ],
      validation: { message: "Select a priority level." },
    },
    {
      id: "technicianNotes",
      label: "Technician Notes",
      type: "textarea",
      required: false,
      placeholder: "Document observations, defects found, and recommended next steps",
      rows: 4,
    },
    {
      id: "photoRequired",
      label: "Photo evidence required for this inspection",
      type: "checkbox",
      required: false,
    },
  ],
  checklist: {
    id: "inspectionChecklist",
    label: "Safety & Operational Checklist",
    type: "triState",
    required: true,
    validation: { message: "Rate every checklist item as Pass, Fail, or N/A." },
    states: [
      { value: "pass", label: "Pass" },
      { value: "fail", label: "Fail" },
      { value: "na", label: "N/A" },
    ],
    items: [
      { id: "powersOn", label: "Equipment powers on" },
      { id: "noVisibleDamage", label: "No visible damage" },
      { id: "safetyGuards", label: "Safety guards in place" },
      { id: "emergencyStop", label: "Emergency stop tested" },
      { id: "serviceAreaClear", label: "Service area clear" },
    ],
  },
};

let formSchema = null;

async function loadSchema() {
  try {
    const response = await fetch("form-schema.json");
    if (!response.ok) throw new Error("Schema file not found");
    return await response.json();
  } catch (error) {
    console.info("Using embedded schema fallback:", error.message);
    return EMBEDDED_SCHEMA;
  }
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function renderJobPanel(schema) {
  const job = schema.demoJob || EMBEDDED_SCHEMA.demoJob;
  jobPanel.innerHTML = `
    <h2>Current Job</h2>
    <dl class="job-meta">
      <div>
        <dt>Work Order</dt>
        <dd>${job.workOrder}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd><span class="status-badge">${job.status}</span></dd>
      </div>
    </dl>
    <div class="sync-badge">
      <span aria-hidden="true">☁</span>
      <span><strong>${job.syncLabel}</strong> — offline-capable demo</span>
    </div>
    <div class="panel-stat">
      <p class="panel-stat-label">Form completion</p>
      <div class="panel-progress" aria-hidden="true">
        <div class="panel-progress-fill" id="panel-progress-fill"></div>
      </div>
      <p class="panel-stat-value" id="panel-progress-label">0% complete</p>
      <p class="panel-stat-value" id="checklist-progress-label">Checklist: 0 / ${schema.checklist?.items?.length || 0}</p>
    </div>
  `;
}

function renderStepper() {
  formStepper.innerHTML = FORM_STEPS.map((step, index) => `
    <div class="step" id="step-${step.id}" data-step-index="${index}">
      <span class="step-number">Step ${index + 1}</span>
      <span class="step-label">${step.label}</span>
    </div>
  `).join("");
}

function createFieldWrapper(field) {
  const wrapper = document.createElement("div");
  wrapper.className = "form-field";
  wrapper.dataset.fieldId = field.id;

  const label = document.createElement("label");
  label.className = "field-label";
  label.setAttribute("for", field.id);
  label.textContent = field.label;
  if (field.required) {
    const mark = document.createElement("span");
    mark.className = "required-mark";
    mark.textContent = " *";
    mark.setAttribute("aria-hidden", "true");
    label.appendChild(mark);
  }

  const error = document.createElement("p");
  error.className = "field-error";
  error.id = `${field.id}-error`;
  error.setAttribute("role", "alert");

  wrapper.append(label, error);
  return { wrapper, error };
}

function renderStatusCards(field) {
  const { wrapper, error } = createFieldWrapper(field);
  wrapper.querySelector("label").removeAttribute("for");

  const group = document.createElement("div");
  group.className = "choice-group status-cards";
  group.id = field.id;
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-labelledby", `${field.id}-label`);

  wrapper.querySelector("label").id = `${field.id}-label`;

  field.options.forEach((option) => {
    const card = document.createElement("label");
    card.className = `choice-card choice-card--${option.tone}`;

    const input = document.createElement("input");
    input.type = "radio";
    input.name = field.id;
    input.id = `${field.id}-${option.value}`;
    input.value = option.value;
    input.required = field.required;

    const body = document.createElement("span");
    body.className = "choice-card-body";
    body.innerHTML = `<span class="choice-card-title">${option.label}</span><span class="choice-card-desc">${option.description}</span>`;

    card.append(input, body);
    group.appendChild(card);
  });

  wrapper.appendChild(group);
  wrapper.appendChild(error);
  return wrapper;
}

function renderPriorityPills(field) {
  const { wrapper, error } = createFieldWrapper(field);
  wrapper.querySelector("label").removeAttribute("for");
  wrapper.querySelector("label").id = `${field.id}-label`;

  const group = document.createElement("div");
  group.className = "choice-group priority-pills";
  group.id = field.id;
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-labelledby", `${field.id}-label`);

  field.options.forEach((option) => {
    const pill = document.createElement("label");
    pill.className = `priority-pill priority-pill--${option.tone}`;

    const input = document.createElement("input");
    input.type = "radio";
    input.name = field.id;
    input.id = `${field.id}-${option.value}`;
    input.value = option.value;
    input.required = field.required;

    const text = document.createElement("span");
    text.textContent = option.label;

    pill.append(input, text);
    group.appendChild(pill);
  });

  wrapper.appendChild(group);
  wrapper.appendChild(error);
  return wrapper;
}

function renderField(field) {
  if (field.type === "status-cards") return renderStatusCards(field);
  if (field.type === "priority-pills") return renderPriorityPills(field);

  const { wrapper, error } = createFieldWrapper(field);
  let control;

  switch (field.type) {
    case "text":
    case "date": {
      control = document.createElement("input");
      control.type = field.type;
      control.id = field.id;
      control.name = field.id;
      if (field.placeholder) control.placeholder = field.placeholder;
      if (field.required) control.required = true;
      if (field.validation?.minLength) control.minLength = field.validation.minLength;
      if (field.defaultToday && field.type === "date") control.value = todayISO();
      break;
    }
    case "select": {
      control = document.createElement("select");
      control.id = field.id;
      control.name = field.id;
      if (field.required) control.required = true;

      const placeholderOption = document.createElement("option");
      placeholderOption.value = "";
      placeholderOption.textContent = field.placeholder || "Select an option";
      placeholderOption.disabled = true;
      placeholderOption.selected = true;
      control.appendChild(placeholderOption);

      field.options.forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        control.appendChild(optionElement);
      });
      break;
    }
    case "textarea": {
      control = document.createElement("textarea");
      control.id = field.id;
      control.name = field.id;
      control.rows = field.rows || 4;
      if (field.placeholder) control.placeholder = field.placeholder;
      break;
    }
    case "checkbox": {
      wrapper.className = "toggle-field";
      wrapper.innerHTML = "";

      control = document.createElement("input");
      control.type = "checkbox";
      control.id = field.id;
      control.name = field.id;

      const text = document.createElement("span");
      text.textContent = field.label;

      wrapper.append(control, text);
      wrapper.appendChild(error);
      return wrapper;
    }
    default:
      return null;
  }

  control.setAttribute("aria-describedby", error.id);
  wrapper.insertBefore(control, error);
  return wrapper;
}

function renderTriStateChecklist(checklist) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "checklist-section form-field";
  fieldset.dataset.fieldId = checklist.id;

  const legend = document.createElement("legend");
  legend.textContent = checklist.label;

  const list = document.createElement("div");
  list.className = "checklist-list";

  checklist.items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "tri-state-row";
    row.dataset.itemId = item.id;

    const label = document.createElement("div");
    label.className = "tri-state-label";
    label.textContent = item.label;

    const options = document.createElement("div");
    options.className = "tri-state-options";
    options.setAttribute("role", "radiogroup");
    options.setAttribute("aria-label", item.label);

    checklist.states.forEach((state) => {
      const option = document.createElement("label");
      option.className = `tri-state-option tri-state-option--${state.value}`;

      const input = document.createElement("input");
      input.type = "radio";
      input.name = item.id;
      input.id = `${item.id}-${state.value}`;
      input.value = state.value;
      input.required = checklist.required;

      const text = document.createElement("span");
      text.textContent = state.label;

      option.append(input, text);
      options.appendChild(option);
    });

    row.append(label, options);
    list.appendChild(row);
  });

  const error = document.createElement("p");
  error.className = "field-error";
  error.id = `${checklist.id}-error`;
  error.setAttribute("role", "alert");

  fieldset.append(legend, list, error);
  return fieldset;
}

function createFormSection(sectionConfig, checklistTotal = 0) {
  const section = document.createElement("section");
  section.className = "form-section";
  section.id = `section-${sectionConfig.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const header = document.createElement("div");
  header.className = "form-section-header";

  const copy = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = sectionConfig.title;
  const description = document.createElement("p");
  description.textContent = sectionConfig.description;
  copy.append(title, description);

  const meta = document.createElement("div");
  meta.style.display = "flex";
  meta.style.flexDirection = "column";
  meta.style.alignItems = "flex-end";
  meta.style.gap = "0.25rem";

  const step = document.createElement("span");
  step.className = "section-step";
  step.textContent = sectionConfig.step || "";
  meta.appendChild(step);

  if (checklistTotal) {
    const counter = document.createElement("span");
    counter.className = "checklist-counter";
    counter.id = "checklist-counter";
    counter.textContent = `0 / ${checklistTotal} rated`;
    meta.appendChild(counter);
  }

  header.append(copy, meta);
  section.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "form-section-grid";
  if (sectionConfig.twoColumn) grid.classList.add("form-section-grid--two-col");

  section.appendChild(grid);
  return { section, grid };
}

function renderForm(schema) {
  const fieldMap = new Map(schema.fields.map((field) => [field.id, field]));
  const container = document.createElement("div");
  container.className = "form-layout";
  const checklistCount = schema.checklist?.items?.length || 0;

  FORM_SECTIONS.slice(0, 2).forEach((sectionConfig) => {
    const { section, grid } = createFormSection(sectionConfig);
    sectionConfig.fieldIds.forEach((fieldId) => {
      const field = fieldMap.get(fieldId);
      const element = field ? renderField(field) : null;
      if (element) grid.appendChild(element);
    });
    container.appendChild(section);
  });

  if (schema.checklist) {
    const checklistSection = createFormSection({
      step: "Step 3",
      title: "Safety & Operational Checklist",
      description: "Rate each item Pass, Fail, or N/A — standard for equipment inspections",
      twoColumn: false,
    }, checklistCount);
    checklistSection.grid.appendChild(renderTriStateChecklist(schema.checklist));
    container.appendChild(checklistSection.section);
  }

  const assessmentSection = FORM_SECTIONS[2];
  const { section, grid } = createFormSection(assessmentSection);
  assessmentSection.fieldIds.forEach((fieldId) => {
    const field = fieldMap.get(fieldId);
    const element = field ? renderField(field) : null;
    if (!element) return;
    if (field.type === "textarea") element.classList.add("form-field--full");
    grid.appendChild(element);
  });
  container.appendChild(section);

  const actions = document.createElement("div");
  actions.className = "form-actions";
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Submit Inspection";
  actions.appendChild(submitButton);
  container.appendChild(actions);

  formElement.innerHTML = "";
  formElement.appendChild(container);
  stickySubmit.hidden = false;
}

function getFieldValue(field) {
  if (field.type === "checkbox") {
    return document.getElementById(field.id)?.checked || false;
  }
  if (field.type === "status-cards" || field.type === "priority-pills") {
    return formElement.querySelector(`input[name="${field.id}"]:checked`)?.value || "";
  }
  const control = document.getElementById(field.id);
  return control ? control.value.trim() : "";
}

function isFieldComplete(field) {
  const value = getFieldValue(field);
  if (field.type === "checkbox") return true;
  if (!field.required) return true;
  if (field.validation?.minLength) return value.length >= field.validation.minLength;
  return Boolean(value);
}

function getChecklistCompletion(schema) {
  if (!schema.checklist) return { rated: 0, total: 0 };
  const total = schema.checklist.items.length;
  const rated = schema.checklist.items.filter((item) =>
    formElement.querySelector(`input[name="${item.id}"]:checked`)
  ).length;
  return { rated, total };
}

function updateProgress(schema) {
  const requiredFields = schema.fields.filter((field) => field.required);
  const completedFields = requiredFields.filter((field) => isFieldComplete(field)).length;
  const { rated, total } = getChecklistCompletion(schema);
  const totalUnits = requiredFields.length + total;
  const completedUnits = completedFields + rated;
  const percent = totalUnits ? Math.round((completedUnits / totalUnits) * 100) : 0;

  completionChip.textContent = `${percent}% complete`;
  const panelFill = document.getElementById("panel-progress-fill");
  const panelLabel = document.getElementById("panel-progress-label");
  const checklistLabel = document.getElementById("checklist-progress-label");
  const checklistCounter = document.getElementById("checklist-counter");

  if (panelFill) panelFill.style.width = `${percent}%`;
  if (panelLabel) panelLabel.textContent = `${percent}% complete`;
  if (checklistLabel) checklistLabel.textContent = `Checklist: ${rated} / ${total}`;
  if (checklistCounter) checklistCounter.textContent = `${rated} / ${total} rated`;

  FORM_STEPS.forEach((step, index) => {
    const element = document.getElementById(`step-${step.id}`);
    if (!element) return;
    element.classList.remove("is-active", "is-complete");

    let complete = false;
    if (index === 0) {
      complete = ["customerName", "jobSiteLocation", "technicianName", "serviceDate"].every((id) =>
        isFieldComplete(schema.fields.find((field) => field.id === id))
      );
    } else if (index === 1) {
      complete = ["equipmentType", "inspectionType"].every((id) =>
        isFieldComplete(schema.fields.find((field) => field.id === id))
      );
    } else if (index === 2) {
      complete = rated === total && total > 0;
    } else if (index === 3) {
      complete = ["conditionRating", "priority"].every((id) =>
        isFieldComplete(schema.fields.find((field) => field.id === id))
      );
    }

    if (complete) element.classList.add("is-complete");
    else if (index === 0 || (index > 0 && document.getElementById(`step-${FORM_STEPS[index - 1].id}`)?.classList.contains("is-complete"))) {
      element.classList.add("is-active");
    }
  });
}

function updateFollowUpAlert(schema) {
  const condition = getFieldValue(schema.fields.find((field) => field.id === "conditionRating"));
  const hasFailedItem = schema.checklist?.items.some(
    (item) => formElement.querySelector(`input[name="${item.id}"]:checked`)?.value === "fail"
  );
  const needsFollowUp = hasFailedItem || condition === "fail" || condition === "needs-attention";

  followUpAlert.hidden = !needsFollowUp;

  const photoField = document.getElementById("photoRequired")?.closest(".toggle-field");
  if (photoField) {
    photoField.classList.toggle("is-highlighted", needsFollowUp);
    if (needsFollowUp && !document.getElementById("photoRequired").checked) {
      document.getElementById("photoRequired").checked = true;
    }
  }
}

function attachLiveUpdates(schema) {
  formElement.addEventListener("input", () => {
    updateProgress(schema);
    updateFollowUpAlert(schema);
  });
  formElement.addEventListener("change", () => {
    updateProgress(schema);
    updateFollowUpAlert(schema);
  });

  schema.fields.forEach((field) => {
    const control = document.getElementById(field.id);
    if (field.type === "status-cards" || field.type === "priority-pills") {
      control?.querySelectorAll("input").forEach((input) => {
        input.addEventListener("change", () => validateField(field));
      });
      return;
    }
    control?.addEventListener("blur", () => validateField(field));
  });
}

function clearValidationState() {
  formElement.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  formElement.querySelectorAll(".field-error").forEach((el) => {
    el.textContent = "";
  });
}

function setFieldError(control, message, errorId) {
  if (control) {
    control.classList.add("invalid");
    control.setAttribute("aria-invalid", "true");
  }
  const errorElement = document.getElementById(errorId || `${control?.id}-error`);
  if (errorElement) errorElement.textContent = message;
}

function validateField(field) {
  const message = field.validation?.message || `${field.label} is required.`;

  if (field.type === "status-cards" || field.type === "priority-pills") {
    const group = document.getElementById(field.id);
    const selected = formElement.querySelector(`input[name="${field.id}"]:checked`);
    if (field.required && !selected) {
      group?.classList.add("invalid");
      setFieldError(group, message, `${field.id}-error`);
      return false;
    }
    group?.classList.remove("invalid");
    return true;
  }

  const control = document.getElementById(field.id);
  if (!control) return true;

  const value = field.type === "checkbox" ? control.checked : control.value.trim();

  if (field.required && field.type !== "checkbox" && !value) {
    setFieldError(control, message);
    return false;
  }

  if (field.validation?.minLength && value.length < field.validation.minLength) {
    setFieldError(control, message);
    return false;
  }

  control.classList.remove("invalid");
  control.setAttribute("aria-invalid", "false");
  return true;
}

function validateChecklist(checklist) {
  let isValid = true;

  checklist.items.forEach((item) => {
    const row = formElement.querySelector(`[data-item-id="${item.id}"]`);
    const selected = formElement.querySelector(`input[name="${item.id}"]:checked`);
    if (!selected) {
      row?.classList.add("invalid");
      isValid = false;
    } else {
      row?.classList.remove("invalid");
    }
  });

  const errorElement = document.getElementById(`${checklist.id}-error`);
  if (!isValid && errorElement) {
    errorElement.textContent = checklist.validation?.message || "Complete the checklist.";
  } else if (errorElement) {
    errorElement.textContent = "";
  }

  return isValid;
}

function validateForm(schema) {
  clearValidationState();
  let isValid = true;

  schema.fields.forEach((field) => {
    if (!validateField(field)) isValid = false;
  });

  if (schema.checklist && !validateChecklist(schema.checklist)) isValid = false;
  return isValid;
}

function collectFormData(schema) {
  const data = {
    formId: schema.formId,
    formTitle: schema.formTitle,
    workOrder: schema.demoJob?.workOrder,
    submittedAt: new Date().toISOString(),
    fields: {},
    checklist: {},
  };

  schema.fields.forEach((field) => {
    if (field.type === "checkbox") {
      data.fields[field.id] = { label: field.label, value: getFieldValue(field) };
    } else {
      data.fields[field.id] = { label: field.label, value: getFieldValue(field) };
    }
  });

  if (schema.checklist) {
    schema.checklist.items.forEach((item) => {
      const result = formElement.querySelector(`input[name="${item.id}"]:checked`)?.value || null;
      data.checklist[item.id] = { label: item.label, result };
    });
  }

  return data;
}

function renderSubmitSummary(submission, schema) {
  const customer = submission.fields.customerName?.value || "—";
  const condition = submission.fields.conditionRating?.value || "—";
  const priority = submission.fields.priority?.value || "—";
  const failCount = Object.values(submission.checklist).filter((item) => item.result === "fail").length;

  submitSummary.innerHTML = `
    <dl class="summary-row"><dt>Customer</dt><dd>${customer}</dd></dl>
    <dl class="summary-row"><dt>Work Order</dt><dd>${schema.demoJob?.workOrder || "—"}</dd></dl>
    <dl class="summary-row"><dt>Condition</dt><dd>${condition}</dd></dl>
    <dl class="summary-row"><dt>Priority</dt><dd>${priority}</dd></dl>
    <dl class="summary-row"><dt>Checklist Failures</dt><dd>${failCount}</dd></dl>
  `;
}

function handleSubmit(event) {
  event.preventDefault();

  if (!validateForm(formSchema)) {
    successMessage.hidden = true;
    jsonPreviewSection.hidden = true;
    formElement.querySelector(".invalid")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const submission = collectFormData(formSchema);

  successMessage.hidden = false;
  jsonPreviewSection.hidden = false;
  renderSubmitSummary(submission, formSchema);
  jsonPreview.textContent = JSON.stringify(submission, null, 2);
  successMessage.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function init() {
  formSchema = await loadSchema();
  renderJobPanel(formSchema);
  renderStepper();
  renderForm(formSchema);
  attachLiveUpdates(formSchema);
  updateProgress(formSchema);
  formElement.addEventListener("submit", handleSubmit);
}

init();
