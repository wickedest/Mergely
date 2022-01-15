const LCS = require('./lcs');

class VDoc {
	constructor() {
		this._lines = {
			lhs: {},
			rhs: {}
		};
		this._rendered = {
			lhs: {},
			rhs: {}
		};
	}

	hasRenderedChange(side, changeId) {
		return !!this._rendered[side][changeId];
	}

	addRender(side, change, changeId, options) {
		const {
			isCurrent,
			lineDiff,
			mergeButton,
			getMergeHandler
		} = options;

		if (this.hasRenderedChange(side, change)) {
			return;
		}
		const oside = (side === 'lhs') ? 'rhs' : 'lhs';
		const bgClass = [ 'mergely', side, change.op, `cid-${changeId}` ];
		const { lf, lt, olf, olt } = getExtents(side, change);

		if (change[lf] < 0) {
			bgClass.push('empty');
		}
		this._getLine(side, lf).addLineClass('background', 'start');
		this._getLine(side, lt).addLineClass('background', 'end');

		if (isCurrent) {
			if (lf != lt) {
				this._getLine(side, lf).addLineClass('background', 'current');
			}
			this._getLine(side, lt).addLineClass('background', 'current');
			for (let j = lf; j <= lt; ++j) {
				this._getLine(side, j).addLineClass('gutter', 'mergely current');
			}
		}

		if (lf == 0 && lt == 0 && olf == 0) {
			// test if this change is the first line of the side
			this._getLine(side, lf).addLineClass('background', bgClass.join(' '));
			this._getLine(side, lf).addLineClass('background', 'first');
			// FIXME: need lineDiff here?
		} else {
			// apply change for each line in-between the changed lines
			for (let j = lf; j <= lt; ++j) {
				this._getLine(side, j).addLineClass('background', bgClass.join(' '));

				if (!lineDiff) {
					// inner line diffs are disabled, skip the rest
					continue;
				}

				if (side === 'lhs'
					&& (change.op === 'd'
						|| (change.op === 'c' && j > olt)
					)) {
					// mark entire line text with deleted (strikeout) if the
					// change is a delete, or if it is changed text and the
					// line goes past the end of the other side.
					this._getLine(side, j).markText(0, undefined, 'mergely ch d lhs');
				} else if (side == 'rhs'
					&& (change.op === 'a'
						|| (change.op === 'c' && j > olt)
					)) {
					// mark entire line text with added if the change is an
					// add, or if it is changed text and the line goes past the
					// end of the other side.
					this._getLine(side, j).markText(0, undefined, 'mergely ch a rhs');
				}
			}
		}

		if (mergeButton) {
			mergeButton.className = `merge-button merge-${oside}-button`;
			const handler = getMergeHandler(change, side, oside);
			this._getLine(side, lf).addMergeButton('merge', mergeButton, handler);
		}
		this._setRenderedChange(side, changeId);
	}

	addInlineDiff(change, { getText }) {
		const { lf, lt, olf, olt } = getExtents('lhs', change);
		const vdoc = this;

		for (let j = lf, k = olf;
			((j >= 0) && (j <= lt)) || ((k >= 0) && (k <= olt));
			++j, ++k) {
			// if both lhs line and rhs are within the change range with
			// respect to each other, do inline diff.
			if (j <= lt && k <= olt) {
				const lhsText = getText('lhs', j);
				const rhsText = getText('rhs', k);

				// TODO: there is an LCS performance gain here if either side
				// is empty.
				const lcs = new LCS(lhsText, rhsText, {
					// TODO
					ignoreaccents: false,
					ignorews: false
				});

				// TODO: there might be an LCS performance gain here to move
				// function declaration out of loop, but there shouldn't be
				// too many lines here. it's no more than the viewport.
				lcs.diff(
					function _added(from, to) {
						console.log('added', {from, to});
						const line = vdoc._getLine('rhs', k);
						line.markText(from, to, 'mergely ch a rhs');
					},
					function _removed(from, to) {
						console.log('removed', {from, to});
						const line = vdoc._getLine('lhs', j);
						line.markText(from, to, 'mergely ch d lhs');
					}
				);
			}
		}
	}

	_setRenderedChange(side, changeId) {
		return this._rendered[side][changeId] = true;
	}

	_getLine(side, id) {
		let line = this._lines[side][id];
		if (line) {
			return line;
		}
		line = new VLine(id);
		this._lines[side][id] = line;
		return line;
	}

	update(side, changeId, editor, viewport) {
		this._setRenderedChange(side, changeId);
		const lines = Object.keys(this._lines[side]);
		for (let i = 0; i < lines.length; ++i) {
			const id = lines[i];
			if (id < viewport.from || id > viewport.to) {
				continue;
			}
			
			const vline = this._getLine(side, id);
			if (vline.rendered) {
				continue;
			}
			vline.update(editor);
		}
	}

	clear() {
		for (const lineId in this._lines.lhs) {
			this._lines.lhs[lineId].clear();
		}
		for (const lineId in this._lines.rhs) {
			this._lines.rhs[lineId].clear();
		}
	}
}

class VLine {
	constructor(id) {
		this.id = id;
		this.background = new Set();
		this.gutter = new Set();
		this.marker = null;
		this.editor = null;
		this.markup = [];
		this._clearMarkup = [];
		this.rendered = false;
	}

	addLineClass(location, clazz) {
		this[location].add(clazz);
	}

	addMergeButton(name, item, handler) {
		this.marker = [ name, item, handler ];
	}

	markText(charFrom, charTo, className) {
		this.markup.push([ charFrom, charTo, className ]);
	}

	update(editor) {
		if (this.rendered) {
			// FIXME: probably do not need this now
			console.log('already rendered', this.id);
			return;
		}
		this.editor = editor;
		if (this.background.size) {
			const clazz = Array.from(this.background).join(' ');
			editor.addLineClass(this.id, 'background', clazz);
		}
		if (this.gutter.size) {
			const clazz = Array.from(this.gutter).join(' ');
			editor.addLineClass(this.id, 'gutter', clazz);
		}
		if (this.marker) {
			const [ name, item, handler ] = this.marker;
			item.addEventListener('click', handler);
			editor.setGutterMarker(this.id, name, item);
		}
		if (this.markup.length) {
			for (const markup of this.markup) {
				const [ charFrom, charTo, className ] = markup;
				const fromPos = { line: this.id };
				const toPos = { line: this.id };
				if (charFrom >= 0) {
					fromPos.ch = charFrom;
				}
				if (charTo >= 0) {
					toPos.ch = charTo;
				}
				this._clearMarkup.push(
					editor.markText(fromPos, toPos, { className }));
			}
		}
		this.rendered = true;
	}

	clear() {
		const { editor } = this;
		if (!this.rendered) {
			return;
		}

		if (this.background) {
			editor.removeLineClass(this.id, 'background');
		}
		if (this.gutter) {
			editor.removeLineClass(this.id, 'gutter');
		}
		if (this.marker) {
			const [ , item, handler ] = this.marker;
			// set with `null` to clear marker
			editor.setGutterMarker(this.id, name, null);
			item.removeEventListener('click', handler);
			item.remove();
		}
		if (this._clearMarkup.length) {
			for (const markup of this._clearMarkup) {
				markup.clear();
			}
			this._clearMarkup = [];
			this.markup = [];
		}
	}
}

function getExtents(side, change) {
	const oside = (side === 'lhs') ? 'rhs' : 'lhs';
	return {
		lf: change[`${side}-line-from`] >= 0 ? change[`${side}-line-from`] : 0,
		lt: change[`${side}-line-to`] >= 0 ? change[`${side}-line-to`] : 0,
		olf: change[`${oside}-line-from`] >= 0 ? change[`${oside}-line-from`] : 0,
		olt: change[`${oside}-line-to`] >= 0 ? change[`${oside}-line-to`] : 0
	};
}

module.exports = VDoc;
