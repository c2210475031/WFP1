// import * as d3 from "https://d3js.org/d3.v4.min.js";

const treeData = {
  name: "Top Level",
  children: [
    {
      name: "Level 2: A",
      children: [{ name: "Son of A" }, { name: "Daughter of A" }],
    },
    {
      name: "Level 2: B",
      children: [
        { name: "Son of A" },
        {
          name: "Daughter of A",
          children: [{ name: "Son of A" }, { name: "Daughter of A" }],
        },
      ],
    },
  ],
};

const getContainerSize = () => {
  const container = document.getElementById("graph");
  return container.getBoundingClientRect();
};
const margin = { top: 20, right: 30, bottom: 30, left: 30 };
const dx = 100;

const { width: contWidth, height: contHeight } = getContainerSize();

const getGraphSize = () => {
  const width = contWidth;
  -margin.left - margin.right;
  const height = contHeight;
  -margin.top - margin.bottom;
  return { width, height };
};
const updateVisibleNodes = (node) => {
  const left = node.x;
  const top = node.y;
  const style = `"bottom: ${top}px; right: ${left}px; "`;
  const n = document.createElement("div");
  n.setAttribute("class", "n");
  n.setAttribute("style", style);
  console.log({ n });
  document.querySelector(".nodes-container").appendChild(n);
};

const createSVGForGraph = () => {
  const diagonal = d3
    .linkVertical()
    .x((d) => d.x)
    .y((d) => d.y);

  const root = d3.hierarchy(treeData);

  const { width, height } = getGraphSize();
  const dy = (width - margin.right - margin.left) / (1 + root.height);

  const treemap = d3.tree().nodeSize([dy, dx]);

  const svg = d3
    .create("svg")
    .attr("width", contWidth)
    .attr("height", contHeight)
    .attr("viewBox", [-margin.left, -margin.top, width, dx])
    .attr(
      "style",
      "max-width: 100%; height: auto; font: 10px sans-serif; user-select: none; border: 2px solid red"
    );

  const gNode = svg
    .append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all")
    .attr(
      "style",
      "max-width: 100%; height: auto; font: 10px sans-serif; user-select: none; border: 2px solid red"
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
      );

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
        const asd = update(d, d);
        updateVisibleNodes(d);
        console.log({ d });
        // console.log("onclick-> ", asd);
      });

    nodeEnter
      .append("circle")
      .attr("r", 2.5)
      .attr("fill", (d) => (d._children ? "#555" : "#999"))
      .attr("stroke-width", 10);

    nodeEnter
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", (d) => (d._children ? -6 : 6))
      .attr("text-anchor", (d) => (d._children ? "end" : "start"))
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
  const asd = update(null, root);
  console.log(asd);
  return svg.node();
};

const svgGraph = createSVGForGraph();

document.getElementById("graph").appendChild(svgGraph);
// document.querySelectorAll(".node").forEach((n) => console.log(n.__data__));
