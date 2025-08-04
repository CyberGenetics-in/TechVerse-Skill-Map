var margin = [20, 120, 20, 140],
    width = 1280 - margin[1] - margin[3],
    height = 800 - margin[0] - margin[2],
    i = 0,
    duration = 1250,
    root,
    allNodes = [],
    searchResults = [];

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var vis = d3.select("#body").append("svg:svg")
    .attr("width", width + margin[1] + margin[3])
    .attr("height", height + margin[0] + margin[2])
  .append("svg:g")
    .attr("transform", "translate(" + margin[3] + "," + margin[0] + ")");

// Add loading indicator
vis.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .attr("class", "loading")
    .text("Loading TechVerse Skill Map...");

d3.json("arf.json", function(json) {
  root = json;
  root.x0 = height / 2;
  root.y0 = 0;

  // Collect all nodes for search functionality
  function collectNodes(node) {
    allNodes.push(node);
    if (node.children) {
      node.children.forEach(collectNodes);
    }
  }
  collectNodes(root);

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  root.children.forEach(collapse);
  update(root);
  
  // Remove loading indicator
  vis.select(".loading").remove();
});

function update(source) {
  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse();

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 180; });

  // Update the nodes…
  var node = vis.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .on("click", function(d) { toggle(d); update(d); })
      .on("mouseover", function(d) {
        // Add tooltip-like behavior
        d3.select(this).select("circle").transition().duration(200).attr("r", 8);
      })
      .on("mouseout", function(d) {
        d3.select(this).select("circle").transition().duration(200).attr("r", 6);
      });

  nodeEnter.append("svg:circle")
      .attr("r", 1e-6)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeEnter.append('a')
      .attr("target", "_blank")
      .attr('xlink:href', function(d) { return d.url; })
      .append("svg:text")
      .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(function(d) { return d.name; })
      .style("fill", function(d) { return d.free ? '#2d3748' : '#999'; })
      .style("fill-opacity", 1e-6);

  nodeEnter.append("svg:title")
    .text(function(d) {
      return d.description || d.name;
    });

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeUpdate.select("circle")
      .attr("r", 6)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeUpdate.select("text")
      .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .remove();

  nodeExit.select("circle")
      .attr("r", 1e-6);

  nodeExit.select("text")
      .style("fill-opacity", 1e-6);

  // Update the links…
  var link = vis.selectAll("path.link")
      .data(tree.links(nodes), function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("svg:path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      })
    .transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// Toggle children.
function toggle(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
}

// Toggle Dark Mode
function goDark() {
  var element = document.body;
  element.classList.toggle("dark-Mode");
  
  // Update button text
  var btnText = document.querySelector('.btn-text');
  if (element.classList.contains("dark-Mode")) {
    btnText.textContent = "Light Mode";
  } else {
    btnText.textContent = "Dark Mode";
  }
}

// Toggle Search
function toggleSearch() {
  var searchContainer = document.getElementById('searchContainer');
  var searchInput = document.getElementById('searchInput');
  
  if (searchContainer.style.display === 'none') {
    searchContainer.style.display = 'block';
    searchContainer.classList.add('show');
    searchInput.focus();
  } else {
    searchContainer.style.display = 'none';
    searchContainer.classList.remove('show');
  }
}

// Perform Search
function performSearch() {
  var searchTerm = document.getElementById('searchInput').value.toLowerCase();
  
  if (searchTerm.length < 2) {
    // Reset to original state
    resetSearch();
    return;
  }
  
  // Filter nodes based on search term
  searchResults = allNodes.filter(function(node) {
    return node.name.toLowerCase().includes(searchTerm) || 
           (node.description && node.description.toLowerCase().includes(searchTerm));
  });
  
  // Highlight matching nodes
  highlightSearchResults(searchResults);
}

// Highlight search results
function highlightSearchResults(results) {
  // Reset all nodes to normal state
  vis.selectAll("g.node").select("circle")
    .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
    .style("stroke", "#667eea");
  
  vis.selectAll("g.node").select("text")
    .style("fill", function(d) { return d.free ? '#2d3748' : '#999'; });
  
  // Highlight matching nodes
  results.forEach(function(result) {
    vis.selectAll("g.node").filter(function(d) { return d === result; })
      .select("circle")
      .style("fill", "#fbbf24")
      .style("stroke", "#d97706");
    
    vis.selectAll("g.node").filter(function(d) { return d === result; })
      .select("text")
      .style("fill", "#92400e")
      .style("font-weight", "bold");
  });
}

// Reset search
function resetSearch() {
  searchResults = [];
  vis.selectAll("g.node").select("circle")
    .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
    .style("stroke", "#667eea");
  
  vis.selectAll("g.node").select("text")
    .style("fill", function(d) { return d.free ? '#2d3748' : '#999'; })
    .style("font-weight", "normal");
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + K to toggle search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    toggleSearch();
  }
  
  // Escape to close search
  if (e.key === 'Escape') {
    var searchContainer = document.getElementById('searchContainer');
    if (searchContainer.style.display !== 'none') {
      toggleSearch();
      resetSearch();
    }
  }
});

// Add search input event listeners
document.addEventListener('DOMContentLoaded', function() {
  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      if (this.value.length >= 2) {
        performSearch();
      } else {
        resetSearch();
      }
    });
    
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }
});

// Add smooth scrolling for better UX
function smoothScrollTo(element) {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}

// Add tooltip functionality
function addTooltip(node, text) {
  var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border-radius", "6px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "1000")
    .style("opacity", 0)
    .text(text);
  
  return tooltip;
}

// Responsive design adjustments
function adjustVisualization() {
  var container = document.querySelector('.visualization-container');
  var containerWidth = container.offsetWidth - 40; // Account for padding
  var containerHeight = container.offsetHeight - 40;
  
  if (containerWidth > 0 && containerHeight > 0) {
    width = containerWidth - margin[1] - margin[3];
    height = containerHeight - margin[0] - margin[2];
    
    // Update tree size
    tree.size([height, width]);
    
    // Update SVG dimensions
    vis.attr("width", width + margin[1] + margin[3])
       .attr("height", height + margin[0] + margin[2]);
    
    // Recalculate layout
    if (root) {
      update(root);
    }
  }
}

// Listen for window resize
window.addEventListener('resize', function() {
  clearTimeout(window.resizeTimeout);
  window.resizeTimeout = setTimeout(adjustVisualization, 250);
});

// Initialize responsive design
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(adjustVisualization, 100);
}); 