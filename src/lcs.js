const diff = require('./diff');
const DiffParser = require('./diff-parser');

function LCS(x, y, options) {
	function getPositionOfWords(text, options) {
		var exp = new RegExp(/\w+/g);
		var map = {};
		var match;
		var item = 0;
		var p0 = 0;
		var p1;
		var ws0;
		while ((match = exp.exec(text))) {
			// if previous ws, then calculate whether not not this should be
			// included as part of the diff
			if (!options.ignorews && ws0 && ws0 <= match.index - 1) {
				map[ item++ ] = {
					p0: ws0,
					p1: match.index - 1,
					ws0,
					word: text.slice(ws0, match.index)
				};
			}
			// add the words to be matched in diff
			p0 = match.index;
			p1 = p0 + match[0].length - 1;
			ws0 = p1 + 2;
			map[ item++ ] = {
				p0,
				p1,
				ws0,
				word: text.slice(p0, p1 + 1)
			};
		}
		return map;
	}

	this.options = options;
	if (options.ignorews) {
		this.xmap = getPositionOfWords(x, this.options);
		this.ymap = getPositionOfWords(y, this.options);
		const xmap = this.xmap;
		this.x = Object.keys(xmap).map(function (i) { return xmap[i].word; });
		const ymap = this.ymap;
		this.y = Object.keys(ymap).map(function (i) { return ymap[i].word; });
	} else {
		this.x = x.split('');
		this.y = y.split('');
	}
};

LCS.prototype.clear = function () {
	this.ready = 0;
};

LCS.prototype.diff = function (added, removed) {
	const d = new diff(this.x, this.y, {
		ignorews: !!this.options.ignorews,
		ignoreaccents: !!this.options.ignoreaccents
	});
	const changes = DiffParser(d.normal_form());
	for (let i = 0; i < changes.length; ++i) {
		const change = changes[i];
		if (this.options.ignorews) {
			if (change.op != 'a') {
				const from = this.xmap[change['lhs-line-from']].p0;
				const to = this.xmap[change['lhs-line-to']].p1 + 1;
				removed(from, to);
			}
			if (change.op !== 'd') {
				const from = this.ymap[change['rhs-line-from']].p0;
				const to = this.ymap[change['rhs-line-to']].p1 + 1;
				added(from, to);
			}
		} else {
			if (change.op != 'a') {
				const from = change['lhs-line-from'];
				const to = change['lhs-line-to'] + 1;
				removed(from, to);
			}
			if (change.op !== 'd') {
				const from = change['rhs-line-from'];
				const to = change['rhs-line-to'] + 1;
				added(from, to);
			}
		}
	}
};

module.exports = LCS;
