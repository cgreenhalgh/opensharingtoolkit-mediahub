CKEDITOR.plugins.add( 'mediahubaudio', {
    requires: 'widget',
    //lang: 'en', 

    icons: 'mediahubaudio',
    hidpi: false,

    init: function( editor ) {

	editor.widgets.add( 'mediahubaudio', {

	    button: 'Insert an Audio File',
  
	    template:
        	'<audio controls><source type="audio/mpeg" src=""/><source type="audio/ogg" src=""/></audio>',
            allowedContent:
                'audio; source',

            requiredContent: 'audio; source[type,src]',

            upcast: function( element ) {
                return element.name == 'audio';
            },

	    init: function() {
                var srcMpeg, srcOgg;
                for( var i=0; i < this.element.getChildCount(); i++) {
		  var child = this.element.getChild( i );
                  if (child.getName() == 'source' ) {
                    var type = child.getAttribute( 'type' );
                    if (type === 'audio/mpeg')
                      srcMpeg = child.getAttribute( 'src' );
                    else if (type === 'audio/ogg')
                      srcOgg = child.getAttribute( 'src' );
                  }
                }
                this.setData( 'srcMpeg', srcMpeg );
                this.setData( 'srcOgg', srcOgg );
	    },

	    data: function() {
                for( var i=0; i < this.element.getChildCount(); i++) {
		  var child = this.element.getChild( i );
                  if (child.getName() == 'source' ) {
                    var type = child.getAttribute( 'type' );
                    if (type === 'audio/mpeg')
                      child.setAttribute( 'src', this.data.srcMpeg );
                    else if (type === 'audio/ogg')
                      child.setAttribute( 'src', this.data.srcOgg );
                  }
                }
	    },

	    dialog: 'mediahubaudio'

	} );

        CKEDITOR.dialog.add( 'mediahubaudio', this.path + 'dialogs/mediahubaudio.js' );

    }

} );

