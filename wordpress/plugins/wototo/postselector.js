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
      var posts = d3.select("svg.postselector").selectAll("g.post")
          .data(data, function(d) { return d.id; })
        .enter().append("g")
          .attr("transform", function(d,i) { return "translate(10,"+(10+i*60)+")"; });
      posts.append("rect")
       .classed("post", true).attr("width",300).attr("height",50);
      posts.append("text")
       .classed("post", true).attr("x", 10)
       .attr("y", 0)
       .attr("dy", "1em")
       .text(function(d) { return d.title; });
    }
  });
}

