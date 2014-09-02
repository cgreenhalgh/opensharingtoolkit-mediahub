/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here.
	// For complete reference see:
	// http://docs.ckeditor.com/#!/api/CKEDITOR.config

	// The toolbar groups arrangement, optimized for two toolbar rows.
	config.toolbarGroups = [
		{ name: 'clipboard',   groups: [ 'clipboard', 'undo' ] },
		{ name: 'editing',     groups: [ 'find', 'selection' ] }, //, 'spellchecker'
		{ name: 'links' },
		{ name: 'insert' },
		{ name: 'forms' },
		{ name: 'tools' },
		{ name: 'document',	   groups: [ 'mode', 'document', 'doctools' ] },
		{ name: 'others' },
		'/',
		{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
		{ name: 'paragraph',   groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ] },
		{ name: 'styles' },
		{ name: 'colors' },
		{ name: 'about' }
	];

	/*config.toolbar = [
		{ name: 'clipboard',   items: [ 'Undo', 'Redo' ] },
                { name: 'insert', items: [ 'Insert a Column' ] }
	];*/

	// not enough: undo,toolbar,
	// basic: about,basicstyles,clipboard,toolbar,enterkey,entities,floatingspace,wysiwygarea,indentlist,link,list
	//config.plugins = "toolbar,enterkey,floatingspace,wysiwygarea,magicline,contextmenu,elementspath,sourcearea,basicstyles,format,undo";
	// default to standard build
        config.extraPlugins = "widget,mediahubcolumn,mediahubcomment,mediahubaudio";
	// config.mediahubcomment_replaceParagraphs = true;
        config.allowedContent = "div(mediahubcolumn); h1; h2; div(mediahubcomment); h3; h4; p; li; ul; ol; img[alt,src,width,height]; a[href,id]; strong; em; b; i; audio[controls]; source[type,src]";
};

