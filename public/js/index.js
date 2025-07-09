import { parseSourceCode } from "./utils/httpUtils.js";

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

  // Alternative: Call a callback function if the graph file provides one
  if (typeof window.onParsedDataUpdate === "function") {
    window.onParsedDataUpdate(globalParsedData);
  }
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

// Export functions for use in other files
if (typeof window !== "undefined") {
  window.getCurrentParsedData = getCurrentParsedData;
  window.parseWithFilter = parseWithFilter;
  window.globalParsedData = globalParsedData;
}
