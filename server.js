const express = require("express");
const path = require("path");
const parseToJSON = require("./utils/parser");

const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json({ limit: "10mb" }));
app.use(express.text({ limit: "10mb" }));

// API endpoint
app.post("/parse", (req, res) => {
  try {
    // Extract source code from request body
    let sourceCode;
    let filterTypes = null;

    console.log(req.body);
    if (typeof req.body === "string") {
      // If body is plain text, treat it as source code
      sourceCode = req.body;
    } else if (typeof req.body === "object") {
      // If body is JSON, extract sourceCode and optional filterTypes
      sourceCode = req.body.sourceCode || req.body.code || req.body.source;
      filterTypes =
        req.body.filterTypes || req.body.nodeTypes || req.body.types;
    } else {
      return res.status(400).json({
        error:
          "Invalid request body. Expected source code as string or JSON object with sourceCode field.",
      });
    }

    if (!sourceCode) {
      return res.status(400).json({
        error:
          "Source code is required. Provide it as plain text or in a JSON object with sourceCode field.",
      });
    }

    // Validate filterTypes if provided
    if (filterTypes && !Array.isArray(filterTypes)) {
      return res.status(400).json({
        error: "filterTypes must be an array of node type strings.",
      });
    }

    // Parse the source code
    const result = parseToJSON(sourceCode, filterTypes);

    // Add request info to response
    const response = {
      success: true,
      filtered: filterTypes !== null,
      ...result,
    };

    res.json(response);
  } catch (error) {
    console.error("Parsing error:", error);
    res.status(500).json({
      error: "Failed to parse source code",
      message: error.message,
    });
  }
});

// Get available node types endpoint (helpful for clients)
app.get("/node-types", (req, res) => {
  // This would ideally return common C node types
  // For now, returning a sample set
  const commonCNodeTypes = [
    "program",
    "function_definition",
    "declaration",
    "compound_statement",
    "expression_statement",
    "if_statement",
    "while_statement",
    "for_statement",
    "return_statement",
    "identifier",
    "string_literal",
    "number_literal",
    "call_expression",
    "binary_expression",
    "unary_expression",
    "assignment_expression",
    "conditional_expression",
    "field_expression",
    "subscript_expression",
    "cast_expression",
    "sizeof_expression",
    "pointer_expression",
    "struct_specifier",
    "enum_specifier",
    "union_specifier",
    "typedef_statement",
    "preproc_include",
    "preproc_def",
    "comment",
  ];

  res.json({
    success: true,
    nodeTypes: commonCNodeTypes,
    note: "These are common C node types. Actual available types depend on the parsed code.",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// Fallback route (optional)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
