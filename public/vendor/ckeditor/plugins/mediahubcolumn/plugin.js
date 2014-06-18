CKEDITOR.plugins.add( 'mediahubcolumn', {
    requires: 'widget',
    //lang: 'en', 

    icons: 'mediahubcolumn',
    hidpi: false,
    onLoad: function() {
	console.log( "mediahubcolumn.onLoad - addCss" );
	CKEDITOR.addCss(
		'.mediahubcolumn {'+
		'  border-top-style: solid;'+
		'  border-top-width: 1px;'+
		'  border-left-style: solid;'+
		'  border-left-width: 1px;'+
		'  background-image: url("vendor/ckeditor/plugins/mediahubcolumn/icons/mediahubcolumn.png");'+
		'  background-repeat: no-repeat;'+
		'  height: 1em;'+
                '  margin: 0.2em;'+
		'};'
	);
    },
    init: function( editor ) {

	editor.widgets.add( 'mediahubcolumn', {

	    button: 'Insert a Column',
  
	    template:
        	'<div class="mediahubcolumn"></div>',
            allowedContent:
                'div(!mediahubcolumn)',

            requiredContent: 'div(mediahubcolumn)',

            upcast: function( element ) {
                return element.name == 'div' && element.hasClass( 'mediahubcolumn' );
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

