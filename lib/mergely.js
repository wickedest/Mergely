Mgly = {};

Mgly.sizeOf = function(obj) {
	var size = 0, key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) size++;
	}
	return size;
}

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
$.extend(Mgly.LCS.prototype, {
	clear: function() { this.ready = 0; },
	diff: function(added, removed) {
		this._diff(this.x.length - 1, this.y.length - 1, added, removed);
	},
	_diff: function(i, j, added, removed){
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
	},
	_lcs: function(string1, string2) {
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
});

Mgly.diff = function(lhs, rhs, retain_lines) {
	this.diff_codes = {};
	this.max_code = 0;
	var lhs_lines = lhs.split('\n');
	var rhs_lines = rhs.split('\n');
	if (lhs.length == 0) lhs_lines = [];
	if (rhs.length == 0) rhs_lines = [];
	
	var lhs_data = new Object();
	lhs_data.data = this._diff_codes(lhs_lines);
	lhs_data.modified = {};
	lhs_data.length = Mgly.sizeOf(lhs_data.data);

	var rhs_data = new Object();
	rhs_data.data = this._diff_codes(rhs_lines);
	rhs_data.modified = {};
	rhs_data.length = Mgly.sizeOf(rhs_data.data);
	
	var max = (lhs_data.length + rhs_data.length + 1);
	var vector_d = Array( 2 * max + 2 );
	var vector_u = Array( 2 * max + 2 );
	
	this._lcs(lhs_data, 0, lhs_data.length, rhs_data, 0, rhs_data.length, vector_u, vector_d);
	this._optimize(lhs_data);
	this._optimize(rhs_data);
	this.items = this._create_diffs(lhs_data, rhs_data);
	if (retain_lines) {
		this.lhs_lines = lhs_lines;
		this.rhs_lines = rhs_lines;
	}
};
$.extend(Mgly.diff.prototype, {
	changes: function() { return this.items; },
	normal_form: function() {
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
			if (this.rhs_lines && this.lhs_lines) {
				// if rhs/lhs lines have been retained, output contextual diff
				for (var i = item.lhs_start; i < item.lhs_start + item.lhs_deleted_count; ++i) {
					nf += '< ' + this.lhs_lines[i] + '\n';
				}
				if (item.rhs_inserted_count && item.lhs_deleted_count) nf += '---\n';
				for (var i = item.rhs_start; i < item.rhs_start + item.rhs_inserted_count; ++i) {
					nf += '> ' + this.rhs_lines[i] + '\n';
				}
			}
		}
		return nf;
	},
	_diff_codes: function(lines) {
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
	},
	_lcs: function(lhs, lhs_lower, lhs_upper, rhs, rhs_lower, rhs_upper, vector_u, vector_d) {
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
	},
	_sms: function(lhs, lhs_lower, lhs_upper, rhs, rhs_lower, rhs_upper, vector_u, vector_d) {
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
	},
	_optimize: function(data) {
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
	},
	_create_diffs: function(lhs_data, rhs_data) {
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
});

Mgly.mergely = function(el, options) {
	CodeMirror.defineExtension("centerOnCursor", function() {
		var coords = this.cursorCoords(null, "local");
		this.scrollTo(null, 
			(coords.y + coords.yBot) / 2 - (this.getScrollerElement().clientHeight / 2));
	});

	if (el) {
		this.init(el, options);
	}
};

$.extend(Mgly.mergely.prototype, {
	name: "mergely",
	//http://jupiterjs.com/news/writing-the-perfect-jquery-plugin
	init: function(el, options) {
		this.settings = {
			autoupdate: true,
			autoresize: true,
			fadein: 'fast',
			editor_width: '400px',			editor_height: '400px',
			resize_timeout: 500,
			change_timeout: 150,
			fgcolor: {a:'#4ba3fa',c:'#cccccc',d:'#ff7f7f'},
			_bgcolor: '#eee',
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
				var self = $(el);
				self.find('.mergely-column').css({ 'width': content_width + 'px' });
				self.find('.mergely-column, .mergely-canvas, .mergely-margin, .mergely-column textarea, .CodeMirror-scroll').css({ 'height': content_height + 'px' });
				self.find('.mergely-canvas').css({ 'height': content_height + 'px' });
				self.find('.mergely-column textarea').css({ 'width': content_width + 'px' });
				self.css({ 'width': w + 'px', 'height': h + 'px' });
				if (self.css('display') == 'none') {
					if (this.fadein != false) self.fadeIn(this.fadein);
					else self.show();
					if (this.loaded) this.loaded();
				}
				if (this.resized) this.resized();
			},
			_debug: '', //scroll,draw,calc,diff,markup
			resized: function() { }
		};
		var cmsettings = {
			mode: 'text/plain',
			readOnly: false,
			lineWrapping: false,
			lineNumbers: true
		}
		this.lhs_cmsettings = {};
		this.rhs_cmsettings = {};
		
		// save this element for faster queries
		this.element = $(el);
		
		// save options if there are any
		if (options && options.cmsettings) $.extend(this.lhs_cmsettings, cmsettings, options.cmsettings, options.lhs_cmsettings);
		if (options && options.cmsettings) $.extend(this.rhs_cmsettings, cmsettings, options.cmsettings, options.rhs_cmsettings);
		if (options) $.extend(this.settings, options);
		
		// bind if the element is destroyed
		this.element.bind("destroyed", $.proxy(this.teardown, this));

		// save this instance in jQuery data
		$.data(el, this.name, this);

		this._setup(el);
	},
	// bind events to this instance's methods
	bind: function() {
		var rhstx = $('#' + this.id + '-rhs').get(0);
		if (!rhstx) {
			console.error('rhs textarea not defined - Mergely not initialized properly');
			return;
		}
		var lhstx = $('#' + this.id + '-lhs').get(0);
		if (!rhstx) {
			console.error('lhs textarea not defined - Mergely not initialized properly');
			return;
		}
		var self = this;
		this.editor = [];
		var lhs_cmsettings = jQuery.extend({
			onChange: function () { if (self.settings.autoupdate) self._changing(self.id + '-lhs', self.id + '-rhs'); },
			onScroll: function () { self._scrolling(self.id + '-lhs'); }
		}, this.lhs_cmsettings);
		this.editor[this.id + '-lhs'] = CodeMirror.fromTextArea(lhstx, lhs_cmsettings
		);
		var rhs_cmsettings = jQuery.extend({
			onChange: function () { if (self.settings.autoupdate) self._changing(self.id + '-lhs', self.id + '-rhs'); },
			onScroll: function () { self._scrolling(self.id + '-rhs'); }
		}, this.rhs_cmsettings);
		this.editor[this.id + '-rhs'] = CodeMirror.fromTextArea(rhstx, rhs_cmsettings
		);
		// resize
		var sz_timeout1 = null;
		var sz = function() {
			self.em_height = null; //recalculate
			if (self.settings.resize) self.settings.resize();
			self.editor[self.id + '-lhs'].refresh();
			self.editor[self.id + '-rhs'].refresh();
			self._changing(self.id + '-lhs', self.id + '-rhs');
		}
		$(window).resize(
			function () {
				if (sz_timeout1) clearTimeout(sz_timeout1);
				sz_timeout1 = setTimeout(sz, self.settings.resize_timeout);
			}
		);
		sz();
	},
	unbind: function() {
		if (this.changed_timeout != null) clearTimeout(this.changed_timeout);
		this.editor[this.id + '-lhs'].toTextArea();
		this.editor[this.id + '-rhs'].toTextArea();
	},
	destroy: function() {
		this.element.unbind('destroyed', this.teardown);
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
	update: function() {
		this._changing(this.id + '-lhs', this.id + '-rhs');
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
	options: function(opts) {
		$.extend(this.settings, opts);
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
	diff: function() {
		var lhs = this.editor[this.id + '-lhs'].getValue();
		var rhs = this.editor[this.id + '-rhs'].getValue();
		var d = new Mgly.diff(lhs, rhs, retain_lines = true);
		return d.normal_form();
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
		var merge_lhs_button;
		var merge_rhs_button;
		if ($.button != undefined) {
			//jquery ui
			merge_lhs_button = '<button title="Merge left"></button>';
			merge_rhs_button = '<button title="Merge right"></button>';
		}
		else {
			// homebrew
			var style = 'width:1em;height:1em;background-color:#888;cursor:pointer;text-align:center;color:#eee;border:1px solid: #222;margin-right:5px;';
			merge_lhs_button = '<div style="' + style + '" title="Merge left">&lt;</div>';
			merge_rhs_button = '<div style="' + style + '" title="Merge right">&gt;</div>';
		}
		this.merge_rhs_button = $(merge_rhs_button);
		this.merge_lhs_button = $(merge_lhs_button);
		if (this.merge_rhs_button.corner) this.merge_rhs_button.corner('3px');
		if (this.merge_lhs_button.corner) this.merge_lhs_button.corner('3px');
		
		// create the textarea and canvas elements
		$(this.element).append($('<div class="mergely-margin" style="height: ' + height + '"><canvas id="' + this.id + '-lhs-margin" width="8px" height="' + height + '"></canvas></div>'));
		$(this.element).append($('<div style="width:' + width + '; height:' + height + '" id="' + this.id + '-editor-lhs" class="mergely-column"><textarea style="" id="' + this.id + '-lhs"></textarea></div>'));
		$(this.element).append($('<div class="mergely-canvas" style="height: ' + height + '"><canvas id="' + this.id + '-lhs-' + this.id + '-rhs-canvas" style="width:28px" width="28px" height="' + height + '"></canvas></div>'));
		$(this.element).append($('<div style="width:' + width + '; height:' + height + '" id="' + this.id + '-editor-rhs" class="mergely-column"><textarea style="" id="' + this.id + '-rhs"></textarea></div>'));
		$(this.element).append($('<div class="mergely-margin" style="height: ' + height + '"><canvas id="' + this.id + '-rhs-margin" width="8px" height="' + height + '"></canvas></div>'));
		//codemirror
		var cmstyle = '#' + this.id + ' .CodeMirror-gutter-text { padding: 5px 0 0 0; }' +
			'#' + this.id + ' .CodeMirror-lines pre, ' + '#' + this.id + ' .CodeMirror-gutter-text pre { line-height: 18px; }';
		if (this.settings.autoresize) {
			cmstyle += this.id + ' .CodeMirror-scroll { height: 100%; overflow: auto; }';
		}
		$('<style type="text/css">' + cmstyle + '</style>').appendTo('head');
		this.bind();
		if (this.settings.lhs) this.settings.lhs( this.editor[this.id + '-lhs'].setValue );
		if (this.settings.rhs) this.settings.rhs( this.editor[this.id + '-rhs'].setValue );
		
		// resize only after bind
		this.settings.resize();
		
		// merge
		var self = this;
		var ed = {lhs:this.editor[this.id + '-lhs'], rhs:this.editor[this.id + '-rhs']};
		$('.merge-button').live('click', function(ev){
			console.log('lhs hover over', ev, this);
			// side of mouseenter
			var side = 'rhs';
			var oside = 'lhs';
			var parent = $(this).parents('#' + self.id + '-editor-lhs');
			if (parent.length) {
				side = 'lhs';
				oside = 'rhs';
			}
			var pos = ed[side].coordsChar({x:ev.pageX, y:ev.pageY});
			console.log('pos', side, pos);

			// get the change id
			var cid = null;
			var info = ed[side].lineInfo(pos.line);
			$.each(info.bgClass.split(' '), function(i, clazz) {
				console.log('clazz', i, clazz);
				if (clazz.indexOf('cid-') == 0) {
					cid = parseInt(clazz.split('-')[1]);
					return false;
				}
			});
			var change = self.changes[cid];
			console.log('change', change);

			var line = {lhs: ed['lhs'].lineInfo(change['lhs-line-to']), rhs: ed['rhs'].lineInfo(change['rhs-line-to'])};
			var text = ed[side].getRange(
				{ 'line': change[side + '-line-from'], 'ch': 0 },
				{ 'line': change[side + '-line-to'], 'ch': line[side].text.length });
			
			if (change['op'] == 'c') {
				ed[oside].replaceRange( text,
					{ 'line': change[oside + '-line-from'], 'ch': 0 },
					{ 'line': change[oside + '-line-to'], 'ch': line[oside].text.length });
			}
			else {// 'a' or 'd'
				var from = parseInt(change[oside + '-line-from']);
				var to = parseInt(change[oside + '-line-to']);
				for (var i = to; i >= from; --i) {
					ed[oside].removeLine(i);
				}
			}
			//reset
			ed['lhs'].setValue(ed['lhs'].getValue());
			ed['rhs'].setValue(ed['rhs'].getValue());
			return false;
		});
	},
	
	_scrolling: function(editor_name) {
		if (self._skipscroll === true) {
			// scrolling one side causes the other to event - ignore it
			self._skipscroll = false;
			return;
		}
		var scroller = $(this.editor[editor_name].getScrollerElement());
		if (this.midway == undefined) {
			this.midway = (scroller.height() / 2.0 + scroller.offset().top).toFixed(2);
		}
		// balance-line
		var midline = this.editor[editor_name].coordsChar({x:0, y:this.midway});
		var top_to = scroller.scrollTop();
		var left_to = scroller.scrollLeft();
		
		this.trace('scroll', 'side', editor_name);
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
							(change[this_side+'-y-end'] - change[this_side+'-y-start']) - 
							(change[other_side+'-y-end'] - change[other_side+'-y-start']);
					}
				}
			}
			
			var scroll = true;
			if (last_change) {
				this.trace('scroll', 'last change before midline', last_change);
				if ((last_change[this_side+'-line-from'] < midline.line) &&
					(last_change[this_side+'-line-to'] > midline.line)) {
					scroll = false;
				}
			}
			this.trace('scroll', 'scroll', scroll);
			if (scroll) {
				// scroll the other side
				this.trace('scroll', 'scrolling other side', top_to - top_adjust);
				var scroller = $(this.editor[name].getScrollerElement());
				self._skipscroll = true;//disable next event
				scroller.scrollTop(top_to - top_adjust).scrollLeft(left_to);
			}
			else this.trace('scroll', 'not scrolling other side');
			this._calculate_offsets(this.id + '-lhs', this.id + '-rhs', this.changes);
			this._draw_diff(this.id + '-lhs', this.id + '-rhs', this.changes);
			this.trace('scroll', 'scrolled');
		}
	},
	_changing: function(editor_name1, editor_name2) {
		var self = this;
		if (this.changed_timeout != null) clearTimeout(this.changed_timeout);
		this.changed_timeout = setTimeout(function(){
			self._changed(editor_name1, editor_name2);
		}, this.settings.change_timeout);
	},
	_changed: function(editor_name1, editor_name2) {
		for (var name in this.editor) {
			var editor = this.editor[name];
			editor.operation(function() {
				for (var i = 0, l = editor.lineCount(); i < l; ++i) {
					editor.clearMarker(i);
					editor.setLineClass(i, null, null);
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
	_get_extents: function() {
		return {
			'top-offset': this.draw_top_offset,
			'em-height': this.em_height,
			'draw-lhs-min': this.draw_lhs_min,
			'draw-rhs-max': this.draw_rhs_max
		};
	},
	_calculate_offsets: function (editor_name1, editor_name2, changes) {
		if (this.em_height == null) {
			
			//var topnode = this.element.find('.CodeMirror-gutter-text pre').first();
			//this.em_height = topnode.get(0).offsetHeight;
			// this is the distance from the top of the screen
			
			var topnode = $('#' + this.id + '-lhs-margin').first();
			var top_offset = topnode.offset().top;
			if (!top_offset) return;//try again
			this.draw_top_offset = 0.5 - top_offset;
			
			this.em_height = $('.CodeMirror-lines pre').get(0).offsetHeight
			if (!this.em_height) {
				console.warn('Failed to calculate offsets, using 18 by default');
				this.em_height = 18;
			}
			this.draw_lhs_min = 0.5;
			var c = $('#' + editor_name1 + '-' + editor_name2 + '-canvas');
			if (!c.length) {
				console.error('failed to find canvas', '#' + editor_name1 + '-' + editor_name2 + '-canvas');
			}
			if (!c.width()) {
				console.error('canvas width is 0');
				return;
			}
			this.draw_rhs_max = $('#' + editor_name1 + '-' + editor_name2 + '-canvas').width() - 0.5; //24.5;
			this.draw_lhs_width = 5;
			this.draw_rhs_width = 5;
			this.trace('calc', 'change offsets calculated', {top_offset: top_offset, lhs_min: this.draw_lhs_min, rhs_max: this.draw_rhs_max, lhs_width: this.draw_lhs_width, rhs_width: this.draw_rhs_width});
		}
		for (var i in changes) {
			var change = changes[i];
			var valign = 2;
			var ls = this.editor[editor_name1].charCoords({line: change['lhs-line-from']});
			var le = this.editor[editor_name1].charCoords({line: change['lhs-line-to']});
			var rs = this.editor[editor_name2].charCoords({line: change['rhs-line-from']});
			var re = this.editor[editor_name2].charCoords({line: change['rhs-line-to']});
			if (change['op'] == 'a') {
				// adds (right), normally start from the end of the lhs,
				// except for the case when the start of the rhs is 0
				if (change['rhs-line-from'] > 0) {
					ls.y = ls.yBot;
					ls.yBot += this.em_height;
					le = ls;
				}
			}
			else if (change['op'] == 'd') {
				// deletes (left) normally finish from the end of the rhs,
				// except for the case when the start of the lhs is 0
				if (change['lhs-line-from'] > 0) {
					rs.y = rs.yBot;
					rs.yBot += this.em_height;
					re = rs;
				}
			}
			change['lhs-y-start'] = this.draw_top_offset + ls.y;
			if (change['op'] == 'c' || change['op'] == 'd') {
				change['lhs-y-end'] = this.draw_top_offset + le.yBot - valign;
			}
			else {
				change['lhs-y-end'] = this.draw_top_offset + le.y - valign;
			}
			change['rhs-y-start'] = this.draw_top_offset + rs.y;
			if (change['op'] == 'c' || change['op'] == 'a') {
				change['rhs-y-end'] = this.draw_top_offset + re.yBot - valign;
			}
			else {
				change['rhs-y-end'] = this.draw_top_offset + re.y - valign;
			}
			this.trace('calc', 'change calculated', i, change);
		}
		return changes;
	},
	_markup_changes: function (editor_name1, editor_name2, changes) {
		$('.merge-button').remove(); // clear
		
		var self = this;
		var led = this.editor[editor_name1];
		var red = this.editor[editor_name2];
		led.operation(function() {
			for (var i in changes) {
				var change = changes[i];
				var clazz = 'mergely ' + change['op'] + ' cid-' + i + ' ';
				// lhs markup
				if (change['lhs-line-from'] == change['lhs-line-to']) {
					if (change['op'] == 'a') {
						// adds (right), normally start from the end of the lhs,
						// except for the case when the start of the rhs is 0
						if (change['rhs-line-from'] > 0) {
							var cl = clazz + 'lhs start end';
							led.setLineClass(change['lhs-line-from'], null, cl);
						}
						else {
							var cl = clazz + 'lhs start';
							led.setLineClass(change['lhs-line-from'], null, cl);
						}
					}
					else if (change['op'] == 'd') {
						var cl = clazz + 'lhs start end';
						led.setLineClass(change['lhs-line-from'], null, cl);
					}
					else if (change['op'] == 'c') {
						var cl = clazz + 'lhs start end';
						led.setLineClass(change['lhs-line-from'], null, cl);
					}
				}
				else {
					var cl = clazz + 'lhs start';
					led.setLineClass(change['lhs-line-from'], null, cl);
					cl = clazz + 'lhs end';
					led.setLineClass(change['lhs-line-to'], null, cl);
				}
				
				if (change['op'] == 'd') {
					// apply delete to cross-out
					var from = change['lhs-line-from'];
					var to = change['lhs-line-to'];
					var to_ln = led.lineInfo(to);
					if (to_ln) {
						var func = led.markText({line:from, ch:0}, {line:to, ch:to_ln.text.length}, 'mergely ch d lhs');
						self.change_funcs.push(func);
					}
				}
				else if (change['op'] == 'c') {
					// apply LCS changes to each line
					for (var j = change['lhs-line-from'], k = change['rhs-line-from'], i = 0; 
						 ((j >= 0) && (j <= change['lhs-line-to'])) || ((k >= 0) && (k <= change['rhs-line-to']));
						 ++j, ++k) {
						if (k + i > change['rhs-line-to']) {
							// lhs continues past rhs, mark lhs as deleted
							var lhs_line = led.getLine( j );
							var func = led.markText({line:j, ch:0}, {line:j, ch:lhs_line.length}, 'mergely ch d lhs');
							self.change_funcs.push(func);
							continue;
						}
						if (j + i > change['lhs-line-to']) {
							// rhs continues past lhs, mark rhs as added
							var rhs_line = red.getLine( k );
							var func = led.markText({line:k, ch:0}, {line:k, ch:lhs_line.length}, 'mergely ch a rhs');
							self.change_funcs.push(func);
							continue;
						}
						var lhs_line = led.getLine( j );
						var rhs_line = red.getLine( k );
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
										var func = self.editor[editor_name2].markText(rhs_start, rhs_stop, 'mergely ch a rhs');
										self.change_funcs.push(func);
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
										var func = self.editor[editor_name1].markText(lhs_start, lhs_stop, 'mergely ch d lhs');
										self.change_funcs.push(func);
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
							var func = red.markText(rhs_start, rhs_stop, 'mergely ch a rhs');
							self.change_funcs.push(func);
						}
						if ((lhs_start.ch >= 0) && (lhs_stop.ch >= lhs_start.ch)) {
							lhs_stop.ch += 1;
							var func = led.markText(lhs_start, lhs_stop, 'mergely ch d lhs');
							self.change_funcs.push(func);
						}
					}
				}
				
				// for each line in-between the changed lines, from and to, apply 'bg' class
				for (var i = change['lhs-line-from'] + 1; i < change['lhs-line-to']; ++i) {
					var cl = clazz + 'lhs';
					led.setLineClass(i, null, cl);
				}
				 
				// add widgets
				var lhs_button = self.merge_lhs_button.clone();
				if (lhs_button.button) {
					//jquery-ui support
					lhs_button.button({icons: {primary: 'ui-icon-triangle-1-w'}, text: false});
				}
				lhs_button.addClass('merge-button');
				lhs_button.attr('id', 'merge-lhs-' + i);
				red.addWidget(
					{'line': change['rhs-line-from'], 'ch': 0}, lhs_button.get(0), false, 'over', 'right');
				
				var rhs_button = self.merge_rhs_button.clone();
				if (rhs_button.button) {
					//jquery-ui support
					rhs_button.button({icons: {primary: 'ui-icon-triangle-1-e'}, text: false});
				}
				rhs_button.addClass('merge-button');
				rhs_button.attr('id', 'merge-rhs-' + i);
				led.addWidget(
					{'line': change['lhs-line-from'], 'ch': 0}, rhs_button.get(0), false, 'over', 'right');
			}
		});
		red.operation(function() {
			for (var i in changes) {
				var change = changes[i];
				var clazz = 'mergely ' + change['op'] + ' cid-' + i + ' ';
				// rhs markup
				if (change['rhs-line-from'] == change['rhs-line-to']) {
					if (change['op'] == 'a') {
						var cl = clazz + 'bg rhs start end';
						red.setLineClass(change['rhs-line-from'], null, cl);
					}
					else if (change['op'] == 'd'){
						if (change['lhs-line-from'] > 0) {
							// deletes (left), normally start from the end of the rhs,
							// except for the case when the start of the lhs is 0
							var cl = clazz + 'rhs start end';
							red.setLineClass(change['rhs-line-from'], null, cl);
							
							// this will be sweet if gutters worked the same as lines
							//red.setMarker(change['rhs-line-from'], null, cl)
						}
						else {
							// case where there are no lines on the rhs or where the lhs change
							// finishes before the rhs change
							var cl = clazz + 'rhs start';
							red.setLineClass(change['rhs-line-from'], null, cl);
							
							// this will be sweet if gutters worked the same as lines
							//red.setMarker(change['rhs-line-from'], null, cl)
						}
					}
					else if (change['op'] == 'c') {
						var cl = clazz + 'rhs start end';
						red.setLineClass(change['rhs-line-from'], null, cl);
						
						// this will be sweet if gutters worked the same as lines
						//red.setMarker(change['rhs-line-from'], null, cl)
					}
				}
				else {
					var cl = clazz + 'rhs start';
					red.setLineClass(change['rhs-line-from'], null, cl);
					cl = clazz + 'rhs end';
					red.setLineClass(change['rhs-line-to'], null, cl);
				}
				for (var i = change['rhs-line-from'] + 1; i <= change['rhs-line-to']; ++i) {
					var cl = clazz + 'rhs';
					if (change['op'] == 'c') {
						// these lines are added
						cl = 'mergely a cid-' + i + ' rhs c';
						//if (i == change['rhs-line-to']) cl += ' c';
					}
					if (i == change['rhs-line-to']) cl += ' end';
					red.setLineClass(i, '', cl);
				}
			}
		});
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
		ctx_lhs.fillStyle = this.settings._bgcolor;
		ctx_lhs.strokeStyle = '#888';
		ctx_lhs.fillRect(0, 0, 6.5, visible_page_height);
		ctx_lhs.strokeRect(0, 0, 6.5, visible_page_height);

		ctx_rhs.beginPath();
		ctx_rhs.fillStyle = this.settings._bgcolor;
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
			ctx.strokeStyle = this.settings.fgcolor[change['op']];
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

			this.trace('draw', change);
			// margin indicators
			lhs_y_start = ((change['lhs-y-start'] + lhs_scroller.scrollTop()) * visible_page_ratio);
			lhs_y_end = ((change['lhs-y-end'] + lhs_scroller.scrollTop()) * visible_page_ratio) + 1;
			rhs_y_start = ((change['rhs-y-start'] + rhs_scroller.scrollTop()) * visible_page_ratio);
			rhs_y_end = ((change['rhs-y-end'] + rhs_scroller.scrollTop()) * visible_page_ratio) + 1;
			this.trace('draw', 'marker calculated', lhs_y_start, lhs_y_end, rhs_y_start, rhs_y_end);

			ctx_lhs.beginPath();
			ctx_lhs.fillStyle = this.settings.fgcolor[change['op']];
			ctx_lhs.strokeStyle = '#000';
			ctx_lhs.lineWidth = 0.5;
			ctx_lhs.fillRect(1.5, lhs_y_start, 4.5, Math.max(lhs_y_end - lhs_y_start, 5));
			ctx_lhs.strokeRect(1.5, lhs_y_start, 4.5, Math.max(lhs_y_end - lhs_y_start, 5));

			ctx_rhs.beginPath();
			ctx_rhs.fillStyle = this.settings.fgcolor[change['op']];
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
			console.log([].slice.apply(arguments));
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
