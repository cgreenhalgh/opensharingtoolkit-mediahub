/* wototo.js
 * 
 * wototo wordpress plugin javascript helpers, e.g. search, explicit items 
 */

/* global ajaxurl */

(function($) {

	var api;

	api = {
		init : function() {
			$('#wototo_thing_search_id').on('click',function(ev) {
				// api.XXX
				var search = $('input[name=wototo_thing_search_search]').val(),
					cat = $('select[name=wototo_thing_search_cat]').val(),
					post_type = $('select[name=wototo_thing_search_type]').val(),
					author = $('select[name=wototo_thing_search_author]').val(),
					orderby = $('select[name=wototo_thing_search_orderby]').val(),
					reverse = $('input[name=wototo_thing_search_reverse]').prop('checked');
				var div = $('#wototo_thing_search_result');
				var spin = $('#wototo_thing_search_spinner');
				div.html('<p>Searching...</p>');
				spin.find('.spinner').show();
				var params = { action: 'wototo_thing_search', search: search,
					cat: cat, post_type: post_type, author: author, orderby: orderby, 
					reverse: (reverse ? '1' : '0'),
				};
				console.log("wototo_thing_search with "+JSON.stringify(params));
				$.ajax({
					url: ajaxurl, 
					data: params,
					dataType: 'text',
					type: 'POST', 
					success: function(data) {
						console.log("wototo search got: "+data);
						spin.find('.spinner').hide();
						div.empty();
						var res = JSON.parse(data);
						api.showThingList( res );
				}});
			});
			$(document).on('click', 'input[name=wototo_thing_add_selected]',function(ev) {
				//console.log("Add selected...");
				var inputs = $('#wototo_thing_search_result input[type=checkbox]:checked');
				var posts = [];
				console.log("Add selected ("+inputs.size()+")");
				var things = $('#wototo_things');
				var ix = $('.wototo_thing', things).size();
				inputs.each(function() { 
					var id = $(this).attr('name');
					if (id.indexOf('-')>=0)
						id = id.substring(id.indexOf('-')+1);
					var post = JSON.parse( $('input[name=wototo_thing_res_json-'+id+']').val() );
					things.append('<div class="wototo_thing submitbox">'+
						'<input type="hidden" name="wototo_thing_id-'+(ix++)+'" value="'+id+'"/>'+
						'<span class="wototo_item_title">'+$('<div/>').text(post.post_title).html()+'</span> '+
						'<span class="description">'+
						'<a href="#" class="item-delete submitdelete deletion wototo_thing_remove">Remove</a> '+
						'<a href="#" class="menu_move_down wototo_thing_up">Up</a> '+
						'<a href="#" class="menu_move_up wototo_thing_down">Down</a>'+
						'</span></div>');
				});
				api.fix_items();
				//console.log("Add selected: "+JSON.stringify(posts));
				
			});
			function get_ix(ev) {
				var ix = $(ev.currentTarget).closest('.wototo_thing').children('input[type=hidden]').attr('name');
				var i = ix.indexOf('-');
				if (i>=0)
					ix = ix.substring(i+1);
				return Number(ix);
			}
			$('#wototo_things').on('click','a.wototo_thing_remove',function(ev) {
				ev.preventDefault();
				var ix = get_ix(ev);
				console.log("remove "+ix);
				$(ev.currentTarget).closest('.wototo_thing').remove();
				api.fix_items();	
			});
			$('#wototo_things').on('click','a.wototo_thing_down',function(ev) {
				ev.preventDefault();
				var ix = get_ix(ev);
				console.log("down "+ix);	
				var things = $('#wototo_things');
				var ts = $('.wototo_thing', things);
				if (ix+1 < ts.length) {
					var t = $(ev.currentTarget).closest('.wototo_thing');
					t.remove();
					$(ts[ix+1]).after(t);
				}				
				api.fix_items();	
			});
			$('#wototo_things').on('click','a.wototo_thing_up',function(ev) {
				ev.preventDefault();
				var ix = get_ix(ev);
				console.log("up "+ix);	
				if (ix>0) {
					var things = $('#wototo_things');
					var ts = $('.wototo_thing', things);
					var t = $(ev.currentTarget).closest('.wototo_thing');
					t.remove();
					$(ts[ix-1]).before(t);
				}				
				api.fix_items();	
			});
		},
		fix_items: function () {
			var things = $('#wototo_things');
			var ts = $('.wototo_thing', ts);
			var inputs = $('input[type=hidden]', things);
			for (var i=0; i<ts.length; i++) {
				var t = ts[i];
				$('input[type=hidden]', t).attr('name','wototo_thing_id-'+i);
				$('a.wototo_thing_up', t).toggleClass('hide',i==0);
				$('a.wototo_thing_down', t).toggleClass('hide',i+1==ts.length);
			}
		},
		showThingList: function( posts ) {
			var div = $('#wototo_thing_search_result');
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
				var p = $('<p><label><input type="checkbox" name="wototo_thing_res-'+post.ID+'"/>'+
					$('<div/>').text(post.post_title).html()+'</label>'+
					'<input type="hidden" name="wototo_thing_res_json-'+post.ID+'"/>'+
					'</p>');	
				$('input[type=hidden]', p).val(JSON.stringify(post));
				div.append(p);
			}
			div.append('<div><input type="button" name="wototo_thing_add_selected" value="Add Selected"/></div>');
		}
	};

	$(document).ready(function(){ api.init(); });

})(jQuery);

