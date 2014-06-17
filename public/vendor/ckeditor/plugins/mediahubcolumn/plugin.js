CKEDITOR.plugins.add( 'mediahubcolumn', {
    requires: 'widget',
    //lang: 'en', 

    icons: 'mediahubcolumn',
    hidpi: false,

    init: function( editor ) {

	editor.widgets.add( 'mediahubcolumn', {

	    button: 'Insert a Column',
  
	    template:
        	'<div class="column"></div>',
            allowedContent:
                'div(!column)',

            requiredContent: 'div(column)',

            upcast: function( element ) {
                return element.name == 'div' && element.hasClass( 'column' );
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

