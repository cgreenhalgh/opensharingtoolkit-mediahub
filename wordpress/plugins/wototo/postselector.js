// postselector.js
/*d3.select("body").selectAll("p")
    .data([4, 8, 15, 16, 23, 42])
  .enter().append("p")
    .text(function(d) { return "I’m number " + d + "!"; });
*/
for (var iid in window.postselector.ids) {
  var id = window.postselector.ids[iid];
  console.log("id "+id);
  $.ajax(window.postselector.ajaxurl, {
    data: { action: "postselector_get_posts", security: window.postselector.nonce, id: id },
    dataType: 'text',
    error: function(xhr, status, thrown) { console.log("get error: "+status); },
    success: function(data) { 
      console.log("get success for "+id+": "+data); 
      data = JSON.parse( data );
      updateData(data);
    }
  });
}
function comparePosts(a,b) {
  if ( a.rank===undefined && b.rank!==undefined )
    return 1;
  if ( a.rank!==undefined && b.rank===undefined )
    return -1;
  return a.rank-b.rank;
}
var currentSelection = null;
var ghost = null;
var laneRanks = [0,0,0];
var use = null;
function updateData(data) {
  console.log("updateData currentSelection="+currentSelection);
  // preserve old order if any
  data.sort(comparePosts);
  laneRanks[0] = laneRanks[1] = laneRanks[2] = 0;
  for (var pi in data) {
    var p = data[pi];
    var lane = p.selected===undefined ? 1 : (p.selected ? 2 : 0);
    p.lane = lane;
    p.rank = laneRanks[lane]++;
  }
  var posts = d3.select("svg.postselector")
    .selectAll("g.post")
     .data(data, function(d) { return d.id; });
  // update
  posts.transition().duration(250)
    .attr("transform", function(d,i) { 
          console.log("transform "+d.id+" currentSelection? "+(d.id==currentSelection));
          if (d.id==currentSelection) 
            return "translate(50,50)"; 
          else 
            return "translate("+(10+333*d.lane)+","+(10+d.rank*60)+")"; 
        })
       .selectAll('rect')
         .attr("width", function(d) { return d.id==currentSelection ? 900 : 300; })
         .attr("height", function(d) { return d.id==currentSelection ? 900 : 50; });
  // enter
  var nposts = posts.enter().append("g")
      .attr("id", function(d) {return "post"+d.id})
      .classed("post", true)
      .attr("transform", function(d,i) { return "translate("+(10+333*d.lane)+","+(10+d.rank*60)+")"; });
  nposts.append("rect")
      .classed("post", true).attr("width",300).attr("height",50);
  nposts.append("text")
      .classed("post", true).attr("x", 10)
      .attr("y", 0)
      .attr("dy", "1em")
      .text(function(d) { return d.title; });
  nposts.on('click', function(d,i) {
    if (d3.event.defaultPrevented) return; // click suppressed
    console.log("click on "+d.id);
    if (d.id==currentSelection)
      currentSelection = null;
    else
      currentSelection = d.id;
    if (use!=null)
      use.remove();
    use = d3.select("svg.postselector").append("use").attr("xlink:href", "#post"+d.id);
    updateData(data);
  });
  var drag = d3.behavior.drag()
    .on("dragstart", function(d) {
      console.log("dragstart");
     })
    .on("drag", function(d) {
      console.log("drag");
      if (currentSelection!==null) {
        currentSelection = null;
        updateData(data);    
      }
      if (ghost==null) {
        ghost = d3.select("svg.postselector").append("rect")
            .classed("ghost", true).attr("width", 300).attr("height", 50);
      }
      ghost.attr("x", d3.event.x-150).attr("y", d3.event.y-25);
      var selected = d3.event.x<333 ? false : (d3.event.x>667 ? true : null);
      var moved = false;
      if (d.selected!==selected && !(d.selected===undefined && selected==null)) {
        console.log("post "+d.id+" selected "+d.selected+" -> "+selected);
        if (selected == null)
          delete d.selected; 
        else
          d.selected = selected;
        moved = true;
      }      
      var rank = Math.floor((d3.event.y)/60);
      if (d.rank!=rank && rank<laneRanks[d.lane]) {
        console.log("change rank "+d.rank+" -> "+rank);
        if (rank>d.rank)
          d.rank = rank+0.5;
        else
          d.rank = rank-0.5;
        moved = true;
      }
      if (moved)
        updateData(data);
     })
    .on("dragend", function(d) {
      console.log("dragend");
      if (ghost)
        ghost.remove();
      ghost = null;
     });
  nposts.call(drag);
  // exit
  posts.exit().remove();
}
