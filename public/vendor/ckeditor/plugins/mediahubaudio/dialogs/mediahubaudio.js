CKEDITOR.dialog.add( 'mediahubaudio', function( editor ) {
    return {
        // Dialog window definition will be added here.
        title: 'Edit Audio',
        minWidth: 200,
        minHeight: 100,
        contents: [
            {
                id: 'files',
                Label: 'Files',
                elements: [
		    {
	                type : 'hbox', 
        	        widths : [ '280px', '110px' ],
        	        align : 'right',
        	        children : [
        	            {
        	                id: 'srcMpeg',
        	                type: 'text',
        	                label: 'MPEG file URL',
        	                width: '200px',
        	                setup: function( widget ) {
        	                    this.setValue( widget.data.srcMpeg );
        	                },
        	                commit: function( widget ) {
        	                    widget.setData( 'srcMpeg', this.getValue() );
        	                }
        	            },
			    {
    				type: 'button',
    				hidden: true,
    				id: 'browseMpeg',
                                filebrowser :
                                {
                                    action : 'Browse',
                                    target: 'files:srcMpeg',
                                    url: editor.config.filebrowserAudioBrowseMpegUrl
                                },
    				label: 'Browse server...',
                                style : 'display:inline-block;margin-top:10px;',
                                align : 'center'
			    }
			]
		    },
		    {
	                type : 'hbox', 
        	        widths : [ '280px', '110px' ],
        	        align : 'right',
        	        children : [
	                    {
	                        id: 'srcOgg',
	                        type: 'text',
	                        label: 'OGG file URL',
	                        width: '200px',
	                        setup: function( widget ) {
	                            this.setValue( widget.data.srcOgg );
	                        },
	                        commit: function( widget ) {
	                            widget.setData( 'srcOgg', this.getValue() );
	                        }
	                    },
			    {
    				type: 'button',
    				hidden: true,
    				id: 'browseOgg',
                                filebrowser :
                                {
                                    action : 'Browse',
                                    target: 'files:srcOgg',
                                    url: editor.config.filebrowserAudioBrowseOggUrl
                                },
    				label: 'Browse server...',
                                style : 'display:inline-block;margin-top:10px;',
                                align : 'center'
			    }
 			]
		    }
                ]
            }
        ]
    };
} );
