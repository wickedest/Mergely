"use strict";

require('./mergely.css');

(function(jQuery, CodeMirror) {

var Mgly = {};

Mgly.Timer = function(){
	var self = this;
	self.start = function() { self.t0 = new Date().getTime(); };
	self.stop = function() {
		var t1 = new Date().getTime();
		var d = t1 - self.t0;
		self.t0 = t1;
		return d;
	};
	self.start();
};

Mgly.ChangeExpression = new RegExp(/(^(?![><\-])*\d+(?:,\d+)?)([acd])(\d+(?:,\d+)?)/);

Mgly.DiffParser = function(diff) {
	var changes = [];
	var change_id = 0;
	// parse diff
	var diff_lines = diff.split(/\n/);
	for (var i = 0; i < diff_lines.length; ++i) {
		if (diff_lines[i].length == 0) continue;
		var change = {};
		var test = Mgly.ChangeExpression.exec(diff_lines[i]);
		if (test == null) continue;
		// lines are zero-based
		var fr = test[1].split(',');
		change['lhs-line-from'] = fr[0] - 1;
		if (fr.length == 1) change['lhs-line-to'] = fr[0] - 1;
		else change['lhs-line-to'] = fr[1] - 1;
		var to = test[3].split(',');
		change['rhs-line-from'] = to[0] - 1;
		if (to.length == 1) change['rhs-line-to'] = to[0] - 1;
		else change['rhs-line-to'] = to[1] - 1;
		change['op'] = test[2];
		changes[change_id++] = change;
	}
	return changes;
};

Mgly.sizeOf = function(obj) {
	var size = 0, key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) size++;
	}
	return size;
};

Mgly.LCS = function(x, y) {
	this.x = (x && x.replace(/[ ]{1}/g, '\n')) || '';
	this.y = (y && y.replace(/[ ]{1}/g, '\n')) || '';
};

jQuery.extend(Mgly.LCS.prototype, {
	clear: function() { this.ready = 0; },
	diff: function(added, removed) {
		var d = new Mgly.diff(this.x, this.y, {ignorews: false});
		var changes = Mgly.DiffParser(d.normal_form());
		var li = 0, lj = 0;
		for (var i = 0; i < changes.length; ++i) {
			var change = changes[i];
			if (change.op != 'a') {
				// find the starting index of the line
				li = d.getLines('lhs').slice(0, change['lhs-line-from']).join(' ').length;
				// get the index of the the span of the change
				lj = change['lhs-line-to'] + 1;
				// get the changed text
				var lchange = d.getLines('lhs').slice(change['lhs-line-from'], lj).join(' ');
				if (change.op == 'd') lchange += ' ';// include the leading space
				else if (li > 0 && change.op == 'c') li += 1; // ignore leading space if not first word
				// output the changed index and text
				removed(li, li + lchange.length);
			}
			if (change.op != 'd') {
				// find the starting index of the line
				li = d.getLines('rhs').slice(0, change['rhs-line-from']).join(' ').length;
				// get the index of the the span of the change
				lj = change['rhs-line-to'] + 1;
				// get the changed text
				var rchange = d.getLines('rhs').slice(change['rhs-line-from'], lj).join(' ');
				if (change.op == 'a') rchange += ' ';// include the leading space
				else if (li > 0 && change.op == 'c') li += 1; // ignore leading space if not first word
				// output the changed index and text
				added(li, li + rchange.length);
			}
		}
	}
});

Mgly.CodeifyText = function(settings) {
    this._max_code = 0;
    this._diff_codes = {};
	this.ctxs = {};
	this.options = {ignorews: false};
	jQuery.extend(this, settings);
	this.lhs = settings.lhs.split('\n');
	this.rhs = settings.rhs.split('\n');
};

jQuery.extend(Mgly.CodeifyText.prototype, {
	getCodes: function(side) {
		if (!this.ctxs.hasOwnProperty(side)) {
			var ctx = this._diff_ctx(this[side]);
			this.ctxs[side] = ctx;
			ctx.codes.length = Object.keys(ctx.codes).length;
		}
		return this.ctxs[side].codes;
	},
	getLines: function(side) {
		return this.ctxs[side].lines;
	},
	_diff_ctx: function(lines) {
		var ctx = {i: 0, codes: {}, lines: lines};
		this._codeify(lines, ctx);
		return ctx;
	},
	_codeify: function(lines, ctx) {
		var code = this._max_code;
		for (var i = 0; i < lines.length; ++i) {
			var line = lines[i];
			if (this.options.ignorews) {
				line = line.replace(/\s+/g, '');
			}
			if (this.options.ignorecase) {
				line = line.toLowerCase();
			}
			var aCode = this._diff_codes[line];
			if (aCode != undefined) {
				ctx.codes[i] = aCode;
			}
			else {
				this._max_code++;
				this._diff_codes[line] = this._max_code;
				ctx.codes[i] = this._max_code;
			}
		}
	}
});

Mgly.diff = function(lhs, rhs, options) {
	var opts = jQuery.extend({ignorews: false}, options);
	this.codeify = new Mgly.CodeifyText({
		lhs: lhs,
		rhs: rhs,
		options: opts
	});
	var lhs_ctx = {
		codes: this.codeify.getCodes('lhs'),
		modified: {}
	};
	var rhs_ctx = {
		codes: this.codeify.getCodes('rhs'),
		modified: {}
	};
	var max = (lhs_ctx.codes.length + rhs_ctx.codes.length + 1);
	var vector_d = [];
	var vector_u = [];
	this._lcs(lhs_ctx, 0, lhs_ctx.codes.length, rhs_ctx, 0, rhs_ctx.codes.length, vector_u, vector_d);
	this._optimize(lhs_ctx);
	this._optimize(rhs_ctx);
	this.items = this._create_diffs(lhs_ctx, rhs_ctx);
};

jQuery.extend(Mgly.diff.prototype, {
	changes: function() { return this.items; },
	getLines: function(side) {
		return this.codeify.getLines(side);
	},
	normal_form: function() {
		var nf = '';
		for (var index = 0; index < this.items.length; ++index) {
			var item = this.items[index];
			var lhs_str = '';
			var rhs_str = '';
			var change = 'c';
			if (item.lhs_deleted_count == 0 && item.rhs_inserted_count > 0) change = 'a';
			else if (item.lhs_deleted_count > 0 && item.rhs_inserted_count == 0) change = 'd';

			if (item.lhs_deleted_count == 1) lhs_str = item.lhs_start + 1;
			else if (item.lhs_deleted_count == 0) lhs_str = item.lhs_start;
			else lhs_str = (item.lhs_start + 1) + ',' + (item.lhs_start + item.lhs_deleted_count);

			if (item.rhs_inserted_count == 1) rhs_str = item.rhs_start + 1;
			else if (item.rhs_inserted_count == 0) rhs_str = item.rhs_start;
			else rhs_str = (item.rhs_start + 1) + ',' + (item.rhs_start + item.rhs_inserted_count);
			nf += lhs_str + change + rhs_str + '\n';

			var lhs_lines = this.getLines('lhs');
			var rhs_lines = this.getLines('rhs');
			if (rhs_lines && lhs_lines) {
				var i;
				// if rhs/lhs lines have been retained, output contextual diff
				for (i = item.lhs_start; i < item.lhs_start + item.lhs_deleted_count; ++i) {
					nf += '< ' + lhs_lines[i] + '\n';
				}
				if (item.rhs_inserted_count && item.lhs_deleted_count) nf += '---\n';
				for (i = item.rhs_start; i < item.rhs_start + item.rhs_inserted_count; ++i) {
					nf += '> ' + rhs_lines[i] + '\n';
				}
			}
		}
		return nf;
	},
	_lcs: function(lhs_ctx, lhs_lower, lhs_upper, rhs_ctx, rhs_lower, rhs_upper, vector_u, vector_d) {
		while ( (lhs_lower < lhs_upper) && (rhs_lower < rhs_upper) && (lhs_ctx.codes[lhs_lower] == rhs_ctx.codes[rhs_lower]) ) {
			++lhs_lower;
			++rhs_lower;
		}
		while ( (lhs_lower < lhs_upper) && (rhs_lower < rhs_upper) && (lhs_ctx.codes[lhs_upper - 1] == rhs_ctx.codes[rhs_upper - 1]) ) {
			--lhs_upper;
			--rhs_upper;
		}
		if (lhs_lower == lhs_upper) {
			while (rhs_lower < rhs_upper) {
				rhs_ctx.modified[ rhs_lower++ ] = true;
			}
		}
		else if (rhs_lower == rhs_upper) {
			while (lhs_lower < lhs_upper) {
				lhs_ctx.modified[ lhs_lower++ ] = true;
			}
		}
		else {
			var sms = this._sms(lhs_ctx, lhs_lower, lhs_upper, rhs_ctx, rhs_lower, rhs_upper, vector_u, vector_d);
			this._lcs(lhs_ctx, lhs_lower, sms.x, rhs_ctx, rhs_lower, sms.y, vector_u, vector_d);
			this._lcs(lhs_ctx, sms.x, lhs_upper, rhs_ctx, sms.y, rhs_upper, vector_u, vector_d);
		}
	},
	_sms: function(lhs_ctx, lhs_lower, lhs_upper, rhs_ctx, rhs_lower, rhs_upper, vector_u, vector_d) {
		var max = lhs_ctx.codes.length + rhs_ctx.codes.length + 1;
		var kdown = lhs_lower - rhs_lower;
		var kup = lhs_upper - rhs_upper;
		var delta = (lhs_upper - lhs_lower) - (rhs_upper - rhs_lower);
		var odd = (delta & 1) != 0;
		var offset_down = max - kdown;
		var offset_up = max - kup;
		var maxd = ((lhs_upper - lhs_lower + rhs_upper - rhs_lower) / 2) + 1;
		vector_d[ offset_down + kdown + 1 ] = lhs_lower;
		vector_u[ offset_up + kup - 1 ] = lhs_upper;
		var ret = {x:0,y:0}, d, k, x, y;
		for (d = 0; d <= maxd; ++d) {
			for (k = kdown - d; k <= kdown + d; k += 2) {
				if (k == kdown - d) {
					x = vector_d[ offset_down + k + 1 ];//down
				}
				else {
					x = vector_d[ offset_down + k - 1 ] + 1;//right
					if ((k < (kdown + d)) && (vector_d[ offset_down + k + 1 ] >= x)) {
						x = vector_d[ offset_down + k + 1 ];//down
					}
				}
				y = x - k;
				// find the end of the furthest reaching forward D-path in diagonal k.
				while ((x < lhs_upper) && (y < rhs_upper) && (lhs_ctx.codes[x] == rhs_ctx.codes[y])) {
					x++; y++;
				}
				vector_d[ offset_down + k ] = x;
				// overlap ?
				if (odd && (kup - d < k) && (k < kup + d)) {
					if (vector_u[offset_up + k] <= vector_d[offset_down + k]) {
						ret.x = vector_d[offset_down + k];
						ret.y = vector_d[offset_down + k] - k;
						return (ret);
					}
				}
			}
			// Extend the reverse path.
			for (k = kup - d; k <= kup + d; k += 2) {
				// find the only or better starting point
				if (k == kup + d) {
					x = vector_u[offset_up + k - 1]; // up
				} else {
					x = vector_u[offset_up + k + 1] - 1; // left
					if ((k > kup - d) && (vector_u[offset_up + k - 1] < x))
						x = vector_u[offset_up + k - 1]; // up
				}
				y = x - k;
				while ((x > lhs_lower) && (y > rhs_lower) && (lhs_ctx.codes[x - 1] == rhs_ctx.codes[y - 1])) {
					// diagonal
					x--;
					y--;
				}
				vector_u[offset_up + k] = x;
				// overlap ?
				if (!odd && (kdown - d <= k) && (k <= kdown + d)) {
					if (vector_u[offset_up + k] <= vector_d[offset_down + k]) {
						ret.x = vector_d[offset_down + k];
						ret.y = vector_d[offset_down + k] - k;
						return (ret);
					}
				}
			}
		}
		throw "the algorithm should never come here.";
	},
	_optimize: function(ctx) {
		var start = 0, end = 0;
		while (start < ctx.codes.length) {
			while ((start < ctx.codes.length) && (ctx.modified[start] == undefined || ctx.modified[start] == false)) {
				start++;
			}
			end = start;
			while ((end < ctx.codes.length) && (ctx.modified[end] == true)) {
				end++;
			}
			if ((end < ctx.codes.length) && (ctx.codes[start] == ctx.codes[end])) {
				ctx.modified[start] = false;
				ctx.modified[end] = true;
			}
			else {
				start = end;
			}
		}
	},
	_create_diffs: function(lhs_ctx, rhs_ctx) {
		var items = [];
		var lhs_start = 0, rhs_start = 0;
		var lhs_line = 0, rhs_line = 0;

		while (lhs_line < lhs_ctx.codes.length || rhs_line < rhs_ctx.codes.length) {
			if ((lhs_line < lhs_ctx.codes.length) && (!lhs_ctx.modified[lhs_line])
				&& (rhs_line < rhs_ctx.codes.length) && (!rhs_ctx.modified[rhs_line])) {
				// equal lines
				lhs_line++;
				rhs_line++;
			}
			else {
				// maybe deleted and/or inserted lines
				lhs_start = lhs_line;
				rhs_start = rhs_line;

				while (lhs_line < lhs_ctx.codes.length && (rhs_line >= rhs_ctx.codes.length || lhs_ctx.modified[lhs_line]))
					lhs_line++;

				while (rhs_line < rhs_ctx.codes.length && (lhs_line >= lhs_ctx.codes.length || rhs_ctx.modified[rhs_line]))
					rhs_line++;

				if ((lhs_start < lhs_line) || (rhs_start < rhs_line)) {
					// store a new difference-item
					items.push({
						lhs_start: lhs_start,
						rhs_start: rhs_start,
						lhs_deleted_count: lhs_line - lhs_start,
						rhs_inserted_count: rhs_line - rhs_start
					});
				}
			}
		}
		return items;
	}
});

Mgly.mergely = function(el, options) {
	if (el) {
		this.init(el, options);
	}
};

jQuery.extend(Mgly.mergely.prototype, {
	name: 'mergely',
	//http://jupiterjs.com/news/writing-the-perfect-jquery-plugin
	init: function(el, options) {
		this.diffView = new Mgly.CodeMirrorDiffView(el, options);
		this.bind(el);
	},
	bind: function(el) {
		this.diffView.bind(el);
	}
});

Mgly.CodeMirrorDiffView = function(el, options) {
	CodeMirror.defineExtension('centerOnCursor', function() {
		var coords = this.cursorCoords(null, 'local');
		this.scrollTo(null,
			(coords.y + coords.yBot) / 2 - (this.getScrollerElement().clientHeight / 2));
	});
	this.init(el, options);
};

jQuery.extend(Mgly.CodeMirrorDiffView.prototype, {
	init: function(el, options) {
		this.settings = jQuery.extend(true, {
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
			fadein: 'fast',
			resize_timeout: 500,
			change_timeout: 150,
			fgcolor: {a:'#4ba3fa',c:'#a3a3a3',d:'#ff7f7f',  // color for differences (soft color)
				ca:'#4b73ff',cc:'#434343',cd:'#ff4f4f'},    // color for currently active difference (bright color)
			bgcolor: '#eee',
			vpcolor: 'rgba(0, 0, 200, 0.5)',
			license: '',
			width: 'auto',
			height: 'auto',
			lhs: function(setValue) { },
			rhs: function(setValue) { },
			loaded: function() { },
			resize: function(init) {
				var parent = jQuery(el).parent();
				var w;
				var h;
				if (this.width == 'auto') {
					w = parent.width();
				}
				else {
					w = this.width;
				}
				if (this.height == 'auto') {
					h = parent.height() - 2;
				}
				else {
					h = this.height;
				}
				var content_width = w / 2.0 - 2 * 8 - 8;
				var content_height = h;
				var self = jQuery(el);
				self.find('.mergely-column').css({ width: content_width + 'px' });
				self.find('.mergely-column, .mergely-canvas, .mergely-margin, .mergely-column textarea, .CodeMirror-scroll, .cm-s-default').css({ height: content_height + 'px' });
				self.find('.mergely-canvas').css({ height: content_height + 'px' });
				self.find('.mergely-column textarea').css({ width: content_width + 'px' });
				self.css({ width: w, height: h, clear: 'both' });
				if (self.css('display') === 'none') {
					if (this.fadein != false) {
						self.fadeIn(this.fadein);
					}
					else {
						self.show();
					}
					if (this.loaded) this.loaded();
				}
				if (this.resized) this.resized();
			},
			_debug: '', //scroll,draw,calc,diff,markup,change
			resized: function() { }
		}, options);

		// save this element for faster queries
		this.element = jQuery(el);

		this.lhs_cmsettings = {
			lineWrapping: this.settings.wrap_lines,
			lineNumbers: this.settings.line_numbers
		};
		this.rhs_cmsettings = {
			lineWrapping: this.settings.wrap_lines,
			lineNumbers: this.settings.line_numbers
		};
		var lhs_gutters = [];
		if (this.lhs_cmsettings.line_numbers) {
			lhs_gutters = ['merge', 'CodeMirror-linenumbers']
		}
		var rhs_gutters = [];
		if (this.rhs_cmsettings.line_numbers) {
			rhs_gutters = ['merge', 'CodeMirror-linenumbers']
		}
		jQuery.extend(true, this.lhs_cmsettings, this.settings.cmsettings, { gutters: lhs_gutters }, this.settings);
		jQuery.extend(true, this.rhs_cmsettings, this.settings.cmsettings, { gutters: rhs_gutters }, this.settings);

		// bind if the element is destroyed
		this.element.bind('destroyed', jQuery.proxy(this.teardown, this));

		// save this instance in jQuery data, binding this view to the node
		jQuery.data(el, 'mergely', this);

		this._setOptions(options);
	},
	unbind: function() {
		if (this.changed_timeout != null) clearTimeout(this.changed_timeout);
		this.editor[this.id + '-lhs'].toTextArea();
		this.editor[this.id + '-rhs'].toTextArea();
		jQuery(window).off('.mergely');
	},
	destroy: function() {
		this.element.unbind('destroyed', this.teardown);
		this.teardown();
	},
	teardown: function() {
		this.unbind();
	},
	lhs: function(text) {
		this.changes = []; // invalidate existing changes
		this.editor[this.id + '-lhs'].setValue(text);
	},
	rhs: function(text) {
		this.changes = []; // invalidate existing changes
		this.editor[this.id + '-rhs'].setValue(text);
	},
	update: function() {
		this._changing(this.id + '-lhs', this.id + '-rhs');
	},
	unmarkup: function() {
		this._clear();
	},
	scrollToDiff: function(direction) {
		if (!this.changes.length) return;
		if (direction == 'next') {
			if (this._current_diff == this.changes.length -1) {
				this._current_diff = 0;
			} else {
				this._current_diff = Math.min(++this._current_diff, this.changes.length - 1);
			}
		}
		else if (direction == 'prev') {
			if (this._current_diff == 0) {
				this._current_diff = this.changes.length - 1;
			} else {
				this._current_diff = Math.max(--this._current_diff, 0);
			}
		}
		this._scroll_to_change(this.changes[this._current_diff]);
		this._changed(this.id + '-lhs', this.id + '-rhs');
	},
	mergeCurrentChange: function(side) {
		if (!this.changes.length) return;
		if (side == 'lhs' && !this.lhs_cmsettings.readOnly) {
			this._merge_change(this.changes[this._current_diff], 'rhs', 'lhs');
		}
		else if (side == 'rhs' && !this.rhs_cmsettings.readOnly) {
			this._merge_change(this.changes[this._current_diff], 'lhs', 'rhs');
		}
	},
	scrollTo: function(side, num) {
		var le = this.editor[this.id + '-lhs'];
		var re = this.editor[this.id + '-rhs'];
		if (side == 'lhs') {
			le.setCursor(num);
			le.centerOnCursor();
		}
		else {
			re.setCursor(num);
			re.centerOnCursor();
		}
	},
	_setOptions: function(opts) {
		jQuery.extend(this.settings, opts);
		if (this.settings.hasOwnProperty('rhs_margin')) {
			// dynamically swap the margin
			if (this.settings.rhs_margin == 'left') {
				this.element.find('.mergely-margin:last-child').insertAfter(
					this.element.find('.mergely-canvas'));
			}
			else {
				var target = this.element.find('.mergely-margin').last();
				target.appendTo(target.parent());
			}
		}
		if (this.settings.hasOwnProperty('sidebar')) {
			// dynamically enable sidebars
			if (this.settings.sidebar) {
				this.element.find('.mergely-margin').css({display: 'block'});
			}
			else {
				this.element.find('.mergely-margin').css({display: 'none'});
			}
		}
		var le, re;
		if (this.settings.hasOwnProperty('wrap_lines')) {
			if (this.editor) {
				le = this.editor[this.id + '-lhs'];
				re = this.editor[this.id + '-rhs'];
				le.setOption('lineWrapping', this.settings.wrap_lines);
				re.setOption('lineWrapping', this.settings.wrap_lines);
			}
		}
		if (this.settings.hasOwnProperty('line_numbers')) {
			if (this.editor) {
				le = this.editor[this.id + '-lhs'];
				re = this.editor[this.id + '-rhs'];
				le.setOption('lineNumbers', this.settings.line_numbers);
				re.setOption('lineNumbers', this.settings.line_numbers);
			}
		}
	},
	options: function(opts) {
		if (opts) {
			this._setOptions(opts);
			if (this.settings.autoresize) this.resize();
			if (this.settings.autoupdate) this.update();
		}
		else {
			return this.settings;
		}
	},
	swap: function() {
		if (this.lhs_cmsettings.readOnly || this.rhs_cmsettings.readOnly) return;
		var le = this.editor[this.id + '-lhs'];
		var re = this.editor[this.id + '-rhs'];
		var tmp = re.getValue();
		re.setValue(le.getValue());
		le.setValue(tmp);
	},
	merge: function(side) {
		var le = this.editor[this.id + '-lhs'];
		var re = this.editor[this.id + '-rhs'];
		if (side == 'lhs' && !this.lhs_cmsettings.readOnly) le.setValue(re.getValue());
		else if (!this.rhs_cmsettings.readOnly) re.setValue(le.getValue());
	},
	get: function(side) {
		var ed = this.editor[this.id + '-' + side];
		var t = ed.getValue();
		if (t == undefined) return '';
		return t;
	},
	clear: function(side) {
		if (side == 'lhs' && this.lhs_cmsettings.readOnly) return;
		if (side == 'rhs' && this.rhs_cmsettings.readOnly) return;
		var ed = this.editor[this.id + '-' + side];
		ed.setValue('');
	},
	cm: function(side) {
		return this.editor[this.id + '-' + side];
	},
	search: function(side, query, direction) {
		var le = this.editor[this.id + '-lhs'];
		var re = this.editor[this.id + '-rhs'];
		var editor;
		if (side == 'lhs') editor = le;
		else editor = re;
		direction = (direction == 'prev') ? 'findPrevious' : 'findNext';
		if ((editor.getSelection().length == 0) || (this.prev_query[side] != query)) {
			this.cursor[this.id] = editor.getSearchCursor(query, { line: 0, ch: 0 }, false);
			this.prev_query[side] = query;
		}
		var cursor = this.cursor[this.id];

		if (cursor[direction]()) {
			editor.setSelection(cursor.from(), cursor.to());
		}
		else {
			cursor = editor.getSearchCursor(query, { line: 0, ch: 0 }, false);
		}
	},
	resize: function() {
		this.settings.resize();
		this._changing(this.id + '-lhs', this.id + '-rhs');
		this._set_top_offset(this.id + '-lhs');
	},
	diff: function() {
		var lhs = this.editor[this.id + '-lhs'].getValue();
		var rhs = this.editor[this.id + '-rhs'].getValue();
		var d = new Mgly.diff(lhs, rhs, this.settings);
		return d.normal_form();
	},
	bind: function(el) {
		this.element.hide();
		this.id = jQuery(el).attr('id');
		try {
			// ensure the id is valid for jQuery
			jQuery(`#${this.id}`);
		} catch (ex) {
			console.error(`jQuery failed to find mergely: #${this.id}`);
			return;
		}
		this.changed_timeout = null;
		this.chfns = {};
		this.chfns[this.id + '-lhs'] = [];
		this.chfns[this.id + '-rhs'] = [];
		this.prev_query = [];
		this.cursor = [];
		this._skipscroll = {};
		this.change_exp = new RegExp(/(\d+(?:,\d+)?)([acd])(\d+(?:,\d+)?)/);
		var merge_lhs_button;
		var merge_rhs_button;
		if (jQuery.button != undefined) {
			//jquery ui
			merge_lhs_button = '<button title="Merge left"></button>';
			merge_rhs_button = '<button title="Merge right"></button>';
		}
		else {
			// homebrew
			var style = 'opacity:0.4;width:10px;height:15px;background-color:#888;cursor:pointer;text-align:center;color:#eee;border:1px solid #222;margin-right:5px;margin-top: -2px;';
			merge_lhs_button = '<div style="' + style + '" title="Merge left">&lt;</div>';
			merge_rhs_button = '<div style="' + style + '" title="Merge right">&gt;</div>';
		}
		this.merge_rhs_button = jQuery(merge_rhs_button);
		this.merge_lhs_button = jQuery(merge_lhs_button);

		// create the textarea and canvas elements
		var height = '10px';
		var width = '10px';

		var splash = jQuery('<div id="mergely-splash">');
		var canvasLhs = jQuery(`<div class="mergely-margin" style="height: '${height}'"><canvas id="lhs-margin" width="8px" height="'${height}'"></canvas></div>`);
		canvasLhs.find('#lhs-margin').attr('id', `${this.id}-lhs-margin`);
		var editorLhs = jQuery(`<div style="position:relative;width:'${width}'; height:'${height}'" id="editor-lhs" class="mergely-column"><textarea id="text-lhs"></textarea></div>`);
		editorLhs.eq(0).attr('id', `${this.id}-editor-lhs`);
		editorLhs.find('#text-lhs').attr('id', `${this.id}-lhs`);
		var canvasMid = jQuery(`<div class="mergely-canvas" style="height: '${height}'"><canvas id="lhs-rhs-canvas" style="width:28px" width="28px" height="'${height}'"></canvas></div>`);
		canvasMid.find('#mergely-canvas').attr('id', `${this.id}-mergely-canvas`);
		canvasMid.find('#lhs-rhs-canvas').attr('id', `${this.id}-lhs-${this.id}-rhs-canvas`);

		this.element.append(splash);
		this.element.append(canvasLhs);
		this.element.append(editorLhs);
		this.element.append(canvasMid);
		var canvasRhs = jQuery(`<div class="mergely-margin" style="height: '${height}'"><canvas id="rhs-margin" width="8px" height="'${height}'"></canvas></div>`);
		canvasRhs.find('#rhs-margin').attr('id', `${this.id}-rhs-margin`);
		if (this.settings.rhs_margin == 'left') {
			this.element.append(canvasRhs);
		}
		var editorRhs = jQuery(`<div style="width:'${width}'; height:'${height}'" id="editor-rhs" class="mergely-column"><textarea id="text-rhs"></textarea></div>`);
		editorRhs.eq(0).attr('id', `${this.id}-editor-rhs`);
		editorRhs.find('#text-rhs').attr('id', `${this.id}-rhs`);
		this.element.append(editorRhs);
		if (this.settings.rhs_margin != 'left') {
			this.element.append(canvasRhs);
		}
		if (!this.settings.sidebar) {
			this.element.find('.mergely-margin').css({display: 'none'});
		}
		if (['lgpl-separate-notice', 'gpl-separate-notice', 'mpl-separate-notice', 'commercial'].indexOf(this.settings.license) < 0) {
			const _lic = {
				'lgpl': 'GNU LGPL v3.0',
				'gpl': 'GNU GPL v3.0',
				'mpl': 'MPL 1.1'
			};
			var lic = _lic[this.settings.license];
			if (!lic) {
				lic = _lic['lgpl'];
			}

			const parenth = this.element.parent().height();
			const parentw = this.element.parent().width();
			const icon = 'data:image/png;base64,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';
			this.element.find('#mergely-splash').css({
				position: 'absolute',
				zIndex: '100',
				backgroundColor: '#fff',
				border: '1px solid black',
				height: '70px',
				width: '300px',
				left: (parentw - 300) / 2,
				padding: '10px 10px 0 10px',
				fontFamily: 'arial',
				fontSize: '11px'
			}).append('<p><img width="36" height="36" alt="mergely" src="' + icon + '" style="float:left;padding-right:10px;" />This software is a Combined Work using Mergely and is covered by the ' + lic + ' license.  For the full license, see <a target="_blank" href="http://www.mergely.com">http://www.mergely.com/license.</a></p>');
			jQuery('body').one('click', function () {
				jQuery('#mergely-splash').fadeOut(100, 'linear', function () {
					this.remove();
				});
			});
		}

		// check initialization
		var rhstx;
		try {
			rhstx = this.element.find(`#${this.id}-rhs`).get(0);
		} catch (ex) {
		}
		if (!rhstx) {
			console.error('rhs textarea not defined - Mergely not initialized properly');
			return;
		}
		var lhstx;
		try {
			lhstx = this.element.find(`#${this.id}-lhs`).get(0);
		} catch (ex) {
		}
		if (!lhstx) {
			console.error('lhs textarea not defined - Mergely not initialized properly');
			return;
		}

		// get current diff border color
		var color = jQuery('<div style="display:none" class="mergely current start" />').appendTo('body').css('border-top-color');
		this.current_diff_color = color;

		// codemirror
		var cmstyle = `#${this.id} .CodeMirror-gutter-text { padding: 5px 0 0 0; }
			'#${this.id} .CodeMirror-lines pre, #${this.id} .CodeMirror-gutter-text pre { line-height: 18px; }
			'.CodeMirror-linewidget { overflow: hidden; };`;
		if (this.settings.autoresize) {
			cmstyle += `${this.id} .CodeMirror-scroll { height: 100%; overflow: auto; }`;
		}
		// adjust the margin line height
		cmstyle += '\n.CodeMirror { line-height: 18px; }';
		jQuery(`<style type="text/css">${cmstyle}</style>`).appendTo('head');

		// bind
		var self = this;
		this.editor = [];
		this.editor[this.id + '-lhs'] = CodeMirror.fromTextArea(lhstx, this.lhs_cmsettings);
		this.editor[this.id + '-rhs'] = CodeMirror.fromTextArea(rhstx, this.rhs_cmsettings);
		this.editor[this.id + '-lhs'].on('change', function(){ if (self.settings.autoupdate) self._changing(self.id + '-lhs', self.id + '-rhs'); });
		this.editor[this.id + '-lhs'].on('scroll', function(){ self._scrolling(self.id + '-lhs'); });
		this.editor[this.id + '-rhs'].on('change', function(){ if (self.settings.autoupdate) self._changing(self.id + '-lhs', self.id + '-rhs'); });
		this.editor[this.id + '-rhs'].on('scroll', function(){ self._scrolling(self.id + '-rhs'); });
		// resize
		if (this.settings.autoresize) {
			var sz_timeout1 = null;
			var sz = function(init) {
				if (self.settings.resize) self.settings.resize(init);
				self.editor[self.id + '-lhs'].refresh();
				self.editor[self.id + '-rhs'].refresh();
				if (self.settings.autoupdate) {
					self._changing(self.id + '-lhs', self.id + '-rhs');
				}
			};
			jQuery(window).on('resize.mergely',
				function () {
					if (sz_timeout1) clearTimeout(sz_timeout1);
					sz_timeout1 = setTimeout(sz, self.settings.resize_timeout);
				}
			);
			sz(true);
		}

		// scrollToDiff() from gutter
		function gutterClicked(side, line, ev) {
			// The "Merge left/right" buttons are also located in the gutter.
			// Don't interfere with them:
			if (ev.target && (jQuery(ev.target).closest('.merge-button').length > 0)) {
				return;
			}

			// See if the user clicked the line number of a difference:
			var i, change;
			for (i = 0; i < this.changes.length; i++) {
				change = this.changes[i];
				if (line >= change[side+'-line-from'] && line <= change[side+'-line-to']) {
					this._current_diff = i;
					// I really don't like this here - something about gutterClick does not
					// like mutating editor here.  Need to trigger the scroll to diff from
					// a timeout.
					setTimeout(function() { this.scrollToDiff(); }.bind(this), 10);
					break;
				}
			}
		}

		this.editor[this.id + '-lhs'].on('gutterClick', function(cm, n, gutterClass, ev) {
			gutterClicked.call(this, 'lhs', n, ev);
		}.bind(this));

		this.editor[this.id + '-rhs'].on('gutterClick', function(cm, n, gutterClass, ev) {
			gutterClicked.call(this, 'rhs', n, ev);
		}.bind(this));

		//bind
		var setv;
		if (this.settings.lhs) {
			setv = this.editor[this.id + '-lhs'].getDoc().setValue;
			this.settings.lhs(setv.bind(this.editor[this.id + '-lhs'].getDoc()));
		}
		if (this.settings.rhs) {
			setv = this.editor[this.id + '-rhs'].getDoc().setValue;
			this.settings.rhs(setv.bind(this.editor[this.id + '-rhs'].getDoc()));
		}
	},

	_scroll_to_change : function(change) {
		if (!change) return;
		var self = this;
		var led = self.editor[self.id+'-lhs'];
		var red = self.editor[self.id+'-rhs'];
		// set cursors
		led.setCursor(Math.max(change["lhs-line-from"],0), 0); // use led.getCursor().ch ?
		red.setCursor(Math.max(change["rhs-line-from"],0), 0);
		if (change["lhs-line-to"] >= 0) {
			led.scrollIntoView({line: change["lhs-line-to"]});
		}
	},

	_scrolling: function(editor_name) {
		if (this._skipscroll[editor_name] === true) {
			// scrolling one side causes the other to event - ignore it
			this._skipscroll[editor_name] = false;
			return;
		}
		var scroller = jQuery(this.editor[editor_name].getScrollerElement());
		if (this.midway == undefined) {
			this.midway = (scroller.height() / 2.0 + scroller.offset().top).toFixed(2);
		}
		// balance-line
		var midline = this.editor[editor_name].coordsChar({left:0, top:this.midway});
		var top_to = scroller.scrollTop();
		var left_to = scroller.scrollLeft();

		this.trace('scroll', 'side', editor_name);
		this.trace('scroll', 'midway', this.midway);
		this.trace('scroll', 'midline', midline);
		this.trace('scroll', 'top_to', top_to);
		this.trace('scroll', 'left_to', left_to);

		var editor_name1 = this.id + '-lhs';
		var editor_name2 = this.id + '-rhs';

		for (var name in this.editor) {
			if (!this.editor.hasOwnProperty(name)) continue;
			if (editor_name == name) continue; //same editor
			var this_side = editor_name.replace(this.id + '-', '');
			var other_side = name.replace(this.id + '-', '');
			var top_adjust = 0;

			// find the last change that is less than or within the midway point
			// do not move the rhs until the lhs end point is >= the rhs end point.
			var last_change = null;
			var force_scroll = false;
			for (var i = 0; i < this.changes.length; ++i) {
				var change = this.changes[i];
				if ((midline.line >= change[this_side+'-line-from'])) {
					last_change = change;
					if (midline.line >= last_change[this_side+'-line-to']) {
						if (!change.hasOwnProperty(this_side+'-y-start') ||
							!change.hasOwnProperty(this_side+'-y-end') ||
							!change.hasOwnProperty(other_side+'-y-start') ||
							!change.hasOwnProperty(other_side+'-y-end')){
							// change outside of viewport
							force_scroll = true;
						}
						else {
							top_adjust +=
								(change[this_side+'-y-end'] - change[this_side+'-y-start']) -
								(change[other_side+'-y-end'] - change[other_side+'-y-start']);
						}
					}
				}
			}

			var vp = this.editor[name].getViewport();
			var scroll = true;
			if (last_change) {
				this.trace('scroll', 'last change before midline', last_change);
				if (midline.line >= vp.from && midline <= vp.to) {
					scroll = false;
				}
			}
			this.trace('scroll', 'scroll', scroll);
			if (scroll || force_scroll) {
				// scroll the other side
				this.trace('scroll', 'scrolling other side', top_to - top_adjust);
				this._skipscroll[name] = true;//disable next event
				this.editor[name].scrollTo(left_to, top_to - top_adjust);
			}
			else this.trace('scroll', 'not scrolling other side');

			if (this.settings.autoupdate) {
				var timer = new Mgly.Timer();
				this._calculate_offsets(editor_name1, editor_name2, this.changes);
				this.trace('change', 'offsets time', timer.stop());
				this._markup_changes(editor_name1, editor_name2, this.changes);
				this.trace('change', 'markup time', timer.stop());
				this._draw_diff(editor_name1, editor_name2, this.changes);
				this.trace('change', 'draw time', timer.stop());
			}
			this.trace('scroll', 'scrolled');
		}
	},
	_changing: function(editor_name1, editor_name2) {
		this.trace('change', 'changing-timeout', this.changed_timeout);
		var self = this;
		if (this.changed_timeout != null) clearTimeout(this.changed_timeout);
		this.changed_timeout = setTimeout(function(){
			var timer = new Mgly.Timer();
			self._changed(editor_name1, editor_name2);
			self.trace('change', 'total time', timer.stop());
		}, this.settings.change_timeout);
	},
	_changed: function(editor_name1, editor_name2) {
		this._clear();
		this._diff(editor_name1, editor_name2);
	},
	_clear: function() {
		var self = this, name, editor, fns, timer, i, change, l;

		var clear_changes = function() {
			timer = new Mgly.Timer();
			for (i = 0, l = editor.lineCount(); i < l; ++i) {
				editor.removeLineClass(i, 'background');
			}
			for (i = 0; i < fns.length; ++i) {
				//var edid = editor.getDoc().id;
				change = fns[i];
				//if (change.doc.id != edid) continue;
				if (change.lines.length) {
					self.trace('change', 'clear text', change.lines[0].text);
				}
				change.clear();
			}
			editor.clearGutter('merge');
			self.trace('change', 'clear time', timer.stop());
		};

		for (name in this.editor) {
			if (!this.editor.hasOwnProperty(name)) continue;
			editor = this.editor[name];
			fns = self.chfns[name];
			// clear editor changes
			editor.operation(clear_changes);
		}
		self.chfns[name] = [];

		var ex = this._draw_info(this.id + '-lhs', this.id + '-rhs');
		var ctx_lhs = ex.clhs.get(0).getContext('2d');
		var ctx_rhs = ex.crhs.get(0).getContext('2d');
		var ctx = ex.dcanvas.getContext('2d');

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
	},
	_diff: function(editor_name1, editor_name2) {
		var lhs = this.editor[editor_name1].getValue();
		var rhs = this.editor[editor_name2].getValue();
		var timer = new Mgly.Timer();
		var d = new Mgly.diff(lhs, rhs, this.settings);
		this.trace('change', 'diff time', timer.stop());
		this.changes = Mgly.DiffParser(d.normal_form());
		this.trace('change', 'parse time', timer.stop());
		if (this._current_diff === undefined && this.changes.length) {
			// go to first difference on start-up
			this._current_diff = 0;
			this._scroll_to_change(this.changes[0]);
		}
		this.trace('change', 'scroll_to_change time', timer.stop());
		this._calculate_offsets(editor_name1, editor_name2, this.changes);
		this.trace('change', 'offsets time', timer.stop());
		this._markup_changes(editor_name1, editor_name2, this.changes);
		this.trace('change', 'markup time', timer.stop());
		this._draw_diff(editor_name1, editor_name2, this.changes);
		this.trace('change', 'draw time', timer.stop());
	},
	_parse_diff: function (editor_name1, editor_name2, diff) {
		this.trace('diff', 'diff results:\n', diff);
		var changes = [];
		var change_id = 0;
		// parse diff
		var diff_lines = diff.split(/\n/);
		for (var i = 0; i < diff_lines.length; ++i) {
			if (diff_lines[i].length == 0) continue;
			var change = {};
			var test = this.change_exp.exec(diff_lines[i]);
			if (test == null) continue;
			// lines are zero-based
			var fr = test[1].split(',');
			change['lhs-line-from'] = fr[0] - 1;
			if (fr.length == 1) change['lhs-line-to'] = fr[0] - 1;
			else change['lhs-line-to'] = fr[1] - 1;
			var to = test[3].split(',');
			change['rhs-line-from'] = to[0] - 1;
			if (to.length == 1) change['rhs-line-to'] = to[0] - 1;
			else change['rhs-line-to'] = to[1] - 1;
			// TODO: optimize for changes that are adds/removes
			if (change['lhs-line-from'] < 0) change['lhs-line-from'] = 0;
			if (change['lhs-line-to'] < 0) change['lhs-line-to'] = 0;
			if (change['rhs-line-from'] < 0) change['rhs-line-from'] = 0;
			if (change['rhs-line-to'] < 0) change['rhs-line-to'] = 0;
			change['op'] = test[2];
			changes[change_id++] = change;
			this.trace('diff', 'change', change);
		}
		return changes;
	},
	_get_viewport_side: function(editor_name) {
		return this.editor[editor_name].getViewport();
	},
	_is_change_in_view: function(side, vp, change) {
		return (change[`${side}-line-from`] >= vp.from && change[`${side}-line-from`] <= vp.to) ||
			(change[`${side}-line-to`] >= vp.from && change[`${side}-line-to`] <= vp.to) ||
			(vp.from >= change[`${side}-line-from`] && vp.to <= change[`${side}-line-to`]);
	},
	_set_top_offset: function (editor_name1) {
		// save the current scroll position of the editor
		var saveY = this.editor[editor_name1].getScrollInfo().top;
		// temporarily scroll to top
		this.editor[editor_name1].scrollTo(null, 0);

		// this is the distance from the top of the screen to the top of the
		// content of the first codemirror editor
		var topnode = this.element.find('.CodeMirror-measure').first();
		var top_offset = topnode.offset().top - 4;
		if(!top_offset) return false;

		// restore editor's scroll position
		this.editor[editor_name1].scrollTo(null, saveY);

		this.draw_top_offset = 0.5 - top_offset;
		return true;
	},
	_calculate_offsets: function (editor_name1, editor_name2, changes) {
		if (this.em_height == null) {
			if(!this._set_top_offset(editor_name1)) return; //try again
			this.em_height = this.editor[editor_name1].defaultTextHeight();
			if (!this.em_height) {
				console.warn('Failed to calculate offsets, using 18 by default');
				this.em_height = 18;
			}
			this.draw_lhs_min = 0.5;
			var c = jQuery('#' + editor_name1 + '-' + editor_name2 + '-canvas');
			if (!c.length) {
				console.error('failed to find canvas', '#' + editor_name1 + '-' + editor_name2 + '-canvas');
			}
			if (!c.width()) {
				console.error('canvas width is 0');
				return;
			}
			this.draw_mid_width = jQuery('#' + editor_name1 + '-' + editor_name2 + '-canvas').width();
			this.draw_rhs_max = this.draw_mid_width - 0.5; //24.5;
			this.draw_lhs_width = 5;
			this.draw_rhs_width = 5;
			this.trace('calc', 'change offsets calculated', {top_offset: this.draw_top_offset, lhs_min: this.draw_lhs_min, rhs_max: this.draw_rhs_max, lhs_width: this.draw_lhs_width, rhs_width: this.draw_rhs_width});
		}
		var lhschc = this.editor[editor_name1].charCoords({line: 0});
		var rhschc = this.editor[editor_name2].charCoords({line: 0});
		var lhsvp = this._get_viewport_side(editor_name1);
		var rhsvp = this._get_viewport_side(editor_name2);

		for (var i = 0; i < changes.length; ++i) {
			var change = changes[i];

			if (this.settings.viewport &&
				!this._is_change_in_view(lhsvp, 'lhs', change) &&
				!this._is_change_in_view(lhsvp, 'rhs', change)) {
				// if the change is outside the viewport, skip
				delete change['lhs-y-start'];
				delete change['lhs-y-end'];
				delete change['rhs-y-start'];
				delete change['rhs-y-end'];
				continue;
			}
			var llf = change['lhs-line-from'] >= 0 ? change['lhs-line-from'] : 0;
			var llt = change['lhs-line-to'] >= 0 ? change['lhs-line-to'] : 0;
			var rlf = change['rhs-line-from'] >= 0 ? change['rhs-line-from'] : 0;
			var rlt = change['rhs-line-to'] >= 0 ? change['rhs-line-to'] : 0;

			var ls, le, rs, re, tls, tle, lhseh, lhssh, rhssh, rhseh;
			if (this.editor[editor_name1].getOption('lineWrapping') || this.editor[editor_name2].getOption('lineWrapping')) {
				// If using line-wrapping, we must get the height of the line
				tls = this.editor[editor_name1].cursorCoords({line: llf, ch: 0}, 'page');
				lhssh = this.editor[editor_name1].getLineHandle(llf);
				ls = { top: tls.top, bottom: tls.top + lhssh.height };

				tle = this.editor[editor_name1].cursorCoords({line: llt, ch: 0}, 'page');
				lhseh = this.editor[editor_name1].getLineHandle(llt);
				le = { top: tle.top, bottom: tle.top + lhseh.height };

				tls = this.editor[editor_name2].cursorCoords({line: rlf, ch: 0}, 'page');
				rhssh = this.editor[editor_name2].getLineHandle(rlf);
				rs = { top: tls.top, bottom: tls.top + rhssh.height };

				tle = this.editor[editor_name2].cursorCoords({line: rlt, ch: 0}, 'page');
				rhseh = this.editor[editor_name2].getLineHandle(rlt);
				re = { top: tle.top, bottom: tle.top + rhseh.height };
			}
			else {
				// If not using line-wrapping, we can calculate the line position
				ls = {
					top: lhschc.top + llf * this.em_height,
					bottom: lhschc.bottom + llf * this.em_height + 2
				};
				le = {
					top: lhschc.top + llt * this.em_height,
					bottom: lhschc.bottom + llt * this.em_height + 2
				};
				rs = {
					top: rhschc.top + rlf * this.em_height,
					bottom: rhschc.bottom + rlf * this.em_height + 2
				};
				re = {
					top: rhschc.top + rlt * this.em_height,
					bottom: rhschc.bottom + rlt * this.em_height + 2
				};
			}

			if (change['op'] == 'a') {
				// adds (right), normally start from the end of the lhs,
				// except for the case when the start of the rhs is 0
				if (rlf > 0) {
					ls.top = ls.bottom;
					ls.bottom += this.em_height;
					le = ls;
				}
			}
			else if (change['op'] == 'd') {
				// deletes (left) normally finish from the end of the rhs,
				// except for the case when the start of the lhs is 0
				if (llf > 0) {
					rs.top = rs.bottom;
					rs.bottom += this.em_height;
					re = rs;
				}
			}
			change['lhs-y-start'] = this.draw_top_offset + ls.top;
			if (change['op'] == 'c' || change['op'] == 'd') {
				change['lhs-y-end'] = this.draw_top_offset + le.bottom;
			}
			else {
				change['lhs-y-end'] = this.draw_top_offset + le.top;
			}
			change['rhs-y-start'] = this.draw_top_offset + rs.top;
			if (change['op'] == 'c' || change['op'] == 'a') {
				change['rhs-y-end'] = this.draw_top_offset + re.bottom;
			}
			else {
				change['rhs-y-end'] = this.draw_top_offset + re.top;
			}
			this.trace('calc', 'change calculated', i, change);
		}
		return changes;
	},
	_markup_changes: function (editor_name1, editor_name2, changes) {
		this.element.find('.merge-button').remove(); //clear

		var self = this;
		var led = this.editor[editor_name1];
		var red = this.editor[editor_name2];
		var current_diff = this._current_diff;
		var lhsvp = this._get_viewport_side(editor_name1);
		var rhsvp = this._get_viewport_side(editor_name2);

		var timer = new Mgly.Timer();
		led.operation(function() {
			for (var i = 0; i < changes.length; ++i) {
				var change = changes[i];
				if (!this._is_change_in_view('lhs', lhsvp, change)) {
					// if the change is outside the viewport, skip
					continue;
				}

				var llf = change['lhs-line-from'] >= 0 ? change['lhs-line-from'] : 0;
				var llt = change['lhs-line-to'] >= 0 ? change['lhs-line-to'] : 0;
				var rlf = change['rhs-line-from'] >= 0 ? change['rhs-line-from'] : 0;
				var rlt = change['rhs-line-to'] >= 0 ? change['rhs-line-to'] : 0;

				var clazz = ['mergely', 'lhs', change['op'], 'cid-' + i];
				led.addLineClass(llf, 'background', 'start');
				led.addLineClass(llt, 'background', 'end');
				if (change['lhs-line-from'] < 0) {
					clazz.push('empty');
				}

				if (current_diff == i) {
					if (llf != llt) {
						led.addLineClass(llf, 'background', 'current');
					}
					led.addLineClass(llt, 'background', 'current');
				}
				if (llf == 0 && llt == 0 && rlf == 0) {
					led.addLineClass(llf, 'background', clazz.join(' '));
					led.addLineClass(llf, 'background', 'first');
				}
				else {
					// apply change for each line in-between the changed lines
					for (var j = llf; j <= llt; ++j) {
						led.addLineClass(j, 'background', clazz.join(' '));
						led.addLineClass(j, 'background', clazz.join(' '));
					}
				}

				if (!red.getOption('readOnly')) {
					// add widgets to lhs, if rhs is not read only
					var rhs_button = self.merge_rhs_button.clone();
					if (rhs_button.button) {
						//jquery-ui support
						rhs_button.button({icons: {primary: 'ui-icon-triangle-1-e'}, text: false});
					}
					rhs_button.addClass('merge-button');
					rhs_button.attr('id', 'merge-rhs-' + i);
					led.setGutterMarker(llf, 'merge', rhs_button.get(0));
				}
			}
		}.bind(this));

		this.trace('change', 'markup lhs-editor time', timer.stop());
		red.operation(function() {
			for (var i = 0; i < changes.length; ++i) {
				var change = changes[i];
				if (!this._is_change_in_view('rhs', rhsvp, change)) {
					// if the change is outside the viewport, skip
					continue;
				}

				var llf = change['lhs-line-from'] >= 0 ? change['lhs-line-from'] : 0;
				var llt = change['lhs-line-to'] >= 0 ? change['lhs-line-to'] : 0;
				var rlf = change['rhs-line-from'] >= 0 ? change['rhs-line-from'] : 0;
				var rlt = change['rhs-line-to'] >= 0 ? change['rhs-line-to'] : 0;

				var clazz = ['mergely', 'rhs', change['op'], 'cid-' + i];
				red.addLineClass(rlf, 'background', 'start');
				red.addLineClass(rlt, 'background', 'end');
				if (change['rhs-line-from'] < 0) {
					clazz.push('empty');
				}

				if (current_diff == i) {
					if (rlf != rlt) {
						red.addLineClass(rlf, 'background', 'current');
					}
					red.addLineClass(rlt, 'background', 'current');
				}
				if (rlf == 0 && rlt == 0 && llf == 0) {
					red.addLineClass(rlf, 'background', clazz.join(' '));
					red.addLineClass(rlf, 'background', 'first');
				}
				else {
					// apply change for each line in-between the changed lines
					for (var j = rlf; j <= rlt; ++j) {
						red.addLineClass(j, 'background', clazz.join(' '));
						red.addLineClass(j, 'background', clazz.join(' '));
					}
				}

				if (!led.getOption('readOnly')) {
					// add widgets to rhs, if lhs is not read only
					var lhs_button = self.merge_lhs_button.clone();
					if (lhs_button.button) {
						//jquery-ui support
						lhs_button.button({icons: {primary: 'ui-icon-triangle-1-w'}, text: false});
					}
					lhs_button.addClass('merge-button');
					lhs_button.attr('id', 'merge-lhs-' + i);
					red.setGutterMarker(rlf, 'merge', lhs_button.get(0));
				}
			}
		}.bind(this));
		this.trace('change', 'markup rhs-editor time', timer.stop());

		// mark text deleted, LCS changes
		var marktext = [], i, j, k, p;
		for (i = 0; this.settings.lcs && i < changes.length; ++i) {
			var change = changes[i];
			var llf = change['lhs-line-from'] >= 0 ? change['lhs-line-from'] : 0;
			var llt = change['lhs-line-to'] >= 0 ? change['lhs-line-to'] : 0;
			var rlf = change['rhs-line-from'] >= 0 ? change['rhs-line-from'] : 0;
			var rlt = change['rhs-line-to'] >= 0 ? change['rhs-line-to'] : 0;

			if (change['op'] == 'd') {
				// apply delete to cross-out (left-hand side only)
				var from = llf;
				var to = llt;

				if (this._is_change_in_view('lhs', lhsvp, change)) {
					// the change is within the viewport
					var to_ln = led.lineInfo(to);
					if (to_ln) {
						marktext.push([led, {line:from, ch:0}, {line:to, ch:to_ln.text.length}, {className: 'mergely ch d lhs'}]);
					}
				}
			}
			else if (change['op'] == 'c') {
				// apply LCS changes to each line
				for (j = llf, k = rlf, p = 0;
					 ((j >= 0) && (j <= llt)) || ((k >= 0) && (k <= rlt));
					 ++j, ++k) {
					var lhs_line, rhs_line;
					if (k + p > rlt && this._is_change_in_view('lhs', lhsvp, change)) {
						// lhs continues past rhs, mark lhs as deleted
						lhs_line = led.getLine( j );
						marktext.push([led, {line:j, ch:0}, {line:j, ch:lhs_line.length}, {className: 'mergely ch d lhs'}]);
						continue;
					}
					if (j + p > llt && this._is_change_in_view('rhs', rhsvp, change)) {
						// rhs continues past lhs, mark rhs as added
						rhs_line = red.getLine( k );
						marktext.push([red, {line:k, ch:0}, {line:k, ch:rhs_line.length}, {className: 'mergely ch a rhs'}]);
						continue;
					}
					lhs_line = led.getLine( j );
					rhs_line = red.getLine( k );
					var lcs = new Mgly.LCS(lhs_line, rhs_line);
					lcs.diff(
						function added (from, to) {
							if (self._is_change_in_view('rhs', rhsvp, change)) {
								marktext.push([red, {line:k, ch:from}, {line:k, ch:to}, {className: 'mergely ch a rhs'}]);
							}
						},
						function removed (from, to) {
							if (self._is_change_in_view('lhs', lhsvp, change)) {
								marktext.push([led, {line:j, ch:from}, {line:j, ch:to}, {className: 'mergely ch d lhs'}]);
							}
						}
					);
				}
			}
		}
		this.trace('change', 'LCS marktext time', timer.stop());

		// mark changes outside closure
		led.operation(function() {
			// apply lhs markup
			for (var i = 0; i < marktext.length; ++i) {
				var m = marktext[i];
				if (m[0].doc.id != led.getDoc().id) continue;
				self.chfns[self.id + '-lhs'].push(m[0].markText(m[1], m[2], m[3]));
			}
		});
		red.operation(function() {
			// apply lhs markup
			for (var i = 0; i < marktext.length; ++i) {
				var m = marktext[i];
				if (m[0].doc.id != red.getDoc().id) continue;
				self.chfns[self.id + '-rhs'].push(m[0].markText(m[1], m[2], m[3]));
			}
		});

		this.trace('change', 'LCS markup time', timer.stop());

		// merge buttons
		var ed = {lhs:led, rhs:red};
		this.element.find('.merge-button').on('click', function(ev){
			// side of mouseenter
			var side = 'rhs';
			var oside = 'lhs';
			var parent = jQuery(this).parents('#' + self.id + '-editor-lhs');
			if (parent.length) {
				side = 'lhs';
				oside = 'rhs';
			}
			var pos = ed[side].coordsChar({left:ev.pageX, top:ev.pageY});

			// get the change id
			var cid = null;
			var info = ed[side].lineInfo(pos.line);
			jQuery.each(info.bgClass.split(' '), function(i, clazz) {
				if (clazz.indexOf('cid-') == 0) {
					cid = parseInt(clazz.split('-')[1], 10);
					return false;
				}
			});
			var change = self.changes[cid];
			self._merge_change(change, side, oside);
			return false;
		});

		// gutter markup that highlights all gutter line numbers for the current change.
		// cm doesn't give us the ability to style the line numbers directly.
		var lhsLineNumbers = jQuery('#mergely-lhs ~ .CodeMirror .CodeMirror-code .CodeMirror-linenumber.CodeMirror-gutter-elt');
		var rhsLineNumbers = jQuery('#mergely-rhs ~ .CodeMirror .CodeMirror-code .CodeMirror-linenumber.CodeMirror-gutter-elt');
		var jf, jt, i, j;
		rhsLineNumbers.removeClass('mergely current');
		lhsLineNumbers.removeClass('mergely current');
		var lhsvpFrom = parseInt(lhsLineNumbers.eq(0).text(), 10) - 1;
		var lhsvpTo = parseInt(lhsLineNumbers.eq(lhsLineNumbers.length - 1).text(), 10);
		var rhsvpFrom = parseInt(rhsLineNumbers.eq(0).text(), 10) - 1;
		var rhsvpTo = parseInt(rhsLineNumbers.eq(rhsLineNumbers.length - 1).text(), 10);

		for (i = 0; i < changes.length; ++i) {
			change = changes[i];

			if (current_diff == i && change.op !== 'a') {
				jf = change['lhs-line-from']
				jt = change['lhs-line-to'] + 1;
				for (j = jf; j < jt; ++j) {
					if (j >= lhsvpFrom && j <= lhsvpTo) {
						lhsLineNumbers.eq(j - lhsvpFrom).addClass('mergely current');
					}
				}
			}
			if (current_diff == i && change.op !== 'd') {
				jf = change['rhs-line-from']
				jt = change['rhs-line-to'] + 1;
				for (j = jf; j < jt; ++j) {
					if (j >= rhsvpFrom && j <= rhsvpTo) {
						rhsLineNumbers.eq(j - rhsvpFrom).addClass('mergely current');
					}
				}
			}
		}

		this.trace('change', 'markup buttons time', timer.stop());
	},
	_merge_change :	function(change, side, oside) {
		if (!change) return;
		var led = this.editor[this.id+'-lhs'];
		var red = this.editor[this.id+'-rhs'];
		var ed = { lhs:led, rhs:red };
		var from = change[side + '-line-from'];
		var to = change[side + '-line-to'];
		var ofrom = change[oside + '-line-from'];
		var oto = change[oside + '-line-to'];
		var doc = ed[side].getDoc();
		var odoc = ed[oside].getDoc();
		var fromlen = from >= 0 ? doc.getLine(from).length + 1 : 0;
		var tolen = to >= 0 ? doc.getLine(to).length + 1 : 0;
		var otolen = oto >= 0 ? odoc.getLine(oto).length + 1 : 0;
		var ofromlen = ofrom >= 0 ? odoc.getLine(ofrom).length + 1 : 0;
		var text;

		if (change['op'] === 'c') {
			text = doc.getRange(CodeMirror.Pos(from, 0), CodeMirror.Pos(to, tolen));
			odoc.replaceRange(text, CodeMirror.Pos(ofrom, 0), CodeMirror.Pos(oto, otolen));
		} else if ((oside === 'lhs' && change['op'] === 'd') || (oside === 'rhs' && change['op'] === 'a')) {
			if (from > 0) {
				text = doc.getRange(CodeMirror.Pos(from - 1, fromlen), CodeMirror.Pos(to, tolen));
			} else {
				text = doc.getRange(CodeMirror.Pos(0, 0), CodeMirror.Pos(to + 1, 0));
			}
			odoc.replaceRange(text, CodeMirror.Pos(ofrom - 1, 0), CodeMirror.Pos(oto + 1, 0));
		} else if ((oside === 'rhs' && change['op'] === 'd') || (oside === 'lhs' && change['op'] === 'a')) {
			if (from > 0) {
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
	},
	_draw_info: function(editor_name1, editor_name2) {
		var visible_page_height = jQuery(this.editor[editor_name1].getScrollerElement()).height() + 17; // fudged
		var gutter_height = jQuery(this.editor[editor_name1].getScrollerElement()).children(':first-child').height();
		var dcanvas = document.getElementById(editor_name1 + '-' + editor_name2 + '-canvas');
		if (dcanvas == undefined) throw 'Failed to find: ' + editor_name1 + '-' + editor_name2 + '-canvas';
		var clhs = this.element.find('#' + this.id + '-lhs-margin');
		var crhs = this.element.find('#' + this.id + '-rhs-margin');
		return {
			visible_page_height: visible_page_height,
			gutter_height: gutter_height,
			visible_page_ratio: (visible_page_height / gutter_height),
			margin_ratio: (visible_page_height / gutter_height),
			lhs_scroller: jQuery(this.editor[editor_name1].getScrollerElement()),
			rhs_scroller: jQuery(this.editor[editor_name2].getScrollerElement()),
			lhs_lines: this.editor[editor_name1].lineCount(),
			rhs_lines: this.editor[editor_name2].lineCount(),
			dcanvas: dcanvas,
			clhs: clhs,
			crhs: crhs,
			lhs_xyoffset: jQuery(clhs).offset(),
			rhs_xyoffset: jQuery(crhs).offset()
		};
	},
	_draw_diff: function(editor_name1, editor_name2, changes) {
		var ex = this._draw_info(editor_name1, editor_name2);
		var mcanvas_lhs = ex.clhs.get(0);
		var mcanvas_rhs = ex.crhs.get(0);
		var ctx = ex.dcanvas.getContext('2d');
		var ctx_lhs = mcanvas_lhs.getContext('2d');
		var ctx_rhs = mcanvas_rhs.getContext('2d');

		this.trace('draw', 'visible_page_height', ex.visible_page_height);
		this.trace('draw', 'gutter_height', ex.gutter_height);
		this.trace('draw', 'visible_page_ratio', ex.visible_page_ratio);
		this.trace('draw', 'lhs-scroller-top', ex.lhs_scroller.scrollTop());
		this.trace('draw', 'rhs-scroller-top', ex.rhs_scroller.scrollTop());

		jQuery.each(this.element.find('canvas'), function () {
			jQuery(this).get(0).height = ex.visible_page_height;
		});

		ex.clhs.unbind('click');
		ex.crhs.unbind('click');

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

		var lhsvp = this._get_viewport_side(editor_name1);
		var rhsvp = this._get_viewport_side(editor_name2);

		for (var i = 0; i < changes.length; ++i) {
			var change = changes[i];
			var fill = this.settings.fgcolor[change['op']];
			if (this._current_diff === i) {
				fill = this.current_diff_color;
			}

			this.trace('draw', change);
			// margin indicators
			var lhs_y_start = ((change['lhs-y-start'] + ex.lhs_scroller.scrollTop()) * ex.visible_page_ratio);
			var lhs_y_end = ((change['lhs-y-end'] + ex.lhs_scroller.scrollTop()) * ex.visible_page_ratio) + 1;
			var rhs_y_start = ((change['rhs-y-start'] + ex.rhs_scroller.scrollTop()) * ex.visible_page_ratio);
			var rhs_y_end = ((change['rhs-y-end'] + ex.rhs_scroller.scrollTop()) * ex.visible_page_ratio) + 1;
			this.trace('draw', 'marker calculated', lhs_y_start, lhs_y_end, rhs_y_start, rhs_y_end);

			ctx_lhs.beginPath();
			ctx_lhs.fillStyle = fill;
			ctx_lhs.strokeStyle = '#000';
			ctx_lhs.lineWidth = 0.5;
			ctx_lhs.fillRect(1.5, lhs_y_start, 4.5, Math.max(lhs_y_end - lhs_y_start, 5));
			ctx_lhs.strokeRect(1.5, lhs_y_start, 4.5, Math.max(lhs_y_end - lhs_y_start, 5));

			ctx_rhs.beginPath();
			ctx_rhs.fillStyle = fill;
			ctx_rhs.strokeStyle = '#000';
			ctx_rhs.lineWidth = 0.5;
			ctx_rhs.fillRect(1.5, rhs_y_start, 4.5, Math.max(rhs_y_end - rhs_y_start, 5));
			ctx_rhs.strokeRect(1.5, rhs_y_start, 4.5, Math.max(rhs_y_end - rhs_y_start, 5));

			if (!this._is_change_in_view('lhs', lhsvp, change) &&
				!this._is_change_in_view('rhs', rhsvp, change)) {
				// if the change is outside the viewport, skip
				continue;
			}

			lhs_y_start = change['lhs-y-start'];
			lhs_y_end = change['lhs-y-end'];
			rhs_y_start = change['rhs-y-start'];
			rhs_y_end = change['rhs-y-end'];

			var radius = 3;

			// draw left box
			ctx.beginPath();
			ctx.strokeStyle = fill;
			ctx.lineWidth = (this._current_diff==i) ? 1.5 : 1;

			var rectWidth = this.draw_lhs_width;
			var rectHeight = lhs_y_end - lhs_y_start - 1;
			var rectX = this.draw_lhs_min;
			var rectY = lhs_y_start;
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
			var cx = this.draw_lhs_min + this.draw_lhs_width;
			var cy = lhs_y_start + (lhs_y_end + 1 - lhs_y_start) / 2.0;
			var dx = this.draw_rhs_max - this.draw_rhs_width;
			var dy = rhs_y_start + (rhs_y_end + 1 - rhs_y_start) / 2.0;
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

		var lto = ex.clhs.height() * ex.visible_page_ratio;
		var lfrom = (ex.lhs_scroller.scrollTop() / ex.gutter_height) * ex.clhs.height();
		var rto = ex.crhs.height() * ex.visible_page_ratio;
		var rfrom = (ex.rhs_scroller.scrollTop() / ex.gutter_height) * ex.crhs.height();
		this.trace('draw', 'cls.height', ex.clhs.height());
		this.trace('draw', 'lhs_scroller.scrollTop()', ex.lhs_scroller.scrollTop());
		this.trace('draw', 'gutter_height', ex.gutter_height);
		this.trace('draw', 'visible_page_ratio', ex.visible_page_ratio);
		this.trace('draw', 'lhs from', lfrom, 'lhs to', lto);
		this.trace('draw', 'rhs from', rfrom, 'rhs to', rto);

		ctx_lhs.fillRect(1.5, lfrom, 4.5, lto);
		ctx_rhs.fillRect(1.5, rfrom, 4.5, rto);

		ex.clhs.click(function (ev) {
			var y = ev.pageY - ex.lhs_xyoffset.top - (lto / 2);
			var sto = Math.max(0, (y / mcanvas_lhs.height) * ex.lhs_scroller.get(0).scrollHeight);
			ex.lhs_scroller.scrollTop(sto);
		});
		ex.crhs.click(function (ev) {
			var y = ev.pageY - ex.rhs_xyoffset.top - (rto / 2);
			var sto = Math.max(0, (y / mcanvas_rhs.height) * ex.rhs_scroller.get(0).scrollHeight);
			ex.rhs_scroller.scrollTop(sto);
		});
	},
	trace: function(name) {
		if(this.settings._debug.indexOf(name) >= 0) {
			arguments[0] = name + ':';
			console.log([].slice.apply(arguments));
		}
	}
});

jQuery.pluginMaker = function(plugin) {
	// add the plugin function as a jQuery plugin
	jQuery.fn[plugin.prototype.name] = function(options) {
		// get the arguments
		var args = jQuery.makeArray(arguments),
		after = args.slice(1);
		var rc;
		this.each(function() {
			var tthis = this;
			// see if we have an instance
			var instance = jQuery.data(this, plugin.prototype.name);
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
				var _plugin = new plugin(this, options);
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
