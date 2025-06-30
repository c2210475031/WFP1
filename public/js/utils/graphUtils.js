export const margin = { top: 20, right: 30, bottom: 30, left: 30 };
export const dx = 100;

export const getContainerSize = () => {
  const container = document.getElementById("graph");
  return container.getBoundingClientRect();
};

export const getGraphSize = (contWidth, contHeight) => {
  const width = contWidth;
  -margin.left - margin.right;
  const height = contHeight;
  -margin.top - margin.bottom;
  return { width, height };
};

const removeDivNode = (id) => {
  const div = document.getElementById(id);
  if (div) {
    div.remove();
  }
};

export const updateVisibleNodes = () => {
  const nodes = document.querySelectorAll(".node");

  const svgContainer = document.querySelector("svg");
  if (!svgContainer) return;
  const svgBounds = svgContainer.getBoundingClientRect();

  nodes.forEach((nd) => {
    const rectBounds = nd.getBoundingClientRect();
    const n = document.createElement("div");
    n.setAttribute("class", "n");

    const top = -10 + rectBounds.y - svgBounds.y + "px";
    const left = 30 + rectBounds.x - svgBounds.x + "px";
    n.style.position = "absolute";
    n.style.left = left;
    n.style.top = top;

    const { x, y, data } = nd.__data__;
    n.setAttribute("transform", `translate(${x},${y})`);
    n.setAttribute("id", data.id);
    n.__data__ = nd.__data__;
    n.onclick = nd.__on[0].listener;

    removeDivNode(data.id);

    document.querySelector(".nodes-container").appendChild(n);
  });
};
