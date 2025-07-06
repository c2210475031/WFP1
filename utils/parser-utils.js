const Parser = require("tree-sitter");
const Language = require("tree-sitter-c");
const fs = require("fs");

const parser = new Parser();
const query = Parser.Query;
parser.setLanguage(Language);

const sourceCode = ` 
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
}
`;

const tree = parser.parse(sourceCode);
const rootNode = tree.rootNode;

let idCounter = 0;
const allNodes = {};
const allTypes = [];

const nodeToJSON = (node) => {
  const id = `node_${idCounter++}`;

  // Store shallow copy in allNodes (without children)
  allNodes[id] = {
    id,
    type: node.type,
    startPosition: node.startPosition,
    endPosition: node.endPosition,
    startIndex: node.startIndex,
    endIndex: node.endIndex,
    text: sourceCode.slice(node.startIndex, node.endIndex),
    // no children here
  };

  // Build tree structure separately
  const jsonNode = {
    id,
    name: node.type,
    children: [],
  };

  for (let i = 0; i < node.namedChildCount; i++) {
    const childJson = nodeToJSON(node.namedChild(i));
    jsonNode.children.push(childJson);
  }

  return jsonNode;
};

/* const rootJson = nodeToJSON(rootNode);

const resultJson = {
  rootNode: rootJson,
  allNodes,
};

fs.writeFile("output.json", JSON.stringify(resultJson), "utf8", (err) => {
  if (err) {
    console.error("Error writing file:", err);
    return;
  }
  console.log("File written successfully!");
});

 */

const parseToJSON = (sourceCode) => {
  const tree = parser.parse(sourceCode);
  const result = {
    metadata: {
      language: "c",
      nodeCount: 0,
      timestamp: new Date().toISOString(),
    },
    types: [],
    tree: null,
    flatNodes: {},
  };

  let nodeId = 0;
  const processNode = (node) => {
    const id = `node_${nodeId++}`; // nodeId++;
    result.metadata.nodeCount++;

    if (!result.types.includes(node.type)) {
      result.types.push(node.type);
    }

    const nodeData = {
      id,
      type: node.type,
      isNamed: node.isNamed,
      startPosition: node.startPosition,
      endPosition: node.endPosition,
      text: node.text,
      children: [],
    };

    // Store in flat structure
    result.flatNodes[id] = { ...nodeData };
    delete result.flatNodes[id].children; // Remove children from flat version

    // Process children for tree structure
    for (const child of node.namedChildren) {
      nodeData.children.push(processNode(child));
    }

    return nodeData;
  };

  result.tree = processNode(tree.rootNode);
  return result;
};

// Usage
const result = parseToJSON(sourceCode);
fs.writeFile("output.json", JSON.stringify(result, null, 2), "utf8", (err) => {
  if (err) {
    console.error("Error writing file:", err);
    return;
  }
  console.log("File written successfully!");
});
