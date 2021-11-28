"use strict";

(function(jQuery, CodeMirror) {

const CodeMirrorDiffView = require('./diff-view');

const Mergely = function() { };

Mergely.prototype.name = 'mergely';

Mergely.prototype.init = function(el, options) {
	this.diffView = new CodeMirrorDiffView(el, options, { jQuery, CodeMirror });
	this.bind(el);
};

Mergely.prototype.bind = function(el) {
	this.diffView.bind(el);
};

window.mergely = function (selector, options = {}) {
	let element = selector;
	if (typeof selector === 'string') {
		element = document.querySelector(selector);
		if (!element) {
			throw new Error(`Failed to find: ${selector}`);
		}
	} else if (!element) {
		throw new Error('Element cannot be null');
	}
	const mergely = new Mergely();
	mergely.init(element, options);
};

})(require('jquery'), require('CodeMirror'));
