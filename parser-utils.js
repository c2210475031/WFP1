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

const walkthrough = (node) => {
  const res = {
    start: node.startPosition,
    end: node.endPosition,
    children: [],
  };
  console.log(node);
  if (node.namedChildCount > 0) {
    for (let i = 0; i < node.namedChildCount; i++) {
      //   console.log(JSON.stringify(node.namedChild(i)));
      const child = walkthrough(node.namedChild(i));
      res.children.push(walkthrough(child));
    }
  }
};

const printNode = (node) => {
  const text = node.text;
  const type = node.type;
  if (type == "compound_statement" || true) {
    console.log("-------------------------------------------------");
    console.log(type);
    console.log(text);
    console.log("-------------------------------------------------");
  }
  return text;
};

const walkNodes = (node) => {
  if (node.namedChildCount > 0) {
    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChild(i);
      walkNodes(child);
      printNode(child);
    }
  }
};

// const tree = parser.parse(code);

// walkNodes(tree.rootNode);

// const sourceCode = "const x = 42;";
const tree = parser.parse(sourceCode);
const rootNode = tree.rootNode;

let idCounter = 0;
const allNodes = {};

function nodeToJSON(node) {
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
}

const rootJson = nodeToJSON(rootNode);

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

// const serialized = walkthrough(result.rootNode.namedChild(0));
/* 
fs.writeFile("output.json", JSON.stringify(serialized), "utf8", (err) => {
  if (err) {
    console.error("Error writing file:", err);
    return;
  }
  console.log("File written successfully!");
});
 */
