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

	hasRendered(side, changeId) {
		return !!this._rendered[side][changeId];
	}

	addRender(side, change, changeId, { isCurrent, mergeButton, getMergeHandler }) {
		this.setRendered(side, changeId);
		const oside = (side === 'lhs') ? 'rhs' : 'lhs';
		const bgClass = [ 'mergely', side, change.op, `cid-${changeId}` ];
		const lf = change[`${side}-line-from`] >= 0 ? change[`${side}-line-from`] : 0;
		const lt = change[`${side}-line-to`] >= 0 ? change[`${side}-line-to`] : 0;
		const olf = change[`${oside}-line-from`] >= 0 ? change[`${oside}-line-from`] : 0;

		if (change[lf] < 0) {
			bgClass.push('empty');
		}
		this.getLine(side, lf).addLineClass('background', 'start');
		this.getLine(side, lt).addLineClass('background', 'end');

		if (isCurrent) {
			if (lf != lt) {
				this.getLine(side, lf).addLineClass('background', 'current');
			}
			this.getLine(side, lt).addLineClass('background', 'current');
			for (let j = lf; j <= lt; ++j) {
				this.getLine(side, j).addLineClass('gutter', 'mergely current');
			}
		}
		if (lf == 0 && lt == 0 && olf == 0) {
			this.getLine(side, lf).addLineClass('background', bgClass.join(' '));
			this.getLine(side, lf).addLineClass('background', 'first');
		} else {
			// apply change for each line in-between the changed lines
			for (let j = lf; j <= lt; ++j) {
				this.getLine(side, j).addLineClass('background', bgClass.join(' '));
			}
		}
		if (mergeButton) {
			mergeButton.className = `merge-button merge-${oside}-button`;
			const handler = getMergeHandler(change, side, oside);
			this.getLine(side, lf).addMergeButton('merge', mergeButton, handler);
		}
	}

	setRendered(side, changeId) {
		return this._rendered[side][changeId] = true;
	}

	getLine(side, id) {
		let line = this._lines[side][id];
		if (line) {
			return line;
		}
		line = new VLine(id);
		this._lines[side][id] = line;
		return line;
	}

	update(side, changeId, editor) {
		this.setRendered(side, changeId);
		const lines = Object.keys(this._lines[side]);
		for (let i = 0; i < lines.length; ++i) {
			const id = lines[i];
			const vline = this.getLine(side, id);
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

		// for (let i = 0; i < Object.keys(this._lines.lhs).length; ++i) {
		// 	this._lines.lhs[i].clear();
		// }
		// for (let i = 0; i < Object.keys(this._lines.rhs).length; ++i) {
		// 	this._lines.rhs[i].clear();
		// }
	}
}

class VLine {
	constructor(id) {
		this.id = id;
		this.background = new Set();
		this.gutter = new Set();
		this.marker = null;
		this.editor = null;
	}

	addLineClass(location, clazz) {
		this[location].add(clazz);
	}

	addMergeButton(name, item, handler) {
		this.marker = [ name, item, handler ];
	}

	update(editor) {
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
	}

	clear() {
		const { editor } = this;
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
	}
}

module.exports = VDoc;
