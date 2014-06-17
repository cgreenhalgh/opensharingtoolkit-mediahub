/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here.
	// For complete reference see:
	// http://docs.ckeditor.com/#!/api/CKEDITOR.config

	// The toolbar groups arrangement, optimized for two toolbar rows.
	config.toolbar = [
		{ name: 'clipboard',   items: [ 'Undo', 'Redo' ] }
	];
        config.plugins = "undo,toolbar,widget,mediahubcolumn";
        config.allowedContent = "div(column); h1; div(html); div(*)";
};
