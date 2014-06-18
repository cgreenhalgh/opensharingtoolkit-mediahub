CKEDITOR.plugins.add( 'mediahubcomment', {
    requires: 'widget',
    //lang: 'en', 

    icons: 'mediahubcomment',
    hidpi: false,
    onLoad: function() {
	console.log( "mediahubcomment.onLoad - addCss" );
	CKEDITOR.addCss(
		'.mediahubcomment {'+
		'  border-top-style: solid;'+
		'  border-top-width: 1px;'+
		'  border-left-style: solid;'+
		'  border-left-width: 1px;'+
		'  background-image: url("vendor/ckeditor/plugins/mediahubcomment/icons/mediahubcomment.png");'+
		'  background-repeat: no-repeat;'+
                '  margin: 0.2em;'+
		'  padding-left: 18px;'+
		'  font-style: italic;'+
		'  background-color: #ccc;'+
		'};'
	);
    },
    init: function( editor ) {

	editor.widgets.add( 'mediahubcomment', {

	    button: 'Insert a Comment',
  
	    template:
        	'<div class="mediahubcomment"><p></p></div>',

	    editables: {
	        content: {
	            selector: '.mediahubcomment',
		    allowedContent: 'p' // p?
	        }
	    },

            allowedContent:
                'div(!mediahubcomment)',

            requiredContent: 'div(mediahubcomment)',

            upcast: function( element ) {
                // eat top-level <p>s?
		if (element.name == 'p' ) {
		    var div = element.getAscendant( 'div' );
		    // wrapper?
		    while ( div && div.hasClass( 'cke_widget_wrapper' ))
		        div = div.getAscendant( 'div' );
		    if ( div ) {
		        console.log( "Skip p in div "+div.getOuterHtml() );
		        return false;
		    }
		    var el = new CKEDITOR.htmlParser.element( 'div' );
		    el.addClass( 'mediahubcomment' );
		    var html = element.getOuterHtml();
		    el.setHtml( html );
		    console.log( "upcast p to comment: "+html );
		    element.replaceWith( el );
		    return el;
		}

                return element.name == 'div' && element.hasClass( 'mediahubcomment' );
            },

	    init: function() {
	        // ...
	    },

	    data: function() {
	        // ...
	    }

	} );
    }

} );

