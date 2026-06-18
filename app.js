/**
 * Field Service Inspection Form Demo
 *
 * Loads form-schema.json, renders the form dynamically, validates input,
 * and displays a JSON preview on successful submit (demo only — no backend).
 */

const formElement = document.getElementById("inspection-form");
const successMessage = document.getElementById("success-message");
const jsonPreviewSection = document.getElementById("json-preview-section");
const jsonPreview = document.getElementById("json-preview");

/**
 * Embedded schema fallback for file:// usage where fetch may be blocked.
 * Mirrors form-schema.json — keep both in sync when updating fields.
 */
const EMBEDDED_SCHEMA = {
  formId: "field-service-inspection",
  formTitle: "Field Service Inspection",
  version: "1.0.0",
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
      label: "Condition Rating",
      type: "select",
      required: true,
      placeholder: "Select condition rating",
      options: [
        { value: "pass", label: "Pass" },
        { value: "needs-attention", label: "Needs Attention" },
        { value: "fail", label: "Fail" },
      ],
      validation: { message: "Please select a condition rating." },
    },
    {
      id: "priority",
      label: "Priority",
      type: "select",
      required: true,
      placeholder: "Select priority level",
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "critical", label: "Critical" },
      ],
      validation: { message: "Please select a priority level." },
    },
    {
      id: "technicianNotes",
      label: "Technician Notes",
      type: "textarea",
      required: false,
      placeholder: "Observations, follow-up actions, or additional context",
      rows: 4,
    },
    {
      id: "photoRequired",
      label: "Photo Required?",
      type: "checkbox",
      required: false,
    },
  ],
  checklist: {
    id: "inspectionChecklist",
    label: "Inspection Checklist",
    required: true,
    minChecked: 1,
    validation: { message: "Complete at least one checklist item." },
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

/**
 * Attempt to load schema from JSON file; fall back to embedded copy for local file usage.
 */
async function loadSchema() {
  try {
    const response = await fetch("form-schema.json");
    if (!response.ok) {
      throw new Error("Schema file not found");
    }
    return await response.json();
  } catch (error) {
    console.info("Using embedded schema fallback:", error.message);
    return EMBEDDED_SCHEMA;
  }
}

/**
 * Build a labeled form control wrapper with error message slot.
 */
function createFieldWrapper(field) {
  const wrapper = document.createElement("div");
  wrapper.className = "form-field";
  wrapper.dataset.fieldId = field.id;

  const label = document.createElement("label");
  label.setAttribute("for", field.id);
  label.textContent = field.label;
  if (field.required) {
    const mark = document.createElement("span");
    mark.className = "required-mark";
    mark.textContent = "*";
    mark.setAttribute("aria-hidden", "true");
    label.appendChild(mark);
  }

  const error = document.createElement("p");
  error.className = "field-error";
  error.id = `${field.id}-error`;
  error.setAttribute("role", "alert");

  wrapper.append(label, error);
  return { wrapper, label, error };
}

/**
 * Render a single schema field into a DOM control.
 */
function renderField(field) {
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
      if (field.validation?.minLength) {
        control.minLength = field.validation.minLength;
      }
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
      wrapper.classList.add("checkbox-field");
      control = document.createElement("input");
      control.type = "checkbox";
      control.id = field.id;
      control.name = field.id;
      control.value = "yes";

      const checkboxLabel = wrapper.querySelector("label");
      wrapper.insertBefore(control, checkboxLabel);
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

/**
 * Render checklist section from schema definition.
 */
function renderChecklist(checklist) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "checklist-section form-field";
  fieldset.dataset.fieldId = checklist.id;

  const legend = document.createElement("legend");
  legend.textContent = checklist.label;
  if (checklist.required) {
    const mark = document.createElement("span");
    mark.className = "required-mark";
    mark.textContent = "*";
    mark.setAttribute("aria-hidden", "true");
    legend.appendChild(mark);
  }

  const optionsContainer = document.createElement("div");
  optionsContainer.className = "checklist-options";

  checklist.items.forEach((item) => {
    const option = document.createElement("div");
    option.className = "checkbox-field";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = item.id;
    input.name = checklist.id;
    input.value = item.id;

    const label = document.createElement("label");
    label.setAttribute("for", item.id);
    label.textContent = item.label;

    option.append(input, label);
    optionsContainer.appendChild(option);
  });

  const error = document.createElement("p");
  error.className = "field-error";
  error.id = `${checklist.id}-error`;
  error.setAttribute("role", "alert");

  fieldset.append(legend, optionsContainer, error);
  return fieldset;
}

/**
 * Render the full form from the loaded schema.
 */
function renderForm(schema) {
  const grid = document.createElement("div");
  grid.className = "form-grid";

  schema.fields.forEach((field) => {
    const element = renderField(field);
    if (element) grid.appendChild(element);
  });

  if (schema.checklist) {
    grid.appendChild(renderChecklist(schema.checklist));
  }

  const actions = document.createElement("div");
  actions.className = "form-actions";

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Submit Inspection";

  actions.appendChild(submitButton);
  grid.appendChild(actions);

  formElement.innerHTML = "";
  formElement.appendChild(grid);
}

/**
 * Clear previous validation state from the form.
 */
function clearValidationState() {
  formElement.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  formElement.querySelectorAll(".field-error").forEach((el) => {
    el.textContent = "";
  });
}

/**
 * Show a field-level validation error.
 */
function setFieldError(control, message) {
  if (control) {
    control.classList.add("invalid");
    control.setAttribute("aria-invalid", "true");
  }

  const errorElement = document.getElementById(`${control?.id || control?.dataset?.fieldId}-error`);
  if (errorElement) {
    errorElement.textContent = message;
  }
}

/**
 * Validate a single schema field against current form values.
 */
function validateField(field) {
  const control = document.getElementById(field.id);
  if (!control) return true;

  let value = field.type === "checkbox" ? control.checked : control.value.trim();
  const message = field.validation?.message || `${field.label} is required.`;

  if (field.required) {
    if (field.type === "checkbox") {
      // Optional checkbox — no required validation unless explicitly needed.
    } else if (!value) {
      setFieldError(control, message);
      return false;
    }
  }

  if (field.validation?.minLength && value.length < field.validation.minLength) {
    setFieldError(control, message);
    return false;
  }

  control.classList.remove("invalid");
  control.setAttribute("aria-invalid", "false");
  return true;
}

/**
 * Validate checklist section — at least one item must be checked.
 */
function validateChecklist(checklist) {
  const checkedItems = formElement.querySelectorAll(`input[name="${checklist.id}"]:checked`);
  const fieldset = formElement.querySelector(`[data-field-id="${checklist.id}"]`);
  const errorElement = document.getElementById(`${checklist.id}-error`);

  if (checklist.required && checkedItems.length < (checklist.minChecked || 1)) {
    if (errorElement) {
      errorElement.textContent = checklist.validation?.message || "Complete the checklist.";
    }
    fieldset?.classList.add("invalid");
    return false;
  }

  fieldset?.classList.remove("invalid");
  return true;
}

/**
 * Run full client-side validation based on schema rules.
 */
function validateForm(schema) {
  clearValidationState();
  let isValid = true;

  schema.fields.forEach((field) => {
    if (!validateField(field)) {
      isValid = false;
    }
  });

  if (schema.checklist && !validateChecklist(schema.checklist)) {
    isValid = false;
  }

  return isValid;
}

/**
 * Collect submitted values into a structured JSON object.
 */
function collectFormData(schema) {
  const data = {
    formId: schema.formId,
    formTitle: schema.formTitle,
    submittedAt: new Date().toISOString(),
    fields: {},
    checklist: {},
  };

  schema.fields.forEach((field) => {
    const control = document.getElementById(field.id);
    if (!control) return;

    if (field.type === "checkbox") {
      data.fields[field.id] = {
        label: field.label,
        value: control.checked,
      };
    } else {
      data.fields[field.id] = {
        label: field.label,
        value: control.value.trim(),
      };
    }
  });

  if (schema.checklist) {
    schema.checklist.items.forEach((item) => {
      const checkbox = document.getElementById(item.id);
      data.checklist[item.id] = {
        label: item.label,
        checked: checkbox ? checkbox.checked : false,
      };
    });
  }

  return data;
}

/**
 * Handle form submit — validate, show success message, and preview JSON.
 */
function handleSubmit(event) {
  event.preventDefault();

  if (!validateForm(formSchema)) {
    successMessage.hidden = true;
    jsonPreviewSection.hidden = true;
    return;
  }

  const submission = collectFormData(formSchema);

  successMessage.hidden = false;
  jsonPreviewSection.hidden = false;
  jsonPreview.textContent = JSON.stringify(submission, null, 2);

  successMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Initialize the demo application.
 */
async function init() {
  formSchema = await loadSchema();
  renderForm(formSchema);
  formElement.addEventListener("submit", handleSubmit);
}

init();
