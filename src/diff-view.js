require('codemirror/addon/search/searchcursor.js');
require('codemirror/addon/selection/mark-selection.js');

const Timer = require('./timer');
const diff = require('./diff');
const DiffParser = require('./diff-parser');
const LCS = require('./lcs');

/**
CHANGES:

BREAKING:
Removed dependency on `jQuery`.
Added `.mergely-editor` to the DOM to scope all the CSS changes.
CSS now prefixes `.mergely-editor`.
Current active change gutter line number style changed from `.CodeMirror-linenumber` to `.CodeMirror-gutter-background`.
Removed support for jquery-ui merge buttons.
API switched from jQuery style to object methods.
No longer necessary to separately require codemirror/addon/search/searchcursor
No longer necessary to separately require codemirror/addon/selection/mark-selection

FEATURE:
Gutter click now scrolls to any line.
FIX:
Fixed issue where canvas markup was not rendered when `viewport` enabled.
Fixed timing issue where swap sides may not work as expected.
Fixed issue where unmarkup did not emit an updated event.
Fixed issue where init triggered an updated event when autoupdate is disabled.
Fixed documentation issue where `merge` incorrectly stated: from the specified `side` to the opposite side
*/
const MERGELY_ICON = 'data:image/png;base64,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';

const NOTICES = [
	'lgpl-separate-notice',
	'gpl-separate-notice',
	'mpl-separate-notice',
	'commercial'
];

function CodeMirrorDiffView(el, options, { CodeMirror }) {
	CodeMirror.defineExtension('centerOnCursor', function() {
		const coords = this.cursorCoords(null, 'local');
		this.scrollTo(null,
			(coords.top + coords.bottom) / 2 - (this.getScrollerElement().clientHeight / 2));
	});
	this.CodeMirror = CodeMirror;

	this.init(el, options);
};

CodeMirrorDiffView.prototype.init = function(el, options = {}) {
	this.settings = {
		autoupdate: true,
		autoresize: true,
		rhs_margin: 'right',
		wrap_lines: false,
		line_numbers: true,
		lcs: true,
		sidebar: true,
		viewport: false,
		ignorews: false,
		ignorecase: false,
		ignoreaccents: false,
		fadein: 'fast',
		resize_timeout: 500,
		change_timeout: 150,
		fgcolor: {a:'#4ba3fa',c:'#a3a3a3',d:'#ff7f7f',  // color for differences (soft color)
			ca:'#4b73ff',cc:'#434343',cd:'#ff4f4f'},    // color for currently active difference (bright color)
		bgcolor: '#eee',
		vpcolor: 'rgba(0, 0, 200, 0.5)',
		license: 'lgpl',
		width: 'auto',
		height: 'auto',
		cmsettings: {
			styleSelectedText: true
		},
		lhs_cmsettings: {},
		rhs_cmsettings: {},
		lhs: function(setValue) { },
		rhs: function(setValue) { },
		loaded: function() { },
		resize: (init) => {
			const parent = el.parentNode;
			const { settings } = this;
			let width;
			let height;
			if (settings.width == 'auto') {
				width = parent.offsetWidth;
			}
			else {
				width = settings.width;
			}
			if (settings.height == 'auto') {
				height = parent.offsetHeight - 2;
			}
			else {
				height = settings.height;
			}
			const contentWidth = width / 2.0 - 2 * 8 - 8;
			const contentHeight = height;

			const lhsEditor = this._queryElement(`#${this.id}-editor-lhs`);
			lhsEditor.style.width = `${contentWidth}px`;
			lhsEditor.style.height = `${contentHeight}px`;
			const rhsEditor = this._queryElement(`#${this.id}-editor-rhs`);
			rhsEditor.style.width = `${contentWidth}px`;
			rhsEditor.style.height = `${contentHeight}px`;

			const lhsCM = this._queryElement(`#${this.id}-editor-lhs .cm-s-default`);
			lhsCM.style.width = `${contentWidth}px`;
			lhsCM.style.height = `${contentHeight}px`;
			const rhsCM = this._queryElement(`#${this.id}-editor-rhs .cm-s-default`);
			rhsCM.style.width = `${contentWidth}px`;
			rhsCM.style.height = `${contentHeight}px`;
			const lhsMargin = this._queryElement(`#${this.id}-lhs-margin`);
			lhsMargin.style.height = `${contentHeight}px`;
			lhsMargin.height = `${contentHeight}`;
			const midCanvas = this._queryElement(`.mergely-canvas canvas`);
			midCanvas.style.height = `${contentHeight}px`;
			midCanvas.height = `${contentHeight}`;
			const rhsMargin = this._queryElement(`#${this.id}-rhs-margin`);
			rhsMargin.style.height = `${contentHeight}px`;
			rhsMargin.height = `${contentHeight}`;

			if (settings.resized) {
				settings.resized();
			}
		},
		_debug: '', //scroll,draw,calc,diff,markup,change,init
		resized: function() { },
		// user supplied options
		...options
	};
	// save this element for faster queries
	this.el = el;

	this.lhs_cmsettings = {
		...this.settings.cmsettings,
		...this.settings.lhs_cmsettings,
		// these override any user-defined CodeMirror settings
		lineWrapping: this.settings.wrap_lines,
		lineNumbers: this.settings.line_numbers,
		gutters: (this.settings.line_numbers && [ 'merge', 'CodeMirror-linenumbers' ]) || [],
	};
	this.rhs_cmsettings = {
		...this.settings.cmsettings,
		...this.settings.rhs_cmsettings,
		// these override any user-defined CodeMirror settings
		lineWrapping: this.settings.wrap_lines,
		lineNumbers: this.settings.line_numbers,
		gutters: (this.settings.line_numbers && [ 'merge', 'CodeMirror-linenumbers' ]) || [],
	};

	this._setOptions(options);
};

CodeMirrorDiffView.prototype.unbind = function() {
	if (this.changed_timeout != null) {
		clearTimeout(this.changed_timeout);
	}
	this.editor.lhs.toTextArea();
	this.editor.rhs.toTextArea();
	this._unbound = true;
};

CodeMirrorDiffView.prototype.remove = function() {
	if (!this._unbound) {
		this.unbind();
	}
	while (this.el.lastChild) {
		this.el.removeChild(this.el.lastChild);
	}
};

CodeMirrorDiffView.prototype.lhs = function(text) {
	// invalidate existing changes and current position
	this.changes = [];
	delete this._current_diff;
	this.editor.lhs.setValue(text);
};

CodeMirrorDiffView.prototype.rhs = function(text) {
	// invalidate existing changes and current position
	this.changes = [];
	delete this._current_diff;
	this.editor.rhs.setValue(text);
};

CodeMirrorDiffView.prototype.update = function() {
	this._changing({ force: true });
};

CodeMirrorDiffView.prototype.unmarkup = function() {
	this._clear();
	this.trace('change', 'emit: updated');
	this.el.dispatchEvent(new Event('updated'));
};

CodeMirrorDiffView.prototype.scrollToDiff = function(direction) {
	if (!this.changes.length) return;
	if (direction === 'next') {
		if (this._current_diff == this.changes.length - 1) {
			this._current_diff = 0;
		} else {
			this._current_diff = Math.min(++this._current_diff, this.changes.length - 1);
		}
	}
	else if (direction === 'prev') {
		if (this._current_diff == 0) {
			this._current_diff = this.changes.length - 1;
		} else {
			this._current_diff = Math.max(--this._current_diff, 0);
		}
	}
	this._scroll_to_change(this.changes[this._current_diff]);
	this._changed();
};

CodeMirrorDiffView.prototype.mergeCurrentChange = function(side) {
	if (!this.changes.length) return;
	if (side == 'lhs' && !this.lhs_cmsettings.readOnly) {
		this._merge_change(this.changes[this._current_diff], 'rhs', 'lhs');
	}
	else if (side == 'rhs' && !this.rhs_cmsettings.readOnly) {
		this._merge_change(this.changes[this._current_diff], 'lhs', 'rhs');
	}
};

CodeMirrorDiffView.prototype.scrollTo = function(side, num) {
	this.trace('scroll', 'scrollTo', side, num);
	const ed = this.editor[side];
	ed.setCursor(num);
	ed.centerOnCursor();
};

CodeMirrorDiffView.prototype._setOptions = function(opts) {
	this.settings = {
		...this.settings,
		...opts
	};
	if (this.settings.hasOwnProperty('sidebar')) {
		// dynamically enable sidebars
		if (this.settings.sidebar) {
			const divs = document.querySelectorAll('.mergely-margin');
			for (const div of divs) {
				div.style.visibility = 'visible';
			}
		}
		else {
			const divs = document.querySelectorAll('.mergely-margin');
			for (const div of divs) {
				div.style.visibility = 'hidden';
			}
		}
	}
	// if options set after init
	if (this.editor) {
		const le = this.editor.lhs;
		const re = this.editor.rhs;
		if (opts.hasOwnProperty('wrap_lines')) {
			le.setOption('lineWrapping', this.settings.wrap_lines);
			re.setOption('lineWrapping', this.settings.wrap_lines);
		}
		if (opts.hasOwnProperty('line_numbers')) {
			le.setOption('lineNumbers', this.settings.line_numbers);
			re.setOption('lineNumbers', this.settings.line_numbers);
		}
		if (opts.hasOwnProperty('rhs_margin')) {
			// dynamically swap the margin
			const divs = document.querySelectorAll('.mergely-editor > div');
			// [0:margin] [1:lhs] [2:mid] [3:rhs] [4:margin], swaps 4 with 3
			divs[4].parentNode.insertBefore(divs[4], divs[3]);
		}
	}
};

CodeMirrorDiffView.prototype.options = function(opts) {
	if (opts) {
		this._setOptions(opts);
		if (this.settings.autoresize) this.resize();
		if (this.settings.autoupdate) this.update();
	}
	else {
		return this.settings;
	}
};

CodeMirrorDiffView.prototype.swap = function() {
	if (this.lhs_cmsettings.readOnly || this.rhs_cmsettings.readOnly) {
		return;
	}
	const le = this.editor.lhs;
	const re = this.editor.rhs;
	const lv = le.getValue();
	const rv = re.getValue();
	re.setValue(lv);
	le.setValue(rv);
};

CodeMirrorDiffView.prototype.merge = function(side) {
	const le = this.editor.lhs;
	const re = this.editor.rhs;
	if (side === 'lhs' && !this.lhs_cmsettings.readOnly) {
		le.setValue(re.getValue());
	} else if (!this.rhs_cmsettings.readOnly) {
		re.setValue(le.getValue());
	}
};

CodeMirrorDiffView.prototype.summary = function() {
	const le = this.editor.lhs;
	const re = this.editor.rhs;

	return {
		numChanges: this.changes.length,
		lhsLength: le.getValue().length,
		rhsLength: re.getValue().length,
		c: this.changes.filter(function (a) {
			return a.op === 'c';
		}).length,
		a: this.changes.filter(function (a) {
			return a.op === 'a';
		}).length,
		d: this.changes.filter(function (a) {
			return a.op === 'd';
		}).length
	}
};

CodeMirrorDiffView.prototype.get = function(side) {
	const ed = this.editor[side];
	const value = ed.getValue();
	if (value === undefined) {
		return '';
	}
	return value;
};

CodeMirrorDiffView.prototype.clear = function(side) {
	if (side == 'lhs' && this.lhs_cmsettings.readOnly) return;
	if (side == 'rhs' && this.rhs_cmsettings.readOnly) return;
	const ed = this.editor[side];
	ed.setValue('');
	delete this._current_diff;
};

CodeMirrorDiffView.prototype.cm = function(side) {
	return this.editor[side];
};

CodeMirrorDiffView.prototype.search = function(side, query, direction) {
	const editor = this.editor[side];
	if (!editor.getSearchCursor) {
		throw new Error('install CodeMirror search addon');
	}
	const searchDirection = (direction === 'prev')
		? 'findPrevious' : 'findNext';
	const start = { line: 0, ch: 0 };
	if ((editor.getSelection().length == 0) || (this.prev_query[side] != query)) {
		this.cursor[this.id] = editor.getSearchCursor(query, start, false);
		this.prev_query[side] = query;
	}
	const cursor = this.cursor[this.id];
	if (cursor[searchDirection]()) {
		editor.setSelection(cursor.from(), cursor.to());
	}
	else {
		cursor = editor.getSearchCursor(query, start, false);
	}
};

CodeMirrorDiffView.prototype.resize = function() {
	// recalculate line height as it may be zoomed
	this.em_height = null;
	this.settings.resize();
	this._changing();
	this._set_top_offset('lhs');
};

CodeMirrorDiffView.prototype.diff = function() {
	const le = this.editor.lhs;
	const re = this.editor.rhs;
	const lhs = le.getValue();
	const rhs = re.getValue();
	const comparison = new diff(lhs, rhs, this.settings);
	return comparison.normal_form();
};

CodeMirrorDiffView.prototype.bind = function(el) {
	const { CodeMirror } = this;
	this.trace('init', 'bind');
	el.style.visibility = 'hidden';
	el.style.opacity = '0';
	this.id = el.id;
	const found = document.querySelector(`#${this.id}`);
	if (!found) {
		console.error(`Failed to find mergely: #${this.id}`);
	}

	this.lhsId = `${this.id}-lhs`;
	this.rhsId = `${this.id}-rhs`;
	this.changed_timeout = null;
	this.chfns = { lhs: [], rhs: [] };
	this.prev_query = [];
	this.cursor = [];
	this._skipscroll = {};
	this.change_exp = new RegExp(/(\d+(?:,\d+)?)([acd])(\d+(?:,\d+)?)/);
	// homebrew button
	const style = 'opacity:0.6;height:16px;background-color:#bfbfbf;cursor:pointer;text-align:center;color:#eee;border:1px solid #848484;margin-right:-15px;margin-top:-2px;';
	const lhsTemplate = `<div style="${style}" class="merge-button" title="Merge left">&lt;</div>`;
	const rhsTemplate = `<div style="${style}" class="merge-button" title="Merge right">&gt;</div>`;
	this.merge_lhs_button = htmlToElement(lhsTemplate);
	this.merge_rhs_button = htmlToElement(rhsTemplate);

	// create the textarea and canvas elements
	el.className += ' mergely-editor';
	const canvasLhs = htmlToElement(getMarginTemplate({
		id: this.id,
		side: 'lhs'
	}));
	const canvasRhs = htmlToElement(getMarginTemplate({
		id: this.id,
		side: 'rhs'
	}));
	const editorLhs = htmlToElement(getEditorTemplate({
		id: this.id,
		side: 'lhs'
	}));
	const editorRhs = htmlToElement(getEditorTemplate({
		id: this.id,
		side: 'rhs'
	}));
	const canvasMid = htmlToElement(getCenterCanvasTemplate({
		id: this.id
	}));

	el.append(canvasLhs);
	el.append(editorLhs);
	el.append(canvasMid);
	if (this.settings.rhs_margin == 'left') {
		el.append(canvasRhs);
	}
	el.append(editorRhs);
	if (this.settings.rhs_margin != 'left') {
		el.append(canvasRhs);
	}
	if (!this.settings.sidebar) {
		// it would be better if this just used this.options()
		const divs = document.querySelectorAll('.mergely-margin');
		for (const div of divs) {
			div.style.visibility = 'hidden';
		}
	}
	if (NOTICES.indexOf(this.settings.license) < 0) {
		const noticeTypes = {
			'lgpl': 'GNU LGPL v3.0',
			'gpl': 'GNU GPL v3.0',
			'mpl': 'MPL 1.1'
		};
		const notice = noticeTypes[this.settings.license];
		if (!notice) {
			notice = noticeTypes.lgpl;
		}
		const editor = this._queryElement('.mergely-editor');
		const splash = htmlToElement(getSplash({
			icon: MERGELY_ICON,
			notice,
			left: (editor.offsetWidth - 300) / 2
		}));
		editor.addEventListener('click', () => {
			splash.style.cssText += 'visibility: hidden; opacity: 0; transition: visibility 0s 100ms, opacity 100ms linear;';
			setTimeout(() => splash.remove(), 110);
		}, { once: true });
		el.append(splash);
	}

	// check initialization
	const lhstx = document.querySelector(`#${this.id}-lhs`);
	const rhstx = document.querySelector(`#${this.id}-rhs`);
	if (!lhstx) {
		console.error('lhs textarea not defined - Mergely not initialized properly');
	}
	if (!rhstx) {
		console.error('rhs textarea not defined - Mergely not initialized properly');
	}

	// get current diff border color from user-defined css
	const diffColor
		= htmlToElement('<div style="display:none" class="mergely current start"></div>')
	const body = this._queryElement('body');
	body.append(diffColor);
	this.current_diff_color = window.getComputedStyle(diffColor).borderTopColor;

	// codemirror
	const cmstyles = [
		'.CodeMirror { line-height: 18px; }'
	];
	if (this.settings.autoresize) {
		cmstyles.push('.CodeMirror-scroll { height: 100%; overflow: auto; }');
	}
	const cmstyle = cmstyles.map(a => `#${this.id} ${a}`).join('\n');
	const css = htmlToElement(`<style type="text/css">${cmstyle}</style>`);
	document.head.appendChild(css);

	// bind
	this.trace('init', 'binding event listeners');
	this.editor = {};
	this.editor.lhs = CodeMirror.fromTextArea(lhstx, this.lhs_cmsettings);
	this.editor.rhs = CodeMirror.fromTextArea(rhstx, this.rhs_cmsettings);
	this.editor.lhs.on('change', () => {
		if (!this.settings.autoupdate) {
			return;
		}
		this._changing();
	});
	this.editor.lhs.on('scroll', () => {
		this._scrolling({ side: 'lhs', id: this.lhsId });
	});
	this.editor.rhs.on('change', () => {
		if (!this.settings.autoupdate) {
			return;
		}
		this._changing();
	});
	this.editor.rhs.on('scroll', () => {
		this._scrolling({ side: 'rhs', id: this.rhsId });
	});

	// resize
	if (this.settings.autoresize) {
		let resizeTimeout;
		const resize = (init) => {
			if (init) {
				if (this.settings.fadein !== false) {
					const duration = this.settings.fadein === 'fast' ? 200 : 750;
					el.style.cssText += `visibility: visible; opacity: 1.0; transition: opacity ${duration}ms linear;`;
				}
				else {
					el.style.visibility = 'visible';
					el.style.opacity = '1.0';
				}
			}
			if (this.settings.resize) this.settings.resize(init);
			this.resize();
			this.editor.lhs.refresh();
			this.editor.rhs.refresh();
		};
		this._handleResize = () => {
			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}
			resizeTimeout = setTimeout(resize, this.settings.resize_timeout);
		};
		window.addEventListener('resize', this._handleResize);
		resize(true);
	}

	// scrollToDiff() from gutter
	function gutterClicked(side, line, ev) {
		if (ev.target.className.includes('merge-button')) {
			ev.preventDefault();
			return;
		}
		const ed = this.editor[side];
		// See if the user clicked the line number of a difference:
		let found = false;
		for (let i = 0; i < this.changes.length; ++i) {
			const change = this.changes[i];
			const lf = change[`${side}-line-from`];
			const lt = change[`${side}-line-to`];
			if (line >= lf && line <= lt) {
				found = true;
				// clicked on a line within the change
				this._current_diff = i;
				break;
			}
		}
		this.scrollTo(side, line);
		if (found) {
			// trigger refresh
			this._changed();
		}
	}

	this.editor.lhs.on('gutterClick', (cm, n, gutterClass, ev) => {
		gutterClicked.call(this, 'lhs', n, ev);
	});

	this.editor.rhs.on('gutterClick', (cm, n, gutterClass, ev) => {
		gutterClicked.call(this, 'rhs', n, ev);
	});

	// if `lhs` and `rhs` are passed in, this sets the values in each editor
	// and kicks off the whole change pipeline.
	if (this.settings.lhs) {
		this.trace('init', 'setting lhs value');
		this.settings.lhs(function setValue(value) {
			this._initializing = true;
			delete this._current_diff;
			this.editor.lhs.getDoc().setValue(value);
		}.bind(this));
	}
	if (this.settings.rhs) {
		this.trace('init', 'setting rhs value');
		this.settings.rhs(function setValue(value) {
			this._initializing = true;
			delete this._current_diff;
			this.editor.rhs.getDoc().setValue(value);
		}.bind(this));
	}
	el.addEventListener('updated', () => {
		this._initializing = false;
		if (this.settings.loaded) {
			this.settings.loaded();
		}
	}, { once: true });
	this.trace('init', 'bound');
	this.editor.lhs.focus();
};

CodeMirrorDiffView.prototype._scroll_to_change = function(change) {
	if (!change) {
		return;
	}
	const {
		lhs: led,
		rhs: red
	} = this.editor;
	// set cursors
	const llf = Math.max(change['lhs-line-from'], 0);
	const rlf = Math.max(change['rhs-line-from'], 0);
	led.setCursor(llf, 0);
	red.setCursor(rlf, 0);
	if (change['lhs-line-to'] >= 0) {
		led.scrollIntoView({ line: change['lhs-line-to'] });
	}
	led.focus();
};

CodeMirrorDiffView.prototype._scrolling = function({ side, id }) {
	if (this._skipscroll[side] === true) {
		// scrolling one side causes the other to event - ignore it
		this._skipscroll[side] = false;
		return;
	}
	if (!this.changes) {
		// pasting a wide line can trigger scroll before changes
		// are calculated
		return;
	}
	const scroller = this.editor[side].getScrollerElement();
	const { top } = scroller.getBoundingClientRect();
	let height;
	if (true || this.midway == undefined) {
		// this.midway = (scroller.offsetHeight / 2.0 + scroller.scrollTop).toFixed(2);
		height = scroller.clientHeight
			- (scroller.offsetHeight - scroller.offsetParent.offsetHeight);
		this.midway = (height / 2.0 + top).toFixed(2);
	}

	// balance-line
	const midline = this.editor[side].coordsChar({
		left: 0,
		top: this.midway
	});
	const top_to = scroller.scrollTop;
	const left_to = scroller.scrollLeft;

	this.trace('scroll', 'side', side);
	this.trace('scroll', 'midway', this.midway);
	this.trace('scroll', 'midline', midline);
	this.trace('scroll', 'top_to', top_to);
	this.trace('scroll', 'left_to', left_to);

	const oside = (side === 'lhs') ? 'rhs' : 'lhs';

	// find the last change that is less than or within the midway point
	// do not move the rhs until the lhs end point is >= the rhs end point.
	let top_adjust = 0;
	let last_change = null;
	let force_scroll = false;
	for (const change of this.changes) {
		if ((midline.line >= change[side+'-line-from'])) {
			last_change = change;
			if (midline.line >= last_change[side+'-line-to']) {
				if (!change.hasOwnProperty(side+'-y-start') ||
					!change.hasOwnProperty(side+'-y-end') ||
					!change.hasOwnProperty(oside+'-y-start') ||
					!change.hasOwnProperty(oside+'-y-end')){
					// change outside of viewport
					force_scroll = true;
				}
				else {
					top_adjust +=
						(change[side+'-y-end'] - change[side+'-y-start']) -
						(change[oside+'-y-end'] - change[oside+'-y-start']);
				}
			}
		}
	}

	const vp = this.editor[oside].getViewport();
	let scroll = true;
	if (last_change) {
		this.trace('scroll', 'last change before midline', last_change);
		if (midline.line >= vp.from && midline <= vp.to) {
			scroll = false;
		}
	}
	this.trace('scroll', 'scroll', scroll);
	if (scroll || force_scroll) {
		// scroll the other side
		this.trace('scroll', 'scrolling other side to pos:', top_to - top_adjust);
		// disable next scroll event because we trigger it
		this._skipscroll[oside] = true;
		this.editor[oside].scrollTo(left_to, top_to - top_adjust);
	}
	else {
		this.trace('scroll', 'not scrolling other side');
	}

	if (this.settings.autoupdate) {
		Timer.start();
		this._calculate_offsets(this.changes);
		this.trace('change', 'offsets time', Timer.stop());
		this._markup_changes(this.changes);
		this.trace('change', 'markup time', Timer.stop());
		this._draw_diff(this.changes);
		this.trace('change', 'draw time', Timer.stop());
	}
	this.trace('scroll', 'scrolled');
};

CodeMirrorDiffView.prototype._changing = function({ force } = { force: false }) {
	this.trace('change', 'changing-timeout', this.changed_timeout);
	if (this.changed_timeout != null) clearTimeout(this.changed_timeout);
	this.changed_timeout = setTimeout(() => {
		if (!force && !this.settings.autoupdate) {
			this.trace('change', 'ignore', force, this.settings.autoupdate);
			return;
		}
		Timer.start();
		this._changed();
		this.trace('change', 'total time', Timer.stop());
	}, this.settings.change_timeout);
};

CodeMirrorDiffView.prototype._changed = function() {
	this._clear();
	this._diff();
};

CodeMirrorDiffView.prototype._clear = function() {
	const clearChanges = (side) => {
		Timer.start();
		const editor = this.editor[side];
		editor.operation(() => {
			const lineCount = editor.lineCount();
			// FIXME: there is no need to call `removeLineClass` for every line
			for (let i = 0; i < lineCount; ++i) {
				editor.removeLineClass(i, 'background');
				editor.removeLineClass(i, 'gutter');
			}
			for (const fn of this.chfns[side]) {
				if (fn.lines.length) {
					this.trace('change', 'clear text', fn.lines[0].text);
				}
				fn.clear();
			}
			editor.clearGutter('merge');
			this.trace('change', 'clear time', Timer.stop());
		});
	};
	clearChanges('lhs');
	clearChanges('rhs');

	const ex = this._draw_info();
	const ctx_lhs = ex.lhs_margin.getContext('2d');
	const ctx_rhs = ex.rhs_margin.getContext('2d');
	const ctx = ex.dcanvas.getContext('2d');

	ctx_lhs.beginPath();
	ctx_lhs.fillStyle = this.settings.bgcolor;
	ctx_lhs.strokeStyle = '#888';
	ctx_lhs.fillRect(0, 0, 6.5, ex.visible_page_height);
	ctx_lhs.strokeRect(0, 0, 6.5, ex.visible_page_height);

	ctx_rhs.beginPath();
	ctx_rhs.fillStyle = this.settings.bgcolor;
	ctx_rhs.strokeStyle = '#888';
	ctx_rhs.fillRect(0, 0, 6.5, ex.visible_page_height);
	ctx_rhs.strokeRect(0, 0, 6.5, ex.visible_page_height);

	ctx.beginPath();
	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, this.draw_mid_width, ex.visible_page_height);

	if (this._unbindHandlersOnClear) {
		for (const [ el, event, handler ] of this._unbindHandlersOnClear) {
			el.removeEventListener(event, handler);
			el.remove();
		}
	}
	this._unbindHandlersOnClear = [];
};

CodeMirrorDiffView.prototype._diff = function() {
	const lhs = this.editor.lhs.getValue();
	const rhs = this.editor.rhs.getValue();
	Timer.start();
	const comparison = new diff(lhs, rhs, this.settings);
	this.trace('change', 'diff time', Timer.stop());
	this.changes = DiffParser(comparison.normal_form());
	this.trace('change', 'parse time', Timer.stop());
	if (this._current_diff === undefined && this.changes.length) {
		// go to first difference on start-up where values are provided in
		// settings.
		this._current_diff = 0;
		if (this._initializing) {
			this._scroll_to_change(this.changes[0]);
		}
	}
	this.trace('change', 'scroll_to_change time', Timer.stop());
	this._calculate_offsets(this.changes);
	this.trace('change', 'offsets time', Timer.stop());
	this._markup_changes(this.changes);
	this.trace('change', 'markup time', Timer.stop());
	this._draw_diff(this.changes);
	this.trace('change', 'draw time', Timer.stop());
};

CodeMirrorDiffView.prototype._get_viewport_side = function(side) {
	return this.editor[side].getViewport();
};

CodeMirrorDiffView.prototype._is_change_in_view = function(side, vp, change) {
	return (change[`${side}-line-from`] >= vp.from && change[`${side}-line-from`] <= vp.to) ||
		(change[`${side}-line-to`] >= vp.from && change[`${side}-line-to`] <= vp.to) ||
		(vp.from >= change[`${side}-line-from`] && vp.to <= change[`${side}-line-to`]);
};

CodeMirrorDiffView.prototype._set_top_offset = function (side) {
	// save the current scroll position of the editor
	const saveY = this.editor[side].getScrollInfo().top;
	// temporarily scroll to top
	this.editor[side].scrollTo(null, 0);

	// this is the distance from the top of the screen to the top of the
	// content of the first codemirror editor
	const topnode = this._queryElement('.CodeMirror-measure');
	const top_offset = topnode.offsetParent.offsetTop + 4;

	// restore editor's scroll position
	this.editor[side].scrollTo(null, saveY);

	this.draw_top_offset = 0.5 - top_offset;
	return true;
};

CodeMirrorDiffView.prototype._calculate_offsets = function (changes) {
	const {
		lhs: led,
		rhs: red
	} = this.editor;

	if (this.em_height == null) {
		if (!this._set_top_offset('lhs')) {
			return; // try again
		}
		this.em_height = led.defaultTextHeight();
		if (!this.em_height) {
			console.warn('Failed to calculate offsets, using 18 by default');
			this.em_height = 18;
		}
		this.draw_lhs_min = 0.5;

		this.draw_mid_width
			= this._queryElement(`#${this.lhsId}-${this.rhsId}-canvas`).offsetWidth;
		this.draw_rhs_max = this.draw_mid_width - 0.5; //24.5;
		this.draw_lhs_width = 5;
		this.draw_rhs_width = 5;
		this.trace('calc', 'change offsets calculated', {
			top_offset: this.draw_top_offset,
			lhs_min: this.draw_lhs_min,
			rhs_max: this.draw_rhs_max,
			lhs_width: this.draw_lhs_width,
			rhs_width: this.draw_rhs_width
		});
	}
	const lhschc = led.charCoords({line: 0});
	const rhschc = red.charCoords({line: 0});
	const lhsvp = this._get_viewport_side('lhs');
	const rhsvp = this._get_viewport_side('rhs');

	for (const change of changes) {
		if (this.settings.viewport &&
			!this._is_change_in_view('lhs', lhsvp, change) &&
			!this._is_change_in_view('rhs', rhsvp, change)) {
			// if the change is outside the viewport, skip
			delete change['lhs-y-start'];
			delete change['lhs-y-end'];
			delete change['rhs-y-start'];
			delete change['rhs-y-end'];
			continue;
		}
		const llf = change['lhs-line-from'] >= 0 ? change['lhs-line-from'] : 0;
		const llt = change['lhs-line-to'] >= 0 ? change['lhs-line-to'] : 0;
		const rlf = change['rhs-line-from'] >= 0 ? change['rhs-line-from'] : 0;
		const rlt = change['rhs-line-to'] >= 0 ? change['rhs-line-to'] : 0;

		let lhsStart;
		let lhsEnd;
		let rhsStart;
		let rhsEnd;
		const lineWrapping = led.getOption('lineWrapping')
			|| red.getOption('lineWrapping');
		if (lineWrapping) {
			// If using line-wrapping, we must get the height of the line, but
			// this is expensive to call.
			lhsStart = led.cursorCoords({ line: llf, ch: 0 }, 'page');
			lhsEnd = led.cursorCoords({ line: llt, ch: 0 }, 'page');
			lhsEnd.bottom = lhsEnd.top + led.getLineHandle(llt).height;
			rhsStart = red.cursorCoords({ line: rlf, ch: 0 }, 'page');
			rhsEnd = red.cursorCoords({ line: rlt, ch: 0 }, 'page');
			rhsEnd.bottom = rhsEnd.top + red.getLineHandle(rlt).height;
		}
		else {
			// If not using line-wrapping, we can calculate the line position
			lhsStart = {
				top: lhschc.top + llf * this.em_height,
				bottom: lhschc.bottom + llf * this.em_height + 2
			};
			lhsEnd = {
				top: lhschc.top + llt * this.em_height,
				bottom: lhschc.bottom + llt * this.em_height + 2
			};
			rhsStart = {
				top: rhschc.top + rlf * this.em_height,
				bottom: rhschc.bottom + rlf * this.em_height + 2
			};
			rhsEnd = {
				top: rhschc.top + rlt * this.em_height,
				bottom: rhschc.bottom + rlt * this.em_height + 2
			};
		}

		if (change.op == 'a') {
			// adds (right), normally start from the end of the lhs,
			// except for the case when the start of the rhs is 0
			if (rlf > 0) {
				lhsStart.top = lhsStart.bottom;
				lhsStart.bottom += this.em_height;
				lhsEnd = lhsStart;
			}
		}
		else if (change.op == 'd') {
			// deletes (left) normally finish from the end of the rhs,
			// except for the case when the start of the lhs is 0
			if (llf > 0) {
				rhsStart.top = rhsStart.bottom;
				rhsStart.bottom += this.em_height;
				rhsEnd = rhsStart;
			}
		}
		change['lhs-y-start'] = this.draw_top_offset + lhsStart.top;
		if (change.op == 'c' || change.op == 'd') {
			change['lhs-y-end'] = this.draw_top_offset + lhsEnd.bottom;
		}
		else {
			change['lhs-y-end'] = this.draw_top_offset + lhsEnd.top;
		}
		change['rhs-y-start'] = this.draw_top_offset + rhsStart.top;
		if (change.op == 'c' || change.op == 'a') {
			change['rhs-y-end'] = this.draw_top_offset + rhsEnd.bottom;
		}
		else {
			change['rhs-y-end'] = this.draw_top_offset + rhsEnd.top;
		}
		this.trace('calc', 'change calculated', change);
	}
	return changes;
};

CodeMirrorDiffView.prototype._markup_changes = function (changes) {
	const {
		lhs: led,
		rhs: red
	} = this.editor;
	const current_diff = this._current_diff;
	const lhsvp = this._get_viewport_side('lhs');
	const rhsvp = this._get_viewport_side('rhs');

	Timer.start();
	led.operation(() => {
		for (let i = 0; i < changes.length; ++i) {
			const change = changes[i];
			if (!this._is_change_in_view('lhs', lhsvp, change)) {
				// if the change is outside the viewport, skip
				continue;
			}

			const llf = change['lhs-line-from'] >= 0 ? change['lhs-line-from'] : 0;
			const llt = change['lhs-line-to'] >= 0 ? change['lhs-line-to'] : 0;
			const rlf = change['rhs-line-from'] >= 0 ? change['rhs-line-from'] : 0;

			const clazz = ['mergely', 'lhs', change.op, 'cid-' + i];
			led.addLineClass(llf, 'background', 'start');
			led.addLineClass(llt, 'background', 'end');
			if (change['lhs-line-from'] < 0) {
				clazz.push('empty');
			}

			if (current_diff === i) {
				if (llf != llt) {
					led.addLineClass(llf, 'background', 'current');
				}
				led.addLineClass(llt, 'background', 'current');
				for (let j = llf; j <= llt; ++j) {
					led.addLineClass(j, 'gutter', 'mergely current');
				}
			}
			if (llf == 0 && llt == 0 && rlf == 0) {
				led.addLineClass(llf, 'background', clazz.join(' '));
				led.addLineClass(llf, 'background', 'first');
			}
			else {
				// apply change for each line in-between the changed lines
				for (let j = llf; j <= llt; ++j) {
					led.addLineClass(j, 'background', clazz.join(' '));
					led.addLineClass(j, 'background', clazz.join(' '));
				}
			}

			if (!red.getOption('readOnly')) {
				const button = this.merge_rhs_button.cloneNode(true);
				button.className = 'merge-button merge-rhs-button';
				const handler = () => {
					this._merge_change(change, 'lhs', 'rhs');
				};
				this._unbindHandlersOnClear.push([ button, 'click', handler ]);
				button.addEventListener('click', handler);
				led.setGutterMarker(llf, 'merge', button);
			}
		}
	});

	this.trace('change', 'markup lhs-editor time', Timer.stop());
	red.operation(() => {
		for (let i = 0; i < changes.length; ++i) {
			const change = changes[i];
			if (!this._is_change_in_view('rhs', rhsvp, change)) {
				// if the change is outside the viewport, skip
				continue;
			}

			const llf = change['lhs-line-from'] >= 0 ? change['lhs-line-from'] : 0;
			const rlf = change['rhs-line-from'] >= 0 ? change['rhs-line-from'] : 0;
			const rlt = change['rhs-line-to'] >= 0 ? change['rhs-line-to'] : 0;

			const clazz = ['mergely', 'rhs', change.op, 'cid-' + i];
			red.addLineClass(rlf, 'background', 'start');
			red.addLineClass(rlt, 'background', 'end');
			if (change['rhs-line-from'] < 0) {
				clazz.push('empty');
			}

			if (current_diff === i) {
				if (rlf != rlt) {
					red.addLineClass(rlf, 'background', 'current');
				}
				red.addLineClass(rlt, 'background', 'current');
				for (let j = rlf; j <= rlt; ++j) {
					red.addLineClass(j, 'gutter', 'mergely current');
				}
			}
			if (rlf == 0 && rlt == 0 && llf == 0) {
				red.addLineClass(rlf, 'background', clazz.join(' '));
				red.addLineClass(rlf, 'background', 'first');
			}
			else {
				// apply change for each line in-between the changed lines
				for (let j = rlf; j <= rlt; ++j) {
					red.addLineClass(j, 'background', clazz.join(' '));
					red.addLineClass(j, 'background', clazz.join(' '));
				}
			}

			if (!led.getOption('readOnly')) {
				// add widgets to rhs, if lhs is not read only
				const button = this.merge_lhs_button.cloneNode(true);
				button.className = 'merge-button merge-lhs-button';
				const handler = () => {
					this._merge_change(change, 'rhs', 'lhs');
				};
				this._unbindHandlersOnClear.push([ button, 'click', handler ]);
				button.addEventListener('click', handler);
				red.setGutterMarker(rlf, 'merge', button);

			}
		}
	});
	this.trace('change', 'markup rhs-editor time', Timer.stop());

	// mark text deleted, LCS changes
	const marktext = [];
	for (let i = 0; this.settings.lcs && i < changes.length; ++i) {
		const change = changes[i];
		const llf = change['lhs-line-from'] >= 0 ? change['lhs-line-from'] : 0;
		const llt = change['lhs-line-to'] >= 0 ? change['lhs-line-to'] : 0;
		const rlf = change['rhs-line-from'] >= 0 ? change['rhs-line-from'] : 0;
		const rlt = change['rhs-line-to'] >= 0 ? change['rhs-line-to'] : 0;

		if (change.op == 'd') {
			// apply delete to cross-out (left-hand side only)
			const from = llf;
			const to = llt;

			if (this._is_change_in_view('lhs', lhsvp, change)) {
				// the change is within the viewport
				const to_ln = led.lineInfo(to);
				if (to_ln) {
					marktext.push([led, {line:from, ch:0}, {line:to, ch:to_ln.text.length}, {className: 'mergely ch d lhs'}]);
				}
			}
		}
		else if (change.op == 'c') {
			// apply LCS changes to each line
			for (let j = llf, k = rlf;
				 ((j >= 0) && (j <= llt)) || ((k >= 0) && (k <= rlt));
				 ++j, ++k) {
				let lhs_line;
				let rhs_line;
				if (k > rlt) {
					// lhs continues past rhs, mark lhs as deleted
					lhs_line = led.getLine( j );
					if (!lhs_line) {
						continue;
					}
					marktext.push([led, {line:j, ch:0}, {line:j, ch:lhs_line.length}, {className: 'mergely ch d lhs'}]);
					continue;
				}
				if (j > llt) {
					// rhs continues past lhs, mark rhs as added
					rhs_line = red.getLine( k );
					if (!rhs_line) {
						continue;
					}
					marktext.push([red, {line:k, ch:0}, {line:k, ch:rhs_line.length}, {className: 'mergely ch a rhs'}]);
					continue;
				}
				lhs_line = led.getLine( j );
				rhs_line = red.getLine( k );
				const lcs = new LCS(lhs_line, rhs_line, {
					ignoreaccents: !!this.settings.ignoreaccents,
					ignorews: !!this.settings.ignorews
				});
				lcs.diff(
					(from, to) => {
						// added
						if (this._is_change_in_view('rhs', rhsvp, change)) {
							marktext.push([
								red,
								{ line: k, ch: from },
								{ line: k, ch: to },
								{ className: 'mergely ch a rhs' }
							]);
						}
					},
					(from, to) => {
						// removed
						if (this._is_change_in_view('lhs', lhsvp, change)) {
							marktext.push([
								led,
								{ line: j, ch: from },
								{ line: j, ch: to },
								{ className: 'mergely ch d lhs' }
							]);
						}
					}
				);
			}
		}
	}
	this.trace('change', 'LCS marktext time', Timer.stop());

	// mark changes outside closure
	led.operation(() => {
		// apply lhs markup
		for (let i = 0; i < marktext.length; ++i) {
			const m = marktext[i];
			if (m[0].doc.id != led.getDoc().id) continue;
			this.chfns.lhs.push(m[0].markText(m[1], m[2], m[3]));
		}
	});
	red.operation(() => {
		// apply lhs markup
		for (let i = 0; i < marktext.length; ++i) {
			const m = marktext[i];
			if (m[0].doc.id != red.getDoc().id) continue;
			this.chfns.rhs.push(m[0].markText(m[1], m[2], m[3]));
		}
	});

	this.trace('change', 'LCS markup time', Timer.stop());
};

CodeMirrorDiffView.prototype._merge_change = function(change, side, oside) {
	if (!change) {
		return;
	}
	const { CodeMirror } = this;
	const {
		lhs: led,
		rhs: red
	} = this.editor;
	const ed = { lhs: led, rhs: red };
	const from = change[`${side}-line-from`];
	const to = change[`${side}-line-to`];
	const ofrom = change[`${oside}-line-from`];
	const oto = change[`${oside}-line-to`];
	const doc = ed[side].getDoc();
	const odoc = ed[oside].getDoc();
	const fromlen = from >= 0 ? doc.getLine(from).length + 1 : 0;
	const tolen = to >= 0 ? doc.getLine(to).length + 1 : 0;
	const otolen = oto >= 0 ? odoc.getLine(oto).length + 1 : 0;
	const ofromlen = ofrom >= 0 ? odoc.getLine(ofrom).length + 1 : 0;

	let text;
	if (change.op === 'c') {
		text = doc.getRange(CodeMirror.Pos(from, 0), CodeMirror.Pos(to, tolen));
		odoc.replaceRange(text, CodeMirror.Pos(ofrom, 0), CodeMirror.Pos(oto, otolen));
	} else if ((oside === 'lhs' && change.op === 'd') || (oside === 'rhs' && change.op === 'a')) {
		if (from > 0) {
			text = doc.getRange(CodeMirror.Pos(from, fromlen), CodeMirror.Pos(to, tolen));
			ofrom += 1;
		} else {
			text = doc.getRange(CodeMirror.Pos(0, 0), CodeMirror.Pos(to + 1, 0));
		}
		odoc.replaceRange(text, CodeMirror.Pos(ofrom - 1, 0), CodeMirror.Pos(oto + 1, 0));
	} else if ((oside === 'rhs' && change.op === 'd') || (oside === 'lhs' && change.op === 'a')) {
		if (from > 0) {
			fromlen = doc.getLine(from - 1).length + 1;
			text = doc.getRange(CodeMirror.Pos(from - 1, fromlen), CodeMirror.Pos(to, tolen));
		} else {
			text = doc.getRange(CodeMirror.Pos(0, 0), CodeMirror.Pos(to + 1, 0));
		}
		if (ofrom < 0) {
			ofrom = 0;
		}
		odoc.replaceRange(text, CodeMirror.Pos(ofrom, ofromlen));
	}
	this._scroll_to_change(change);
};

CodeMirrorDiffView.prototype._draw_info = function() {
	const lhsScroll = this.editor.lhs.getScrollerElement();
	const rhsScroll = this.editor.rhs.getScrollerElement();
	const visible_page_height = lhsScroll.offsetHeight + 17; // fudged
	const gutter_height = lhsScroll.querySelector(':first-child').offsetHeight;
	const dcanvas = document.getElementById(`${this.lhsId}-${this.rhsId}-canvas`);
	if (dcanvas == undefined) {
		throw 'Failed to find: ' + this.lhsId + '-' + this.rhsId + '-canvas';
	}
	const lhs_margin = this._queryElement(`#${this.id}-lhs-margin`);
	const rhs_margin = this._queryElement(`#${this.id}-rhs-margin`);

	return {
		visible_page_height: visible_page_height,
		gutter_height: gutter_height,
		visible_page_ratio: (visible_page_height / gutter_height),
		margin_ratio: (visible_page_height / gutter_height),
		lhs_scroller: lhsScroll,
		rhs_scroller: rhsScroll,
		lhs_lines: this.editor.lhs.lineCount(),
		rhs_lines: this.editor.rhs.lineCount(),
		dcanvas,
		lhs_margin,
		rhs_margin,
		lhs_xyoffset: {
			top: lhs_margin.offsetParent.offsetTop,
			left: lhs_margin.offsetParent.offsetLeft
		},
		rhs_xyoffset: {
			top: rhs_margin.offsetParent.offsetTop,
			left: rhs_margin.offsetParent.offsetLeft
		}
	};
};

CodeMirrorDiffView.prototype._draw_diff = function(changes) {
	const ex = this._draw_info();
	const mcanvas_lhs = ex.lhs_margin;
	const mcanvas_rhs = ex.rhs_margin;
	const ctx = ex.dcanvas.getContext('2d');
	const ctx_lhs = mcanvas_lhs.getContext('2d');
	const ctx_rhs = mcanvas_rhs.getContext('2d');

	this.trace('draw', 'visible_page_height', ex.visible_page_height);
	this.trace('draw', 'gutter_height', ex.gutter_height);
	this.trace('draw', 'visible_page_ratio', ex.visible_page_ratio);
	this.trace('draw', 'lhs-scroller-top', ex.lhs_scroller.scrollTop);
	this.trace('draw', 'rhs-scroller-top', ex.rhs_scroller.scrollTop);

	ex.lhs_margin.removeEventListener('click', this._handleLhsMarginClick);
	ex.rhs_margin.removeEventListener('click', this._handleRhsMarginClick);

	ctx_lhs.beginPath();
	ctx_lhs.fillStyle = this.settings.bgcolor;
	ctx_lhs.strokeStyle = '#888';
	ctx_lhs.fillRect(0, 0, 6.5, ex.visible_page_height);
	ctx_lhs.strokeRect(0, 0, 6.5, ex.visible_page_height);
	ctx_lhs.stroke();

	ctx_rhs.beginPath();
	ctx_rhs.fillStyle = this.settings.bgcolor;
	ctx_rhs.strokeStyle = '#888';
	ctx_rhs.fillRect(0, 0, 6.5, ex.visible_page_height);
	ctx_rhs.strokeRect(0, 0, 6.5, ex.visible_page_height);
	ctx_rhs.stroke();

	const lhsvp = this._get_viewport_side('lhs');
	const rhsvp = this._get_viewport_side('rhs');

	for (let i = 0; i < changes.length; ++i) {
		const change = changes[i];
		if (!this._is_change_in_view('lhs', lhsvp, change) &&
			!this._is_change_in_view('rhs', rhsvp, change)) {
			// if the change is outside the viewport, skip
			continue;
		}

		const fill = this.settings.fgcolor[change.op];
		if (this._current_diff === i) {
			fill = this.current_diff_color;
		}

		this.trace('draw', change);
		// margin indicators
		const lhs_y_start = ((change['lhs-y-start'] + ex.lhs_scroller.scrollTop) * ex.visible_page_ratio);
		const lhs_y_end = ((change['lhs-y-end'] + ex.lhs_scroller.scrollTop) * ex.visible_page_ratio) + 1;
		const rhs_y_start = ((change['rhs-y-start'] + ex.rhs_scroller.scrollTop) * ex.visible_page_ratio);
		const rhs_y_end = ((change['rhs-y-end'] + ex.rhs_scroller.scrollTop) * ex.visible_page_ratio) + 1;
		this.trace('draw', 'marker calculated', lhs_y_start, lhs_y_end, rhs_y_start, rhs_y_end);

		ctx_lhs.beginPath();
		ctx_lhs.fillStyle = fill;
		ctx_lhs.strokeStyle = '#000';
		ctx_lhs.lineWidth = 0.5;
		ctx_lhs.fillRect(1.5, lhs_y_start, 4.5, Math.max(lhs_y_end - lhs_y_start, 5));
		ctx_lhs.strokeRect(1.5, lhs_y_start, 4.5, Math.max(lhs_y_end - lhs_y_start, 5));
		ctx_lhs.stroke();

		ctx_rhs.beginPath();
		ctx_rhs.fillStyle = fill;
		ctx_rhs.strokeStyle = '#000';
		ctx_rhs.lineWidth = 0.5;
		ctx_rhs.fillRect(1.5, rhs_y_start, 4.5, Math.max(rhs_y_end - rhs_y_start, 5));
		ctx_rhs.strokeRect(1.5, rhs_y_start, 4.5, Math.max(rhs_y_end - rhs_y_start, 5));
		ctx_rhs.stroke();

		lhs_y_start = change['lhs-y-start'];
		lhs_y_end = change['lhs-y-end'];
		rhs_y_start = change['rhs-y-start'];
		rhs_y_end = change['rhs-y-end'];

		const radius = 3;

		// draw left box
		ctx.beginPath();
		ctx.strokeStyle = fill;
		ctx.lineWidth = (this._current_diff === i) ? 1.5 : 1;

		const rectWidth = this.draw_lhs_width;
		const rectHeight = lhs_y_end - lhs_y_start - 1;
		const rectX = this.draw_lhs_min;
		const rectY = lhs_y_start;
		// top and top top-right corner

		// draw left box
		ctx.moveTo(rectX, rectY);
		if (navigator.appName == 'Microsoft Internet Explorer') {
			// IE arcs look awful
			ctx.lineTo(this.draw_lhs_min + this.draw_lhs_width, lhs_y_start);
			ctx.lineTo(this.draw_lhs_min + this.draw_lhs_width, lhs_y_end + 1);
			ctx.lineTo(this.draw_lhs_min, lhs_y_end + 1);
		}
		else {
			if (rectHeight <= 0) {
				ctx.lineTo(rectX + rectWidth, rectY);
			}
			else {
				ctx.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius, radius);
				ctx.arcTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight, radius);
			}
			// bottom line
			ctx.lineTo(rectX, rectY + rectHeight);
		}
		ctx.stroke();

		rectWidth = this.draw_rhs_width;
		rectHeight = rhs_y_end - rhs_y_start - 1;
		rectX = this.draw_rhs_max;
		rectY = rhs_y_start;

		// draw right box
		ctx.moveTo(rectX, rectY);
		if (navigator.appName == 'Microsoft Internet Explorer') {
			ctx.lineTo(this.draw_rhs_max - this.draw_rhs_width, rhs_y_start);
			ctx.lineTo(this.draw_rhs_max - this.draw_rhs_width, rhs_y_end + 1);
			ctx.lineTo(this.draw_rhs_max, rhs_y_end + 1);
		}
		else {
			if (rectHeight <= 0) {
				ctx.lineTo(rectX - rectWidth, rectY);
			}
			else {
				ctx.arcTo(rectX - rectWidth, rectY, rectX - rectWidth, rectY + radius, radius);
				ctx.arcTo(rectX - rectWidth, rectY + rectHeight, rectX - radius, rectY + rectHeight, radius);
			}
			ctx.lineTo(rectX, rectY + rectHeight);
		}
		ctx.stroke();

		// connect boxes
		const cx = this.draw_lhs_min + this.draw_lhs_width;
		const cy = lhs_y_start + (lhs_y_end + 1 - lhs_y_start) / 2.0;
		const dx = this.draw_rhs_max - this.draw_rhs_width;
		const dy = rhs_y_start + (rhs_y_end + 1 - rhs_y_start) / 2.0;
		ctx.moveTo(cx, cy);
		if (cy == dy) {
			ctx.lineTo(dx, dy);
		}
		else {
			// fancy!
			ctx.bezierCurveTo(
				cx + 12, cy - 3, // control-1 X,Y
				dx - 12, dy - 3, // control-2 X,Y
				dx, dy);
		}
		ctx.stroke();
	}

	// visible window feedback
	ctx_lhs.fillStyle = this.settings.vpcolor;
	ctx_rhs.fillStyle = this.settings.vpcolor;

	const lto = ex.lhs_margin.offsetHeight * ex.visible_page_ratio;
	const lfrom = (ex.lhs_scroller.scrollTop / ex.gutter_height) * ex.lhs_margin.offsetHeight;
	const rto = ex.rhs_margin.offsetHeight * ex.visible_page_ratio;
	const rfrom = (ex.rhs_scroller.scrollTop / ex.gutter_height) * ex.rhs_margin.offsetHeight;
	this.trace('draw', 'cls.height', ex.lhs_margin.offsetHeight);
	this.trace('draw', 'lhs_scroller.scrollTop', ex.lhs_scroller.scrollTop);
	this.trace('draw', 'gutter_height', ex.gutter_height);
	this.trace('draw', 'visible_page_ratio', ex.visible_page_ratio);
	this.trace('draw', 'lhs from', lfrom, 'lhs to', lto);
	this.trace('draw', 'rhs from', rfrom, 'rhs to', rto);

	ctx_lhs.fillRect(1.5, lfrom, 4.5, lto);
	ctx_rhs.fillRect(1.5, rfrom, 4.5, rto);

	this._handleLhsMarginClick = function (ev) {
		const y = ev.pageY - ex.lhs_xyoffset.top - (lto / 2);
		const sto = Math.max(0, (y / mcanvas_lhs.height) * ex.lhs_scroller.scrollHeight);
		ex.lhs_scroller.scrollTo({ top: sto });
	};
	this._handleRhsMarginClick = function (ev) {
		const y = ev.pageY - ex.rhs_xyoffset.top - (rto / 2);
		const sto = Math.max(0, (y / mcanvas_rhs.height) * ex.rhs_scroller.scrollHeight);
		ex.rhs_scroller.scrollTo({ top: sto });
	};
	ex.lhs_margin.addEventListener('click', this._handleLhsMarginClick);
	ex.rhs_margin.addEventListener('click', this._handleRhsMarginClick);

	this.trace('change', 'emit: updated');
	this.el.dispatchEvent(new Event('updated'));
};

CodeMirrorDiffView.prototype.trace = function(name) {
	if(this.settings._debug.indexOf(name) >= 0) {
		arguments[0] = `${name}:`;
		console.log([].slice.apply(arguments));
	}
}

CodeMirrorDiffView.prototype._queryElement = function(selector) {
	const cacheName = `_element:${selector}`;
	const element = this[cacheName] || document.querySelector(selector);
	if (!this[cacheName]) {
		this[cacheName] = element;
	}
	return this[cacheName];
}

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function getMarginTemplate({ id, side }) {
	return `\
<div class="mergely-margin">
	<canvas id="${id}-${side}-margin" style="width: 8px" width="8px"></canvas>
</div>;`;
}

function getEditorTemplate({ id, side }) {
	return `\
<div style="position: relative;" id="${id}-editor-${side}" class="mergely-column">
	<textarea id="${id}-${side}"></textarea>
</div>`;
}

function getCenterCanvasTemplate({ id }) {
	return `\
<div class="mergely-canvas">
	<canvas id="${id}-lhs-${id}-rhs-canvas" style="width:28px" width="28px">
	</canvas>
</div>`;
}

function getSplash({ icon, notice, left }) {
	return `\
<div
	class="mergely-splash"
	style="position: absolute; z-index: 100; background-color: #fff; border: 1px solid black; height: 70px; width: 300px; left: ${left}px; padding: 10px 10px 0 10px; font-family: arial; font-size: 11px;">
	<p>
		<img width="36" height="36" alt="mergely" src="${icon}" style="float:left;padding-right:10px;" />
		This software is a Combined Work using Mergely and is covered by the
		${notice} license. For the full license, see
		<a target="_blank" href="http://www.mergely.com">http://www.mergely.com/license</a>.
	</p>
</div>`;
}

module.exports = CodeMirrorDiffView;
