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
API switched from jQuery-style to object methods.
Removed `options.width`
Removed `options.height`
Removed `options.resize`
Removed `options.resized`
Removed `options.autoresize`
Removed `options.fadein`
Remove styles `.mergely-resizer`, `.mergely-full-screen-0`, and `.mergely-full-screen-8`.
Default for `options.change_timeout` changed to 0.
No longer necessary to separately require codemirror/addon/search/searchcursor
No longer necessary to separately require codemirror/addon/selection/mark-selection

FEATURE:
Gutter click now scrolls to any line.
File drop-target indicator.
Mergely now emits `resize` event on resize.

FIX:
Fixed issue where canvas markup was not rendered when `viewport` enabled.
Fixed timing issue where swap sides may not work as expected.
Fixed issue where unmarkup did not emit an updated event.
Fixed issue where init triggered an updated event when autoupdate is disabled.
Fixed documentation issue where `merge` incorrectly stated: from the specified `side` to the opposite side
Fixed performance issue scrolling (find #)
Fixed issue where initial render scrolled to first change, showing it at the bottom, as opposed to middle

TODO:
For some reason ignore-whitespace will mark the "red" differently
When wrap_lines is false, the CM editor grows, screwing up the layout
Fix the overflow for the rendered diff view
Introduce an async render pipeline as it's currently blocking UI
Merge button with multiple editors
Delete gutter_height (and any unused values)
Fix performance issue where scroll-to-first-change seems to take a lot of time.
*/

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
		rhs_margin: 'right',
		wrap_lines: false,
		line_numbers: true,
		lcs: true,
		sidebar: true,
		viewport: false,
		ignorews: false,
		ignorecase: false,
		ignoreaccents: false,
		resize_timeout: 500,
		change_timeout: 0,
		fgcolor: {
			a: '#4ba3fa',
			c: '#a3a3a3',
			d: '#ff7f7f',  // color for differences (soft color)
			ca: '#4b73ff',
			cc: '#434343',
			cd: '#ff4f4f'
		}, // color for currently active difference (bright color)
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
		_debug: '', //scroll,draw,calc,diff,markup,change,init
		// user supplied options
		...options
	};
	// save this element for faster queries
	this.el = el;

	this.lhs_cmsettings = {
		viewportMargin: Infinity,
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
	if (this._changedTimeout != null) {
		clearTimeout(this._changedTimeout);
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
	this._changing();
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
			const divs = document.querySelectorAll(`#${this.id} .mergely-margin`);
			for (const div of divs) {
				div.style.visibility = 'visible';
			}
		}
		else {
			const divs = document.querySelectorAll(`#${this.id} .mergely-margin`);
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
			const divs = document.querySelectorAll(`#${this.id} .mergely-editor > div`);
			// [0:margin] [1:lhs] [2:mid] [3:rhs] [4:margin], swaps 4 with 3
			divs[4].parentNode.insertBefore(divs[4], divs[3]);
		}
	}
};

CodeMirrorDiffView.prototype.options = function(opts) {
	if (opts) {
		this._setOptions(opts);
		this.resize();
		if (this.settings.autoupdate) {
			this.update();
		}
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
	this.trace('draw', 'resize');
	const parent = this.el.parentNode;
	const { settings } = this;
	let height;
	const contentHeight = parent.offsetHeight - 2;

	const lhsMargin = this._queryElement(`#${this.id}-lhs-margin`);
	lhsMargin.style.height = `${contentHeight}px`;
	lhsMargin.height = `${contentHeight}`;
	const midCanvas = this._queryElement(`#${this.id}-lhs-${this.id}-rhs-canvas`);
	midCanvas.style.height = `${contentHeight}px`;
	midCanvas.height = `${contentHeight}`;
	const rhsMargin = this._queryElement(`#${this.id}-rhs-margin`);
	rhsMargin.style.height = `${contentHeight}px`;
	rhsMargin.height = `${contentHeight}`;

	this.el.dispatchEvent(new Event('resize'));

	// recalculate line height as it may be zoomed
	this.em_height = null;
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
	el.style.display = 'flex';
	el.style.flexGrow = '1'; // FIXME: needed?
	el.style.height = '100%';
	this.id = el.id;
	const found = document.getElementById(this.id);
	if (!found) {
		console.error(`Failed to find mergely: #${this.id}`);
		return;
	}
	this.lhsId = `${this.id}-lhs`;
	this.rhsId = `${this.id}-rhs`;
	this._changedTimeout = null;
	this.chfns = { lhs: [], rhs: [] };
	this.prev_query = [];
	this.cursor = [];
	this._skipscroll = {};
	this.change_exp = new RegExp(/(\d+(?:,\d+)?)([acd])(\d+(?:,\d+)?)/);
	// homebrew button
	const lhsTemplate = `<div class="merge-button" title="Merge left">&#x25C0;</div>`;
	const rhsTemplate = `<div class="merge-button" title="Merge right">&#x25B6;</div>`;
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
		const divs = document.querySelectorAll(`#${this.id} .mergely-margin`);
		for (const div of divs) {
			div.style.visibility = 'hidden';
		}
	}

	if (NOTICES.indexOf(this.settings.license) < 0) {
		el.addEventListener('updated', () => {
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
				notice,
				left: (editor.offsetWidth - 300) / 2
			}));
			editor.addEventListener('click', () => {
				splash.style.visibility = 'hidden';
				splash.style.opacity = '0';
				splash.style.transition = `visibility 0s 100ms, opacity 100ms linear`;
				setTimeout(() => splash.remove(), 110);
			}, { once: true });
			el.append(splash);
		}, { once: true });
	}

	// check initialization
	const lhstx = document.getElementById(`${this.id}-lhs`);
	const rhstx = document.getElementById(`${this.id}-rhs`);
	if (!lhstx) {
		console.error('lhs textarea not defined - Mergely not initialized properly');
	}
	if (!rhstx) {
		console.error('rhs textarea not defined - Mergely not initialized properly');
	}

	// get current diff border color from user-defined css
	const diffColor
		= htmlToElement('<div style="display:none" class="mergely current start"></div>')
	// const body = this._queryElement('body');
	this.el.append(diffColor);
	this.current_diff_color = window.getComputedStyle(diffColor).borderTopColor;

	// make a throttled render function
	this._renderDiff = throttle.apply(this, [
		this._renderChanges,
		{
			delay: 15
		}
	]);

	// bind event listeners
	this.trace('init', 'binding event listeners');
	this.editor = {};
	this.editor.lhs = CodeMirror.fromTextArea(lhstx, this.lhs_cmsettings);
	this.editor.rhs = CodeMirror.fromTextArea(rhstx, this.rhs_cmsettings);

	// if `lhs` and `rhs` are passed in, this sets the values in each editor,
	// but the changes are not picked up until the explicit resize below.
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

	this.editor.lhs.on('change', (instance, ev) => {
		if (!this.settings.autoupdate) {
			return;
		}
		if (typeof ev === 'object') {
			this.trace('change', 'lhs change event', instance, ev);
		} else {
			this.trace('change', 'lhs change event (ignored)');
		}
		this._changing();
	});
	this.editor.lhs.on('scroll', () => {
		this.trace('change', 'scroll lhs');
		this._scrolling({ side: 'lhs', id: this.lhsId });
	});
	this.editor.rhs.on('change', (instance, ev) => {
		if (!this.settings.autoupdate) {
			return;
		}
		if (typeof ev === 'object') {
			this.trace('change', 'rhs change event', instance, ev);
		} else {
			this.trace('change', 'rhs change event (ignored)');
		}
		this._changing();
	});
	this.editor.rhs.on('scroll', () => {
		this.trace('change', 'scroll rhs');
		this._scrolling({ side: 'rhs', id: this.rhsId });
	});

	// resize event handeler
	let resizeTimeout;
	const resize = () => {
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
	resize();

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
			this._changing();
		}
	}

	this.editor.lhs.on('gutterClick', (cm, n, gutterClass, ev) => {
		gutterClicked.call(this, 'lhs', n, ev);
	});

	this.editor.rhs.on('gutterClick', (cm, n, gutterClass, ev) => {
		gutterClicked.call(this, 'rhs', n, ev);
	});

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
	this.trace('scroll', 'scrolling');
	if (this._changedTimeout) {
		console.log('change in progress; skipping scroll');
		return;
	}
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
	this.trace('scroll', scroll);
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
		// nothing changed, just re-render the current diff. clear the margin
		// markup while the render is throttled
		this._clearMarginMarkup();
		this._renderDiff();
	}
	this.trace('scroll', 'scrolled');
};

CodeMirrorDiffView.prototype._changing = function({ force } = { force: false }) {
	this.trace('change', 'changing (has _changedTimeout)', !!this._changedTimeout);
	if (this._changedTimeout != null) {
		clearTimeout(this._changedTimeout);
	}
	const handleChange = () => {
		this._changedTimeout = null;
		if (!force && !this.settings.autoupdate) {
			this.trace('change', 'ignore', force, this.settings.autoupdate);
			return;
		}
		Timer.start();
		this._changed();
		this.trace('change', 'total time', Timer.stop());
	};
	if (this.settings.change_timeout > 0) {
		this._changedTimeout = setTimeout(handleChange, this.settings.change_timeout);
	} else {
		// setImmediate(handleChange);
		handleChange();
	}
};

CodeMirrorDiffView.prototype._changed = function() {
	this.trace('change', 'changed');
	this._clear();
	this._diff();
};

CodeMirrorDiffView.prototype._clear = function() {
	this.trace('draw', 'clear');
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
	this._clearMargins();
	clearChanges('lhs');
	clearChanges('rhs');

	if (this._unbindHandlersOnClear) {
		for (const [ el, event, handler ] of this._unbindHandlersOnClear) {
			el.removeEventListener(event, handler);
			el.remove();
		}
	}
	this._unbindHandlersOnClear = [];
};

CodeMirrorDiffView.prototype._clearMargins = function() {
	this.trace('draw', '_clearMargins');
	const ex = this._draw_info();

	const ctx_lhs = ex.lhs_margin.getContext('2d');
	ctx_lhs.beginPath();
	ctx_lhs.fillStyle = this.settings.bgcolor;
	ctx_lhs.strokeStyle = '#888';
	ctx_lhs.fillRect(0, 0, 6.5, ex.visible_page_height);
	ctx_lhs.strokeRect(0, 0, 6.5, ex.visible_page_height);

	const ctx_rhs = ex.rhs_margin.getContext('2d');
	ctx_rhs.beginPath();
	ctx_rhs.fillStyle = this.settings.bgcolor;
	ctx_rhs.strokeStyle = '#888';
	ctx_rhs.fillRect(0, 0, 6.5, ex.visible_page_height);
	ctx_rhs.strokeRect(0, 0, 6.5, ex.visible_page_height);

	this._clearMarginMarkup();
};

CodeMirrorDiffView.prototype._clearMarginMarkup = function() {
	const ex = this._draw_info();
	const ctx = ex.dcanvas.getContext('2d');
	ctx.beginPath();
	ctx.fillStyle = 'rgba(0,0,0,0)'; // transparent
	ctx.clearRect(0, 0, this.draw_mid_width, ex.visible_page_height);
};

CodeMirrorDiffView.prototype._diff = function() {
	const lhs = this.editor.lhs.getValue();
	const rhs = this.editor.rhs.getValue();
	Timer.start();
	const comparison = new diff(lhs, rhs, this.settings);
	this.trace('change', 'diff time', Timer.stop());
	this.changes = DiffParser(comparison.normal_form());
	this.trace('change', 'parse time', Timer.stop());
	this._calculate_offsets(this.changes);
	this.trace('change', 'offsets time', Timer.stop());
	this._renderDiff();
};

CodeMirrorDiffView.prototype._renderChanges = function() {
	this._clearMargins();
	if (this._current_diff === undefined && this.changes.length) {
		// go to first difference on start-up where values are provided in
		// settings.
		this._current_diff = 0;
	}
	this._markup_changes(this.changes);
	this.trace('change', 'markup time', Timer.stop());
	this._draw_diff(this.changes);
	this.trace('change', 'draw time', Timer.stop());
}

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

	// calculate extents of diff canvas
	this.draw_lhs_min = 0.5;
	this.draw_mid_width
		= this._queryElement(`#${this.lhsId}-${this.rhsId}-canvas`).offsetWidth;
	this.draw_rhs_max = this.draw_mid_width - 0.5; //24.5;
	this.draw_lhs_width = 5;
	this.draw_rhs_width = 5;
	this.em_height = led.defaultTextHeight();

	const mode = 'local';
	const lineWrapping = led.getOption('lineWrapping')
		|| red.getOption('lineWrapping');
	const lhschc = !lineWrapping ? led.charCoords({ line: 0 }, mode) : null;
	const rhschc = !lineWrapping ? red.charCoords({ line: 0 }, mode) : null;
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

		if (lineWrapping) {
			// if line wrapping is enabled, have to use a more computationally
			// intensive calculation to determine heights of lines
			if (change.op === 'c') {
				change['lhs-y-start'] = led.heightAtLine(llf, mode);
				change['lhs-y-end'] = led.heightAtLine(llt + 1, mode);
				change['rhs-y-start'] = red.heightAtLine(rlf, mode);
				change['rhs-y-end'] = red.heightAtLine(rlt + 1, mode);
			} else if (change.op === 'a') {
				// both lhs start and end are the same value
				if (change['lhs-line-from'] === -1) {
					change['lhs-y-start'] = led.heightAtLine(llf, mode);
				} else {
					change['lhs-y-start'] = led.heightAtLine(llf + 1, mode);
				}
				change['lhs-y-end'] = change['lhs-y-start'];
				change['rhs-y-start'] = red.heightAtLine(rlf, mode);
				change['rhs-y-end'] = red.heightAtLine(rlt + 1, mode);
			} else {
				// delete
				change['lhs-y-start'] = led.heightAtLine(llf, mode);
				change['lhs-y-end'] = led.heightAtLine(llt + 1, mode);
				// both rhs start and end are the same value
				if (change['rhs-line-from'] === -1) {
					change['rhs-y-start'] = red.heightAtLine(rlf, mode);
				} else {
					change['rhs-y-start'] = red.heightAtLine(rlf + 1, mode);
				}
				change['rhs-y-end'] = change['rhs-y-start'];
			}
		} else {
			// if line wrapping is not enabled, we can compute line height.
			if (change.op === 'c') {
				change['lhs-y-start'] = lhschc.top + llf * this.em_height;
				change['lhs-y-end'] = lhschc.bottom + llt * this.em_height;
				change['rhs-y-start'] = rhschc.top + rlf * this.em_height;
				change['rhs-y-end'] = rhschc.bottom + rlt * this.em_height;
			} else if (change.op === 'a') {
				// both lhs start and end are the same value
				if (change['lhs-line-from'] === -1) {
					change['lhs-y-start'] = lhschc.top + llf * this.em_height;
				} else {
					change['lhs-y-start'] = lhschc.bottom + llf * this.em_height;
				}
				change['lhs-y-end'] = change['lhs-y-start'];
				change['rhs-y-start'] = rhschc.top + rlf * this.em_height;
				change['rhs-y-end'] = rhschc.bottom + rlt * this.em_height;
			} else {
				// delete
				change['lhs-y-start'] = lhschc.top + llf * this.em_height;
				change['lhs-y-end'] = lhschc.bottom + llt * this.em_height;
				// both rhs start and end are the same value
				if (change['rhs-line-from'] === -1) {
					change['rhs-y-start'] = rhschc.top + rlf * this.em_height;
				} else {
					change['rhs-y-start'] = rhschc.bottom + rlf * this.em_height;
				}
				change['rhs-y-end'] = change['rhs-y-start'];
			}
		}
		// the height and line borders don't aligne - fudge the offset
		change['lhs-y-start'] += 1.5;
		change['lhs-y-end'] += 1.5;
		change['rhs-y-start'] += 1.5;
		change['rhs-y-end'] += 1.5;
	}
}

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

	// mark text deleted, LCS changes
	const marktext = [];
	for (let i = 0; this.settings.lcs && i < changes.length; ++i) {
		const change = changes[i];
		const llf = change['lhs-line-from'] >= 0 ? change['lhs-line-from'] : 0;
		const llt = change['lhs-line-to'] >= 0 ? change['lhs-line-to'] : 0;
		const rlf = change['rhs-line-from'] >= 0 ? change['rhs-line-from'] : 0;
		const rlt = change['rhs-line-to'] >= 0 ? change['rhs-line-to'] : 0;

		if (!this._is_change_in_view('lhs', lhsvp, change)
			&& !this._is_change_in_view('lhs', rhsvp, change)) {
			continue;
		}

		if (change.op == 'd') {
			// apply delete to cross-out (left-hand side only)
			const from = llf;
			const to = llt;

			// the change is within the viewport
			const to_ln = led.lineInfo(to);
			if (to_ln) {
				marktext.push([led, {line:from, ch:0}, {line:to, ch:to_ln.text.length}, {className: 'mergely ch d lhs'}]);
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
				// FIXME: function defined within loop
				lcs.diff(
					(from, to) => {
						// added
						marktext.push([
							red,
							{ line: k, ch: from },
							{ line: k, ch: to },
							{ className: 'mergely ch a rhs' }
						]);
					},
					(from, to) => {
						// removed
						marktext.push([
							led,
							{ line: j, ch: from },
							{ line: j, ch: to },
							{ className: 'mergely ch d lhs' }
						]);
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
	let ofrom = change[`${oside}-line-from`];
	const oto = change[`${oside}-line-to`];
	const doc = ed[side].getDoc();
	const odoc = ed[oside].getDoc();
	let fromlen = from >= 0 ? doc.getLine(from).length + 1 : 0;
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
	const visible_page_height = lhsScroll.offsetHeight; // fudged
	const gutter_height = lhsScroll.querySelector(':first-child').offsetHeight;
	const dcanvas = document.getElementById(`${this.lhsId}-${this.rhsId}-canvas`);
	if (dcanvas == undefined) {
		throw 'Failed to find: ' + this.lhsId + '-' + this.rhsId + '-canvas';
	}
	const lhs_margin = document.getElementById(`${this.id}-lhs-margin`);
	const rhs_margin = document.getElementById(`${this.id}-rhs-margin`);

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
	this.trace('draw', 'lhs-scroller-top', ex.lhs_scroller.scrollTop);
	this.trace('draw', 'rhs-scroller-top', ex.rhs_scroller.scrollTop);

	ex.lhs_margin.removeEventListener('click', this._handleLhsMarginClick);
	ex.rhs_margin.removeEventListener('click', this._handleRhsMarginClick);

	const lhsvp = this._get_viewport_side('lhs');
	const rhsvp = this._get_viewport_side('rhs');

	const radius = 3;
	const lhsScrollTop = ex.lhs_scroller.scrollTop;
	const rhsScrollTop = ex.rhs_scroller.scrollTop;

	const lratio = ex.lhs_margin.offsetHeight / ex.lhs_scroller.scrollHeight;
	const rratio = ex.rhs_margin.offsetHeight / ex.rhs_scroller.scrollHeight;

	for (let i = 0; i < changes.length; ++i) {
		const change = changes[i];
		if (this.settings.viewport 
			&& !this._is_change_in_view('lhs', lhsvp, change)
			&& !this._is_change_in_view('rhs', rhsvp, change)) {
			// skip if viewport enabled and the change is outside the viewport
			continue;
		}

		const lhs_y_start = change['lhs-y-start'] - lhsScrollTop;
		const lhs_y_end = change['lhs-y-end'] - lhsScrollTop;
		const rhs_y_start = change['rhs-y-start'] - rhsScrollTop;
		const rhs_y_end = change['rhs-y-end'] - rhsScrollTop;

		const fill = (this._current_diff === i) ?
			this.current_diff_color : this.settings.fgcolor[change.op];

		// draw margin indicators
		this.trace('draw', 'marker calculated', lhs_y_start, lhs_y_end, rhs_y_start, rhs_y_end);

		const mkr_lhs_y_start = change['lhs-y-start'] * lratio;
		const mkr_lhs_y_end = Math.max(change['lhs-y-end'] * lratio, 5);
		ctx_lhs.beginPath();
		ctx_lhs.fillStyle = '#a3a3a3';
		ctx_lhs.strokeStyle = '#000';
		ctx_lhs.lineWidth = 0.5;
		ctx_lhs.fillRect(1.5, mkr_lhs_y_start, 4.5, Math.max(mkr_lhs_y_end - mkr_lhs_y_start, 5));
		ctx_lhs.strokeRect(1.5, mkr_lhs_y_start, 4.5, Math.max(mkr_lhs_y_end - mkr_lhs_y_start, 5));
		ctx_lhs.stroke();

		const mkr_rhs_y_start = change['rhs-y-start'] * lratio;
		const mkr_rhs_y_end = Math.max(change['rhs-y-end'] * lratio, 5);
		ctx_rhs.beginPath();
		ctx_rhs.fillStyle = '#a3a3a3';
		ctx_rhs.strokeStyle = '#000';
		ctx_rhs.lineWidth = 0.5;
		ctx_rhs.fillRect(1.5, mkr_rhs_y_start, 4.5, Math.max(mkr_rhs_y_end - mkr_rhs_y_start, 5));
		ctx_rhs.strokeRect(1.5, mkr_rhs_y_start, 4.5, Math.max(mkr_rhs_y_end - mkr_rhs_y_start, 5));
		ctx_rhs.stroke();

		// draw left box
		ctx.beginPath();
		ctx.strokeStyle = fill;
		ctx.lineWidth = 1;

		let rectWidth = this.draw_lhs_width;
		let rectHeight = lhs_y_end - lhs_y_start - 1;
		let rectX = this.draw_lhs_min;
		let rectY = lhs_y_start;
		// top and top top-right corner

		this.trace('draw', 'drawing left box');
		ctx.moveTo(rectX, rectY);
		if (rectHeight <= 0) {
			ctx.lineTo(rectX + rectWidth, rectY);
		}
		else {
			ctx.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius, radius);
			ctx.arcTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight, radius);
		}
		// bottom line
		ctx.lineTo(rectX, rectY + rectHeight);
		ctx.stroke();

		this.trace('draw', 'drawing right box');
		rectWidth = this.draw_rhs_width;
		rectHeight = rhs_y_end - rhs_y_start - 1;
		rectX = this.draw_rhs_max;
		rectY = rhs_y_start;

		ctx.moveTo(rectX, rectY);
		if (rectHeight <= 0) {
			ctx.lineTo(rectX - rectWidth, rectY);
		}
		else {
			ctx.arcTo(rectX - rectWidth, rectY, rectX - rectWidth, rectY + radius, radius);
			ctx.arcTo(rectX - rectWidth, rectY + rectHeight, rectX - radius, rectY + rectHeight, radius);
		}
		ctx.lineTo(rectX, rectY + rectHeight);
		ctx.stroke();

		// connect boxes
		this.trace('draw', 'drawing box connector');
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

	this.trace('draw', 'drawing viewport');
	// visible viewport feedback
	ctx_lhs.fillStyle = this.settings.vpcolor;
	ctx_rhs.fillStyle = this.settings.vpcolor;

	const lfrom = lhsScrollTop * lratio;
	const lto = Math.max(ex.lhs_scroller.clientHeight * lratio, 5);
	const rfrom = rhsScrollTop * rratio;
	const rto = Math.max(ex.rhs_scroller.clientHeight * rratio, 5);

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
	<canvas id="${id}-${side}-margin" width="8px"></canvas>
</div>;`;
}

function getEditorTemplate({ id, side }) {
	return `\
<div id="${id}-editor-${side}" class="mergely-column">
	<textarea id="${id}-${side}"></textarea>
</div>`;
}

function getCenterCanvasTemplate({ id }) {
	return `\
<div class="mergely-canvas">
	<canvas id="${id}-lhs-${id}-rhs-canvas" width="28px"></canvas>
</div>`;
}

function getSplash({ icon, notice, left }) {
	return `\
<div class="mergely-splash">
	<p>
		<span class="mergely-icon"></span>
		This software is a Combined Work using Mergely and is covered by the
		${notice} license. For the full license, see
		<a target="_blank" href="http://www.mergely.com">http://www.mergely.com/license</a>.
	</p>
</div>`;
}

function throttle(func, { delay }) {
	let lastTime = 0;
	const throttleFn = () => {
		const now = Date.now();

		if (now - lastTime >= delay) {
			func.apply(this);
			lastTime = now;
		} else {
			this.trace('scroll', 'throttled');
			console.log('throttled');
			// call `func` if no other event after `delay`
			if (this._to) {
				clearTimeout(this._to);
			}
			this._to = setTimeout(() => {
				func.apply(this);
				this._to = null;
			}, delay);
		}
	};
	return throttleFn;
}

module.exports = CodeMirrorDiffView;
