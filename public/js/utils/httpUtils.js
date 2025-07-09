const API_BASE_URL = "http://localhost:3000";

// Generic error handler
const handleApiError = (error) => {
  console.error("API Error:", error);
  if (error.response) {
    // Server responded with error status
    return {
      success: false,
      error: error.response.data?.error || "Server error",
      status: error.response.status,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      success: false,
      error: "Network error - unable to reach server",
      status: 0,
    };
  } else {
    // Something else happened
    return {
      success: false,
      error: error.message || "Unknown error",
      status: 0,
    };
  }
};

/**
 * Parse source code without filtering (returns all nodes)
 * @param {string} sourceCode - The C source code to parse
 * @returns {Promise<Object>} - Parsed result or error
 */
export const parseSourceCode = async (sourceCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceCode: sourceCode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to parse source code");
    }

    return data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Parse source code with node type filtering
 * @param {string} sourceCode - The C source code to parse
 * @param {string[]} filterTypes - Array of node types to include
 * @returns {Promise<Object>} - Parsed result or error
 */
export const parseSourceCodeWithFilter = async (sourceCode, filterTypes) => {
  try {
    const response = await fetch(`${API_BASE_URL}/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceCode: sourceCode,
        filterTypes: filterTypes,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to parse source code");
    }

    return data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get available node types
 * @returns {Promise<Object>} - Available node types or error
 */
export const getAvailableNodeTypes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/node-types`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get node types");
    }

    return data;
  } catch (error) {
    return handleApiError(error);
  }
};
