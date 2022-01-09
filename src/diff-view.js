require('codemirror/addon/search/searchcursor.js');
require('codemirror/addon/selection/mark-selection.js');

const Timer = require('./timer');
const diff = require('./diff');
const DiffParser = require('./diff-parser');
const LCS = require('./lcs');
const VDoc = require('./vdoc');

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
Removed `options.fgcolor`
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
Introduce an async render pipeline as it's currently blocking UI
Fix issue where characters like `{}[].?` are not detected by LCS
Fix the popup
Fix Ctrl+Home not scrolling off initial render + jump to first
Fix full screen width with macbeth is too wide
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

const trace = console.log;
const traceTimeStart = console.time;
const traceTimeEnd = console.timeEnd;

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
		change_timeout: 1150,
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
	Timer.start();

	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'init', options);
	}
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
	this._vdoc = new VDoc();

	this._setOptions(options);
};

CodeMirrorDiffView.prototype.unbind = function() {
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'unbind');
	}
	if (this._changedTimeout != null) {
		clearTimeout(this._changedTimeout);
	}
	this.editor.lhs.toTextArea();
	this.editor.rhs.toTextArea();
	this._unbound = true;
};

CodeMirrorDiffView.prototype.remove = function() {
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'remove');
	}
	if (!this._unbound) {
		this.unbind();
	}
	while (this.el.lastChild) {
		this.el.removeChild(this.el.lastChild);
	}
};

CodeMirrorDiffView.prototype.lhs = function(text) {
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'lhs', text);
	}
	// invalidate existing changes and current position
	this.changes = [];
	this._current_diff = -1;
	this.editor.lhs.setValue(text);
};

CodeMirrorDiffView.prototype.rhs = function(text) {
	// invalidate existing changes and current position
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'rhs', text);
	}
	this.changes = [];
	this._current_diff = -1;
	this.editor.rhs.setValue(text);
};

CodeMirrorDiffView.prototype.update = function() {
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'update');
	}
	this._changing({ force: true });
};

CodeMirrorDiffView.prototype.unmarkup = function() {
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'unmarkup');
	}
	this._clear();
	this.el.dispatchEvent(new Event('updated'));
};

CodeMirrorDiffView.prototype.scrollToDiff = function(direction) {
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'scrollToDiff', direction);
	}
	if (!this.changes.length) return;
	if (direction === 'next') {
		if (this._current_diff === this.changes.length - 1
			|| this._current_diff === undefined) {
			this._current_diff = 0;
		} else {
			this._current_diff = Math.min(++this._current_diff, this.changes.length - 1);
		}
	} else if (direction === 'prev') {
		if (this._current_diff == 0
			|| this._current_diff === undefined) {
			this._current_diff = this.changes.length - 1;
		} else {
			this._current_diff = Math.max(--this._current_diff, 0);
		}
	}
	if (this.settings._debug.includes('change')) {
		trace('change', Timer.stop(), 'current-diff', this._current_diff);
	}
	this._scroll_to_change(this.changes[this._current_diff]);
};

CodeMirrorDiffView.prototype.mergeCurrentChange = function(side) {
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'mergeCurrentChange', side);
	}
	if (!this.changes.length) return;
	if (side == 'lhs' && !this.lhs_cmsettings.readOnly) {
		this._merge_change(this.changes[this._current_diff], 'rhs', 'lhs');
	}
	else if (side == 'rhs' && !this.rhs_cmsettings.readOnly) {
		this._merge_change(this.changes[this._current_diff], 'lhs', 'rhs');
	}
};

CodeMirrorDiffView.prototype.scrollTo = function(side, num) {
	if (this.settings._debug.includes('api')
		|| this.settings._debug.includes('event')) {
		trace('api', Timer.stop(), 'scrollTo', side, num);
	}
	const ed = this.editor[side];
	ed.setCursor(num);
	ed.centerOnCursor();
	this._renderChanges();
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
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'options', opts);
	}
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
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'swap');
	}
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
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'merge', side);
	}
	const le = this.editor.lhs;
	const re = this.editor.rhs;
	if (side === 'lhs' && !this.lhs_cmsettings.readOnly) {
		le.setValue(re.getValue());
	} else if (!this.rhs_cmsettings.readOnly) {
		re.setValue(le.getValue());
	}
};

CodeMirrorDiffView.prototype.summary = function() {
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'summary');
	}
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
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'get', side);
	}
	const ed = this.editor[side];
	const value = ed.getValue();
	if (value === undefined) {
		return '';
	}
	return value;
};

CodeMirrorDiffView.prototype.clear = function(side) {
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'clear', side);
	}
	if (side == 'lhs' && this.lhs_cmsettings.readOnly) return;
	if (side == 'rhs' && this.rhs_cmsettings.readOnly) return;
	const ed = this.editor[side];
	ed.setValue('');
	delete this._current_diff;
};

CodeMirrorDiffView.prototype.cm = function(side) {
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'cm', 'side');
	}
	return this.editor[side];
};

CodeMirrorDiffView.prototype.search = function(side, query, direction) {
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'search', side, query, direction);
	}
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
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'resize');
	}
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
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'diff');
	}
	const le = this.editor.lhs;
	const re = this.editor.rhs;
	const lhs = le.getValue();
	const rhs = re.getValue();
	const comparison = new diff(lhs, rhs, this.settings);
	return comparison.normal_form();
};

CodeMirrorDiffView.prototype.bind = function(el) {
	if (this.settings._debug.includes('api')) {
		trace('api', Timer.stop(), 'bind', el);
	}
	const { CodeMirror } = this;
	el.style.display = 'flex';
	// el.style.flexGrow = '1'; // FIXME: needed?
	el.style.height = '100%';
	this.id = el.id;
	const found = document.getElementById(this.id);
	if (!found) {
		console.error(`Failed to find mergely: #${this.id}`);
		return;
	}
	this.lhsId = `${this.id}-lhs`;
	this.rhsId = `${this.id}-rhs`;
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
	this._current_diff = -1;

	// get colors from user-defined css
	this._get_colors();

	// bind event listeners
	this.editor = {};
	this.editor.lhs = CodeMirror.fromTextArea(lhstx, this.lhs_cmsettings);
	this.editor.rhs = CodeMirror.fromTextArea(rhstx, this.rhs_cmsettings);

	// if `lhs` and `rhs` are passed in, this sets the values in each editor,
	// but the changes are not picked up until the explicit resize below.
	if (this.settings.lhs) {
		this.settings.lhs((value) => {
			this.lhs(value);
		});
	}
	if (this.settings.rhs) {
		this.settings.rhs((value) => {
			this.rhs(value);
		});
	}

	// If either editor gets a change, clear the view immediately
	this.editor.lhs.on('beforeChange', () => {
		this._clear();
	});
	this.editor.rhs.on('beforeChange', () => {
		this._clear();
	});

	this.editor.lhs.on('change', (instance, ev) => {
		if (this.settings._debug.includes('event')) {
			trace('event', Timer.stop(), 'change lhs', ev);
		}
		if (!this.settings.autoupdate) {
			return;
		}
		this._changing();
	});
	this.editor.lhs.on('scroll', () => {
		if (this.settings._debug.includes('event')) {
			trace('event', Timer.stop(), 'scroll lhs');
		}
		this._scrolling({ side: 'lhs', id: this.lhsId });
	});
	this.editor.rhs.on('change', (instance, ev) => {
		if (this.settings._debug.includes('event')) {
			trace('event', Timer.stop(), 'change rhs', ev);
		}
		if (!this.settings.autoupdate) {
			return;
		}
		this._changing();
	});
	this.editor.rhs.on('scroll', () => {
		if (this.settings._debug.includes('event')) {
			trace('event', Timer.stop(), 'scroll rhs');
		}
		this._scrolling({ side: 'rhs', id: this.rhsId });
	});

	// resize event handeler
	let resizeTimeout;
	const resize = () => {
		if (this.settings._debug.includes('event')) {
			traceTimeStart('resize');
		}
		this.resize();
		this.editor.lhs.refresh();
		this.editor.rhs.refresh();
		if (this.settings._debug.includes('event')) {
			traceTimeEnd('resize');
		}
	};
	this._handleResize = () => {
		if (resizeTimeout) {
			clearTimeout(resizeTimeout);
		}
		resizeTimeout = setTimeout(resize, this.settings.resize_timeout);
	};
	window.addEventListener('resize', () => {
		if (this.settings._debug.includes('event')) {
			trace('event', Timer.stop(), 'resize');
		}
		this._handleResize();
	});
	resize();

	// `scrollToDiff` from gutter
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
				if (this._current_diff >= 0) {
					const current = this.changes[this._current_diff];
					for (let i = current['lhs-line-from']; i <= current['lhs-line-to']; ++i) {
						console.log('remove gutter lhs', i);
						this.editor.lhs.removeLineClass(i, 'gutter');
					}
					for (let i = current['rhs-line-from']; i <= current['rhs-line-to']; ++i) {
						console.log('remove gutter rhs', i);
						this.editor.rhs.removeLineClass(i, 'gutter');
					}
				}

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
		if (this.settings._debug.includes('event')) {
			trace('event', Timer.stop(), 'gutterClick', 'lhs', n, ev);
		}
		gutterClicked.call(this, 'lhs', n, ev);
	});

	this.editor.rhs.on('gutterClick', (cm, n, gutterClass, ev) => {
		if (this.settings._debug.includes('event')) {
			trace('event', Timer.stop(), 'gutterClick', 'rhs', n, ev);
		}
		gutterClicked.call(this, 'rhs', n, ev);
	});

	el.addEventListener('updated', () => {
		if (this.settings._debug.includes('event')) {
			trace('event', Timer.stop(), 'updated');
		}
		// this._initializing = false;
		if (this.settings.loaded) {
			this.settings.loaded();
		}
	}, { once: true });
	this.editor.lhs.focus();
};

CodeMirrorDiffView.prototype._get_colors = function() {
	// get current diff border color from user-defined css
	this._colors = {};
	const currentColor
		= htmlToElement('<div style="display:none" class="mergely current start"></div>')
	this.el.append(currentColor);
	const currentStyle = window.getComputedStyle(currentColor);
	this._colors.current = {
		border: currentStyle.borderTopColor
	};
	currentColor.remove();

	const aColor
		= htmlToElement('<div style="display:none" class="mergely start end mergely rhs a"></div>')
	this.el.append(aColor);
	const aStyle = window.getComputedStyle(aColor);
	this._colors.a = {
		border: aStyle.borderTopColor,
		bg: aStyle.backgroundColor
	};
	aColor.remove();

	const dColor
		= htmlToElement('<div style="display:none" class="mergely start end lhs d"></div>')
	this.el.append(dColor);
	const dStyle = window.getComputedStyle(dColor);
	this._colors.d = {
		border: dStyle.borderTopColor,
		bg: dStyle.backgroundColor
	};
	dColor.remove();

	const cColor
		= htmlToElement('<div style="display:none" class="mergely start end mergely lhs c"></div>')
	this.el.append(cColor);
	const cStyle = window.getComputedStyle(cColor);
	this._colors.c = {
		border: cStyle.borderTopColor,
		bg: cStyle.backgroundColor
	};
	cColor.remove();
	if (this.settings._debug.includes('draw')) {
		trace('draw', Timer.stop(), '_get_colors', this._colors);
	}
}

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
		this.scrollTo('lhs', change['lhs-line-to'])
	} else if (change['rhs-line-to'] >= 0) {
		this.scrollTo('rhs', change['rhs-line-to'])
	}
	led.focus();
};

CodeMirrorDiffView.prototype._scrolling = function({ side, id }) {
	if (this.settings._debug.includes('scroll')) {
		traceTimeStart(`_scrolling ${side}`);
		trace('scroll', Timer.stop(), '_scrolling', side, 'start');
	}

	// if (this._changedTimeout) {
	// 	// FIXME:
	// 	throw new Error('FIXME: this does not work as expected');
	// 	console.log('change in progress; skipping scroll');
	// 	return;
	// }
	if (this._skipscroll[side] === true) {
		if (this.settings._debug.includes('scroll')) {
			trace('scroll', Timer.stop(), '_scrolling', 'skip scroll', side);
		}
		// scrolling one side causes the other to event - ignore it, but use
		// the event to trigger a render.
		this._skipscroll[side] = false;
		traceTimeEnd(`_scrolling ${side}`);
		return;
	}
	if (!this.changes) {
		// pasting a wide line can trigger scroll before changes
		// are calculated
		traceTimeEnd(`_scrolling ${side}`);
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
		if (this.settings._debug.includes('scroll')) {
			trace('scroll', Timer.stop(), '_scrolling', 'last change before midline', last_change);
		}
		if (midline.line >= vp.from && midline <= vp.to) {
			scroll = false;
		}
	}
	if (scroll || force_scroll) {
		// scroll the other side
		if (this.settings._debug.includes('scroll')) {
			trace('scroll', Timer.stop(), '_scrolling', 'other side pos:', top_to - top_adjust);
		}
		// disable next scroll event because we trigger it
		this._skipscroll[oside] = true;
		const top = top_to - top_adjust;

		// will scroll - note that CM scrolling is expensive and can take 70ms
		// to scroll, which doesn't sound like much, but it can be jittery
		this.editor[oside].scrollTo(left_to, top_to - top_adjust);
		if (this._scrollTimeout) {
			clearTimeout(this._scrollTimeout);
			this._scrollTimeout = null;
		}
		// FIXME: this renders a "laggy" scroll view but performs better, but
		// is still not performant enough.
		// this._scrollTimeout = setTimeout(() => {
		// 	if (this.settings._debug.includes('scroll')) {
		// 		trace('_scrolling', 'forced update');
		// 	}
		// 	// will not scroll, force an update
		// 	this._renderChanges();
		// }, 100);
	} else if (this.settings._debug.includes('scroll')) {
		trace('scroll', Timer.stop(), '_scrolling', 'not scrolling other side');
	}
	// FIXME: this renders a better scroll view but is slower
	this._renderChanges(); // FIXME: experimental

	if (this.settings._debug.includes('scroll')) {
		traceTimeEnd(`_scrolling ${side}`);
	}
};

CodeMirrorDiffView.prototype._changing = function({ force } = { force: false }) {
	if (this.settings._debug.includes('change')) {
		traceTimeStart('_changing');
	}
	const handleChange = () => {
		this._changedTimeout = null;
		if (!force && !this.settings.autoupdate) {
			if (this.settings._debug.includes('change')) {
				trace('change', Timer.stop(), '_changing', 'ignore change', force, this.settings.autoupdate);
			}
			return;
		}
		this._changed();
	};
	if (this.settings.change_timeout > 0) {
		if (this.settings._debug.includes('change')) {
			trace('change', Timer.stop(), 'setting timeout', this.settings.change_timeout)
		}
		if (this._changedTimeout != null) {
			clearTimeout(this._changedTimeout);
		}
		this._changedTimeout = setTimeout(handleChange, this.settings.change_timeout);
	} else {
		// FIXME: needed?
		setImmediate(handleChange);
		// handleChange();
	}
	if (this.settings._debug.includes('change')) {
		traceTimeEnd('_changing');
	}
};

CodeMirrorDiffView.prototype._changed = function() {
	if (this.settings._debug.includes('change')) {
		trace('change', Timer.stop(), '_changed', 'start');
		traceTimeStart('_changed');
	}
	// NOTE: clear is handled by the beforeChange event
	this._diff();
	if (this.settings._debug.includes('change')) {
		traceTimeEnd('_changed');
	}
};

/**
 * Clears the rendered canvases and text markup.  After, `_renderChanges`
 * can be called to re-render the current diff.
 */
CodeMirrorDiffView.prototype._clear = function() {
	if (this.settings._debug.includes('draw')) {
		traceTimeStart('_clear');
		trace('draw', Timer.stop(), '_clear', 'start');
	}
	this.changes = [];
	this._clearMarkup();
	this._clearCanvases();
	if (this.settings._debug.includes('draw')) {
		traceTimeEnd('_clear');
	}
};

CodeMirrorDiffView.prototype._clearMarkup = function () {
	if (this.settings._debug.includes('draw')) {
		traceTimeStart('_clearMarkup');
	}
	this._vdoc.clear();
	this._vdoc = new VDoc();
	if (this.settings._debug.includes('draw')) {
		traceTimeEnd('_clearMarkup');
	}
}

CodeMirrorDiffView.prototype._clearCanvases = function() {
	if (this.settings._debug.includes('draw')) {
		traceTimeStart('_clearCanvases');
	}

	const ex = this._draw_info();

	// clear margins
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

	const ctx = ex.dcanvas.getContext('2d');
	ctx.beginPath();
	ctx.fillStyle = 'rgba(0,0,0,0)'; // transparent
	ctx.clearRect(0, 0, this.draw_mid_width, ex.visible_page_height);

	if (this.settings._debug.includes('draw')) {
		traceTimeEnd('_clearCanvases');
	}
};

CodeMirrorDiffView.prototype._diff = function() {
	const lhs = this.editor.lhs.getValue();
	const rhs = this.editor.rhs.getValue();
	if (this.settings._debug.includes('diff')) {
		trace('draw', Timer.stop(), '_diff', 'start');
		traceTimeStart('_diff');
	}
	const comparison = new diff(lhs, rhs, this.settings);
	this.changes = DiffParser(comparison.normal_form());
	if (this.settings._debug.includes('diff')) {
		traceTimeEnd('_diff');
	}
	this._renderChanges();
	this.el.dispatchEvent(new Event('updated'));
};

CodeMirrorDiffView.prototype._renderChanges = function() {
	if (this.settings._debug.includes('draw')) {
		trace('draw', Timer.stop(), '_renderChanges', 'start');
		traceTimeStart('_renderChanges');
	}
	this._clearCanvases();
	this._calculate_offsets(this.changes);
	this._markupLineChanges(this.changes);
	this._renderDiff(this.changes);
	if (this.settings._debug.includes('draw')) {
		traceTimeEnd('_renderChanges');
	}
}

CodeMirrorDiffView.prototype._get_viewport_side = function(side) {
	const editor = this.editor[side];
    const rect = editor.getWrapperElement().getBoundingClientRect();
    const topVisibleLine = editor.lineAtHeight(rect.top, 'window');
    const bottomVisibleLine = editor.lineAtHeight(rect.bottom, 'window');
	return {
		from: topVisibleLine,
		to: bottomVisibleLine
	};
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
	if (this.settings._debug.includes('draw')) {
		traceTimeStart('_calculate_offsets');
	}
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
	if (this.settings._debug.includes('draw')) {
		traceTimeEnd('_calculate_offsets');
	}
}

CodeMirrorDiffView.prototype._markupLineChanges = function (changes) {
	if (this.settings._debug.includes('draw')) {
		traceTimeStart('_markupLineChanges');
	}
	const {
		lhs: led,
		rhs: red
	} = this.editor;
	const current_diff = this._current_diff;
	const lhsvp = this._get_viewport_side('lhs');
	const rhsvp = this._get_viewport_side('rhs');
	const { _vdoc: vdoc } = this;

	led.operation(() => {
		for (let i = 0; i < changes.length; ++i) {
			const change = changes[i];
			if (!this._is_change_in_view('lhs', lhsvp, change)) {
				// if the change is outside the viewport, skip
				continue;
			}
			if (vdoc.hasRendered('lhs', i)) {
				// already rendered
				continue;
			}
			vdoc.addRender('lhs', change, i, {
				isCurrent: current_diff === i,
				getMergeHandler: (change, side, oside) => {
					return () => this._merge_change(change, side, oside);
				},
				mergeButton: red.getOption('readOnly')
					? null : this.merge_rhs_button.cloneNode(true) 
			});
			vdoc.update('lhs', i, led);
		}
	});

	red.operation(() => {
		for (let i = 0; i < changes.length; ++i) {
			const change = changes[i];
			if (!this._is_change_in_view('rhs', rhsvp, change)) {
				// if the change is outside the viewport, skip
				continue;
			}
			if (vdoc.hasRendered('rhs', i)) {
				// already rendered
				continue;
			}
			vdoc.addRender('rhs', change, i, {
				isCurrent: current_diff === i,
				getMergeHandler: (change, side, oside) => {
					return () => this._merge_change(change, side, oside);
				},
				mergeButton: led.getOption('readOnly')
					? null : this.merge_lhs_button.cloneNode(true) 
			});
			vdoc.update('rhs', i, red);
		}
	});

	// mark text deleted, LCS changes

	function getMarkupFunc({ marktext, editor, lineNum, op }) {
		return (from, to) => {
			marktext.push([
				editor,
				{ line: lineNum, ch: from },
				{ line: lineNum, ch: to },
				{ className: `mergely ch ${op}` }
			]);
		}
	}
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

				if (this.settings._debug.includes('diff')) {
					traceTimeStart(`diff lcs change: ${i}`);
				}

				const lcs = new LCS(lhs_line, rhs_line, {
					ignoreaccents: !!this.settings.ignoreaccents,
					ignorews: !!this.settings.ignorews
				});

				lcs.diff(
					getMarkupFunc({ marktext, editor: red, lineNum: k, op: 'a rhs' }),
					getMarkupFunc({ marktext, editor: led, lineNum: j, op: 'd lhs' })
				);

				if (this.settings._debug.includes('diff')) {
					traceTimeEnd(`diff lcs change: ${i}`);
				}
			}
		}
	}

	if (this.settings._debug.includes('draw')) {
		trace('draw', Timer.stop(), '_markupLineChanges applying', marktext.length, 'markups');
	}

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

	if (this.settings._debug.includes('draw')) {
		traceTimeEnd('_markupLineChanges');
	}
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
};

CodeMirrorDiffView.prototype._draw_info = function() {
	const lhsScroll = this.editor.lhs.getScrollerElement();
	const rhsScroll = this.editor.rhs.getScrollerElement();
	const visible_page_height = lhsScroll.offsetHeight; // fudged
	const dcanvas = document.getElementById(`${this.lhsId}-${this.rhsId}-canvas`);
	if (dcanvas == undefined) {
		throw new Error('Failed to find: ' + this.lhsId + '-' + this.rhsId + '-canvas');
	}
	const lhs_margin = document.getElementById(`${this.id}-lhs-margin`);
	const rhs_margin = document.getElementById(`${this.id}-rhs-margin`);

	return {
		visible_page_height: visible_page_height,
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

CodeMirrorDiffView.prototype._renderDiff = function(changes) {
	const ex = this._draw_info();
	const mcanvas_lhs = ex.lhs_margin;
	const mcanvas_rhs = ex.rhs_margin;
	const ctx = ex.dcanvas.getContext('2d');
	const ctx_lhs = mcanvas_lhs.getContext('2d');
	const ctx_rhs = mcanvas_rhs.getContext('2d');

	if (this.settings._debug.includes('draw')) {
		trace('draw', Timer.stop(), '_renderDiff', 'visible page height', ex.visible_page_height);
		trace('draw', Timer.stop(), '_renderDiff', 'scroller-top lhs', ex.lhs_scroller.scrollTop);
		trace('draw', Timer.stop(), '_renderDiff', 'scroller-top rhs', ex.rhs_scroller.scrollTop);
	}

	ex.lhs_margin.removeEventListener('click', this._handleLhsMarginClick);
	ex.rhs_margin.removeEventListener('click', this._handleRhsMarginClick);

	const lhsvp = this._get_viewport_side('lhs');
	const rhsvp = this._get_viewport_side('rhs');

	const radius = 3;
	const lhsScrollTop = ex.lhs_scroller.scrollTop;
	const rhsScrollTop = ex.rhs_scroller.scrollTop;

	const lratio = ex.lhs_margin.offsetHeight / ex.lhs_scroller.scrollHeight;
	const rratio = ex.rhs_margin.offsetHeight / ex.rhs_scroller.scrollHeight;

	// draw margin indicators
	for (let i = 0; i < changes.length; ++i) {
		const change = changes[i];

		const lhs_y_start = change['lhs-y-start'] - lhsScrollTop;
		const lhs_y_end = change['lhs-y-end'] - lhsScrollTop;
		const rhs_y_start = change['rhs-y-start'] - rhsScrollTop;
		const rhs_y_end = change['rhs-y-end'] - rhsScrollTop;

		if (Number.isNaN(lhs_y_start)) {
			trace('draw', Timer.stop(), '_renderDiff', 'unexpected NaN',
				change['lhs-y-start'], change['lhs-y-end']);
			continue;
		}

		// draw margin indicators
		if (this.settings._debug.includes('draw1')) {
			trace('draw', Timer.stop(), '_renderDiff', 'draw1', 'marker',
				lhs_y_start, lhs_y_end, rhs_y_start, rhs_y_end);
		}

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

		// draw canvas markup changes
		if (!this._is_change_in_view('lhs', lhsvp, change)
			&& !this._is_change_in_view('rhs', rhsvp, change)) {
			// skip if viewport enabled and the change is outside the viewport
			continue;
		}

		const borderColor = (this._current_diff === i) ?
			this._colors.current.border : this._colors[change.op].border;

		// draw left box
		ctx.beginPath();
		ctx.strokeStyle = borderColor;
		ctx.lineWidth = 1;

		let rectWidth = this.draw_lhs_width;
		let rectHeight = lhs_y_end - lhs_y_start - 1;
		let rectX = this.draw_lhs_min;
		let rectY = lhs_y_start;
		// top and top top-right corner

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
<textarea id="${id}-${side}" class="mergely-column"></textarea>`;
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
	const throttleFn = (...args) => {
		const now = Date.now();

		/*if ((now - lastTime >= delay)) {
			//console.log('not throttled', `rendering ${!!this._to}`, (now - lastTime), delay);
			//func.apply(this);
			//lastTime = now;
		} else {
		*/
			// this.trace('scroll', 'throttled');
			console.log('throttled');
			// call `func` if no other event after `delay`
			if (this._to) {
				clearTimeout(this._to);
			}
			this._to = setTimeout(() => {
				console.log('apply', delay);
				func.apply(this, args);
				this._to = null;
			}, delay);
		//}
	};
	return throttleFn;
}

module.exports = CodeMirrorDiffView;
