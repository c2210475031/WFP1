import { populateNodeTypes } from "./codeEditor.js";
import { updateGraph } from "./treeGraph.js";
import {
  parseSourceCode,
  parseSourceCodeWithFilter,
} from "./utils/httpUtils.js";

let globalParsedData = null;

// Function to parse code and store in global variable
export const parseAndStoreData = async (sourceCode) => {
  // Don't parse if code is empty
  if (!sourceCode.trim()) {
    globalParsedData = null;
    parseStatus = {
      isLoading: false,
      hasError: false,
      lastError: null,
      lastUpdated: null,
    };
    notifyGraphUpdate();
    return;
  }

  try {
    // Call the parser API
    const result = await parseSourceCode(sourceCode);

    if (result.success) {
      // Store successful parse result
      globalParsedData = result;

      // Log for debugging
      console.log("Parse successful:", {
        nodeCount: result.metadata.nodeCount,
        types: result.metadata.types,
        filtered: result.filtered,
      });
    } else {
      // Handle parse error
      globalParsedData = null;

      console.error("Parse failed:", result.error);
    }
  } catch (error) {
    // Handle network or other errors
    globalParsedData = null;

    console.error("Parse request failed:", error);
  }

  // Notify graph file about the update
  notifyGraphUpdate();
};

// Function to notify graph file about data updates
const notifyGraphUpdate = () => {
  // Dispatch custom event that graph file can listen to
  const event = new CustomEvent("parsedDataUpdated", {
    detail: {
      data: globalParsedData,
    },
  });

  document.dispatchEvent(event);
};

// Utility function to get current parsed data (for use in other files)
const getCurrentParsedData = () => {
  return {
    data: globalParsedData,
    status: parseStatus,
  };
};

// Utility function to parse with custom filter types
const parseWithFilter = async (filterTypes) => {
  const code = codeInput.value;
  if (!code.trim()) return;

  try {
    const result = await parseSourceCodeWithFilter(code, filterTypes);

    if (result.success) {
      globalParsedData = result;

      notifyGraphUpdate();
    }
  } catch (error) {
    globalParsedData = null;
  }
};

document.addEventListener("nodeTypesChanged", (event) => {
  const { selectedTypes } = event.detail;
  if (selectedTypes.length) {
    console.log(selectedTypes);
    parseWithFilter(selectedTypes);
  }
});

document.addEventListener("parsedDataUpdated", (event) => {
  const { data } = event.detail;

  if (data) {
    updateGraph(data);
    const nodeTypes = data?.metadata?.types;
    if (nodeTypes.join() !== window.nodeTypes?.join()) {
      populateNodeTypes(nodeTypes);
      window.nodeTypes = nodeTypes;
    }
  }
});

// Export functions for use in other files
if (typeof window !== "undefined") {
  window.getCurrentParsedData = getCurrentParsedData;
  window.parseWithFilter = parseWithFilter;
  window.globalParsedData = globalParsedData;
}
