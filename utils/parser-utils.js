const Parser = require("tree-sitter");
const Language = require("tree-sitter-c");
const fs = require("fs");
const { type } = require("os");

const parser = new Parser();
const query = Parser.Query;
parser.setLanguage(Language);

const sourceCode = `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Define a constant
#define MAX_NAME_LEN 50

// Structure definition
struct Person {
    int id;
    char name[MAX_NAME_LEN];
    float salary;
};

// Function prototypes
void greetUser();
int add(int a, int b);
void printArray(int arr[], int size);
void fileDemo();

int main() {
    // Variables and data types
    int x = 5, y = 10, sum;
    float pi = 3.14;
    char letter = 'A';
    char name[MAX_NAME_LEN];

    // Input/Output
    greetUser();
    printf("Enter your name: ");
    fgets(name, MAX_NAME_LEN, stdin);
    name[strcspn(name, "\n")] = 0; // Remove newline
    printf("Hello, %s!\n\n", name);

    // Operators and function usage
    sum = add(x, y);
    printf("Sum of %d and %d is %d\n\n", x, y, sum);

    // Arrays and loop
    int numbers[5] = {1, 2, 3, 4, 5};
    printf("Array contents: ");
    printArray(numbers, 5);
    printf("\n");

    // Pointer demo
    int *ptr = &x;
    printf("Value of x via pointer: %d\n", *ptr);
    *ptr = 20;
    printf("New value of x: %d\n\n", x);

    // Conditional statements
    if (x > y) {
        printf("x is greater than y\n");
    } else if (x < y) {
        printf("x is less than y\n");
    } else {
        printf("x is equal to y\n");
    }

    // Switch case
    switch (letter) {
        case 'A':
            printf("You got an A!\n");
            break;
        case 'B':
            printf("You got a B.\n");
            break;
        default:
            printf("Grade not A or B.\n");
    }
    printf("\n");

    // Loops
    printf("While loop: ");
    int i = 0;
    while (i < 3) {
        printf("%d ", i++);
    }
    printf("\n");

    printf("Do-while loop: ");
    i = 0;
    do {
        printf("%d ", i++);
    } while (i < 3);
    printf("\n");

    printf("For loop: ");
    for (i = 0; i < 3; i++) {
        printf("%d ", i);
    }
    printf("\n\n");

    // Structures
    struct Person p1;
    p1.id = 1;
    strcpy(p1.name, "Alice");
    p1.salary = 50000.50;

    printf("Person Info:\n");
    printf("ID: %d, Name: %s, Salary: %.2f\n\n", p1.id, p1.name, p1.salary);

    // File handling
    fileDemo();

    return 0;
}

// Function definitions
void greetUser() {
    printf("=== Welcome to the C Language Demo! ===\n");
}

int add(int a, int b) {
    return a + b;
}

void printArray(int arr[], int size) {
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
}

void fileDemo() {
    FILE *fp = fopen("demo.txt", "w");
    if (fp == NULL) {
        printf("Failed to create file.\n");
        return;
    }
    fprintf(fp, "This is a demo file.\n");
    fclose(fp);

    char buffer[100];
    fp = fopen("demo.txt", "r");
    if (fp != NULL) {
        printf("Reading from file:\n");
        while (fgets(buffer, 100, fp) != NULL) {
            printf("%s", buffer);
        }
        fclose(fp);
    } else {
        printf("File not found.\n");
    }
}

`;
/* 
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
 */
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
      types: [],
    },

    tree: null,
    flatNodes: {},
  };

  let nodeId = 0;
  const processNode = (node, parentId) => {
    const id = `node_${nodeId++}`; // nodeId++;
    result.metadata.nodeCount++;

    if (!result.metadata.types.includes(node.type)) {
      result.metadata.types.push(node.type);
    }

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
      nodeData.children.push(processNode(child, id));
    }

    return nodeData;
  };

  result.tree = processNode(tree.rootNode, null);
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
