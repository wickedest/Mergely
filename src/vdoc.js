const diff = require('./diff');

const trace = console.log;

class VDoc {
	constructor(options) {
		this.options = options;
		this._lines = {
			lhs: {},
			rhs: {}
		};
		this._rendered = {
			lhs: {},
			rhs: {}
		};
	}

	addRender(side, change, changeId, options) {
		if (this.options._debug) {
			trace('vdoc#addRender', side, changeId, change);
		}
		const {
			isCurrent,
			lineDiff,
			mergeButton,
			getMergeHandler
		} = options;

		const alreadyRendered = !!this._rendered[side][changeId];

		if (alreadyRendered) {
			if (this.options._debug) {
				trace('vdoc#addRender (already rendered)', side, changeId, change);
			}
			return;
		}

		const oside = (side === 'lhs') ? 'rhs' : 'lhs';
		const bgClass = [ 'mergely', side, `cid-${changeId}` ];
		const { lf, lt, olf } = getExtents(side, change);

		if (isCurrent) {
			if (lf !== lt) {
				this._getLine(side, lf).addLineClass('background', 'current');
			}
			this._getLine(side, lt).addLineClass('background', 'current');
			for (let j = lf; j <= lt; ++j) {
				this._getLine(side, j).addLineClass('gutter', 'mergely current');
			}
		}

		const bgChangeOp = {
			lhs: {
				d: 'd',
				a: 'd',
				c: 'c'
			},
			rhs: {
				d: 'a',
				a: 'a',
				c: 'c'
			}
		}[ side ][ change.op ];


		if (lf < 0) {
			// If this is the first, line it has start but no end
			bgClass.push('start');
			bgClass.push('no-end');
			bgClass.push(bgChangeOp);
			this._getLine(side, 0).addLineClass('background', bgClass.join(' '));
			this._setRenderedChange(side, changeId);
			return;
		}
		if (side === 'lhs' && change['lhs-y-start'] === change['lhs-y-end']) {
			// if lhs, and start/end are the same, it has end but no-start
			bgClass.push('no-start');
			bgClass.push('end');
			bgClass.push(bgChangeOp);
			this._getLine(side, lf).addLineClass('background', bgClass.join(' '));
			this._setRenderedChange(side, changeId);
			return;
		}
		if (side === 'rhs' && change['rhs-y-start'] === change['rhs-y-end']) {
			// if rhs, and start/end are the same, it has end but no-start
			bgClass.push('no-start');
			bgClass.push('end');
			bgClass.push(bgChangeOp);
			this._getLine(side, lf).addLineClass('background', bgClass.join(' '));
			this._setRenderedChange(side, changeId);
			return;
		}

		this._getLine(side, lf).addLineClass('background', 'start');
		this._getLine(side, lt).addLineClass('background', 'end');

		for (let j = lf, k = olf; lf !== -1 && lt !== -1 && j <= lt; ++j, ++k) {
			this._getLine(side, j).addLineClass('background', bgChangeOp);
			this._getLine(side, j).addLineClass('background', bgClass.join(' '));

			if (!lineDiff) {
				// inner line diffs are disabled, skip the rest
				continue;
			}

			if (side === 'lhs' && (change.op === 'd')) {
				// mark entire line text with deleted (strikeout) if the
				// change is a delete, or if it is changed text and the
				// line goes past the end of the other side.
				this._getLine(side, j).markText(0, undefined, `mergely ch d lhs cid-${changeId}`);
			} else if (side === 'rhs' && (change.op === 'a')) {
				// mark entire line text with added if the change is an
				// add, or if it is changed text and the line goes past the
				// end of the other side.
				this._getLine(side, j).markText(0, undefined, `mergely ch a rhs cid-${changeId}`);
			}
		}

		if (mergeButton) {
			mergeButton.className = `merge-button merge-${oside}-button`;
			const handler = getMergeHandler(change, side, oside);
			this._getLine(side, lf).addMergeButton('merge', mergeButton, handler);
		}
		this._setRenderedChange(side, changeId);
	}

	addInlineDiff(change, changeId, { getText, ignorews, ignoreaccents, ignorecase }) {
		if (this.options._debug) {
			trace('vdoc#addInlineDiff', changeId, change);
		}
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

				const alreadyRendered
					= !!this._getLine('lhs', j).markup.length
					|| !!this._getLine('rhs', k).markup.length
				if (alreadyRendered) {
					continue;
				}

				const results = new diff(lhsText, rhsText, {
					ignoreaccents,
					ignorews,
					ignorecase,
					split: 'chars'
				});
				for (const change of results.changes()) {
					const {
						lhs_start,
						lhs_deleted_count,
						rhs_start,
						rhs_inserted_count
					} = change;
					const lhs_to = lhs_start + lhs_deleted_count;
					const rhs_to = rhs_start + rhs_inserted_count;
					const lhs_line = vdoc._getLine('lhs', j);
					lhs_line.markText(lhs_start, lhs_to, `mergely ch ind lhs cid-${changeId}`);
					const rhs_line = vdoc._getLine('rhs', k);
					rhs_line.markText(rhs_start, rhs_to, `mergely ch ina rhs cid-${changeId}`);
				}
			} else if (k > olt) {
				// lhs has exceeded the max lines in the rhs editor, remainder are deleted
				const line = vdoc._getLine('lhs', j);
				line.markText(0, undefined, `mergely ch ind lhs cid-${changeId}`);
			} else if (j > lt) {
				// rhs has exceeded the max lines in the lhs editor, remainder are added
				const line = vdoc._getLine('rhs', k);
				line.markText(0, undefined, `mergely ch ina rhs cid-${changeId}`);
			}
		}
	}

	_setRenderedChange(side, changeId) {
		if (this.options._debug) {
			trace('vdoc#_setRenderedChange', side, changeId);
		}
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

	update(side, editor, viewport) {
		if (this.options._debug) {
			trace('vdoc#update', side, editor, viewport);
		}
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
		if (this.options._debug) {
			trace('vdoc#clear');
		}
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
		editor.operation(() => {
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
		});
		this.rendered = true;
	}

	clear() {
		const { editor } = this;
		if (!this.rendered) {
			return;
		}

		editor.operation(() => {
			if (this.background) {
				editor.removeLineClass(this.id, 'background');
			}
			if (this.gutter) {
				editor.removeLineClass(this.id, 'gutter');
			}
			if (this.marker) {
				const [ name, item, handler ] = this.marker;
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
		});
	}
}

function getExtents(side, change) {
	const oside = (side === 'lhs') ? 'rhs' : 'lhs';
	return {
		lf: change[`${side}-line-from`],
		lt: change[`${side}-line-to`],
		olf: change[`${oside}-line-from`],
		olt: change[`${oside}-line-to`]
	};
}

module.exports = VDoc;
