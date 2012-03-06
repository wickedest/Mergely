/**
 * Copyright (c) 2012 by Jamie Peabody, http://www.mergely.com/
 * All rights reserved.
 * Version: 2.3 2012-02-07
 */
Mgly = {};

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

Mgly.LCS = function(x, y) {
	//http://en.wikipedia.org/wiki/Longest_common_subsequence_problem
	this.length = this._lcs(x, y);
	var C = [];
	x = x.split('');
	y = y.split('');
	x.unshift('');//add an empty element to the start [1..m]
	y.unshift('');//add an empty element to the start [1..n]
	this.C = C;
	this.x = x;
	this.y = y;
	var i = 0;
	var j = 0;
	for (i = 0; i < x.length + 1; ++i) {
		C[i] = [];
		for (j = 0; j < y.length + 1; ++j) C[i][j] = 0;
	}
	for (i = 1; i < x.length + 1; ++i) {
		for (j = 1; j < y.length + 1; ++j) {
			if (x[i - 1] == y[j - 1]) C[i][j] = C[i - 1][j - 1] + 1;
			else C[i][j] = Math.max( C[i][j - 1], C[i - 1][j] );
		}
	}
	this.ready = 1;
}

Mgly.LCS.prototype.clear = function() {
	this.ready = 0;
}

Mgly.LCS.prototype._diff = function(i, j, added, removed) {
	var x = this.x;
	var y = this.y;
	var C = this.C;
	if (this.ready && i > 0 && j > 0 && (x[i] == y[j])) {
		this._diff(i - 1, j - 1, added, removed);
	}
	else {
		if (j > 0 && (i == 0 || (C[i][j - 1] >= C[i-1][j]))) {
			this._diff(i, j - 1, added, removed);
			if (added) added(j - 1, y[j]);
		}
		else if (i > 0 && (j == 0 || (C[i][j - 1] < C[i - 1][j]))) {
			this._diff(i - 1, j, added, removed);
			if (removed) removed(i - 1, x[i]);
		}
	}
}

Mgly.LCS.prototype.diff = function(added, removed) {
	this._diff(this.x.length - 1, this.y.length - 1, added, removed);
}

Mgly.LCS.prototype._lcs = function(string1, string2) {
	// init max value
	var longest = 0;
	// init 2D array with 0
	var table = Array(string1.length);
	for(a = 0; a <= string1.length; a++){
		table[a] = Array(string2.length);
		for(b = 0; b <= string2.length; b++){
			table[a][b] = 0;
		}
	}
	// fill table
	for(var i = 0; i < string1.length; i++) {
		for(var j = 0; j < string2.length; j++) {
			if(string1[i]==string2[j]) {
				if(table[i][j] == 0){
					table[i+1][j+1] = 1;
				} 
				else {
					table[i+1][j+1] = table[i][j] + 1;
				}
				if(table[i+1][j+1] > longest){
					longest = table[i+1][j+1];
				}
			} 
			else {
				table[i+1][j+1] = 0;
			}
		}
	}
	return longest;
}

Mgly.diff = function(lhs, rhs) {
	this.diff_codes = {};
	this.max_code = 0;
	var lhs_lines = lhs.split('\n');
	var rhs_lines = rhs.split('\n');
	if (lhs.length == 0) lhs_lines = [];
	if (rhs.length == 0) rhs_lines = [];
	
	var lhs_data = new Object();
	lhs_data.data = this._diff_codes(lhs_lines);
	lhs_data.modified = {};
	lhs_data.length = Object.size(lhs_data.data);

	var rhs_data = new Object();
	rhs_data.data = this._diff_codes(rhs_lines);
	rhs_data.modified = {};
	rhs_data.length = Object.size(rhs_data.data);
	
	var max = (lhs_data.length + rhs_data.length + 1);
	var vector_d = Array( 2 * max + 2 );
	var vector_u = Array( 2 * max + 2 );
	
	this._lcs(lhs_data, 0, lhs_data.length, rhs_data, 0, rhs_data.length, vector_u, vector_d);
	this._optimize(lhs_data);
	this._optimize(rhs_data);
	this.items = this._create_diffs(lhs_data, rhs_data);
};

Mgly.diff.prototype.changes = function() {
	return this.items;
}

Mgly.diff.prototype.normal_form = function() {
	var nf = '';
	for (var index in this.items) {
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
	}
	return nf;
}

Mgly.diff.prototype._diff_codes = function(lines) {
	var code = this.max_code;
	var codes = {};
	for (var i = 0; i < lines.length; ++i) {
		var line = lines[i];
		var aCode = this.diff_codes[line];
		if (aCode != undefined) {
			codes[i] = aCode;
		}
		else {
			this.max_code++;
			this.diff_codes[line] = this.max_code;
			codes[i] = this.max_code;
		}
	}
	return codes;
}

Mgly.diff.prototype._lcs = function(lhs, lhs_lower, lhs_upper, rhs, rhs_lower, rhs_upper, vector_u, vector_d) {
	while ( (lhs_lower < lhs_upper) && (rhs_lower < rhs_upper) && (lhs.data[lhs_lower] == rhs.data[rhs_lower]) ) {
		++lhs_lower;
		++rhs_lower;
	}
	while ( (lhs_lower < lhs_upper) && (rhs_lower < rhs_upper) && (lhs.data[lhs_upper - 1] == rhs.data[rhs_upper - 1]) ) {
		--lhs_upper;
		--rhs_upper;
	}
	if (lhs_lower == lhs_upper) {
		while (rhs_lower < rhs_upper) {
			rhs.modified[ rhs_lower++ ] = true;
		}
	}
	else if (rhs_lower == rhs_upper) {
		while (lhs_lower < lhs_upper) {
			lhs.modified[ lhs_lower++ ] = true;
		}
	}
	else {
		var sms = this._sms(lhs, lhs_lower, lhs_upper, rhs, rhs_lower, rhs_upper, vector_u, vector_d);
		this._lcs(lhs, lhs_lower, sms.x, rhs, rhs_lower, sms.y, vector_u, vector_d);
		this._lcs(lhs, sms.x, lhs_upper, rhs, sms.y, rhs_upper, vector_u, vector_d);
	}
}

Mgly.diff.prototype._sms = function(lhs, lhs_lower, lhs_upper, rhs, rhs_lower, rhs_upper, vector_u, vector_d) {
	var max = lhs.length + rhs.length + 1;
	var kdown = lhs_lower - rhs_lower;
	var kup = lhs_upper - rhs_upper;
	var delta = (lhs_upper - lhs_lower) - (rhs_upper - rhs_lower);
	var odd = (delta & 1) != 0;
	var offset_down = max - kdown;
	var offset_up = max - kup;
	var maxd = ((lhs_upper - lhs_lower + rhs_upper - rhs_lower) / 2) + 1;
	vector_d[ offset_down + kdown + 1 ] = lhs_lower;
	vector_u[ offset_up + kup - 1 ] = lhs_upper;
	var ret = new Object();
	for (var d = 0; d <= maxd; ++d) {
		for (var k = kdown - d; k <= kdown + d; k += 2) {
			var x, y;
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
			while ((x < lhs_upper) && (y < rhs_upper) && (lhs.data[x] == rhs.data[y])) {
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
        for (var k = kup - d; k <= kup + d; k += 2) {
			// find the only or better starting point
			var x, y;
			if (k == kup + d) {
				x = vector_u[offset_up + k - 1]; // up
			} else {
				x = vector_u[offset_up + k + 1] - 1; // left
				if ((k > kup - d) && (vector_u[offset_up + k - 1] < x))
					x = vector_u[offset_up + k - 1]; // up
			}
			y = x - k;
			while ((x > lhs_lower) && (y > rhs_lower) && (lhs.data[x - 1] == rhs.data[y - 1])) {
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
}

Mgly.diff.prototype._optimize = function(data) {
    var start = 0, end = 0;
    while (start < data.length) {
		while ((start < data.length) && (data.modified[start] == undefined || data.modified[start] == false)) {
			start++;
		}
		end = start;
		while ((end < data.length) && (data.modified[end] == true)) {
			end++;
		}
		if ((end < data.length) && (data.data[start] == data.data[end])) {
			data.modified[start] = false;
			data.modified[end] = true;
		}
		else {
			start = end;
		}
	}
}

Mgly.diff.prototype._create_diffs = function(lhs_data, rhs_data) {
	var items = [];
	var lhs_start = 0, rhs_start = 0;
	var lhs_line = 0, rhs_line = 0;

	while (lhs_line < lhs_data.length || rhs_line < rhs_data.length) {
		if ((lhs_line < lhs_data.length) && (!lhs_data.modified[lhs_line])
			&& (rhs_line < rhs_data.length) && (!rhs_data.modified[rhs_line])) {
			// equal lines
			lhs_line++;
			rhs_line++;
		}
		else {
			// maybe deleted and/or inserted lines
			lhs_start = lhs_line;
			rhs_start = rhs_line;

			while (lhs_line < lhs_data.length && (rhs_line >= rhs_data.length || lhs_data.modified[lhs_line]))
				lhs_line++;

			while (rhs_line < rhs_data.length && (lhs_line >= lhs_data.length || rhs_data.modified[rhs_line]))
				rhs_line++;

			if ((lhs_start < lhs_line) || (rhs_start < rhs_line)) {
				// store a new difference-item
				var aItem = new Object();
				aItem.lhs_start = lhs_start;
				aItem.rhs_start = rhs_start;
				aItem.lhs_deleted_count = lhs_line - lhs_start;
				aItem.rhs_inserted_count = rhs_line - rhs_start;
				items.push(aItem);
			}
		}
	}
	return items;
}

Mgly.mergely = function(el, options) {
	if (el) {
		this.init(el, options);
	}
};

$.extend(Mgly.mergely.prototype, 
{
	name: "mergely",
	//http://jupiterjs.com/news/writing-the-perfect-jquery-plugin
	init: function(el, options) {
		this.settings = {
			autoresize: true,
			fadein: 'fast',
			editor_width: '400px',			editor_height: '400px',
			resize_timeout: 500,
			change_timeout: 150,
			fgcolor: '#4ba3fa',
			bgcolor: '#eee',
			lhs: function(setValue) { },
			rhs: function(setValue) { },
			loaded: function() { },
			height: function(h) { return h - 20; },
			width: function(w) { return w; },
			resize: function() {
				var w = $(el).parent().width();
				var h = $(window).height();
				if (this.width) w = this.width(w);
				if (this.height) h = this.height(h);
				var content_width = w / 2.0 - 2 * 8 - 8;
				var content_height = h;
				var tthis = $(el);
				tthis.find('.mergely-column, .CodeMirror-scroll').css({ 'width': content_width + 'px' });
				tthis.find('.mergely-column, .mergely-canvas, .mergely-margin, .mergely-column textarea, .CodeMirror-scroll').css({ 'height': content_height + 'px' });
				tthis.find('.mergely-canvas').css({ 'height': content_height + 'px' });
				tthis.find('.mergely-column textarea').css({ 'width': content_width + 'px' });
				tthis.css({ 'width': w + 'px', 'height': h + 'px' });
				if (tthis.css('display') == 'none') {
					if (this.fadein != false) tthis.fadeIn(this.fadein);
					else tthis.show();
					if (this.loaded) this.loaded();
				}
				if (this.resized) this.resized();
			},
			_debug: '', //scroll,draw,calc,diff,markup
			resized: function() { }
		};
		this.cmsettings = {
			mode: 'application/xml',
			readOnly: false,
			lineWrapping: false,
			lineNumbers: true
		}
		
		// save this element for faster queries
		this.element = $(el);
		
		// save options if there are any
		if (options.cmsettings) $.extend(this.cmsettings, options.cmsettings);
		if (options) $.extend(this.settings, options);
		
		// bind if the element is destroyed
		this.element.bind("destroyed", $.proxy(this.teardown, this));

		// save this instance in jQuery data
		$.data(el, this.name, this);

		this._setup(el);
	},
	// bind events to this instance's methods
	bind: function() {
		var tthis = this;
		this.editor = [];
		var lhs_cmsettings = jQuery.extend({
			onChange: function () { tthis._changing(tthis.id + '-lhs', tthis.id + '-rhs'); },
			onScroll: function () { tthis._scrolling(tthis.id + '-lhs'); }
		}, this.cmsettings);
		this.editor[this.id + '-lhs'] = CodeMirror.fromTextArea(
			$('#' + this.id + '-lhs').get(0), lhs_cmsettings
		);
		var rhs_cmsettings = jQuery.extend({
			onChange: function () { tthis._changing(tthis.id + '-lhs', tthis.id + '-rhs'); },
			onScroll: function () { tthis._scrolling(tthis.id + '-rhs'); }
		}, this.cmsettings);
		this.editor[this.id + '-rhs'] = CodeMirror.fromTextArea(
			$('#' + this.id + '-rhs').get(0), rhs_cmsettings
		);
		// resize
		var sz_timeout1 = null;
		$(window).resize(
			function () {
				if (sz_timeout1) clearTimeout(sz_timeout1);
				sz_timeout1 = setTimeout(function () {
					tthis.em_height = null; //recalculate
					if (tthis.settings.resize) tthis.settings.resize();
					tthis.editor[tthis.id + '-lhs'].refresh();
					tthis.editor[tthis.id + '-rhs'].refresh();
						tthis._changing(tthis.id + '-lhs', tthis.id + '-rhs');
				}, tthis.settings.resize_timeout);
			}
		);
	},
	unbind: function() {
		this.editor[this.id + '-lhs'].toTextArea();
		this.editor[this.id + '-rhs'].toTextArea();
	},
	destroy: function() {
		this.element.unbind("destroyed", this.teardown);
		this.teardown();
    },
	teardown: function() {
		this.unbind();
	},
	lhs: function(text) {
		this.editor[this.id + '-lhs'].setValue(text);
	},
	rhs: function(text) {
		this.editor[this.id + '-rhs'].setValue(text);
	},
	swap: function() {
		var le = this.editor[this.id + '-lhs'];
		var re = this.editor[this.id + '-rhs'];
		var tmp = re.getValue();
		re.setValue(le.getValue());
		le.setValue(tmp);
	},
	merge: function(side) {
		var le = this.editor[this.id + '-lhs'];
		var re = this.editor[this.id + '-rhs'];
		if (side == 'lhs') le.setValue(re.getValue());
		else re.setValue(le.getValue());
	},
	get: function(side) {
		var ed = this.editor[this.id + '-' + side];
		var t = ed.getValue();
		if (t == undefined) return '';
		return t;
	},
	clear: function(side) {
		var ed = this.editor[this.id + '-' + side];
		ed.setValue('');
	},
	search: function(side, query) {
		var le = this.editor[this.id + '-lhs'];
		var re = this.editor[this.id + '-rhs'];
		var editor;
		if (side == 'lhs') editor = le;
		else editor = re;
        if ((editor.getSelection().length == 0) || (this.prev_query[side] != query)) {
            this.cursor[this.id] = editor.getSearchCursor(query, { line: 0, ch: 0 }, false);
            this.prev_query[side] = query;
        }
        if (this.cursor[this.id].findNext()) {
            editor.setSelection(this.cursor[this.id].from(), this.cursor[this.id].to());
        }
        else {
            this.cursor[this.id] = editor.getSearchCursor(query, { line: 0, ch: 0 }, false);
        }
	},
	resize: function() {
		this.settings.resize();
		this._changing(this.id + '-lhs', this.id + '-rhs');
	},
	_setup: function(el) {
		$(this.element).hide();//hide
		this.id = $(el).attr('id');
		var height = this.settings.editor_height;
		var width = this.settings.editor_width;
		this.changed_timeout = null;
		this.change_funcs = [];
		this.prev_query = [];
		this.cursor = [];
		this.change_exp = new RegExp(/(\d+(?:,\d+)?)([acd])(\d+(?:,\d+)?)/);
		var merge_left_button;
		var merge_right_button;
		if ($.button != undefined) {
			//jquery ui
			merge_left_button = '<button title="Merge left"></button>';
			merge_right_button = '<button title="Merge right"></button>';
		}
		else {
			// homebrew
			var style = 'width:1em;height:1em;background-color:#888;cursor:pointer;text-align:center;color:#eee;border:1px solid: #222;margin-right:5px;';
			merge_left_button = '<div style="' + style + '" title="Merge left">&lt;</div>';
			merge_right_button = '<div style="' + style + '" title="Merge right">&gt;</div>';
		}
		this.merge_right_button = $(merge_right_button);
		this.merge_left_button = $(merge_left_button);
		if (this.merge_right_button.corner) this.merge_right_button.corner('3px');
		if (this.merge_left_button.corner) this.merge_left_button.corner('3px');

		// create the textarea and canvas elements
		$(this.element).append($('<div class="mergely-margin" style="height: ' + height + '"><canvas id="' + this.id + '-lhs-margin" width="8" height="' + height + '"></canvas></div>'));
		$(this.element).append($('<div style="width:' + width + '; height:' + height + '" id="' + this.id + '-editor-lhs" class="mergely-column"><textarea style="" id="' + this.id + '-lhs"></textarea></div>'));
		$(this.element).append($('<div class="mergely-canvas" style="height: ' + height + '"><canvas id="' + this.id + '-lhs-' + this.id + '-rhs-canvas" width="28" height="' + height + '"></canvas></div>'));
		$(this.element).append($('<div style="width:' + width + '; height:' + height + '" id="' + this.id + '-editor-rhs" class="mergely-column"><textarea style="" id="' + this.id + '-rhs"></textarea></div>'));
		$(this.element).append($('<div class="mergely-margin" style="height: ' + height + '"><canvas id="' + this.id + '-rhs-margin" width="8" height="' + height + '"></canvas></div>'));
		this.bind();
		if (this.settings.lhs) this.settings.lhs( this.editor[this.id + '-lhs'].setValue );
		if (this.settings.rhs) this.settings.rhs( this.editor[this.id + '-rhs'].setValue );
		
		// resize only after bind
		$(window).resize();

		//codemirror
		var cmstyle = '#' + this.id + ' .CodeMirror-gutter-text { padding: 5px 0 0 0; }' +
			'#' + this.id + ' .CodeMirror-lines pre, ' + '#' + this.id + ' .CodeMirror-gutter-text pre { line-height: 18px; }';
		if (this.settings.autoresize) {
			cmstyle += this.id + ' .CodeMirror-scroll { height: 100%; overflow: auto; }';
		}
		$('<style type="text/css">' + cmstyle + '</style>').appendTo('head');
	},
	_scrolling: function(editor_name) {
		var scroller = $(this.editor[editor_name].getScrollerElement());
		if (this.midway == undefined) {
			this.midway = (scroller.height() / 2.0 + scroller.offset().top).toFixed(2);
		}
		// balance-line
		var midline = this.editor[editor_name].coordsChar({x:0, y:this.midway});
		var top_to = scroller.scrollTop();
		var left_to = scroller.scrollLeft();
		
		this.trace('scroll', 'midway', this.midway);
		this.trace('scroll', 'midline', midline);
		this.trace('scroll', 'top_to', top_to);
		this.trace('scroll', 'left_to', left_to);
		
		for (var name in this.editor) {
			if (editor_name == name) continue; //same editor
			var this_side = editor_name.replace(this.id + '-', '');
			var other_side = name.replace(this.id + '-', '');
			var top_adjust = 0;
			
			// find the last change that is less than or within the midway point
			// do not move the rhs until the lhs end point is >= the rhs end point.
			var last_change = null;
			for (var i in this.changes) {
				var change = this.changes[i];
				if ((midline.line >= change[this_side+'-line-from'])) {
					last_change = change;
					if (midline.line >= last_change[this_side+'-line-to']) {
						top_adjust += 
							(change[this_side+'-y-end'] - change[this_side+'-y-start']) - (change[other_side+'-y-end'] - change[other_side+'-y-start']);
					}
				}
			}
			
			var scroll = true;
			if (last_change) {
				this.trace('scroll', 'last visible change', last_change);
				if ((last_change[this_side+'-line-from'] < midline.line) &&
					(last_change[this_side+'-line-to'] > midline.line)) {
					scroll = false;
				}
			}
			if (scroll) {
				// scroll the other side
				this.trace('scroll', 'scrolling other side', top_to - top_adjust);
				var scroller = $(this.editor[name].getScrollerElement());
				scroller.scrollTop(top_to - top_adjust).scrollLeft(left_to);
			}
			else this.trace('scroll', 'not scrolling other side');
			this._calculate_offsets(this.id + '-lhs', this.id + '-rhs', this.changes);
			this._draw_diff(this.id + '-lhs', this.id + '-rhs', this.changes);
			this.trace('scroll', 'scrolled');
		}
	},
	_changing: function(editor_name1, editor_name2) {
		var tthis = this;
		if (this.changed_timeout != null) clearTimeout(this.changed_timeout);
		this.changed_timeout = setTimeout(function(){
			tthis._changed(editor_name1, editor_name2);
		}, this.settings.change_timeout);
	},
	_changed: function(editor_name1, editor_name2) {
		for (var name in this.editor) {
			var editor = this.editor[name];
			editor.operation(function() {
				for (var i = 0, l = editor.lineCount(); i < l; ++i) {
					editor.clearMarker(i);
					editor.setLineClass(i, null);
				}
			});
		}
		//remove previous markup changes
		for (var i in this.change_funcs) {
			var change = this.change_funcs[i];
			if (change.clear != undefined) change.clear();
			else change();//prev codemirror
		}
		this._diff(editor_name1, editor_name2);
	},
	_diff: function(editor_name1, editor_name2) {
		var lhs = this.editor[editor_name1].getValue();
		var rhs = this.editor[editor_name2].getValue();
		var d = new Mgly.diff(lhs, rhs);
		this.changes = this._parse_diff(editor_name1, editor_name2, d.normal_form());
		this._calculate_offsets(editor_name1, editor_name2, this.changes);
		this._markup_changes(editor_name1, editor_name2, this.changes);
		this._draw_diff(editor_name1, editor_name2, this.changes);
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
			change['op'] = test[2];
			changes[change_id++] = change;
			this.trace('diff', 'change', change);
		}
		return changes;
	},
	_calculate_offsets: function (editor_name1, editor_name2, changes) {
		if (this.draw_top_offset == null) {
			var topnode = this.element.find('.CodeMirror-gutter-text pre').first();
			var top_offset = topnode.offset().top;
			this.em_height = topnode.get(0).offsetHeight;
			// this is the distance from the top of the screen
			this.draw_top_offset = 6.5 - top_offset;
			if (this.em_height > 0) {
				this.draw_lhs_min = 0.5;
				this.draw_rhs_max = $('#' + editor_name1 + '-' + editor_name2 + '-canvas').width() - 0.5; //24.5;
				this.draw_lhs_width = 5;
				this.draw_rhs_width = 5;
			}
			this.trace('calc', 'change offsets calculated', 'top_offset', top_offset);
		}
		for (var i in changes) {
			var change = changes[i];
			change['lhs-y-start'] = this.draw_top_offset + this.editor[editor_name1].charCoords({line: change['lhs-line-from'], ch:0}).y;
			change['lhs-y-end'] = this.draw_top_offset + this.editor[editor_name1].charCoords({line: change['lhs-line-to']+1, ch:0}).y - 1;
			change['rhs-y-start'] = this.draw_top_offset + this.editor[editor_name2].charCoords({line: change['rhs-line-from'], ch:0}).y;
			change['rhs-y-end'] = this.draw_top_offset + this.editor[editor_name2].charCoords({line: change['rhs-line-to']+1, ch:0}).y - 1;
			if (change['op'] == 'd') {
				change['rhs-y-start'] = change['rhs-y-end'];
			}
			else if (change['op'] == 'a') {
				change['lhs-y-start'] = change['lhs-y-end'];
			}
			this.trace('calc', 'change offsets calculated', i, change);
		}
	},
	_markup_changes: function (editor_name1, editor_name2, changes) {
		$('.merge-button').remove(); // clear
		var editor = this.editor[editor_name1];
		editor.operation(function() {
			for (var i in changes) {
				var change = changes[i];
				var class_start = 'mergely-' + change['op'] + '-start';
				var class_end = 'mergely-' + change['op'] + '-end';
				var class_start_end = class_start + ' ' + class_end;
				if (change['lhs-line-from'] == change['lhs-line-to']) {
					if (change['op'] == 'c') {
						editor.setLineClass(change['lhs-line-from'], class_start_end);
						//editor.setMarker(change['lhs-line-from'], '%N%', class_start_end);
					}
					else if (change['op'] == 'a') {
						editor.setLineClass(change['lhs-line-from'], class_end + '-lhs');
						//editor.setMarker(change['lhs-line-from'], '%N%', class_end + '-lhs');
					}
					else if (change['op'] == 'd') {
						editor.setLineClass(change['lhs-line-from'], class_start_end + ' mergely-c-rem');
						//editor.setMarker(change['lhs-line-from'], '%N%', class_start_end + ' mergely-c-rem');
					}
				}
				else {
					editor.setLineClass(change['lhs-line-from'], class_start + ((change['op'] == 'd')? ' mergely-c-rem' : '') );
					editor.setLineClass(change['lhs-line-to'], class_end + ((change['op'] == 'd')? ' mergely-c-rem' : '') );
					//editor.setMarker(change['lhs-line-from'], '%N%', class_start + ((change['op'] == 'd')? ' mergely-c-rem' : '') );
					//editor.setMarker(change['lhs-line-to'], '%N%', class_end + ((change['op'] == 'd')? ' mergely-c-rem' : '') );
					
					if (change['op'] == 'd') {// fill in deletes between from/to
						for (var line = change['lhs-line-from'] + 1; line < change['lhs-line-to']; ++line) {
							editor.setLineClass(line, 'mergely-c-rem mergely-d-mid');
							//editor.setMarker(line, '%N%', 'mergely-c-rem mergely-d-mid');
						}
					}
				}
			}
		});
		
		var editor = this.editor[editor_name2];
		editor.operation(function() {
			for (var i in changes) {
				var change = changes[i];
				var class_start = 'mergely-' + change['op'] + '-start';
				var class_end = 'mergely-' + change['op'] + '-end';
				var class_start_end = class_start + ' ' + class_end;
				if (change['rhs-line-from'] == change['rhs-line-to']) {
					if (change['op'] == 'c') {
						editor.setLineClass(change['rhs-line-from'], class_start_end);
						//editor.setMarker(change['rhs-line-from'], '%N%', class_start_end);
					}
					else if (change['op'] == 'a') {
						editor.setLineClass(change['rhs-line-from'], class_start_end);
						//editor.setMarker(change['rhs-line-from'], '%N%', class_start_end);
					}
					else if (change['op'] == 'd') {
						editor.setLineClass(change['rhs-line-from'], class_end + '-rhs');
						//editor.setMarker(change['rhs-line-from'], '%N%', class_end + '-rhs');
					}
				}
				else {
					editor.setLineClass(change['rhs-line-from'], class_start);
					editor.setLineClass(change['rhs-line-to'], class_end);
					//editor.setMarker(change['rhs-line-from'], '%N%', class_start);
					//editor.setMarker(change['rhs-line-to'], '%N%', class_end);
					
					if (change['op'] == 'a') {// fill in deletes between from/to
						for (var line = change['rhs-line-from'] + 1; line < change['rhs-line-to']; ++line) {
							editor.setLineClass(line, 'mergely-c-add mergely-a-mid');
							//editor.setMarker(line, '%N%', 'mergely-c-add mergely-a-mid');
						}
					}
				}
			}
		});
		
		for (var i in changes) {
			var change = changes[i];
			var class_start = 'mergely-' + change['op'] + '-start';
			var class_end = 'mergely-' + change['op'] + '-end';
			var class_start_end = class_start + ' ' + class_end;

			if (!this.cmsettings.readOnly) {
				var button = this.merge_right_button.clone();
				if (button.button) button.button({icons: {primary: 'ui-icon-triangle-1-e'}, text: false});
				button.addClass('merge-button');
				button.attr('id', 'merge-right-' + i);
				// the strangeness here is to get around creating closures in a loop, which do
				// not work.  to get around, need to wrap and call the function.
				var tthis = this;
				$(button).get(0).onclick = (function (change) {
					return function() {
						var lhs_line = tthis.editor[editor_name1].lineInfo(change['lhs-line-to']);
						var rhs_line = tthis.editor[editor_name2].lineInfo(change['rhs-line-to']);
						var text = tthis.editor[editor_name1].getRange(
							{ 'line': change['lhs-line-from'], 'ch': 0 },
							{ 'line': change['lhs-line-to'], 'ch': lhs_line.text.length });
						if (change['op'] == 'c') {
							tthis.editor[editor_name2].replaceRange(
								text, { 'line': change['rhs-line-from'], 'ch': 0 },
								{ 'line': change['rhs-line-to'], 'ch': rhs_line.text.length });
						}
						else if (change['op'] == 'a' ) {
							var from = parseInt(change['rhs-line-from']);
							var to = parseInt(change['rhs-line-to']);
							for (var i = to; i >= from; --i) {
								tthis.editor[editor_name2].removeLine(i);
							}
						}
						else {
							//must force a newline
							text = text + '\n';
							tthis.editor[editor_name2].replaceRange(
								text, { 'line': change['rhs-line-from'] + 1, 'ch': 0 });
						}

						//reset
						tthis.editor[editor_name1].setValue(tthis.editor[editor_name1].getValue());
						tthis.editor[editor_name2].setValue(tthis.editor[editor_name2].getValue());
						return false;
					}
				})(change);
				
				this.trace('markup', 'lhs adding button', change['lhs-line-from']);
				this.editor[editor_name1].addWidget(
					{ 'line': change['lhs-line-from'], 'ch': 0 }, button.get(0), false, 'over', 'right')

				button = this.merge_left_button.clone();
				if (button.button) button.button({icons: {primary: 'ui-icon-triangle-1-w'}, text: false});
				button.addClass('merge-button');
				button.attr('id', 'merge-left-' + i);
				// the strangeness here is to get around creating closures in a loop, which do
				// not work.  to get around, need to wrap and call the function.
				var tthis = this;
				$(button).get(0).onclick = (function (change) {
					return function () {
						var lhs_line = tthis.editor[editor_name1].lineInfo(change['lhs-line-to']);
						var rhs_line = tthis.editor[editor_name2].lineInfo(change['rhs-line-to']);
						var text = tthis.editor[editor_name2].getRange(
							{ 'line': change['rhs-line-from'], 'ch': 0 },
							{ 'line': change['rhs-line-to'], 'ch': rhs_line.text.length });
						if (change['op'] == 'c') {
							tthis.editor[editor_name1].replaceRange(
								text, { 'line': change['lhs-line-from'], 'ch': 0 },
								{ 'line': change['lhs-line-to'], 'ch': lhs_line.text.length });
						}
						else if (change['op'] == 'd' ) {
							var from = parseInt(change['lhs-line-from']);
							var to = parseInt(change['lhs-line-to']);
							for (var i = to; i >= from; --i) {
								tthis.editor[editor_name1].removeLine(i);
							}
						}
						else {
							//must force a newline
							text = text + '\n';
							tthis.editor[editor_name1].replaceRange(
								text, { 'line': change['lhs-line-from'] + 1, 'ch': 0 });
						}
						//reset
						tthis.editor[editor_name1].setValue(tthis.editor[editor_name1].getValue());
						tthis.editor[editor_name2].setValue(tthis.editor[editor_name2].getValue());
						return false;
					}
				})(change);
				
				this.trace('markup', 'rhs adding button', change['rhs-line-from']);
				this.editor[editor_name2].addWidget(
					{ 'line': change['rhs-line-from'], 'ch': 0 }, button.get(0), false, 'over', 'right')
			}
			//
			// LCS or line changes
			//
			if (change['op'] == 'a') {
				var from = change['rhs-line-from'];
				var to = change['rhs-line-to'];
				var to_ln = this.editor[editor_name2].lineInfo(to);
				if (to_ln) {
					var func = this.editor[editor_name2].markText({line:from, ch:0}, {line:to, ch:to_ln.text.length}, 'mergely-c-add');
					this.change_funcs.push(func);
				}
				continue;
			}
			else if (change['op'] == 'd') {
				var from = change['lhs-line-from'];
				var to = change['lhs-line-to'];
				var to_ln = this.editor[editor_name1].lineInfo(to);
				if (to_ln) {
					var func = this.editor[editor_name1].markText({line:from, ch:0}, {line:to, ch:to_ln.text.length}, 'mergely-c-rem');
					this.change_funcs.push(func);
				}
				continue;
			}
			
			var tthis = this;
			
			for (var j = change['lhs-line-from'], k = change['rhs-line-from'], i = 0; 
				 ((j >= 0) && (j <= change['lhs-line-to'])) || ((k >= 0) && (k <= change['rhs-line-to']));
				 ++j, ++k) {
				if (k + i > change['rhs-line-to']) {
					// lhs continues past rhs, mark lhs as deleted
					var lhs_line = this.editor[editor_name1].getLine( j );
					var func = this.editor[editor_name1].markText({line:j, ch:0}, {line:j, ch:lhs_line.length}, 'mergely-c-rem');
					this.change_funcs.push(func);
					continue;
				}
				if (j + i > change['lhs-line-to']) {
					// rhs continues past lhs, mark rhs as added
					var rhs_line = this.editor[editor_name2].getLine( k );
					var func = this.editor[editor_name1].markText({line:k, ch:0}, {line:k, ch:lhs_line.length}, 'mergely-c-add');
					this.change_funcs.push(func);
					continue;
				}
				
				var lhs_line = this.editor[editor_name1].getLine( j );
				var rhs_line = this.editor[editor_name2].getLine( k );
				var lhs_start = { 'line': -1, 'ch': -1 };
				var lhs_stop = { 'line': -1, 'ch': -1 };
				var rhs_start = { 'line': -1, 'ch': -1 };
				var rhs_stop = { 'line': -1, 'ch': -1 };
				
				var lcs = new Mgly.LCS(lhs_line, rhs_line);
				var max = Math.max(lhs_line.length, rhs_line.length);
				if (max == 0) max = 1;
				var percent = ((1.0)*lcs.length / max) * 100;
				if (percent < 10) lcs.clear();
				lcs.diff(
					added = function (index, c) {
						if (rhs_start.ch < 0) {
							rhs_start.line = k;
							rhs_start.ch = index;
							rhs_stop.line = k;
							rhs_stop.ch = index;
						}
						else if (index == rhs_stop.ch + 1) {
							rhs_stop.ch = index;
						}
						else {
							if ((rhs_start.ch >= 0) && (rhs_stop.ch >= rhs_start.ch)) {
								rhs_stop.ch += 1;
								var func = tthis.editor[editor_name2].markText(rhs_start, rhs_stop, 'mergely-c-add');
								tthis.change_funcs.push(func);
							}
							//reset
							rhs_start.ch = -1;
							rhs_stop.ch = -1;
							if (c != '\n') this.added(index, c);//call again
						}
					},
					removed = function (index, c) {
						if (lhs_start.ch < 0) {
							lhs_start.line = j;
							lhs_start.ch = index;
							lhs_stop.line = j;
							lhs_stop.ch = index;
						}
						else if (index == lhs_stop.ch + 1) {
							lhs_stop.ch = index;
						}
						else {
							if ((lhs_start.ch >= 0) && (lhs_stop.ch >= lhs_start.ch)) {
								lhs_stop.ch += 1;
								var func = tthis.editor[editor_name1].markText(lhs_start, lhs_stop, 'mergely-c-rem');
								tthis.change_funcs.push(func);
							}
							//reset
							lhs_start.ch = -1;
							lhs_stop.ch = -1;
							if (c != '\n') this.removed(index, c);//call again
						}
					}
				);
				if ((rhs_start.ch >= 0) && (rhs_stop.ch >= rhs_start.ch)) {
					rhs_stop.ch += 1;
					var func = this.editor[editor_name2].markText(rhs_start, rhs_stop, 'mergely-c-add');
					this.change_funcs.push(func);
				}
				if ((lhs_start.ch >= 0) && (lhs_stop.ch >= lhs_start.ch)) {
					lhs_stop.ch += 1;
					var func = this.editor[editor_name1].markText(lhs_start, lhs_stop, 'mergely-c-rem');
					this.change_funcs.push(func);
				}
			}
			
			
		}
	},
	_draw_diff: function(editor_name1, editor_name2, changes) {
		var visible_page_height = $(this.editor[editor_name1].getScrollerElement()).height();
		var gutter_height = $(this.editor[editor_name1].getScrollerElement()).children(':first-child').height();
		var visible_page_ratio = (visible_page_height / gutter_height);
		var margin_ratio = (visible_page_height / gutter_height);
		var lhs_scroller = $(this.editor[editor_name1].getScrollerElement());
		var rhs_scroller = $(this.editor[editor_name2].getScrollerElement());
		var lhs_lines = this.editor[editor_name1].lineCount();
		var rhs_lines = this.editor[editor_name2].lineCount();
		
		this.trace('draw', 'visible_page_height', visible_page_height);
		this.trace('draw', 'gutter_height', gutter_height);
		this.trace('draw', 'visible_page_ratio', visible_page_ratio);
		this.trace('draw', 'lhs-scroller-top', lhs_scroller.scrollTop());
		this.trace('draw', 'rhs-scroller-top', rhs_scroller.scrollTop());

		var dcanvas = document.getElementById(editor_name1 + '-' + editor_name2 + '-canvas');
		if (dcanvas == undefined) throw 'Failed to find: ' + editor_name1 + '-' + editor_name2 + '-canvas';
		$.each($('canvas'), function () {
			$(this).get(0).height = visible_page_height;
		});
		var clhs = $('#' + this.id + '-lhs-margin');
		var crhs = $('#' + this.id + '-rhs-margin');
		clhs.unbind('click');
		crhs.unbind('click');
		var mcanvas_lhs = clhs.get(0);
		var mcanvas_rhs = crhs.get(0);
		var lhs_xyoffset = $(clhs).offset();
		var rhs_xyoffset = $(crhs).offset();

		var ctx = dcanvas.getContext('2d');
		var ctx_lhs = mcanvas_lhs.getContext('2d');
		var ctx_rhs = mcanvas_rhs.getContext('2d');

		ctx_lhs.beginPath();
		ctx_lhs.fillStyle = this.settings.bgcolor;
		ctx_lhs.strokeStyle = '#888';
		ctx_lhs.fillRect(0, 0, 6.5, visible_page_height);
		ctx_lhs.strokeRect(0, 0, 6.5, visible_page_height);

		ctx_rhs.beginPath();
		ctx_rhs.fillStyle = this.settings.bgcolor;
		ctx_rhs.strokeStyle = '#888';
		ctx_rhs.fillRect(0, 0, 6.5, visible_page_height);
		ctx_rhs.strokeRect(0, 0, 6.5, visible_page_height);

		for (var i in changes) {
			var change = changes[i];

			var lhs_y_start = change['lhs-y-start'];
			var lhs_y_end = change['lhs-y-end'];
			var rhs_y_start = change['rhs-y-start'];
			var rhs_y_end = change['rhs-y-end'];
			
			// draw left box
			ctx.beginPath();
			ctx.strokeStyle = this.settings.fgcolor;
			ctx.lineWidth = 1;
			ctx.moveTo(this.draw_lhs_min, lhs_y_start);
			ctx.lineTo(this.draw_lhs_min + this.draw_lhs_width, lhs_y_start);
			ctx.lineTo(this.draw_lhs_min + this.draw_lhs_width, lhs_y_end + 1);
			ctx.lineTo(this.draw_lhs_min, lhs_y_end + 1);
			ctx.stroke();

			// draw right box
			ctx.moveTo(this.draw_rhs_max, rhs_y_start);
			ctx.lineTo(this.draw_rhs_max - this.draw_rhs_width, rhs_y_start);
			ctx.lineTo(this.draw_rhs_max - this.draw_rhs_width, rhs_y_end + 1);
			ctx.lineTo(this.draw_rhs_max, rhs_y_end + 1);
			ctx.stroke();

			// connect boxes
			ctx.moveTo(this.draw_lhs_min + this.draw_lhs_width, lhs_y_start + (lhs_y_end + 1 - lhs_y_start) / 2.0);
			ctx.lineTo(this.draw_rhs_max - this.draw_rhs_width, rhs_y_start + (rhs_y_end + 1 - rhs_y_start) / 2.0);
			ctx.stroke();

			// margin indicators
			/*
			if (this.em_height * lhs_lines > visible_page_height) {
				// margin indicators need to be re-calculated per-ratio
				lhs_y_start = change['lhs-line-from'] * (visible_page_height / lhs_lines);
				lhs_y_end = (change['lhs-line-to'] + 1) * (visible_page_height / lhs_lines);
			}
			if (this.em_height * rhs_lines > visible_page_height) {
				// margin indicators need to be re-calculated per-ratio
				rhs_y_start = change['rhs-line-from'] * (visible_page_height / rhs_lines);
				rhs_y_end = (change['rhs-line-to'] + 1) * (visible_page_height / rhs_lines);
			}
			*/
			this.trace('draw', change);
			// margin indicators
			lhs_y_start = ((change['lhs-y-start'] + lhs_scroller.scrollTop()) * visible_page_ratio);
			lhs_y_end = ((change['lhs-y-end'] + lhs_scroller.scrollTop()) * visible_page_ratio) + 1;
			rhs_y_start = ((change['rhs-y-start'] + rhs_scroller.scrollTop()) * visible_page_ratio);
			rhs_y_end = ((change['rhs-y-end'] + rhs_scroller.scrollTop()) * visible_page_ratio) + 1;
			this.trace('draw', 'marker calculated', lhs_y_start, lhs_y_end, rhs_y_start, rhs_y_end);

			ctx_lhs.beginPath();
			ctx_lhs.fillStyle = this.settings.fgcolor;
			ctx_lhs.strokeStyle = '#000';
			ctx_lhs.lineWidth = 0.5;
			ctx_lhs.fillRect(1.5, lhs_y_start, 4.5, Math.max(lhs_y_end - lhs_y_start, 5));
			ctx_lhs.strokeRect(1.5, lhs_y_start, 4.5, Math.max(lhs_y_end - lhs_y_start, 5));

			ctx_rhs.beginPath();
			ctx_rhs.fillStyle = this.settings.fgcolor;
			ctx_rhs.strokeStyle = '#000';
			ctx_rhs.lineWidth = 0.5;
			ctx_rhs.fillRect(1.5, rhs_y_start, 4.5, Math.max(rhs_y_end - rhs_y_start, 5));
			ctx_rhs.strokeRect(1.5, rhs_y_start, 4.5, Math.max(rhs_y_end - rhs_y_start, 5));
		}

		// visible window feedback
		ctx_lhs.fillStyle = 'rgba(0, 0, 200, 0.5)';
		ctx_rhs.fillStyle = 'rgba(0, 0, 200, 0.5)';
		
		var to = clhs.height() * visible_page_ratio;
		var from = (lhs_scroller.scrollTop() / gutter_height) * clhs.height();
		this.trace('draw', 'cls.height', clhs.height());
		this.trace('draw', 'lhs_scroller.scrollTop()', lhs_scroller.scrollTop());
		this.trace('draw', 'gutter_height', gutter_height);
		this.trace('draw', 'visible_page_ratio', visible_page_ratio);
		this.trace('draw', 'from', from, 'to', to);
		
		ctx_lhs.fillRect(1.5, from, 4.5, to);
		ctx_rhs.fillRect(1.5, from, 4.5, to);
		
		clhs.click(function (ev) {
			var y = ev.pageY - lhs_xyoffset.top - (to / 2);
			var sto = Math.max(0, (y / mcanvas_lhs.height) * lhs_scroller.get(0).scrollHeight);
			lhs_scroller.scrollTop(sto);
		});
		crhs.click(function (ev) {
			var y = ev.pageY - rhs_xyoffset.top - (to / 2);
			var sto = Math.max(0, (y / mcanvas_rhs.height) * rhs_scroller.get(0).scrollHeight);
			rhs_scroller.scrollTop(sto);
		});
	},
	trace: function(name) {
		if(this.settings._debug.indexOf(name) >= 0) {
			arguments[0] = name+':'; 
			console.log(this, [].slice.apply(arguments));
		} 
	}
});

$.pluginMaker = function(plugin) {
	// add the plugin function as a jQuery plugin
	$.fn[plugin.prototype.name] = function(options) {
		// get the arguments 
		var args = $.makeArray(arguments),
		after = args.slice(1);
		var rc = undefined;
		this.each(function() {
			// see if we have an instance
			var instance = $.data(this, plugin.prototype.name);
			if (instance) {
				// call a method on the instance
				if (typeof options == "string") {
					rc = instance[options].apply(instance, after);
				} else if (instance.update) {
					// call update on the instance
					alert('here');
					return instance.update.apply(instance, args);
				}
			} else {
				// create the plugin
				new plugin(this, options);
			}
		});
		if (rc != undefined) return rc;
	};
};

// make the mergely widget
$.pluginMaker(Mgly.mergely);
