    // Code could be further optimized and cleaned (by modularizing).
    // @project: Jivox Phase-1
    // @author: Saurabh Singh Parihar

    // Fallback if JSON does not have a size
    function insertPopulation(node)
    {
     node.population=0;
     if(node.children==null){return 1;}
     else
     {
      for(var i=0;i<node.children.length;i++)
      {
        node.population+=insertPopulation(node.children[i]);
      }
      return node.population;
     }
    }

    // Fallback if JSON does not have a size
    function populateDensity(node,rootPopulation)
    {
     if(node.children==null){node.pdense=0; return;}
     else
     {
      node.pdense=node.population/rootPopulation;
      for(var i=0;i<node.children.length;i++)
      {
        populateDensity(node.children[i],rootPopulation);
      }
     }
    }

    // some random colors per node.
    function addRandomColor (node) 
    {
     colorArray=['rgb(189, 0, 38)','burlywood','rgb(62,249,123)',null];
     node.color=colorArray[Math.trunc(Math.random()*100%4)];

     if (node.color==null) node.color='rgb(72, 35, 175)'; 

     for(var i=0;(node.children&&i<node.children.length);i++)
       addRandomColor(node.children[i]);

     return;
    }

    var margin = {top: 20, right: 120, bottom: 20, left: 120},
        width = 1960 - margin.right - margin.left,
        height = 800 - margin.top - margin.bottom;

    var i = 0,
        duration = 750,
        root;

    var tree = d3.layout.tree()
        .size([height, width]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    root = getDummyData();
    root.x0 = height / 2;
    root.y0 = 0;

    var labels={};
    var circles={};
    var paths={};

    //Remove these too if size is not required
    insertPopulation(root);
    populateDensity(root,root.population); //Can be optimized...

    //Just for test
    addRandomColor(root);

    function collapse(d) 
    {
      if (d.children) 
      {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;            //This helps to track which are currently open.
      }
    }

    root.children.forEach(collapse);
    update(root);    //This causes the effect of expanding on load.

    d3.select(self.frameElement).style("height", "800px");

    function update(source) 
    {

      // Compute the new tree layout.
      var nodes = tree.nodes(root).reverse(),
          links = tree.links(nodes);

      // Normalize for fixed-depth.
      nodes.forEach(function(d) { d.y = d.depth * 180; }); //Interesting animation on removing this

      // Normalize for fixed-depth.
      //nodes.forEach(function(d) { d.x/=2; }); //Interesting animation on removing this

      // Update the nodes…
      var node = svg.selectAll("g.node")
          .data(nodes, function(d) { return d.id || (d.id = ++i); });

      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
          .on("click", click);

      nodeEnter.append("circle")
          .attr("r", 1e-6)
          .on("mouseover", function (d) {
                node_onMouseOver(d);
            })
          .on("mouseout", function (d) { node_onMouseOut(d)});

      nodeEnter.append("text")
          .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
          .attr("dy", ".35em")
          .attr("text-anchor", function(d) { labels[d.id] = this; return d.children || d._children ? "end" : "start"; })
          .text(function(d) { return d.name; })
          .style("fill-opacity", 1e-6)
          .on("mouseover", function (d) {node_onMouseOver(d);})
          .on("mouseout", function (d) { node_onMouseOut(d)});

      // Transition nodes to their new position.
      var nodeUpdate = node.transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

      nodeUpdate.select("circle")
          .attr("r", function(d) {return d.size===0?2:4.5+(10*d.size);}) // Change this to 4.5 to remove size difference
          //.attr("r", function(d) {return d.population===0?2:4.5+(30*d.size);}) // 
          .style("fill", function(d) { circles[d.id] = this; return d.population ? d.color : "#fff";}) //d._children ? d.color : "#fff";
          .style("fill-opacity", function(d) { return d.population ? 0.3 : 1;})
          .style("stroke", function(d) { return d.population===0?"lightsteelblue":d._children ? d.color : "none"; }); //return d._children ? d.color : "lightsteelblue"; }

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
      var link = svg.selectAll("path.link")
          .data(links, function(d) { return d.target.id; });

          

      // Enter any new links at the parent's previous position.
      link.enter().insert("path", "g")
          .attr("class", "link")
          .attr("d", function(d) {
            paths[d.target.id] = this;
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
           })
          .style("stroke",function(d){return d.target.color;})
          .style("stroke-width",function(d){return d.target.population===0?4:9+(20*d.target.size);})
          .style("stroke-opacity",function(d){return ((.2*d.source.depth)+.3);})
          .on("mouseover", function (d) {node_onMouseOver(d.source);})
          .on("mouseout", function (d) { node_onMouseOut(d.source)});
          ;

      // Transition links to their new position.
      link.transition()
          .duration(duration)
          .attr("d", diagonal);

      
      link.exit().transition()
            .duration(duration)
            .attr("d", diagonal)
            .remove();

      
      // Stash the old positions for transition.
      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });

      function node_onMouseOver(d) {

            if (typeof d.target != "undefined") {
                d = d.target;
            }

            window.d=d;
            console.log(d);

            highlightPath(d);

            function highlightPath(d) 
            {
                if (d) 
                {
                    d3.select(labels[d.id]).transition().style("font-weight","bold").style("font-size","16px");;
                    d3.select(circles[d.id]).transition().style("fill-opacity",0.6);
                    d3.select(paths[d.id]).style("stroke-opacity",function (d) {return ((d.source.depth + 1) / 4.5) + .3;});
                    highlightPath(d.parent);
                }
            }



        }

        function node_onMouseOut(d) 
        {
            noHighlightPath(d);

            function noHighlightPath(d) {
                if (d) 
                {
                    d3.select(labels[d.id]).transition().style("font-weight","normal").style("font-size","12px");
                    d3.select(circles[d.id]).transition().style("fill-opacity",function(d){return d.population===0?1:0.3});
                    d3.select(paths[d.id]).style("stroke-opacity",function (d) {return ((d.source.depth + 1) / 4.5);});
                    noHighlightPath(d.parent);
                }
            }
        }

    }

    // Toggle children on click.
    function click(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(d);
    }