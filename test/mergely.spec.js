const simple = require('simple-mock');
require('codemirror')
require('../src/mergely');
const macbeth = require('./data/macbeth').join('\n');

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
	lhs_cmsettings: {},
	rhs_cmsettings: {},
	bgcolor: '#eee',
	vpcolor: 'rgba(0, 0, 200, 0.5)',
	license: 'lgpl',
	cmsettings: {
		styleSelectedText: true
	},
	_debug: false
};

describe('mergely', function () {
	let editor;
	let editorId = 0;
	function init(options) {
		editor = new window.Mergely(`#mergely-${editorId - 1}`, options);
		return editor;
	};

	beforeEach(() => {
		const div = document.createElement('div');
		div.id = `mergely-${editorId++}`;
		div.style.margin = '0px';
		div.style.height = '275px';
		document.querySelector('body').appendChild(div);
	});

	afterEach(() => {
		if (editor._diffView.settings._debug) {
			// debugging, skip teardown
			return;
		}
		editor && editor.unbind();
		simple.restore();
		editor.el.parentNode.removeChild(editor.el);
	});

	describe('initialization', () => {
		it('initializes without arguments', (done) => {
			const editor = init();
			expect(editor).to.exist;
			editor.once('updated', () => {
				try {
					const { children } = editor.el.children[0];
					const items = Array.from(children).map(a => a.className);
					// NOTE: if running karma debug, these tests can fail because
					// the debugger grabs the focus and the CodeMirror instance
					// loses `CodeMirror-focused`
					expect(items).to.deep.equal([
						'mergely-margin',
						'mergely-column',
						'CodeMirror cm-s-default CodeMirror-focused',
						'mergely-canvas',
						'mergely-column',
						'CodeMirror cm-s-default',
						'mergely-margin',
						'mergely-splash'
					]);
					expect(editor.get('lhs')).to.equal('');
					expect(editor.get('rhs')).to.equal('');
					done();
				} catch (ex) {
					done(ex);
				}
			});
		});

		it('initializes with static arguments for lhs/rhs text with function', function (done) {
			const editor = init({
				height: 100,
				license: 'lgpl-separate-notice',
				lhs: 'left-hand side text',
				rhs: 'right-hand side text'
			});
			expect(editor).to.exist;
			editor.once('updated', () => {
				try {
					const { children } = editor.el.children[0];
					const items = Array.from(children).map(a => a.className);
					// NOTE: if running karma debug, these tests can fail because
					// the debugger grabs the focus and the CodeMirror instance
					// loses `CodeMirror-focused`
					expect(items).to.deep.equal([
						'mergely-margin',
						'mergely-column',
						'CodeMirror cm-s-default CodeMirror-focused',
						'mergely-canvas',
						'mergely-column',
						'CodeMirror cm-s-default',
						'mergely-margin'
					]);
					expect(editor.get('lhs')).to.equal('left-hand side text');
					expect(editor.get('rhs')).to.equal('right-hand side text');
					done();
				} catch (ex) {
					done(ex);
				}
			});
		});

		it('initializes with static arguments for lhs/rhs text', function (done) {
			const editor = init({
				height: 100,
				license: 'lgpl-separate-notice',
				lhs: 'left-hand side text',
				rhs: 'right-hand side text'
			});
			expect(editor).to.exist;
			editor.once('updated', () => {
				try {
					const { children } = editor.el.children[0];
					const items = Array.from(children).map(a => a.className);
					// NOTE: if running karma debug, these tests can fail because
					// the debugger grabs the focus and the CodeMirror instance
					// loses `CodeMirror-focused`
					expect(items).to.deep.equal([
						'mergely-margin',
						'mergely-column',
						'CodeMirror cm-s-default CodeMirror-focused',
						'mergely-canvas',
						'mergely-column',
						'CodeMirror cm-s-default',
						'mergely-margin'
					]);
					expect(editor.get('lhs')).to.equal('left-hand side text');
					expect(editor.get('rhs')).to.equal('right-hand side text');
					done();
				} catch (ex) {
					done(ex);
				}
			});
		});

		it('initializes with no sidebar', function (done) {
			const editor = init({
				height: 100,
				license: 'lgpl-separate-notice',
				sidebar: false
			});
			expect(editor).to.exist;
			editor.once('updated', () => {
				try {
					const { children } = editor.el.children[0];
					const items = Array.from(children).map(a => a.className);
					// NOTE: if running karma debug, these tests can fail because
					// the debugger grabs the focus and the CodeMirror instance
					// loses `CodeMirror-focused`
					expect(items).to.deep.equal([
						'mergely-margin',
						'mergely-column',
						'CodeMirror cm-s-default CodeMirror-focused',
						'mergely-canvas',
						'mergely-column',
						'CodeMirror cm-s-default',
						'mergely-margin'
					]);
					expect(children[0].style.visibility).to.equal('hidden');
					expect(children[6].style.visibility).to.equal('hidden');
					done();
				} catch (ex) {
					done(ex);
				}
			});
		});

		it('initializes with options', function () {
			const initOptions = {
				fgcolor: {
					a: 'red',
					c: 'green',
					d: 'blue'
				},
				ignorews: true,
				ignorecase: true,
				ignoreaccents: true,
				resize_timeout: 99,
				change_timeout: 99,
				fadein: 'slow',
				height: '100px',
				width: '400px',
				cmsettings: {
					lineSeparator: '\n',
					readOnly: true
				},
				rhs_cmsettings: {
					readOnly: false
				}
			};
			const editor = init({ ...initOptions });
			const options = editor.options();
			expect(options).to.deep.include({
				...initOptions
			});
		});

		it('initializes with and set lhs/rhs on update', function (done) {
			const editor = init();
			expect(editor).to.exist;
			const test = () => {
				done();
			};
			editor.once('updated', () => {
				editor.on('updated', test);
				editor.lhs('left-hand side text');
				editor.rhs('right-hand side text');
			});
		});
	});

	describe('clear', () => {
		it('should clear lhs side', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue('left-hand side text'),
				rhs: (setValue) => setValue('right-hand side text')
			});
			const test = () => {
				try {
					expect(editor.get('lhs')).to.equal('');
					expect(editor.get('rhs')).to.equal('right-hand side text');
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', () => {
				editor.clear('lhs');
				test();
			});
		});

		it('should clear rhs side', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: 'left-hand side text',
				rhs: 'right-hand side text'
			});
			const test = () => {
				try {
					expect(editor.get('lhs')).to.equal('left-hand side text');
					expect(editor.get('rhs')).to.equal('');
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', () => {
				editor.clear('rhs');
				test();
			});
		});

	});

	describe('cm', () => {
		it('should get CodeMirror from lhs and rhs sides', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: 'left-hand 2 side text',
				rhs: 'right-hand 2 side text'
			});
			editor.once('updated', () => {
				const lcm = editor.cm('lhs');
				const rcm = editor.cm('rhs');
				expect(lcm).to.not.equal(rcm);
				expect(lcm.getValue()).to.equal('left-hand 2 side text');
				expect(rcm.getValue()).to.equal('right-hand 2 side text');
				done();
			});
		});
	});

	describe('get', () => {
		it('should get lhs and rhs text', function () {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: 'left-hand side text',
				rhs: 'right-hand side text'
			});
			editor.once('updated', () => {
				expect(editor.get('lhs')).to.equal('left-hand side text');
				expect(editor.get('rhs')).to.equal('right-hand side text');
			});
		});
	});

	describe('lhs', () => {
		it('should set lhs value', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: 'left-hand side text'
			});
			const test = () => {
				try {
					expect(editor.get('lhs')).to.equal('banana');
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', () => {
				expect(editor.get('lhs')).to.equal('left-hand side text');
				editor.lhs('banana');
				test();
			});
		});
	});

	describe('rhs', () => {
		it('should set rhs value', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				rhs: 'right-hand side text'
			});
			const test = () => {
				try {
					expect(editor.get('rhs')).to.equal('banana');
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', () => {
				expect(editor.get('rhs')).to.equal('right-hand side text');
				editor.rhs('banana');
				test();
			});
		});
	});

	describe('merge', () => {
		it('should merge lhs to rhs', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: 'left-hand side text',
				rhs: 'right-hand side text'
			});
			const test = () => {
				try {
					expect(editor.get('lhs')).to.equal('left-hand side text');
					expect(editor.get('rhs')).to.equal('left-hand side text');
					const diff = editor.diff();
					expect(diff).to.equal('');
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', () => {
				expect(editor.get('lhs')).to.equal('left-hand side text');
				expect(editor.get('rhs')).to.equal('right-hand side text');
				editor.merge('rhs');
				test();
			});
		});

		it('should merge rhs to lhs', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: 'left-hand side text',
				rhs: 'right-hand side text'
			});
			const test = () => {
				try {
					expect(editor.get('lhs')).to.equal('right-hand side text');
					expect(editor.get('rhs')).to.equal('right-hand side text');
					const diff = editor.diff();
					expect(diff).to.equal('');
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', () => {
				expect(editor.get('lhs')).to.equal('left-hand side text');
				expect(editor.get('rhs')).to.equal('right-hand side text');
				editor.merge('lhs');
				test();
			});
		});
	});

	describe('options', () => {
		it('should have default options', function (done) {
			const editor = init();
			const test = () => {
				try {
					const currentOptions = editor.options();
					expect(currentOptions).to.deep.equal({
						...defaultOptions,
						lhs: currentOptions.lhs,
						rhs: currentOptions.rhs
					});
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', () => {
				currentOptions = editor.options();
				editor.once('updated', test);
				editor.options({});
				test();
			});
		});

		it('should not change any options if set with empty object', function (done) {
			let currentOptions;
			const editor = init({
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: 'left-hand side text',
				rhs: 'right-hand side text'
			});
			const test = () => {
				try {
					const newOptions = editor.options();
					expect(currentOptions).to.deep.equal(newOptions);
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', () => {
				currentOptions = editor.options();
				editor.once('updated', test);
				editor.options({});
				test();
			});
		});

		it('should change options', function (done) {
			let currentOptions;
			const editor = init({
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: 'left-hand side text',
				rhs: 'right-hand side text'
			});
			const changes = {
				autoresize: false,
				fadein: 'slow',
				ignorews: true,
				ignorecase: true,
				ignoreaccents: true,
				viewport: true,
				wrap_lines: true,
				sidebar: false,
				line_numbers: false
			};
			const test = () => {
				try {
					const newOptions = editor.options();
					expect(newOptions).to.deep.equal({
						...currentOptions,
						...changes
					});
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', () => {
				currentOptions = editor.options();
				editor.once('updated', test);
				editor.options(changes);
				test();
			});
		});

		it('should ignore white-space', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				ignorews: true,
				lhs: '\tthis is  text',
				rhs: 'this\tis\ttext\t\t'
			});
			editor.once('updated', () => {
				try {
					expect(editor.diff()).to.equal('');
					expect(editor.el.querySelectorAll('.mergely.rhs.c')).to.have.length(0);
					expect(editor.el.querySelectorAll('.mergely.lhs.c')).to.have.length(0);
					done();
				} catch (ex) {
					done(ex);
				}
			});
		});

		it('should ignore case', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				ignorecase: true,
				lhs: 'thIS IS text',
				rhs: 'this is text'
			});
			editor.once('updated', () => {
				try {
					expect(editor.diff()).to.equal('');
					expect(editor.el.querySelectorAll('.mergely.rhs.c')).to.have.length(0);
					expect(editor.el.querySelectorAll('.mergely.lhs.c')).to.have.length(0);
					done();
				} catch (ex) {
					done(ex);
				}
			});
		});

		it('should ignore accented characters', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				ignoreaccents: true,
				lhs: 'comunicação',
				rhs: 'comunicacao'
			});
			editor.once('updated', () => {
				try {
					expect(editor.diff()).to.equal('');
					expect(editor.el.querySelectorAll('.mergely.rhs.c')).to.have.length(0);
					expect(editor.el.querySelectorAll('.mergely.lhs.c')).to.have.length(0);
					done();
				} catch (ex) {
					done(ex);
				}
			});
		});

		it('should ignore white-space, case, and accented characters', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				ignorews: true,
				ignoreaccents: true,
				ignorecase: true,
				lhs: 'This is Comunicação',
				rhs: '\t\tthis\tis\tcomunicacao'
			});
			editor.once('updated', () => {
				try {
					expect(editor.diff()).to.equal('');
					expect(editor.el.querySelectorAll('.mergely.rhs.c')).to.have.length(0);
					expect(editor.el.querySelectorAll('.mergely.lhs.c')).to.have.length(0);
					done();
				} catch (ex) {
					done(ex);
				}
			});
		});
	});

	describe('resize', () => {
		it('should trigger update on resize', function (done) {
			const loaded = simple.stub();
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				loaded
			});
			editor.once('updated', () => {
				editor.once('updated', () => {
					done();
				});
				editor.resize();
			});
		});
	});

	describe('scrollTo', () => {
		it('should scroll to line when not in view', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: macbeth,
				rhs: macbeth.replace(/place/g, 'space')
			});
			const test = () => {
				try {
					const {
						_isChangeInView: isVisible,
						_getViewportSide: getViewport,
						changes
					} = editor._diffView;
					let vp = getViewport.call(editor._diffView, 'lhs');
					expect(vp).to.deep.equal({ from: 0, to: 15 });
					const change = changes[4];
					expect(isVisible('lhs', vp, change)).to.be.false;
					expect(isVisible('rhs', vp, change)).to.be.false;
					editor.once('updated', () => {
						try {
							vp = getViewport.call(editor._diffView, 'lhs');
							expect(vp).to.deep.equal({ from: 687, to: 703 });
							expect(isVisible('lhs', vp, change)).to.be.true;
							expect(isVisible('rhs', vp, change)).to.be.true;
							done();
						} catch (ex) {
							done(ex);
						}
					});
					editor.scrollTo('lhs', 696);
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', () => {
				expect(editor.diff()).to.include('696c696');
				test();
			});
		});
	});

	describe('scrollToDiff', () => {
		it('should scroll next 4 times and scroll into view', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: macbeth,
				rhs: macbeth.replace(/place/g, 'space')
			});
			let count = 0;
			const test = () => {
				count += 1;
				if (count <= 4) {
					editor.scrollToDiff('next');
					return;
				}
				try {
					const {
						_isChangeInView: isVisible,
						_getViewportSide: getViewport,
						changes
					} = editor._diffView;
					const change = changes[3];
					vp = getViewport.call(editor._diffView, 'lhs');
					expect(vp).to.deep.equal({ from: 673, to: 689 });
					expect(isVisible('lhs', vp, change)).to.be.true;
					expect(isVisible('rhs', vp, change)).to.be.true;
					done();
				} catch (ex) {
					done(ex);
				}
			};
			// intentional `editor.on`
			editor.on('updated', () => {
				expect(editor.diff()).to.include('696c696');
				test();
			});
		});
	});

	describe('search', () => {
		it('should search and scroll to match', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: macbeth,
				rhs: macbeth.replace(/place/g, 'space')
			});
			let count = 0;
			const test = () => {
				try {
					const {
						_isChangeInView: isVisible,
						_getViewportSide: getViewport,
						changes
					} = editor._diffView;
					const change = changes[4];

					const vp = getViewport.call(editor._diffView, 'lhs');
					expect(vp).to.deep.equal({ from: 325, to: 340 });
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', () => {
				editor.search('lhs', 'knock');
				test();
			});
		});
	});

	describe('swap', () => {
		it('should swap sides', (done) => {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: 'left-hand side text',
				rhs: 'right-hand side text'
			});
			const test = () => {
				try {
					expect(editor.get('lhs')).to.equal('right-hand side text');
					expect(editor.get('rhs')).to.equal('left-hand side text');
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', () => {
				editor.once('updated', test);
				editor.swap();
			});
		});
	});

	describe('summary', () => {
		it('should return empty', (done) => {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice'
			});
			const test = () => {
				try {
					const summary = editor.summary();
					expect(summary).to.deep.equal({
						numChanges: 0,
						lhsLength: 0,
						rhsLength: 0,
						c: 0,
						a: 0,
						d: 0
					});
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', test);
		});

		it('should return changes', (done) => {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: 'a\n\nb\nc\nd',
				rhs: 'aa\n\nd'
			});
			const test = () => {
				try {
					const summary = editor.summary();
					expect(summary).to.deep.equal({
						numChanges: 2,
						lhsLength: 8,
						rhsLength: 5,
						c: 1,
						a: 0,
						d: 1
					});
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', test);
		});
	});

	describe('unmarkup', () => {
		it('should remove markup', (done) => {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: 'left-hand side text',
				rhs: 'right-hand side text'
			});
			const test = () => {
				try {
					const found = document.querySelector('.mergely.ch.ind.lhs');
					expect(found).to.be.null;
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', () => {
				try {
					const found = document.querySelector('.mergely.ch.ind.lhs');
					expect(found).to.not.be.null;
				} catch (ex) {
					return done(ex);
				}
				editor.once('updated', test);
				editor.unmarkup();
			});
		});
	});

	describe('update', () => {
		it('should trigger update on options', (done) => {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: 'left-hand side text',
				rhs: 'right-hand side text'
			});
			editor.once('updated', () => {
				editor.once('updated', () => done());
				editor.options({ wrap_lines: false });
			});
		});

		it('should trigger update on lhs/rhs change', (done) => {
			const editor = init({
				lhs: 'left-hand side text',
				rhs: 'right-hand side text'
			});
			editor.once('updated', () => {
				editor.once('updated', () => done());
				editor.lhs('lhs text');
				editor.rhs('rhs text');
			});
		});

		it('should trigger update on scroll', (done) => {
			const editor = init({
				lhs: macbeth,
				rhs: macbeth.replace(/place/g, 'space')
			});
			editor.once('updated', () => {
				editor.once('updated', () => done());
				editor.scrollTo('lhs', 696);
			});
		});
	});

	describe('_isChangeInView', () => {
		it('should be false when change less-than viewport', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				viewport: true,
				license: 'lgpl-separate-notice',
				lhs: macbeth,
				rhs: macbeth
			});
			const test = () => {
				try {
					const { _isChangeInView: isVisible } = editor._diffView;
					expect(isVisible('lhs', {from: 10, to: 20}, {
						'lhs-line-from': 0,
						'lhs-line-to': 9
					})).to.be.false;
					done();
				} catch (ex) {
					done(ex);
				}
			}
			editor.once('updated', test);
		});

		it('should be true when change less-than-equal viewport', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				viewport: true,
				license: 'lgpl-separate-notice',
				lhs: macbeth,
				rhs: macbeth
			});
			const test = () => {
				try {
					const { _isChangeInView: isVisible } = editor._diffView;
					expect(isVisible('lhs', {from: 10, to: 20}, {
						'lhs-line-from': 0,
						'lhs-line-to': 10
					})).to.be.true;
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', test);
		});

		it('should be false when change greater-than viewport', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				viewport: true,
				license: 'lgpl-separate-notice',
				lhs: macbeth,
				rhs: macbeth
			});
			const test = () => {
				try {
					const { _isChangeInView: isVisible } = editor._diffView;
					expect(isVisible('lhs', {from: 10, to: 20}, {
						'lhs-line-from': 21,
						'lhs-line-to': 22
					})).to.be.false;
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', test);
		});

		it('should be true when change straddles viewport from', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				viewport: true,
				license: 'lgpl-separate-notice',
				lhs: macbeth,
				rhs: macbeth
			});
			const test = () => {
				try {
					const { _isChangeInView: isVisible } = editor._diffView;
					expect(isVisible('lhs', {from: 10, to: 20}, {
						'lhs-line-from': 5,
						'lhs-line-to': 11
					})).to.be.true;
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', test);
		});

		it('should be true when change straddles viewport to', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				viewport: true,
				license: 'lgpl-separate-notice',
				lhs: macbeth,
				rhs: macbeth
			});
			const test = () => {
				try {
					const { _isChangeInView: isVisible } = editor._diffView;
					expect(isVisible('lhs', {from: 10, to: 20}, {
						'lhs-line-from': 15,
						'lhs-line-to': 21
					})).to.be.true;
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', test);
		});

		it('should be true when change encompasses viewport', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				viewport: true,
				license: 'lgpl-separate-notice',
				lhs: macbeth,
				rhs: macbeth
			});
			const test = () => {
				try {
					const { _isChangeInView: isVisible } = editor._diffView;
					expect(isVisible('lhs', {from: 10, to: 20}, {
						'lhs-line-from': 0,
						'lhs-line-to': 25
					})).to.be.true;
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', test);
		});
	});

	describe('security', () => {
		it('should not be vulnerable to XSS', function (done) {
			const xss = '<script id="injected">alert("omg - xss");</script>';
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: xss,
				rhs: ''
			});
			editor.once('updated', () => {
				// the value is as expected
				expect(editor.get('lhs')).to.equal(xss);
				// yet, shouldn't find injected script in DOM
				const found = document.querySelector('#injected');
				done(found !== null);
			});
		});
	});
});
