const Parser = require("tree-sitter");
const Language_C = require("tree-sitter-c");

const parser = new Parser();
parser.setLanguage(Language_C);

const parseToJSON = (sourceCode, filterTypes = null) => {
  const tree = parser.parse(sourceCode);
  const result = {
    metadata: {
      language: "c",
      nodeCount: 0,
      timestamp: new Date().toISOString(),
      types: [],
      filteredTypes: filterTypes || [],
      totalNodesBeforeFilter: 0,
    },
    tree: null,
    flatNodes: {},
  };

  let nodeId = 0;
  let totalNodes = 0;

  const shouldIncludeNode = (nodeType) => {
    return !filterTypes || filterTypes.includes(nodeType);
  };

  const processNode = (node, parentId) => {
    totalNodes++;

    // Track all node types for metadata
    if (!result.metadata.types.includes(node.type)) {
      result.metadata.types.push(node.type);
    }

    // Check if this node should be included based on filter
    if (!shouldIncludeNode(node.type)) {
      // If filtering and this node type is not wanted, process children directly
      let childResults = [];
      for (const child of node.namedChildren) {
        const childResult = processNode(child, parentId);
        if (childResult) {
          if (Array.isArray(childResult)) {
            childResults.push(...childResult);
          } else {
            childResults.push(childResult);
          }
        }
      }
      return childResults.length > 0 ? childResults : null;
    }

    const id = `node_${nodeId++}`;
    result.metadata.nodeCount++;

    const nodeData = {
      id,
      type: node.type,
      parentId: parentId,
      isNamed: node.isNamed,
      startPosition: node.startPosition,
      endPosition: node.endPosition,
      text: node.text,
      children: [],
    };

    // Store in flat structure
    result.flatNodes[id] = { ...nodeData };
    delete result.flatNodes[id].children; // Remove children from flat version
    delete result.flatNodes[id].text; // Remove text from flat version

    // Process children for tree structure
    for (const child of node.namedChildren) {
      const childResult = processNode(child, id);
      if (childResult) {
        if (Array.isArray(childResult)) {
          nodeData.children.push(...childResult);
        } else {
          nodeData.children.push(childResult);
        }
      }
    }

    return nodeData;
  };

  const rootResult = processNode(tree.rootNode, null);
  result.metadata.totalNodesBeforeFilter = totalNodes;

  // Handle case where root node might be filtered out
  if (rootResult) {
    if (Array.isArray(rootResult)) {
      // If root was filtered out, create a synthetic root
      result.tree = {
        id: "root",
        type: "program",
        parentId: null,
        isNamed: true,
        startPosition: { row: 0, column: 0 },
        endPosition: tree.rootNode.endPosition,
        text: sourceCode,
        children: rootResult,
      };
    } else {
      result.tree = rootResult;
    }
  } else {
    result.tree = null;
  }

  return result;
};

module.exports = parseToJSON;
