const CodeMirror = require('codemirror');
require('codemirror/addon/search/searchcursor.js');
require('codemirror/addon/selection/mark-selection.js');
require('codemirror/lib/codemirror.css');
require('codemirror/mode/go/go.js');
require('codemirror/mode/javascript/javascript.js');
require('codemirror/mode/htmlmixed/htmlmixed.js');
require('codemirror/mode/markdown/markdown.js');
require('codemirror/mode/python/python.js');

const dom = require('./dom.js');
const VDoc = require('./vdoc');

const NOTICES = [
	'lgpl-separate-notice',
	'gpl-separate-notice',
	'mpl-separate-notice',
	'commercial'
];

function CodeMirrorDiffView(el, options) {
	CodeMirror.defineExtension('centerOnCursor', function() {
		const coords = this.cursorCoords(null, 'local');
		this.scrollTo(null,
			(coords.top + coords.bottom) / 2 - (this.getScrollerElement().clientHeight / 2));
	});
	this.init(el, options);
};

const trace = console.log;
const traceTimeStart = console.time;
const traceTimeEnd = console.timeEnd;

CodeMirrorDiffView.prototype.init = function(el, options = {}) {
	this.setOptions(options);
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
	this._vdoc = new VDoc({ _debug: this.settings._debug });
	this._linkedScrollTimeout = {};
};

CodeMirrorDiffView.prototype.unbind = function() {
	if (this._unbound) {
		return;
	}
	this.trace('api#unbind');
	if (this._changedTimeout != null) {
		clearTimeout(this._changedTimeout);
	}
	if (this.editor) {
		this.editor.lhs && this.editor.lhs.toTextArea();
		this.editor.rhs && this.editor.rhs.toTextArea();
	}
	while (this.el.lastChild) {
		this.el.removeChild(this.el.lastChild);
	}
	if (this._origEl) {
		this.el.style = this._origEl.style;
		this.el.className = this._origEl.className;
	}
	this._unbound = true;
};

CodeMirrorDiffView.prototype.readOnly = function(side) {
	if (side === 'lhs') {
		return this.lhs_cmsettings.readOnly;
	} else if (side === 'rhs') {
		return this.rhs_cmsettings.readOnly;
	} else {
		return this.lhs_cmsettings.readOnly || this.rhs_cmsettings.readOnly;
	}
}

CodeMirrorDiffView.prototype.lhs = function(text) {
	this.trace('api#lhs', text && text.length);
	// invalidate existing changes and current position
	this.changes = [];
	this._current_diff = -1;
	this.editor.lhs.setValue(text);
};

CodeMirrorDiffView.prototype.rhs = function(text) {
	// invalidate existing changes and current position
	this.trace('api#rhs', text && text.length);
	this.changes = [];
	this._current_diff = -1;
	this.editor.rhs.setValue(text);
};

CodeMirrorDiffView.prototype.update = function() {
	this.trace('api#update');
	this.el.dispatchEvent(new Event('changed'));
};

CodeMirrorDiffView.prototype.unmarkup = function() {
	this.trace('api#unmarkup');
	this._clear();
	this.el.dispatchEvent(new Event('updated'));
};

CodeMirrorDiffView.prototype.scrollToDiff = function(direction) {
	this.trace('api#scrollToDiff', direction);
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
	this.trace('change', 'current-diff', this._current_diff);
	// _current_diff changed, refresh the view
	this._scroll_to_change(this.changes[this._current_diff]);
	this.setChanges(this.changes);
};

CodeMirrorDiffView.prototype.mergeCurrentChange = function(side) {
	this.trace('api#mergeCurrentChange', side);
	if (!this.changes.length) return;
	if (side == 'lhs' && !this.lhs_cmsettings.readOnly) {
		this._merge_change(this.changes[this._current_diff], 'rhs', 'lhs');
	}
	else if (side == 'rhs' && !this.rhs_cmsettings.readOnly) {
		this._merge_change(this.changes[this._current_diff], 'lhs', 'rhs');
	}
};

CodeMirrorDiffView.prototype.scrollTo = function(side, num) {
	this.trace('api#scrollTo', side, num);
	const ed = this.editor[side];
	ed.setCursor(num);
	ed.centerOnCursor();
	this._renderChanges();
	this.el.dispatchEvent(new Event('updated'));
};

CodeMirrorDiffView.prototype.setOptions = function(opts) {
	const current_margin_rhs = this.settings ? this.settings.rhs_margin : 'right';
	this.settings = {
		...this.settings,
		...opts
	};
	this.trace('api#setOptions', opts);

	// if options set after init
	if (this.editor) {
		if (opts.hasOwnProperty('sidebar')) {
			const divs = document.querySelectorAll(`#${this.id} .mergely-margin`);
			const visible = !!opts.sidebar;
			for (const div of divs) {
				div.style.visibility = visible ? 'visible' : 'hidden';
			}
		}

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
		if (opts.hasOwnProperty('rhs_margin') && opts.rhs_margin !== current_margin_rhs) {
			// dynamically swap the margin
			const divs = document.querySelectorAll(`#${this.id} .mergely-editor > div`);
			// [0:margin] [1:lhs] [2:mid] [3:rhs] [4:margin], swaps 4 with 3
			divs[4].parentNode.insertBefore(divs[4], divs[3]);
		}
		this._changing();
	}
};

CodeMirrorDiffView.prototype.get = function(side) {
	this.trace('api#get', side);
	const ed = this.editor[side];
	const value = ed.getValue();
	if (value === undefined) {
		return '';
	}
	return value;
};

CodeMirrorDiffView.prototype.cm = function(side) {
	this.trace('api#cm', 'side');
	return this.editor[side];
};

CodeMirrorDiffView.prototype.search = function(side, query, direction) {
	this.trace('api#search', side, query, direction);
	const editor = this.editor[side];
	if (!editor.getSearchCursor) {
		throw new Error('install CodeMirror search addon');
	}
	const searchDirection = (direction === 'prev')
		? 'findPrevious' : 'findNext';
	const start = { line: 0, ch: 0 };
	if ((editor.getSelection().length === 0) || (this.prev_query[side] !== query)) {
		this.cursor[this.id] = editor.getSearchCursor(query, start, false);
		this.prev_query[side] = query;
	}
	let cursor = this.cursor[this.id];
	if (cursor[searchDirection]()) {
		editor.setSelection(cursor.from(), cursor.to());
	}
	else {
		// Failed to find, reset and start again (this seems harder than it should be)
		cursor = this.cursor[this.id] = editor.getSearchCursor(query, start, false);
		this.prev_query[side] = query;
		if (cursor[searchDirection]()) {
			editor.setSelection(cursor.from(), cursor.to());
		}
	}
};

CodeMirrorDiffView.prototype.resize = function() {
	this.trace('api#resize');
	const parent = this.el;
	const contentHeight = parent.offsetHeight - 2;

	const lhsMargin = this._queryElement(`#${this.id}-lhs-margin`);
	lhsMargin.style.height = `${contentHeight}px`;
	lhsMargin.height = `${contentHeight}`;
	const midCanvas = this._queryElement(`#${this.id}-lhs-rhs-canvas`);
	midCanvas.style.height = `${contentHeight}px`;
	midCanvas.height = `${contentHeight}`;
	const rhsMargin = this._queryElement(`#${this.id}-rhs-margin`);
	rhsMargin.style.height = `${contentHeight}px`;
	rhsMargin.height = `${contentHeight}`;

	this.el.dispatchEvent(new Event('resized'));

	// recalculate line height as it may be zoomed
	this.em_height = null;
	this._changing();
	this._set_top_offset('lhs');
};

CodeMirrorDiffView.prototype.bind = function(container) {
	this.trace('api#bind', container);
	this._origEl = {
		style: container.style,
		className: container.className
	};
	const el = dom.getMergelyContainer({ clazz: container.className });
	const computedStyle = window.getComputedStyle(container);
	if (!computedStyle.height || computedStyle.height === '0px') {
		throw new Error(
			`The element "${container.id}" requires an explicit height`);
	}
	this.id = `${container.id}`;
	this.lhsId = `${container.id}-lhs`;
	this.rhsId = `${container.id}-rhs`;
	this.chfns = { lhs: [], rhs: [] };
	this.prev_query = [];
	this.cursor = [];
	this._skipscroll = {};
	this.change_exp = new RegExp(/(\d+(?:,\d+)?)([acd])(\d+(?:,\d+)?)/);
	// homebrew button
	const lhsTemplate = `<div class="merge-button" title="Merge left">&#x25C0;</div>`;
	const rhsTemplate = `<div class="merge-button" title="Merge right">&#x25B6;</div>`;
	this.merge_lhs_button = dom.htmlToElement(lhsTemplate);
	this.merge_rhs_button = dom.htmlToElement(rhsTemplate);

	// create the textarea and canvas elements
	// el.className += ' mergely-editor';
	const canvasLhs = dom.getMarginTemplate({ id: this.lhsId });
	const canvasRhs = dom.getMarginTemplate({ id: this.rhsId });
	const editorLhs = dom.getEditorTemplate({ id: this.lhsId });
	const editorRhs = dom.getEditorTemplate({ id: this.rhsId });
	const canvasMid = dom.getCenterCanvasTemplate({ id: this.id });

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
		canvasLhs.style.visibility = 'hidden';
		canvasRhs.style.visibility = 'hidden';
	}
	container.append(el);

	if (NOTICES.indexOf(this.settings.license) < 0) {
		container.addEventListener('updated', () => {
			const noticeTypes = {
				'lgpl': 'GNU LGPL v3.0',
				'gpl': 'GNU GPL v3.0',
				'mpl': 'MPL 1.1'
			};
			let notice = noticeTypes[this.settings.license];
			if (!notice) {
				notice = noticeTypes.lgpl;
			}
			const editor = this._queryElement(`#${this.id}`);
			const splash = dom.getSplash({
				notice,
				left: (editor.offsetWidth - 300) / 2,
				top: (editor.offsetHeight - 58) / 3
			});
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

	// bind event listeners
	this.editor = {};
	this.editor.lhs = CodeMirror.fromTextArea(lhstx, this.lhs_cmsettings);
	this.editor.rhs = CodeMirror.fromTextArea(rhstx, this.rhs_cmsettings);

	// if `lhs` and `rhs` are passed in, this sets the values in each editor,
	// but the changes are not picked up until the explicit resize below.
	if (this.settings.lhs) {
		const type = typeof(this.settings.lhs);
		if (type === 'string') {
			this.lhs(this.settings.lhs);
		} else if (type === 'function') {
			this.settings.lhs((value) => { this.lhs(value); });
		}
	}
	if (this.settings.rhs) {
		const type = typeof(this.settings.rhs);
		if (type === 'string') {
			this.rhs(this.settings.rhs);
		} else if (type === 'function') {
			this.settings.rhs((value) => { this.rhs(value); });
		}
	}

	// If either editor gets a change, clear the view immediately, otherwise
	// can lead to artifacts appearing from the codemirror edit pushing lines
	// up or down.
	// FIXME: this causes high-amount of flicker (have no fix)
	this.editor.lhs.on('beforeChange', (cm, ev) => {
		if (ev.text.length > 1
			|| ((ev.from.line - ev.to.line) && ev.origin === '+delete')) {
			this._clear();
		}
	});
	this.editor.rhs.on('beforeChange', (cm, ev) => {
		this.trace('event#rhs-beforeChange', ev);
		if (ev.text.length > 1
			|| ((ev.from.line - ev.to.line) && ev.origin === '+delete')) {
			this._clear();
		}
	});

	this.editor.lhs.on('change', (instance, ev) => {
		this.trace('event#lhs-change');
		this._changing();
		this.trace('event#lhs-change [emitted]');
	});
	this.editor.lhs.on('scroll', () => {
		if (this._skipscroll.lhs) {
			this.trace('event#lhs-scroll (skipped)');
			return;
		} else {
			this.trace('event#lhs-scroll');
		}
		// firefox scroll-linked effect render issue
		setTimeout(() => {
			this._scrolling({ side: 'lhs' });
		}, 1);
	});
	this.editor.rhs.on('change', (instance, ev) => {
		this.trace('event#rhs-change', ev);
		this._changing();
	});
	this.editor.rhs.on('scroll', () => {
		if (this._skipscroll.rhs) {
			this.trace('event#rhs-scroll (skipped)');
			return;
		} else {
			this.trace('event#rhs-scroll');
		}
		// firefox scroll-linked effect render issue
		setTimeout(() => {
			this._scrolling({ side: 'rhs' });
		}, 1);
	});

	// resize event handeler
	let resizeTimeout;
	const resize = () => {
		if (this.settings._debug) {
			traceTimeStart('event#resize');
			this.trace('event#resize [start]');
		}
		this.resize();
		if (this.settings._debug) {
			traceTimeEnd('event#resize');
		}
	};
	this._handleResize = () => {
		if (resizeTimeout) {
			clearTimeout(resizeTimeout);
		}
		resizeTimeout = setTimeout(resize, this.settings.resize_timeout);
	};
	window.addEventListener('resize', () => {
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
						this.editor.lhs.removeLineClass(i, 'gutter');
					}
					for (let i = current['rhs-line-from']; i <= current['rhs-line-to']; ++i) {
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
		this.trace('event#gutterClick', 'lhs', n, ev);
		gutterClicked.call(this, 'lhs', n, ev);
	});

	this.editor.rhs.on('gutterClick', (cm, n, gutterClass, ev) => {
		this.trace('event#gutterClick', 'rhs', n, ev);
		gutterClicked.call(this, 'rhs', n, ev);
	});

	this.editor.lhs.focus();
};

/**
 * Clears current diff, rendered canvases, and text markup.
 */
CodeMirrorDiffView.prototype._clear = function() {
	if (this.settings._debug) {
		traceTimeStart('draw#_clear');
	}
	this.changes = [];
	this._clearMarkup();
	this._clearCanvases();
	if (this.settings._debug) {
		traceTimeEnd('draw#_clear');
	}
};

CodeMirrorDiffView.prototype._clearMarkup = function () {
	if (this.settings._debug) {
		traceTimeStart('draw#_clearMarkup');
	}
	this._vdoc.clear();
	this._vdoc = new VDoc({ _debug: this.settings._debug });
	if (this.settings._debug) {
		traceTimeEnd('draw#_clearMarkup');
	}
}

CodeMirrorDiffView.prototype._clearCanvases = function() {
	if (this.settings._debug) {
		traceTimeStart('draw#_clearCanvases');
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

	if (this.settings._debug) {
		traceTimeEnd('draw#_clearCanvases');
	}
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
		this.scrollTo('lhs', change['lhs-line-to']);
	} else if (change['rhs-line-to'] >= 0) {
		this.scrollTo('rhs', change['rhs-line-to']);
	}
	led.focus();
};

CodeMirrorDiffView.prototype._scrolling = function({ side }) {
	if (this.settings._debug) {
		traceTimeStart(`scroll#_scrolling ${side}`);
	}
	if (!this.changes) {
		// pasting a wide line can trigger scroll before changes
		// are calculated
		if (this.settings._debug) {
			traceTimeEnd(`scroll#_scrolling ${side}`);
		}
		return;
	}
	const scroller = this.editor[side].getScrollerElement();
	const { top } = scroller.getBoundingClientRect();
	let height;
	if (scroller.offsetParent === null) {
		return;
	}
	if (this.midway == undefined) {
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
		this.trace('scroll#_scrolling', 'last change before midline', last_change);
		if (midline.line >= vp.from && midline <= vp.to) {
			scroll = false;
		}
	}
	if (scroll || force_scroll) {
		// scroll the other side
		this.trace('scroll#_scrolling', 'other side', oside, 'pos:', top_to - top_adjust);

		// disable linked scroll events for the opposite editor because this
		// triggers the next one explicitly, and we don't want to link the
		// scroll in that case. the events can be unpredictable, sometimes
		// coming in 2s, so this will "link" scrolling the other editor to
		// this editor until this editor stops scrolling and times out.
		this._skipscroll[oside] = true;
		this.trace('scroll#set oside skip set:', oside, this._skipscroll);
		if (this._linkedScrollTimeout[oside]) {
			clearTimeout(this._linkedScrollTimeout[oside]);
			this.trace('scroll#clearing timeout:', this._skipscroll);
		}
		this._linkedScrollTimeout[oside] = setTimeout(() => {
			this._skipscroll[oside] = false;
			this.trace('scroll#set oside skip unset:', oside, this._skipscroll);
		}, 100);

		const top = top_to - top_adjust;
		// scroll the opposite editor
		this.editor[oside].scrollTo(left_to, top);
	} else {
		this.trace('scroll#_scrolling', 'not scrolling other side');
	}
	this._renderChanges();

	if (this.settings._debug) {
		traceTimeEnd(`scroll#_scrolling ${side}`);
	}
};

CodeMirrorDiffView.prototype._changing = function() {
	if (!this.settings.autoupdate) {
		this.trace('change#_changing autoupdate is disabled');
		return;
	}
	if (this.settings._debug) {
		traceTimeStart('change#_changing');
		this.trace('change#_changing [start]');
	}
	const handleChange = () => {
		this._changedTimeout = null;
		this.el.dispatchEvent(new Event('changed'));
	};
	if (this.settings.change_timeout > 0) {
		this.trace('change#setting timeout', this.settings.change_timeout)
		if (this._changedTimeout != null) {
			clearTimeout(this._changedTimeout);
		}
		this._changedTimeout = setTimeout(handleChange, this.settings.change_timeout);
	} else {
		handleChange();
	}
	if (this.settings._debug) {
		traceTimeEnd('change#_changing');
	}
};

CodeMirrorDiffView.prototype.setChanges = function(changes) {
	this.trace('change#setChanges');
	this._clear();
	// after clear, set the new changes
	this.changes = changes;
	this._renderChanges();
}

CodeMirrorDiffView.prototype._renderChanges = function() {
	if (this.settings._debug) {
		traceTimeStart('draw#_renderChanges');
		this.trace('draw#_renderChanges [start]', this.changes.length, 'changes');
	}
	this._clearCanvases();
	this._calculateOffsets(this.changes);
	this._markupLineChanges(this.changes);
	this._renderDiff(this.changes);
	if (this.settings._debug) {
		traceTimeEnd('draw#_renderChanges');
	}
	this.el.dispatchEvent(new Event('updated'));
}

CodeMirrorDiffView.prototype._getViewportSide = function(side) {
	const editor = this.editor[side];
    const rect = editor.getWrapperElement().getBoundingClientRect();
    const topVisibleLine = editor.lineAtHeight(rect.top, 'window');
    const bottomVisibleLine = editor.lineAtHeight(rect.bottom, 'window');
	return {
		from: topVisibleLine,
		to: bottomVisibleLine
	};
};

CodeMirrorDiffView.prototype._isChangeInView = function(side, vp, change) {
	if (change[`${side}-line-from`] < 0 || change[`${side}-line-to`] < 0) {
		// handle case where the diff is "empty" - always in view
		return true;
	}

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

CodeMirrorDiffView.prototype._calculateOffsets = function (changes) {
	if (this.settings._debug) {
		traceTimeStart('draw#_calculateOffsets');
	}
	const {
		lhs: led,
		rhs: red
	} = this.editor;

	// calculate extents of diff canvas
	this.draw_lhs_min = 0.5;
	this.draw_mid_width
		= this._queryElement(`#${this.id}-lhs-rhs-canvas`).offsetWidth;
	this.draw_rhs_max = this.draw_mid_width - 0.5; //24.5;
	this.draw_lhs_width = 5;
	this.draw_rhs_width = 5;
	this.em_height = led.defaultTextHeight();

	const mode = 'local';
	const lineWrapping = led.getOption('lineWrapping')
		|| red.getOption('lineWrapping');
	const lhschc = !lineWrapping ? led.charCoords({ line: 0 }, mode) : null;
	const rhschc = !lineWrapping ? red.charCoords({ line: 0 }, mode) : null;
	const lhsvp = this._getViewportSide('lhs');
	const rhsvp = this._getViewportSide('rhs');

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
		// the height and line borders don't align slightly - fudge the offset
		change['lhs-y-start'] += 0.5;
		change['lhs-y-end'] += 0.5;
		change['rhs-y-start'] += 0.5;
		change['rhs-y-end'] += 0.5;
	}
	if (this.settings._debug) {
		traceTimeEnd('draw#_calculateOffsets');
	}
}

CodeMirrorDiffView.prototype._markupLineChanges = function (changes) {
	if (this.settings._debug) {
		traceTimeStart('draw#_markupLineChanges');
	}
	const {
		lhs: led,
		rhs: red
	} = this.editor;
	const current_diff = this._current_diff;
	const lhsvp = this._getViewportSide('lhs');
	const rhsvp = this._getViewportSide('rhs');
	const { _vdoc: vdoc } = this;

	// use the virtual doc to markup all the changes
	for (let i = 0; i < changes.length; ++i) {
		const change = changes[i];
		const isCurrent = current_diff === i;
		const lineDiff = this.settings.lcs !== false;
		const lhsInView = this._isChangeInView('lhs', lhsvp, change);
		const rhsInView = this._isChangeInView('rhs', rhsvp, change);

		// lhs changes
		if (lhsInView) {
			const osideEditable = this.settings.line_numbers
				&& !red.getOption('readOnly');

			vdoc.addRender('lhs', change, i, {
				isCurrent,
				lineDiff,
				// TODO: move out of loop
				getMergeHandler: (change, side, oside) => {
					return () => this._merge_change(change, side, oside);
				},
				mergeButton: osideEditable
					? this.merge_rhs_button.cloneNode(true) : null
			});
		}

		// rhs changes
		if (rhsInView) {
			const osideEditable = this.settings.line_numbers
				&& !led.getOption('readOnly');

			vdoc.addRender('rhs', change, i, {
				isCurrent,
				lineDiff,
				// TODO: move out of loop
				getMergeHandler: (change, side, oside) => {
					return () => this._merge_change(change, side, oside);
				},
				mergeButton: osideEditable
					? this.merge_lhs_button.cloneNode(true) : null
			});
		}

		if (lineDiff
			&& (lhsInView || rhsInView)
			&& change.op === 'c') {
			vdoc.addInlineDiff(change, i, {
				ignoreaccents: this.settings.ignoreaccents,
				ignorews: this.settings.ignorews,
				ignorecase: this.settings.ignorecase,
				getText: (side, lineNum) => {
					if (side === 'lhs') {
						const text = led.getLine(lineNum);
						return text || '';
					} else {
						const text = red.getLine(lineNum);
						return text || '';
					}
				}
			});
		}
	}
	led.operation(() => {
		vdoc.update('lhs', led, lhsvp);
	});
	red.operation(() => {
		vdoc.update('rhs', red, rhsvp);
	});
	if (this.settings._debug) {
		traceTimeEnd('draw#_markupLineChanges');
	}
};

CodeMirrorDiffView.prototype._merge_change = function(change, side, oside) {
	if (!change) {
		return;
	}
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
	const dcanvas = document.getElementById(`${this.id}-lhs-rhs-canvas`);
	if (dcanvas == undefined) {
		throw new Error(`Failed to find: ${this.id}-lhs-rhs-canvas`);
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
	if (this.settings._debug) {
		traceTimeStart('draw#_renderDiff');
	}
	const ex = this._draw_info();
	const mcanvas_lhs = ex.lhs_margin;
	const mcanvas_rhs = ex.rhs_margin;
	const ctx = ex.dcanvas.getContext('2d');
	const ctx_lhs = mcanvas_lhs.getContext('2d');
	const ctx_rhs = mcanvas_rhs.getContext('2d');

	this.trace('draw#_renderDiff', 'visible page height', ex.visible_page_height);
	this.trace('draw#_renderDiff', 'scroller-top lhs', ex.lhs_scroller.scrollTop);
	this.trace('draw#_renderDiff', 'scroller-top rhs', ex.rhs_scroller.scrollTop);

	ex.lhs_margin.removeEventListener('click', this._handleLhsMarginClick);
	ex.rhs_margin.removeEventListener('click', this._handleRhsMarginClick);

	const lhsvp = this._getViewportSide('lhs');
	const rhsvp = this._getViewportSide('rhs');

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
			this.trace(
				'draw#_renderDiff unexpected NaN',
				change['lhs-y-start'], change['lhs-y-end']
			);
			continue;
		}

		// draw margin indicators
		this.trace('draw#_renderDiff', 'draw1', 'marker',
			lhs_y_start, lhs_y_end, rhs_y_start, rhs_y_end);

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
		if (!this._isChangeInView('lhs', lhsvp, change)
			&& !this._isChangeInView('rhs', rhsvp, change)) {
			// skip if viewport enabled and the change is outside the viewport
			continue;
		}

		const borderColor = (this._current_diff === i) ?
			this.settings._colors.current.border : this.settings._colors[change.op].border;

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

	if (this.settings._debug) {
		traceTimeEnd('draw#_renderDiff');
	}
};

CodeMirrorDiffView.prototype._queryElement = function(selector) {
	const cacheName = `_element:${selector}`;
	const element = this[cacheName] || document.querySelector(selector);
	if (!this[cacheName]) {
		this[cacheName] = element;
	}
	return this[cacheName];
}

CodeMirrorDiffView.prototype.trace = function(...args) {
	if (this.settings._debug) {
		console.log(...args);
	}
}

module.exports = CodeMirrorDiffView;
