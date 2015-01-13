// postselector.js
/*d3.select("body").selectAll("p")
    .data([4, 8, 15, 16, 23, 42])
  .enter().append("p")
    .text(function(d) { return "I’m number " + d + "!"; });
*/
var datas = {};
//for (var iid in window.postselector.ids) {
//  var id = window.postselector.ids[iid];
var data = null;
function load( id ) {
  console.log("id "+id);
  $.ajax(window.postselector.ajaxurl, {
    data: { action: "postselector_get_posts", security: window.postselector.nonce, id: id },
    dataType: 'text',
    error: function(xhr, status, thrown) { console.log("get error: "+status); alert("Sorry, could not get data from wordpress"); },
    success: function(d) { 
      console.log("get success for "+id+": "+d); 
      ndata = JSON.parse( d );
      datas[id] = ndata;
      // preserve ranks (and array object) if unspecified
      if (data) {
        var ds = {};
        for (var i in ndata)
          ds[ndata[i].id] = i;
        var ods = {}
        for (var i in data)
          ods[data[i].id] = i;
        
        for (var id in ods) 
          if (ds[id]===undefined)
            data.splice(ods[id],1);
        for (var id in ds) 
          if (ods[id]===undefined)
            data.push(ndata[ds[id]]);
         // todo: other fields changed??
      } else
        data = ndata;
      update();
    }
  });
}
load( window.postselector.ids[0] );

$('#refresh').on('click',function() {
  load( window.postselector.ids[0], datas[window.postselector.ids[0]] );
});

function comparePosts(a,b) {
  if ( ( a.rank===undefined || a.rank===null ) && ( b.rank!==undefined && b.rank!==null ) )
    return 1;
  if ( ( a.rank!==undefined && a.rank!==null ) && ( b.rank===undefined || b.rank===null ) )
    return -1;
  return a.rank-b.rank;
}
var currentSelection = null;
var dragSelection = null;
var ghost = null;
var laneRanks = [0,0,0];
var detail = null;
function update() {
  console.log("updateData currentSelection="+currentSelection);
  // preserve old order if any
  data.sort(comparePosts);
  laneRanks[0] = laneRanks[1] = laneRanks[2] = 0;
  for (var pi in data) {
    var p = data[pi];
    var lane = (p.selected===undefined || p.selected===null) ? 1 : (p.selected ? 2 : 0);
    p.lane = lane;
    p.rank = laneRanks[lane]++;
  }
  var posts = d3.select("svg.postselector")
    .selectAll("g.post")
     .data(data, function(d) { return d.id; });
  // update
  posts.classed("current",function(d) { console.log("classed "+d.id); return d.id==currentSelection || d.id==dragSelection });
  var trans = posts.transition().duration(250);
  trans.attr("transform", function(d,i) { 
          console.log("transform "+d.id+" currentSelection? "+(d.id==currentSelection));
          if (d.id==currentSelection) 
            return "translate(50,50)"; 
          else 
            return "translate("+(16+333*d.lane)+","+(10+d.rank*60)+")"; 
        })
       .selectAll('rect')
         .attr("width", function(d) { return d.id==currentSelection ? 900 : 300; })
         .attr("height", function(d) { return d.id==currentSelection ? 900 : 50; });
  trans.selectAll('image')
         .attr("width", function(d) { return d.id==currentSelection ? 196 : 46; })
         .attr("height", function(d) { return d.id==currentSelection ? 196 : 46; });
  trans.selectAll('text')
         .attr("x", function(d) { return d.id==currentSelection ? 200 : 60; })
  // enter
  var nposts = posts.enter().append("g")
      .attr("id", function(d) {return "post"+d.id})
      .classed("post", true)
      .attr("transform", function(d,i) { return "translate("+(16+333*d.lane)+",2000)"; });
  nposts.transition().duration(1000)
      .attr("transform", function(d,i) { return "translate("+(16+333*d.lane)+","+(10+d.rank*60)+")"; });
  nposts.append("clipPath").attr("id", function(d) { return "post"+d.id+"-clip" })
    .append("rect").attr("width",300).attr("height",50);
  nposts.append("rect")
      .classed("post", true).attr("width",300).attr("height",50);
  nposts.append("text")
      .classed("post", true).attr("width",300).attr("x", 60)
      .attr("y", 0)
      .attr("dy", "1em")
      .attr("clip-path", function(d) { return "url(#post"+d.id+"-clip)" })
      .text(function(d) { return d.title; });
  nposts.append("image").attr("xlink:href", function(d) { return d.iconurl ? d.iconurl : '' }).
    attr("width", 46).attr("height", 46).attr("x",2).attr("y",2);
  //nposts.append("foreignObject")
  //    .attr("x", 20).attr("y", 60).attr("width", 860).attr("height", 820)
  //    .append("xhtml:body").append("xhtml:div").classed("content", true).html(function(d) { return d.content; });
  nposts.on('click', function(d,i) {
    if (d3.event.defaultPrevented) return; // click suppressed
    console.log("click on "+d.id);
    if (detail) {
      detail.remove();
      detail = null;
    }
    if (d.id==currentSelection)
      currentSelection = null;
    else {
      currentSelection = d.id;
      detail = d3.select(d3.event.currentTarget).append("foreignObject")
        .attr("x", 20).attr("y", 200).attr("width", 860).attr("height", 680).style("opacity", 0);
      detail.append("xhtml:body").classed("post",true).append("xhtml:div").classed("content", true).html(function(d) { return d.content; });
      detail.transition().delay(250).style("opacity", 1);
    }
    for (var i=0; i<data.length; i++) {
      var item = data[i];
      if (item.id==d.id) {
        data.splice(i,1);
        data.push(item);
        d3.select("svg.postselector")
          .selectAll("g.post")
            .data(data, function(d) { return d.id; })
            .order();        
        break;
      }
    }
    update();
  });
  var drag = d3.behavior.drag()
    .on("dragstart", function(d) {
      console.log("dragstart");
     })
    .on("drag", function(d) {
      console.log("drag");
      var changed = false;
      if (currentSelection!==null) {
        if (detail) {
          detail.remove();
          detail = null;
        }
        currentSelection = null;
        changed = true;
      }
      if (ghost==null) {
        dragSelection = d.id;
        changed = true;
        ghost = d3.select("svg.postselector").append("rect")
            .classed("ghost", true).attr("width", 300).attr("height", 50);
      }
      if (changed)
        update();    

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
        update();
     })
    .on("dragend", function(d) {
      console.log("dragend");
      if (ghost)
        ghost.remove();
      ghost = null;
      if (dragSelection) {
        dragSelection = null;
        update();
      }
     });
  nposts.call(drag);
  // exit
  posts.exit().remove();
}

$('input[type=submit]').on('click',function(ev) {
  ev.preventDefault();
  var id = ev.currentTarget.id;
  var ix = id.indexOf('-');
  id = id.substring(ix+1);
  console.log("submit "+id);
  if (id==window.postselector.ids[0]) {
    $('#submit'+id).prop('disabled', true);
    var res = { selected:[], rejected:[] };
    data.sort(comparePosts);
    for (var di=0; di<data.length; di++) {
      var post = data[di];
      if (post.selected!==null && post.selected!==undefined) {
        if (post.selected)
          res.selected.push(post.id);
        else
          res.rejected.push(post.id);
      }
    }  
    var postData = String(JSON.stringify(res));
    console.log("post "+postData);
    $.ajax(window.postselector.ajaxurl, {
      data: { action: "postselector_save", security: window.postselector.nonce, id: id, choices: postData },
      dataType: 'text',
      type: 'POST',
      error: function(xhr, status, thrown) { 
        console.log("save error: "+status); alert("Sorry, could not save data to wordpress"); 
        $('#'+id).prop('disabled', false);
      },
      success: function(res) { 
        console.log("save result for "+id+": "+res); 
        if (res=='0' || res=='1' || res.substring(0,1)=='#') 
          alert("Sorry, could not save data to wordpress"); 
        $('#'+id).prop('disabled', false);
      }
    });
  }
});

