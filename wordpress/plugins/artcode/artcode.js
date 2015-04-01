/* artcode.js
 * 
 * artcode wordpress plugin javascript helpers, e.g. search, explicit items 
 */

/* global ajaxurl */

(function($) {

	var api;

	api = {
		init : function() {
			$('#artcode_marker_search_id').on('click',function(ev) {
				// api.XXX
				var search = $('input[name=artcode_marker_search_search]').val(),
					cat = $('select[name=artcode_marker_search_cat]').val(),
					post_type = $('select[name=artcode_marker_search_type]').val(),
					author = $('select[name=artcode_marker_search_author]').val(),
					orderby = $('select[name=artcode_marker_search_orderby]').val(),
					reverse = $('input[name=artcode_marker_search_reverse]').prop('checked');
				var div = $('#artcode_marker_search_result');
				var spin = $('#artcode_marker_search_spinner');
				div.html('<p>Searching...</p>');
				spin.find('.spinner').show();
				var params = { action: 'artcode_marker_search', search: search,
					cat: cat, post_type: post_type, author: author, orderby: orderby, 
					reverse: (reverse ? '1' : '0'),
				};
				console.log("artcode_marker_search with "+JSON.stringify(params));
				$.ajax({
					url: ajaxurl, 
					data: params,
					dataType: 'text',
					type: 'POST', 
					success: function(data) {
						console.log("artcode search got: "+data);
						spin.find('.spinner').hide();
						div.empty();
						var res = JSON.parse(data);
						api.showThingList( res );
				}});
			});
			$(document).on('click', 'input[name=artcode_marker_add_selected]',function(ev) {
				//console.log("Add selected...");
				var inputs = $('#artcode_marker_search_result input[type=checkbox]:checked');
				var posts = [];
				console.log("Add selected ("+inputs.size()+")");
				var things = $('#artcode_markers');
				var ix = $('.artcode_marker', things).size();
				inputs.each(function() { 
					var id = $(this).attr('name');
					if (id.indexOf('-')>=0)
						id = id.substring(id.indexOf('-')+1);
					var post = JSON.parse( $('input[name=artcode_marker_res_json-'+id+']').val() );
					var artcode = post['_artcode_code'];
					things.append('<div class="artcode_marker submitbox">'+
						'<input type="hidden" name="artcode_marker_id-'+(ix++)+'" value="'+id+'"/>'+
						'<span class="artcode_marker_title">'+$('<div/>').text(post.post_title).html()+'</span> '+
						'<span class="description">'+$('<div/>').text(artcode).html()+' '+
						'<a href="'+post.edit_url+'" target="_blank" class="'+(!post.edit_url ? 'hide' : '')+'">Edit</a> '+
						'<a href="'+post.view_url+'" target="_blank" class="">View</a> '+
						'| '+
						'<a href="#" class="item-delete submitdelete deletion artcode_marker_remove">Remove</a> '+
						'<a href="#" class="menu_move_down artcode_marker_up">Up</a> '+
						'<a href="#" class="menu_move_up artcode_marker_down">Down</a>'+
						'</span></div>');
				});
				api.fix_items();
				//console.log("Add selected: "+JSON.stringify(posts));
				
			});
			function get_ix(ev) {
				var ix = $(ev.currentTarget).closest('.artcode_marker').children('input[type=hidden]').attr('name');
				var i = ix.indexOf('-');
				if (i>=0)
					ix = ix.substring(i+1);
				return Number(ix);
			}
			$('#artcode_markers').on('click','a.artcode_marker_remove',function(ev) {
				ev.preventDefault();
				var ix = get_ix(ev);
				console.log("remove "+ix);
				$(ev.currentTarget).closest('.artcode_marker').remove();
				api.fix_items();	
			});
			$('#artcode_markers').on('click','a.artcode_marker_down',function(ev) {
				ev.preventDefault();
				var ix = get_ix(ev);
				console.log("down "+ix);	
				var things = $('#artcode_markers');
				var ts = $('.artcode_marker', things);
				if (ix+1 < ts.length) {
					var t = $(ev.currentTarget).closest('.artcode_marker');
					t.remove();
					$(ts[ix+1]).after(t);
				}				
				api.fix_items();	
			});
			$('#artcode_markers').on('click','a.artcode_marker_up',function(ev) {
				ev.preventDefault();
				var ix = get_ix(ev);
				console.log("up "+ix);	
				if (ix>0) {
					var things = $('#artcode_markers');
					var ts = $('.artcode_marker', things);
					var t = $(ev.currentTarget).closest('.artcode_marker');
					t.remove();
					$(ts[ix-1]).before(t);
				}				
				api.fix_items();	
			});
		},
		fix_items: function () {
			var things = $('#artcode_markers');
			var ts = $('.artcode_marker', ts);
			var inputs = $('input[type=hidden]', things);
			for (var i=0; i<ts.length; i++) {
				var t = ts[i];
				$('input[type=hidden]', t).attr('name','artcode_marker_id-'+i);
				$('a.artcode_marker_up', t).toggleClass('hide',i==0);
				$('a.artcode_marker_down', t).toggleClass('hide',i+1==ts.length);
			}
		},
		showThingList: function( posts ) {
			var div = $('#artcode_marker_search_result');
			div.empty();
			if ( posts.length == 0 ) {
				div.html("<p>No posts found</p>");
				return;	
			}
			for (var i in posts) {
				var post = posts[i]; 
				if (post.more) {
					div.append("<p>(more)</p>");
					break;
				}
				var p = $('<p><label><input type="checkbox" name="artcode_marker_res-'+post.ID+'"/>'+
					$('<div/>').text(post.post_title+(post._artcode_code!='' ? ' ('+post._artcode_code+')':'')).html()+'</label>'+
					'<input type="hidden" name="artcode_marker_res_json-'+post.ID+'"/>'+
					'</p>');	
				$('input[type=hidden]', p).val(JSON.stringify(post));
				div.append(p);
			}
			div.append('<div><input type="button" name="artcode_marker_add_selected" value="Add Selected"/></div>');
		}
	};

	$(document).ready(function(){ api.init(); });

})(jQuery);

