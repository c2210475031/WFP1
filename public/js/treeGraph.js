import { treeData, treeData2, treeData3 } from "./utils/data.js";
import {
  createGrid,
  dx,
  getContainerSize,
  getGraphSize,
  handleClickNodeExpand,
  hideAllCodeBlocks,
  initializeZoomBehavior,
  margin,
} from "./utils/graphUtils.js";
const { width: contWidth, height: contHeight } = getContainerSize();
const categorizedTypes = [
  "preproc_include",
  "preproc_def",
  "struct_specifier",
  "declaration",
  "function_definition",
];

const createSVGForGraph = (treeData) => {
  const diagonal = d3
    .linkVertical()
    .x((d) => d.x)
    .y((d) => d.y);

  const root = d3.hierarchy(treeData);

  const { width, height } = getGraphSize(contWidth, contHeight);
  const dy = (width - margin.right - margin.left) / (1 + root.height) + 50;

  const treemap = d3.tree().nodeSize([dy, dx]);

  const svg = d3
    .create("svg")
    .attr("width", contWidth)
    .attr("height", contHeight);

  // Create a zoom container group
  const zoomContainer = svg.append("g").attr("class", "zoom-container");

  // Initialize grid
  //??? createGrid(zoomContainer);

  // Initialize zoom behavior
  initializeZoomBehavior(svg);

  const gLink = zoomContainer
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5);

  const gNode = zoomContainer
    .append("g")
    .attr("cursor", "pointer")
    .attr("id", "nodes-group")
    .attr("pointer-events", "all")
    .attr(
      "style",
      "width: 100%; height: 100%; font: 10px sans-serif; user-select: none;"
    );

  const update = (event, source) => {
    const duration = event?.altKey ? 500 : 250; // hold the alt key to slow down the transition
    const nodes = root.descendants().reverse();
    const links = root.links();

    // Compute the new tree layout.
    treemap(root);

    let top = root;
    let bottom = root;
    let left = root;
    let right = root;
    root.eachBefore((node) => {
      if (node.y < top.y) top = node;
      if (node.y > bottom.y) bottom = node;
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    const height = bottom.y - top.y + margin.top + margin.bottom;

    // Modified transition to work with zoom container
    const transition = svg
      .transition()
      .duration(duration)
      .attr("height", contHeight)
      .attr("viewBox", [
        left.x - (contWidth - (right.x - left.x)) / 2,
        -margin.top,
        contWidth,
        contHeight,
      ]);

    // Update the nodes…
    const node = gNode.selectAll("g").data(nodes, (d) => d.id);
    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);
    // .attr("class", "node");

    nodeEnter.attr("class", (d) =>
      d._children ? "node has-children" : "node"
    );

    const foreignObject = nodeEnter
      .append("foreignObject")
      .attr("x", -50)
      .attr("y", 0)
      .attr("width", 100)
      .attr("height", 60)
      .attr("id", (d) => d.data.id)
      .on("click", (d) => {
        const event = d3.event;
        event.stopPropagation();
        if (event.ctrlKey) {
          handleClickNodeExpand(d);
        } else {
          d.children = d.children ? null : d._children;
          hideAllCodeBlocks();
          update(event, d);
        }
      });

    const nodeDiv = foreignObject
      .append("xhtml:div")
      .attr("class", "node-shape");

    nodeDiv.append("h3").text((d) => d.data.type.replaceAll("_", " "));

    // Transition nodes to their new position.
    const nodeUpdate = node
      .merge(nodeEnter)
      .transition(transition)
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node
      .exit()
      .transition(transition)
      .remove()
      .attr("transform", (d) => `translate(${source.x},${source.y})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    // Update the links…
    const link = gLink.selectAll("path").data(links, (d) => d.target.id);

    // Enter any new links at the parent's previous position.
    const linkEnter = link
      .enter()
      .append("path")
      .attr("class", "neon-link ")
      .attr("d", (d) => {
        const o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      });

    // Transition links to their new position.
    link.merge(linkEnter).transition(transition).attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition(transition)
      .remove()
      .attr("d", (d) => {
        const o = { x: source.x, y: source.y };
        return diagonal({ source: o, target: o });
      });
    // Stash the old positions for transition.
    root.eachBefore((d) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    return gNode.selectAll("g");
  };

  root.x0 = dy / 2;
  root.y0 = 0;
  root.descendants().forEach((d, i) => {
    d.id = i;
    d._children = d.children;
    if (d.depth && d.data.type.length !== 7) d.children = null;
  });
  update(null, root);
  return svg.node();
};

/* const svgGraph = createSVGForGraph(treeData.rootNode);
const svgGraph2 = createSVGForGraph(treeData2.tree);
const svgGraph3 = createSVGForGraph(treeData3.tree);

document.querySelector(".svg-container").appendChild(svgGraph3);
 */

const updateGraph = (parsedData) => {
  const svgGraph = createSVGForGraph(parsedData.tree);

  const svgContainer = document.querySelector(".svg-container");
  if (svgContainer.children.length > 0) {
    svgContainer.innerHTML = "";
  }
  svgContainer.appendChild(svgGraph);
};

document.addEventListener("parsedDataUpdated", (event) => {
  const { data } = event.detail;

  if (data) {
    updateGraph(data);
  } else {
    clearGraph();
  }
});
