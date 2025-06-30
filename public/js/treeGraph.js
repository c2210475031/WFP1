import { treeData } from "./utils/data.js";
import {
  dx,
  getContainerSize,
  getGraphSize,
  margin,
  updateVisibleNodes,
} from "./utils/graphUtils.js";

const { width: contWidth, height: contHeight } = getContainerSize();

const updateSVGSizeOnZoom = (transform) => {
  const svg = document.querySelector("svg");
  const { x, y, k } = transform;
  const { width, height } = getComputedStyle(svg);
  const newWidth = parseInt(width) / k;
  const newHeight = parseInt(height) / k;

  svg.style.width = newWidth.toFixed() + "px";
  svg.style.height = newHeight.toFixed() + "px";

  console.log({
    k,
    wioth: parseInt(width),
    newWidth,
    oldWidth: svg.width.baseVal.value,
    newHeight,
    oldHeight: svg.height.baseVal.value,
  });
};

const createSVGForGraph = (treeData) => {
  const diagonal = d3
    .linkVertical()
    .x((d) => d.x)
    .y((d) => d.y);

  const root = d3.hierarchy(treeData);

  const { width, height } = getGraphSize(contWidth, contHeight);
  const dy = (width - margin.right - margin.left) / (1 + root.height);

  const treemap = d3.tree().nodeSize([dy, dx]);

  const svg = d3
    .create("svg")
    .attr("width", contWidth)
    .attr("height", contHeight);

  // .attr("width", "auto")
  // .attr("height", "auto")
  // .attr("viewBox", [-margin.left, -margin.top, width, dx])
  // .attr(
  //   "style",
  //   "max-width: 100%; height: 100%; font: 10px sans-serif; user-select: none"
  // )
  /*   .call(
      d3.zoom().on("zoom", function () {
        // console.log(d3.event.transform);
        updateSVGSizeOnZoom(d3.event.transform);
        svg.attr("transform", { ...d3.event.transform, k: 0 });
      })
    ); */

  const gNode = svg
    .append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all")
    // .attr("fill", "#f003")
    .attr(
      "style",
      "width: 100%; height: 100%; font: 10px sans-serif; user-select: none;background-color:#f003"
    );

  const gLink = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5);

  const update = (event, source) => {
    const duration = event?.altKey ? 2500 : 250; // hold the alt key to slow down the transition
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

    const transition = svg
      .transition()
      .duration(duration)
      .attr("height", contHeight)
      .attr("viewBox", [
        left.x - (contWidth - (right.x - left.x)) / 2,
        -margin.top,
        contWidth,
        contHeight,
      ])
      .tween(
        "resize",
        window.ResizeObserver ? null : () => () => svg.dispatch("toggle")
      )
      .on("end", () => {
        //! updateVisibleNodes();
      });

    // Update the nodes…
    const node = gNode.selectAll("g").data(nodes, (d) => d.id);

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .attr("class", "node")
      .on("click", (d) => {
        d.children = d.children ? null : d._children;
        update(d, d);
        // updateVisibleNodes();
      })
      .on("mouseover", (param) => console.log("mouse over", param))
      .on("mouseout", (param) => console.log("mouse out", param));

    nodeEnter
      .append("rect")
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", (d) => (d._children ? "#555" : "#999"))
      .attr("stroke-width", 10);

    nodeEnter
      .append("text")
      //   .attr("dy", "2em")
      //   .attr("x", (d) => (d._children ? -6 : 6))
      //   .attr("text-anchor", (d) => (d._children ? "end" : "start"))
      .attr("text-anchor", "middle")
      .text((d) => d.data.name)
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("stroke", "white")
      .attr("paint-order", "stroke");

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
    if (d.depth && d.data.name.length !== 7) d.children = null;
  });
  update(null, root);
  return svg.node();
};

const svgGraph = createSVGForGraph(treeData.rootNode);

document.querySelector(".svg-container").appendChild(svgGraph);
// updateVisibleNodes();
