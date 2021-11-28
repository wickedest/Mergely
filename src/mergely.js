"use strict";

(function(jQuery, CodeMirror) {

const diff = require('./diff');
const LCS = require('./lcs');
const CodeMirrorDiffView = require('./diff-view');

const Mgly = {};

Mgly.diff = diff;

Mgly.LCS = LCS;

Mgly.CodeMirrorDiffView = CodeMirrorDiffView;

Mgly.sizeOf = function(obj) {
	let size = 0;
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) size++;
	}
	return size;
};

Mgly.mergely = function(el, options) {
	if (el) {
		this.init(el, options);
	}
};

Mgly.mergely.prototype.name = 'mergely';

Mgly.mergely.prototype.init = function(el, options) {
	this.diffView = new Mgly.CodeMirrorDiffView(el, options, { jQuery, CodeMirror });
	this.bind(el);
};

Mgly.mergely.prototype.bind = function(el) {
	this.diffView.bind(el);
};

jQuery.pluginMaker = function(plugin) {
	// add the plugin function as a jQuery plugin
	jQuery.fn[plugin.prototype.name] = function(options) {
		// get the arguments
		const args = jQuery.makeArray(arguments),
		after = args.slice(1);
		let rc;
		this.each(function() {
			const tthis = this;
			// see if we have an instance
			const instance = jQuery.data(this, plugin.prototype.name);
			if (instance) {
				// call a method on the instance
				if (typeof options == "string") {
					rc = instance[options].apply(instance, after);
				} else if (instance.update) {
					// call update on the instance
					return instance.update.apply(instance, args);
				}
			} else {
				// create the plugin
				const _plugin = new plugin(this, options);
				jQuery.fn[`${plugin.prototype.name}Unregister`] = function() {
					jQuery.data(tthis, plugin.prototype.name, null);
				}
			}
		});
		if (rc != undefined) return rc;
	};
};

// make the mergely widget
jQuery.pluginMaker(Mgly.mergely);

})(require('jquery'), require('CodeMirror'));
