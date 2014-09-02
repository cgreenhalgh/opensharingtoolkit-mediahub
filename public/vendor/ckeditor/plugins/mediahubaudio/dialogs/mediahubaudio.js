CKEDITOR.dialog.add( 'mediahubaudio', function( editor ) {
    return {
        // Dialog window definition will be added here.
        title: 'Edit Audio',
        minWidth: 200,
        minHeight: 100,
        contents: [
            {
                id: 'files',
                elements: [
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
    filebrowser: 'files:srcMpeg',
    label: 'Browse server...',
    style: 'float:right',
},
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
    filebrowser: 'files:srcOgg',
    label: 'Browse server...',
    style: 'float:right',
}
                ]
            }
        ]
    };
} );
