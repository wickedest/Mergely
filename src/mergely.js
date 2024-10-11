const CodeMirrorDiffView = require('./diff-view');
const { default: DiffWorker } = require('./diff.worker.js');
const diff = require('./diff');
const dom = require('./dom.js');

const trace = console.log;


const defaultOptions = {
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
	change_timeout: 50,
	bgcolor: '#eee',
	vpcolor: 'rgba(0, 0, 200, 0.5)',
	license: 'lgpl',
	cmsettings: {
		styleSelectedText: true,
		mode: null
	},
	lhs_cmsettings: {},
	rhs_cmsettings: {},
	lhs: null,
	rhs: null,
	_debug: false
};

class Mergely {
	constructor(selector, options) {
		let element = selector;
		if (typeof selector === 'string') {
			element = document.querySelector(selector);
			if (!element) {
				throw new Error(`Failed to find: ${selector}`);
			}
		} else if (typeof selector !== 'object') {
			throw new Error(`The 'selector' element must be a string or DOM element`);
		}

		const computedStyle = window.getComputedStyle(element);
		if (!element.style.height
			&& (!computedStyle.height || computedStyle.height === '0px')
		) {
			throw new Error(
				`The element "${selector}" requires an explicit height`);
		}

		this.el = element;
		this._initOptions = { ...options };
		this._setOptions(options);

		const view = new CodeMirrorDiffView(element, this._viewOptions);
		this._diffView = view;

		const exposedViewMethods = [
			'cm',
			'get',
			'lhs',
			'mergeCurrentChange',
			'resize',
			'rhs',
			'scrollTo',
			'scrollToDiff',
			'search',
			'unmarkup',
			'update'
		];
		for (const method of exposedViewMethods) {
			this[method] = view[method].bind(view);
		}
		this._listeners = [];
		this._addEventListener = element.addEventListener.bind(element);
		this._removeEventListener = element.removeEventListener.bind(element);

		// Add change listener for when the view needs a new diff
		this.on('changed', () => {
			const options = this._options;
			if (options._debug) {
				trace('event#changed got event');
			}
			this._stopWorker();

			// create worker
			const worker = new DiffWorker();
			this._diffWorker = worker;
			worker.onerror = (ev) => {
				console.error('Unexpected error with web worker', ev);
			}
			worker.onmessage = (ev) => {
				if (options._debug) {
					trace('event#changed worker finished');
				}
				this._changes = ev.data;
				view.setChanges(this._changes);
			}
			worker.postMessage({
				lhs: this.get('lhs'),
				rhs: this.get('rhs'),
				options: {
					ignoreaccents: options.ignoreaccents,
					ignorews: options.ignorews,
					ignorecase: options.ignorecase,
				}
			});
		});

		view.bind(this.el);
	}

	_setOptions(options) {
		if (this._options && this._options._debug) {
			trace('api#options');
		}
		const colors = dom.getColors(this.el);
		this._options = {
			...defaultOptions,//lgpl
			...(this._options || this._initOptions),
			...options//lgpl-separate-notice
		};
		this._viewOptions = {
			...this._options,
			_colors: colors
		};
	}

	_stopWorker() {
		if (!this._diffWorker) {
			return;
		}
		if (this._options._debug) {
			trace('event#changed terminating worker');
		}
		this._diffWorker.terminate();
		this._diffWorker = null;
	}

	unbind() {
		this._stopWorker();
		for (const [ event, listener ] of this._listeners) {
			this._removeEventListener(event, listener);
		}
		if (this._diffWorker) {
			this._diffWorker.terminate();
		}
		this._diffView.unbind();
		delete this._diffView;
	}

	/**
	 * @deprecated
	 */
	mergelyUnregister() {
	}

	on(event, handler) {
		this._listeners.push([ event, handler ]);
		this._addEventListener(event, handler);
	}

	once(event, handler) {
		this._listeners.push([ event, handler ]);
		this._addEventListener(event, handler, { once: true });
	}

	clear(side) {
		if (this._options._debug) {
			trace('api#clear', side);
		}
		if (side === 'lhs') {
			if (!this._diffView.readOnly('lhs')) {
				this._diffView.lhs('');
			}
		} else if (side === 'rhs') {
			if (!this._diffView.readOnly('rhs')) {
				this._diffView.rhs('');
			}
		}
	}

	diff() {
		if (this._options._debug) {
			trace('api#diff');
		}
		const lhs_text = this.get('lhs');
		const rhs_text = this.get('rhs');
		const comparison = new diff(lhs_text, rhs_text, {
			ignoreaccents: this._options.ignoreaccents,
			ignorews: this._options.ignorews,
			ignorecase: this._options.ignorecase
		});
		return comparison.normal_form();
	}

	merge(side) {
		if (this._options._debug) {
			trace('api#merge', side);
		}
		const lhs_text = this.get('lhs');
		const rhs_text = this.get('rhs');
		if (side === 'lhs' && !this._diffView.readOnly('lhs')) {
			this._diffView.lhs(rhs_text);
		} else if (!this._diffView.readOnly('rhs')) {
			this._diffView.rhs(lhs_text);
		}
	}

	options(opts) {
		if (opts) {
			this._setOptions(opts);
			this._diffView.setOptions(opts);
		}
		else {
			return this._options;
		}
	}

	summary() {
		if (this._options._debug) {
			trace('api#summary');
		}
		const lhs_text = this.get('lhs');
		const rhs_text = this.get('rhs');
		return {
			numChanges: this._changes.length,
			lhsLength: lhs_text.length,
			rhsLength: rhs_text.length,
			c: this._changes.filter(function (a) { return a.op === 'c'; }).length,
			a: this._changes.filter(function (a) { return a.op === 'a'; }).length,
			d: this._changes.filter(function (a) { return a.op === 'd'; }).length
		}
	}

	swap() {
		if (this._options._debug) {
			trace('api#swap');
		}
		if (this._diffView.readOnly()) {
			trace('api#swap readOnly');
			return;
		}
		const lhs_text = this.get('lhs');
		const rhs_text = this.get('rhs');
		this._diffView.lhs(rhs_text);
		this._diffView.rhs(lhs_text);
	}
}

window.Mergely = Mergely;

module.exports = Mergely;
