import { parseAndStoreData } from "./index.js";

const codeInput = document.getElementById("codeInput");
const codeDisplay = document.getElementById("codeDisplay");
const lineNumbers = document.getElementById("lineNumbers");
const statusInfo = document.getElementById("statusInfo");

// Control buttons
const newFileBtn = document.getElementById("newFileBtn");
const uploadFileBtn = document.getElementById("uploadFileBtn");
const saveFileBtn = document.getElementById("saveFileBtn");
const formatCodeBtn = document.getElementById("formatCodeBtn");
// File Upload Input
const fileInput = document.getElementById("fileInput");
//Node Type Filter Dropdown
const dropdownBtn = document.getElementById("dropdownBtn");
const selectAllBtn = document.getElementById("selectAllBtn");

let currentFileName = "untitled.c";

// Initialize with default code
codeInput.value = `// Write your C code here...
#include <stdio.h>

void mergeSort(int arr[], int left, int right) {
  if (left < right) {
      // Calculate the midpoint
      int mid = left + (right - left) / 2;
      // Sort first and second halves
      mergeSort(arr, left, mid);
      mergeSort(arr, mid + 1, right);
      // Merge the sorted halves
      merge(arr, left, mid, right);
  }
}`;

function updateDisplay() {
  const code = codeInput.value;
  const highlighted = hljs.highlight(code, { language: "c" }).value;
  codeDisplay.innerHTML = `<pre><code>${highlighted}</code></pre>`;
  updateLineNumbers();
  updateStatus();
}

function updateLineNumbers() {
  const lines = codeInput.value.split("\n");
  const lineNumbersHtml = lines.map((_, index) => index + 1).join("\n");
  lineNumbers.textContent = lineNumbersHtml;
}

function updateStatus() {
  const cursorPos = codeInput.selectionStart;
  const textBeforeCursor = codeInput.value.substring(0, cursorPos);
  const lines = textBeforeCursor.split("\n");
  const currentLine = lines.length;
  const currentColumn = lines[lines.length - 1].length + 1;
  statusInfo.textContent = `Line ${currentLine}, Column ${currentColumn}`;
}

function syncScroll() {
  codeDisplay.scrollTop = codeInput.scrollTop;
  codeDisplay.scrollLeft = codeInput.scrollLeft;
  lineNumbers.scrollTop = codeInput.scrollTop;
  lineNumbers.scrollLeft = codeInput.scrollLeft;
}

// Event listeners
codeInput.addEventListener("input", updateDisplay);
codeInput.addEventListener("scroll", syncScroll);
codeInput.addEventListener("keyup", updateStatus);
codeInput.addEventListener("click", updateStatus);

// Handle tab key
codeInput.addEventListener("keydown", function (e) {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = this.selectionStart;
    const end = this.selectionEnd;
    this.value =
      this.value.substring(0, start) + "    " + this.value.substring(end);
    this.selectionStart = this.selectionEnd = start + 4;
    updateDisplay();
  } else if (e.key === "s" && e.ctrlKey) {
    e.preventDefault();
    formatCode();
  }
});

// File operations
const newFile = () => {
  if (
    codeInput.value.trim() &&
    confirm(
      "Are you sure you want to create a new file? Unsaved changes will be lost."
    )
  ) {
    codeInput.value = "";
    currentFileName = "untitled.c";
    updateDisplay();
  } else if (!codeInput.value.trim()) {
    codeInput.value = "";
    currentFileName = "untitled.c";
    updateDisplay();
  }
};

const uploadFile = () => {
  fileInput.click();
};

const loadFile = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      codeInput.value = e.target.result;
      currentFileName = file.name;
      updateDisplay();
    };
    reader.readAsText(file);
  }
};

const saveFile = () => {
  const blob = new Blob([codeInput.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = currentFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Basic C code formatting
const formatCode = async () => {
  let code = codeInput.value;
  // Remove extra whitespace
  code = code.replace(/\s+$/gm, "");

  // Add proper spacing around operators
  code = code.replace(/([^=!<>])=([^=])/g, "$1 = $2");
  code = code.replace(/([^=!<>])==([^=])/g, "$1 == $2");
  code = code.replace(/([^=!<>])!=([^=])/g, "$1 != $2");

  // Add space after commas
  code = code.replace(/,([^\s])/g, ", $1");

  // Add space after control keywords
  code = code.replace(/\b(if|while|for|switch)\(/g, "$1 (");

  codeInput.value = code;
  updateDisplay();
  await parseAndStoreData(code);
};

let selectedNodeTypes = [];
let availableNodeTypes = [];

const updateSelectedNodeTypes = () => {
  const checkboxes = document.querySelectorAll(
    '#nodeTypesDropdown input[type="checkbox"]:checked'
  );
  selectedNodeTypes = Array.from(checkboxes).map((cb) => cb.value);

  // Trigger custom event for other parts of the application
  const event = new CustomEvent("nodeTypesChanged", {
    detail: {
      selectedTypes: selectedNodeTypes,
      availableTypes: availableNodeTypes,
    },
  });
  document.dispatchEvent(event);
};

export const populateNodeTypes = (types) => {
  let nodeTypes = [];
  if (types) {
    types.forEach((t) => nodeTypes.push({ label: t, checked: true }));
  }

  availableNodeTypes = nodeTypes;
  const dropdownContent = document.getElementById("dropdownContent");

  // Clear existing content
  dropdownContent.innerHTML = "";

  // Create dropdown items
  nodeTypes.forEach((nodeType) => {
    const label = document.createElement("label");
    label.className = "dropdown-item";
    label.innerHTML = `
                    <input type="checkbox" value="${nodeType.label}" ${
      nodeType.checked ? "checked" : ""
    }> 
                    ${nodeType.label}
                `;

    // Add event listener to the checkbox
    const checkbox = label.querySelector('input[type="checkbox"]');
    checkbox.addEventListener("change", updateSelectedNodeTypes);

    dropdownContent.appendChild(label);
  });
};

const toggleNodeTypesDropdown = () => {
  const dropdown = document.getElementById("nodeTypesDropdown");
  dropdown.classList.toggle("show");
};

const selectAllNodeTypes = () => {
  const checkboxes = document.querySelectorAll(
    '#nodeTypesDropdown input[type="checkbox"]'
  );
  checkboxes.forEach((cb) => (cb.checked = true));
  updateSelectedNodeTypes();
};

// Editor Control Buttons
newFileBtn.addEventListener("click", newFile);
uploadFileBtn.addEventListener("click", uploadFile);
fileInput.addEventListener("change", loadFile);
saveFileBtn.addEventListener("click", saveFile);
formatCodeBtn.addEventListener("click", formatCode);
//Dropdown node type filter
dropdownBtn.addEventListener("click", toggleNodeTypesDropdown);
selectAllBtn.addEventListener("click", selectAllNodeTypes);

// Initialize
updateDisplay();
codeInput.focus();
