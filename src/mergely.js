const CodeMirrorDiffView = require('./diff-view');

class Mergely {
	constructor(element, options) {
		this._diffView = new CodeMirrorDiffView(element, options, {
			CodeMirror
		});
		this.el = element;
		const methods = [
			'clear',
			'cm',
			'diff',
			'get',
			'lhs',
			'merge',
			'mergeCurrentChange',
			'options',
			'remove',
			'resize',
			'rhs',
			'scrollTo',
			'scrollToDiff',
			'search',
			'summary',
			'swap',
			'unmarkup',
			'update'
		];
		for (const method of methods) {
			this[method] = this._diffView[method].bind(this._diffView);
		}
		this._listeners = [];
		this.addEventListener = element.addEventListener.bind(element);
		this.removeEventListener = element.removeEventListener.bind(element);
		// Use `setImmediate` so that clients have opportunity to bind event
		// handlers.
		// FIXME: webpack 5 has issue with `setImmediate`
		// setImmediate(() => this._diffView.bind(element));
		this._diffView.bind(element)
	}

	unbind() {
		for (const [ event, listener ] of this._listeners) {
			this.removeEventListener(event, listener);
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
		this.addEventListener(event, handler);
	}

	once(event, handler) {
		this._listeners.push([ event, handler ]);
		this.addEventListener(event, handler, { once: true });
	}

	/**
	 * @deprecated
	 * @param {*} method
	 * @param  {...any} options
	 */
	mergely(method, ...options) {
		this[method](...options);
	}

	remove() {

	}
}

window.Mergely = function (selector, options = {}) {
	let element = selector;
	if (typeof selector === 'string') {
		element = document.querySelector(selector);
		if (!element) {
			throw new Error(`Failed to find: ${selector}`);
		}
	} else if (!element) {
		throw new Error('Element cannot be null');
	}
	const mergely = new Mergely(element, options);
	return mergely;
};
