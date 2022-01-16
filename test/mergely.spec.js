const CodeMirror = require('CodeMirror');
const simple = require('simple-mock');
const Mergely = require('../src/mergely');
const macbeth = require('./data/macbeth').join('\n');

const defaultOptions = {
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
	ignoreaccents: false,
	fadein: 'fast',
	resize_timeout: 500,
	change_timeout: 150,
	fgcolor: {
		a: '#4ba3fa',
		c: '#a3a3a3',
		d: '#ff7f7f',
		ca: '#4b73ff',
		cc: '#434343',
		cd: '#ff4f4f'
	},
	bgcolor: '#eee',
	vpcolor: 'rgba(0, 0, 200, 0.5)',
	license: '',
	width: 'auto',
	height: 'auto',
	cmsettings: {
		styleSelectedText: true
	}
};

describe('mergely', function () {
	let editor;
	function init(options) {
		const div = document.createElement('div');
		div.id = 'mergely';
		div.style.margin = '0px';
		document.querySelector('body').appendChild(div);
		editor = new window.Mergely('#mergely', options);
		return editor;
	};

	afterEach(() => {
		editor.remove();
		simple.restore();
	});

	describe('initialization', () => {
		it('initializes without arguments', () => {
			const editor = init({
				height: 100,
				license: 'lgpl-separate-notice'
			});
			expect(editor).to.exist;
			const { children } = editor.el;
			expect(children.length).to.equal(5);
			expect(children[0].className).to.equal('mergely-margin');
			expect(children[1].className).to.equal('mergely-column');
			expect(children[2].className).to.equal('mergely-canvas');
			expect(children[3].className).to.equal('mergely-column');
			expect(children[4].className).to.equal('mergely-margin');
			expect(editor.get('lhs')).to.equal('');
			expect(editor.get('rhs')).to.equal('');
		});

		it('initializes with static arguments for lhs/rhs text', function () {
			const editor = init({
				height: 100,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue('left-hand side text'),
				rhs: (setValue) => setValue('right-hand side text')
			});
			expect(editor).to.exist;
			const { children } = editor.el;
			expect(children.length).to.equal(5);
			expect(children[0].className).to.equal('mergely-margin');
			expect(children[1].className).to.equal('mergely-column');
			expect(children[2].className).to.equal('mergely-canvas');
			expect(children[3].className).to.equal('mergely-column');
			expect(children[4].className).to.equal('mergely-margin');
			expect(editor.get('lhs')).to.equal('left-hand side text');
			expect(editor.get('rhs')).to.equal('right-hand side text');
		});

		it('initializes with no sidebar', function () {
			const editor = init({
				height: 100,
				license: 'lgpl-separate-notice',
				sidebar: false
			});
			expect(editor).to.exist;
			const { children } = editor.el;
			expect(children.length).to.equal(5);
			expect(children[0].className).to.equal('mergely-margin');
			expect(children[0].style.visibility).to.equal('hidden');
			expect(children[1].className).to.equal('mergely-column');
			expect(children[2].className).to.equal('mergely-canvas');
			expect(children[3].className).to.equal('mergely-column');
			expect(children[4].className).to.equal('mergely-margin');
			expect(children[4].style.visibility).to.equal('hidden');
		});

		it('initializes with default options', function () {
			const editor = init();
			const options = editor.options();
			expect(options).to.deep.include({
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
				ignoreaccents: false,
				fadein: 'fast',
				resize_timeout: 500,
				change_timeout: 150,
				fgcolor: {
					a: '#4ba3fa',
					c: '#a3a3a3',
					d: '#ff7f7f',
					ca: '#4b73ff',
					cc: '#434343',
					cd: '#ff4f4f'
				},
				bgcolor: '#eee',
				vpcolor: 'rgba(0, 0, 200, 0.5)',
				license: 'lgpl',
				width: 'auto',
				height: 'auto',
				cmsettings: {
					styleSelectedText: true
				},
				lhs_cmsettings: {},
				rhs_cmsettings: {}
			});
			expect(options.lhs).to.be.a('function');
			expect(options.rhs).to.be.a('function');
			expect(options.loaded).to.be.a('function');
			expect(options.resize).to.be.a('function');
			expect(options.resized).to.be.a('function');
		});

		it('initializes with options', function () {
			const initOptions = {
				autoupdate: false,
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
	});

	describe('clear', () => {
		it.only('should clear lhs and rhs sides', function (done) {
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
					expect(editor.get('rhs')).to.equal('');
					const diff = editor.diff();
					expect(diff).to.equal('');
					done();
				} catch (ex) {
					done(ex);
				}
			};
			console.log('here-1');
			editor.el.addEventListener('updated', test, { once: true });
			console.log('here-2');
			expect(editor.get('lhs')).to.equal('left-hand side text');
			console.log('here-3');
			expect(editor.get('rhs')).to.equal('right-hand side text');
			console.log('here-4');
			editor.clear('lhs');
			console.log('here-5');
			editor.clear('rhs');
		});
	});

	describe('cm', () => {
		it('should get CodeMirror from lhs and rhs sides', function () {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue('left-hand side text'),
				rhs: (setValue) => setValue('right-hand side text')
			});
			const lcm = editor.cm('lhs');
			const rcm = editor.cm('rhs');
			expect(lcm).to.not.equal(rcm);
			expect(lcm.getValue()).to.equal('left-hand side text');
			expect(rcm.getValue()).to.equal('right-hand side text');
		});
	});

	describe('get', () => {
		it('should get lhs and rhs text', function () {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue('left-hand side text'),
				rhs: (setValue) => setValue('right-hand side text')
			});
			expect(editor.get('lhs')).to.equal('left-hand side text');
			expect(editor.get('rhs')).to.equal('right-hand side text');
		});
	});

	describe('lhs', () => {
		it('should set lhs value', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue('left-hand side text')
			});
			const test = () => {
				try {
					expect(editor.get('lhs')).to.equal('banana');
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.el.addEventListener('updated', test, { once: true });
			expect(editor.get('lhs')).to.equal('left-hand side text');
			editor.lhs('banana');
		});
	});

	describe('rhs', () => {
		it('should set rhs value', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				rhs: (setValue) => setValue('right-hand side text')
			});
			const test = () => {
				try {
					expect(editor.get('lhs')).to.equal('banana');
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.el.addEventListener('updated', test, { once: true });
			expect(editor.get('rhs')).to.equal('right-hand side text');
			editor.lhs('banana');
		});
	});

	describe('merge', () => {
		it('should merge lhs to rhs', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue('left-hand side text'),
				rhs: (setValue) => setValue('right-hand side text')
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
			editor.el.addEventListener('updated', test, { once: true });
			expect(editor.get('lhs')).to.equal('left-hand side text');
			expect(editor.get('rhs')).to.equal('right-hand side text');
			editor.merge('rhs');
		});

		it('should merge rhs to lhs', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue('left-hand side text'),
				rhs: (setValue) => setValue('right-hand side text')
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
			editor.el.addEventListener('updated', test, { once: true });
			expect(editor.get('lhs')).to.equal('left-hand side text');
			expect(editor.get('rhs')).to.equal('right-hand side text');
			editor.merge('lhs');
		});
	});

	describe('mergeCurrentChange', () => {
		const opts = [{ // add 0-7 merge lhs
			lhs: '',
			rhs: '\na',
			dir: 'lhs',
			name: 'add is line 2 and insert into end of empty lhs'
		},
		{
			lhs: '',
			rhs: 'a\n',
			dir: 'lhs',
			name: 'add is line 1 and insert into end of empty lhs'
		},
		{
			lhs: 'a',
			rhs: 'a\nb',
			dir: 'lhs',
			name: 'add is line 2 and insert into end to existing lhs'
		},
		{
			lhs: 'a',
			rhs: 'a\nbcd',
			dir: 'lhs',
			name: 'add is line 2 of length 3 and insert into end of existing lhs'
		},
		{
			lhs: 'a',
			rhs: 'a\nb\nc\nd',
			dir: 'lhs',
			name: 'add is lines 2-4 and insert into end of existing lhs'
		},
		{
			lhs: '',
			rhs: '\nabcd',
			dir: 'lhs',
			name: 'add is line 2 of length 4 and lhs is empty'
		},
		{
			lhs: 'abcd',
			rhs: '\nabcd',
			dir: 'lhs',
			name: 'add is line 1 cr and insert into front of lhs'
		},
		{
			lhs: 'a\nd',
			rhs: 'a\nb\nc\nd',
			dir: 'lhs',
			name: 'add is lines 2-3 and insert into middle of lhs'
		},
		// add 8-15 merge rhs
		{
			lhs: '',
			rhs: '\na',
			dir: 'rhs',
			name: 'add is line 2 and empty lhs will replace non-empty rhs'
		},
		{
			lhs: '',
			rhs: 'a\n',
			dir: 'rhs',
			name: 'add is line 1 and empty lhs will replace line 1 of rhs'
		},
		{
			lhs: 'a',
			rhs: 'a\nb',
			dir: 'rhs',
			name: 'add is line 2 and empty end lhs will replace line 2 of rhs'
		},
		{
			lhs: 'a',
			rhs: 'a\nbcd',
			dir: 'rhs',
			name: 'add is line 2 of length 3 and empty end lhs will replace line 2 of rhs'
		},
		{
			lhs: 'a',
			rhs: 'a\nb\nc\nd',
			dir: 'rhs',
			name: 'add is lines 2-4 and empty end lhs will replace last 3 lines of rhs'
		},
		{
			lhs: '',
			rhs: '\nabcd',
			dir: 'rhs',
			name: 'add is line 2 of length 4 and empty lhs will replace last line of rhs'
		},
		{
			lhs: 'abcd',
			rhs: '\nabcd',
			dir: 'rhs',
			name: 'add is line 1 cr and empty front will replace first line of rhs'
		},
		{
			lhs: 'a\nd',
			rhs: 'a\nb\nc\nd',
			dir: 'rhs',
			name: 'add is lines 2-3 and empty middle will replace middle two lines of rhs'
		},
		// change 16-21 merge lhs
		{
			lhs: 'a',
			rhs: '',
			dir: 'lhs',
			name: 'change is line 1 and will replace empty rhs'
		},
		{
			lhs: 'a\nb\nc',
			rhs: '',
			dir: 'lhs',
			name: 'change is lines 1-3 and will replace empty rhs'
		},
		{
			lhs: 'a',
			rhs: 'b',
			dir: 'lhs',
			name: 'change is line 1 and will replace opposite line 1'
		},
		{
			lhs: 'a\nb',
			rhs: 'c\nd',
			dir: 'lhs',
			name: 'change is lines 2 and will replace opposite line 2'
		},
		{
			lhs: 'a\nbc\nef',
			rhs: 'a\nbcd\nef',
			dir: 'lhs',
			name: 'change is middle line 2 and will replace opposite middle line 2'
		},
		{
			lhs: 'a\nb\n\n',
			rhs: 'a1\nb1\nc1\nd',
			dir: 'lhs',
			name: 'change is all lines 1-3 and will replace opposite all lines 1-4'
		},
		// change 22-27 merge rhs
		{
			lhs: 'a',
			rhs: '',
			dir: 'rhs',
			name: 'change is line 1 and will empty the rhs'
		},
		{
			lhs: 'a\nb\nc',
			rhs: '',
			dir: 'rhs',
			name: 'change is lines 1-3 and will replace empty rhs'
		},
		{
			lhs: 'a',
			rhs: 'b',
			dir: 'rhs',
			name: 'change is line 1 and will replace opposite rhs line 1'
		},
		{
			lhs: 'a\nb',
			rhs: 'c\nd',
			dir: 'rhs',
			name: 'change is lines 2 and will replace opposite rhs line 2'
		},
		{
			lhs: 'a\nbc\nef',
			rhs: 'a\nbcd\nef',
			dir: 'rhs',
			name: 'change is middle line 2 and will replace opposite rhs middle line 2'
		},
		{
			lhs: 'a\nb\n\n',
			rhs: 'a1\nb1\nc1\nd',
			dir: 'rhs',
			name: 'change is all lines 1-3 and will replace opposite rhs all lines 1-4'
		},
		// delete 28-35 merge lhs
		{
			lhs: '\na',
			rhs: '',
			dir: 'lhs',
			name: 'delete is line 2 and will merge empty rhs'
		},
		{
			lhs: 'a\n',
			rhs: '',
			dir: 'lhs',
			name: 'delete is line 1 and will merge empty rhs leaving cr on line 2'
		},
		{
			lhs: 'a\nb',
			rhs: 'a',
			dir: 'lhs',
			name: 'delete is line 2 and will merge into end to existing rhs'
		},
		{
			lhs: 'a\nbcd',
			rhs: 'a',
			dir: 'lhs',
			name: 'delete is line 2 of length 3 and insert into end of existing rhs'
		},
		{
			lhs: 'a\nb\nc\nd',
			rhs: 'a',
			dir: 'lhs',
			name: 'delete is lines 2-4 and insert into end of existing rhs'
		},
		{
			lhs: '\nabcd',
			rhs: '',
			dir: 'lhs',
			name: 'delete is line 2 of length 4 and insert into end of empty rhs'
		},
		{
			lhs: '\nabcd',
			rhs: 'abcd',
			dir: 'lhs',
			name: 'delete is line 1 cr and insert into front of rhs'
		},
		{
			lhs: 'a\nb\nc\nd',
			rhs: 'a\nd',
			dir: 'lhs',
			name: 'delete is lines 2-3 and insert into middle of rhs'
		},
		{
			lhs: 'a\nb\nc',
			rhs: 'a\nb\nx\nc',
			dir: 'lhs',
			name: 'delete line 3 of length 1 of rhs and will be replaced with empty line 2 of lhs'
		},
		// delete 36-43 merge rhs
		{
			lhs: '\na',
			rhs: '',
			dir: 'rhs',
			name: 'delete is line 2 and will merge empty rhs'
		},
		{
			lhs: 'a\n',
			rhs: '',
			dir: 'rhs',
			name: 'delete is line 1 and will merge empty rhs leaving cr on line 2'
		},
		{
			lhs: 'a\nb',
			rhs: 'a',
			dir: 'rhs',
			name: 'delete is line 2 and will merge into end to existing rhs'
		},
		{
			lhs: 'a\nbcd',
			rhs: 'a',
			dir: 'rhs',
			name: 'delete is line 2 of length 3 and insert into end of existing rhs'
		},
		{
			lhs: 'a\nb\nc\nd',
			rhs: 'a',
			dir: 'rhs',
			name: 'delete is lines 2-4 and insert into end of existing rhs'
		},
		{
			lhs: '\nabcd',
			rhs: '',
			dir: 'rhs',
			name: 'delete is line 2 of length 4 and insert into end of empty rhs'
		},
		{
			lhs: '\nabcd',
			rhs: 'abcd',
			dir: 'rhs',
			name: 'delete is line 1 cr and insert into front of rhs'
		},
		{
			lhs: 'a\nb\nc\nd',
			rhs: 'a\nd',
			dir: 'rhs',
			name: 'delete is lines 2-3 and insert into middle of rhs'
		},
		{
			lhs: 'a\nb\nc',
			rhs: 'a\nb\nx\nc',
			dir: 'rhs',
			name: 'merge rhs line 3 of length 1 and insert after line 2 of lhs'
		},
		{
			lhs: '\ngood',
			rhs: 'good',
			dir: 'rhs',
			name: 'lhs has deleted line at start'
		},
		{
			lhs: '\na\nb\nc\ngood',
			rhs: 'good',
			dir: 'rhs',
			name: 'lhs has multiple deleted lines at start'
		},
		{
			lhs: 'good\n',
			rhs: 'good',
			dir: 'rhs',
			name: 'lhs has deleted line at end (issue #115)'
		},
		{
			lhs: 'good\na\nb\nc',
			rhs: 'good',
			dir: 'rhs',
			name: 'lhs has multiple deleted lines at end (issue #115)'
		},
		{
			lhs: 'good',
			rhs: '\ngood',
			dir: 'lhs',
			name: 'rhs has added line at start'
		},
		{
			lhs: 'good',
			rhs: '\na\nb\nc\ngood',
			dir: 'lhs',
			name: 'rhs has multiple added lines at start'
		},
		{
			lhs: 'good',
			rhs: 'good\n',
			dir: 'lhs',
			name: 'rhs has added line at end'
		},
		{
			lhs: 'good',
			rhs: 'good\na\nb\nc',
			dir: 'lhs',
			name: 'rhs has multiple added lines at end'
		}];

		opts.forEach((opt, i) => {
			it(`merge-case-${i} should merge change to ${opt.dir} where ${opt.name}`, function (done) {
				const editor = init({
					height: 100,
					license: 'lgpl-separate-notice',
					change_timeout: 0,
					lhs: (setValue) => setValue(opt.lhs),
					rhs: (setValue) => setValue(opt.rhs),
				});
				const test = () => {
					try {
						expect(editor.get('lhs')).to.equal(opt.lhs);
						expect(editor.get('rhs')).to.equal(opt.rhs);
						expect(editor.el.querySelectorAll('.merge-button').length > 0)
							.to.be.true;
						done();
					} catch (ex) {
						done(ex);
					}
				};
				editor.el.addEventListener('updated', test, { once: true });
			});
		});
	});

	describe('options', () => {
		it('should not change any options if object empty', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue('left-hand side text'),
				rhs: (setValue) => setValue('right-hand side text')
			});
			const test = () => {
				try {
					const newOptions = editor.options();
					expect(defaultOptions).to.deep.equal(newOptions);
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.el.addEventListener('updated', test, { once: true });
			const defaultOptions = editor.options();
			editor.options({});
		});

		it('should change options', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue('left-hand side text'),
				rhs: (setValue) => setValue('right-hand side text')
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
						...defaultOptions,
						...changes
					});
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.el.addEventListener('updated', test, { once: true });
			const defaultOptions = editor.options();
			editor.options(changes);
		});

		it('should ignore white-space', function () {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				ignorews: true,
				lhs: (setValue) => setValue('\tthis is  text'),
				rhs: (setValue) => setValue('this\tis\ttext\t\t')
			});
			expect(editor.diff()).to.equal('');
		});

		it('should ignore case', function () {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				ignorecase: true,
				lhs: (setValue) => setValue('thIS IS text'),
				rhs: (setValue) => setValue('this is text')
			});
			expect(editor.diff()).to.equal('');
		});

		it('should ignore accented characters', function () {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				ignoreaccents: true,
				lhs: (setValue) => setValue('comunicação'),
				rhs: (setValue) => setValue('comunicacao')
			});
			expect(editor.diff()).to.equal('');
		});

		it('should ignore white-space, case, and accented characters', function () {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				ignorews: true,
				ignoreaccents: true,
				ignorecase: true,
				lhs: (setValue) => setValue('This is Comunicação'),
				rhs: (setValue) => setValue('\t\tthis\tis\tcomunicacao')
			});
			expect(editor.diff()).to.equal('');
		});
	});

	describe('resize', () => {
		it('should trigger resize', function (done) {
			const loaded = simple.stub();
			const resized = simple.stub();
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				loaded,
				resized
			});
			const test = () => {
				try {
					expect(loaded.calls).to.have.length(1);
					expect(resized.calls).to.have.length(3);
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.el.addEventListener('updated', test, { once: true });
			editor.resize();
		});
	});

	describe('scrollTo', () => {
		it('should scroll to line when not in view', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue(macbeth),
				rhs: (setValue) => setValue(macbeth.replace(/place/g, 'space'))
			});
			const test = () => {
				try {
					const {
						_is_change_in_view: isVisible,
						_get_viewport_side: getViewport,
						changes
					} = editor._diffView;
					let vp = getViewport.call(editor._diffView, 'lhs');
					expect(vp).to.deep.equal({ from: 0, to: 15 });
					const change = changes[4];
					expect(isVisible('lhs', vp, change)).to.be.false;
					expect(isVisible('rhs', vp, change)).to.be.false;
					editor.el.addEventListener('updated', () => {
						try {
							vp = getViewport.call(editor._diffView, 'lhs');
							expect(vp).to.deep.equal({ from: 680, to: 708 });
							expect(isVisible('lhs', vp, change)).to.be.true;
							expect(isVisible('rhs', vp, change)).to.be.true;
							done();
						} catch (ex) {
							done(ex);
						}
					}, { once: true });
					editor.scrollTo('lhs', 696);
				} catch (ex) {
					done(ex);
				}
			};
			expect(editor.diff()).to.include('696c696');
			editor.el.addEventListener('updated', test, { once: true });
		});
	});

	describe('scrollToDiff', () => {
		it('should scroll next to specific diff and scroll into view', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue(macbeth),
				rhs: (setValue) => setValue(macbeth.replace(/place/g, 'space'))
			});
			let count = 0;
			const test = () => {
				if (count < 4) {
					count += 1;
					editor.scrollToDiff('next');
					return;
				}
				try {
					const {
						_is_change_in_view: isVisible,
						_get_viewport_side: getViewport,
						changes
					} = editor._diffView;
					const change = changes[4];

					vp = getViewport.call(editor._diffView, 'lhs');
					expect(vp).to.deep.equal({ from: 666, to: 706 });
					expect(isVisible('lhs', vp, change)).to.be.true;
					expect(isVisible('rhs', vp, change)).to.be.true;
					done();
				} catch (ex) {
					done(ex);
				} finally {
					editor.el.removeEventListener(test);
				}
			};
			expect(editor.diff()).to.include('696c696');
			editor.el.addEventListener('updated', test);
		});
	});

	describe('search', () => {
		it('should search', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue(macbeth),
				rhs: (setValue) => setValue(macbeth.replace(/place/g, 'space'))
			});
			let count = 0;
			const test = () => {
				if (count < 2) {
					// init, scroll, search
					count += 1;
					if (count === 2) {
						editor.search('lhs', 'knock');
					}
					return;
				}
				try {
					const {
						_is_change_in_view: isVisible,
						_get_viewport_side: getViewport,
						changes
					} = editor._diffView;
					const change = changes[4];

					const vp = getViewport.call(editor._diffView, 'lhs');
					expect(vp).to.deep.equal({ from: 323, to: 349 });
					done();
				} catch (ex) {
					done(ex);
				} finally {
					editor.el.removeEventListener(test);
				}
			};
			expect(editor.diff()).to.include('696c696');
			editor.el.addEventListener('updated', test);
		});
	});

	describe('swap', () => {
		it('should swap sides', (done) => {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue('left-hand side text'),
				rhs: (setValue) => setValue('right-hand side text')
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
			editor.el.addEventListener('updated', () => {
				editor.swap();
				editor.el.addEventListener('updated', test, { once: true });
			}, { once: true });
		});
	});

	describe('unmarkup', () => {
		it('should remove markup', (done) => {
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue('left-hand side text'),
				rhs: (setValue) => setValue('right-hand side text')
			});
			const test = () => {
				try {
					const found = document.querySelector('.mergely.ch.d.lhs');
					expect(found).to.be.null;
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.el.addEventListener('updated', () => {
				try {
					const found = document.querySelector('.mergely.ch.d.lhs');
					expect(found).to.not.be.null;
				} catch (ex) {
					return done(ex);
				}
				editor.el.addEventListener('updated', test, { once: true });
				editor.unmarkup();
			}, { once: true });
		});
	});

	describe('update', () => {
		it('should not trigger update on init when autoupdate is false', (done) => {
			const editor = init({
				height: 100,
				change_timeout: 0,
				autoupdate: false,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue('left-hand side text'),
				rhs: (setValue) => setValue('right-hand side text')
			});
			const updated = simple.stub();
			editor.el.addEventListener('updated', updated, { once: true });
			setTimeout(() => {
				const found = document.querySelector('.mergely.ch.d.lhs');
				try {
					expect(found).to.be.null;
					expect(updated.calls).to.have.length(0);
					done();
				} catch (ex) {
					done(ex);
				}
			}, 150);
		});

		it('should not trigger update on options when autoupdate is false', (done) => {
			const editor = init({
				height: 100,
				change_timeout: 0,
				autoupdate: false,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue('left-hand side text'),
				rhs: (setValue) => setValue('right-hand side text')
			});
			const updated = simple.stub();
			editor.el.addEventListener('updated', updated, { once: true });
			setTimeout(() => {
				const found = document.querySelector('.mergely.ch.d.lhs');
				try {
					expect(found).to.be.null;
					expect(updated.calls).to.have.length(0);
					done();
				} catch (ex) {
					done(ex);
				}
			}, 150);
			editor.options({ wrap_lines: false });
		});

		it('should not trigger update on lhs/rhs change when autoupdate is false', (done) => {
			const editor = init({
				height: 100,
				change_timeout: 0,
				autoupdate: false,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue('left-hand side text'),
				rhs: (setValue) => setValue('right-hand side text')
			});
			const updated = simple.stub();
			editor.el.addEventListener('updated', updated, { once: true });
			setTimeout(() => {
				const found = document.querySelector('.mergely.ch.d.lhs');
				try {
					expect(found).to.be.null;
					expect(updated.calls).to.have.length(0);
					done();
				} catch (ex) {
					done(ex);
				}
			}, 150);
			editor.lhs('lhs text');
			editor.rhs('rhs text');
		});

		it('should not trigger update on scroll when autoupdate is false', (done) => {
			const editor = init({
				height: 100,
				change_timeout: 0,
				autoupdate: false,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue(macbeth),
				rhs: (setValue) => setValue(macbeth.replace(/place/g, 'space'))
			});
			const updated = simple.stub();
			editor.el.addEventListener('updated', updated, { once: true });
			setTimeout(() => {
				const found = document.querySelector('.mergely.ch.d.lhs');
				try {
					expect(found).to.be.null;
					expect(updated.calls).to.have.length(0);
					done();
				} catch (ex) {
					done(ex);
				}
			}, 150);
			editor.scrollTo('lhs', 696);
		});

		it('should manually update when autoupdate is false', (done) => {
			const editor = init({
				height: 100,
				change_timeout: 0,
				autoupdate: false,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue(macbeth),
				rhs: (setValue) => setValue(macbeth.replace(/place/g, 'space'))
			});
			const test = () => {
				try {
					const found = document.querySelector('.mergely.ch.d.lhs');
					expect(found).not.to.be.null;
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.el.addEventListener('updated', test, { once: true });
			setTimeout(() => {
				editor.scrollTo('lhs', 696);
				editor.update();
			}, 80);
		});
	});

	describe('_is_change_in_view', () => {
		it('should be false when change less-than viewport', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				viewport: true,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue(macbeth),
				rhs: (setValue) => setValue(macbeth)
			});
			const test = () => {
				try {
					const { _is_change_in_view: isVisible } = editor._diffView;
					expect(isVisible('lhs', {from: 10, to: 20}, {
						'lhs-line-from': 0,
						'lhs-line-to': 9
					})).to.be.false;
					done();
				} catch (ex) {
					done(ex);
				}
			}
			editor.el.addEventListener('updated', test, { once: true });
		});

		it('should be true when change less-than-equal viewport', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				viewport: true,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue(macbeth),
				rhs: (setValue) => setValue(macbeth)
			});
			const test = () => {
				try {
					const { _is_change_in_view: isVisible } = editor._diffView;
					expect(isVisible('lhs', {from: 10, to: 20}, {
						'lhs-line-from': 0,
						'lhs-line-to': 10
					})).to.be.true;
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.el.addEventListener('updated', test, { once: true });
		});

		it('should be false when change greater-than viewport', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				viewport: true,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue(macbeth),
				rhs: (setValue) => setValue(macbeth)
			});
			const test = () => {
				try {
					const { _is_change_in_view: isVisible } = editor._diffView;
					expect(isVisible('lhs', {from: 10, to: 20}, {
						'lhs-line-from': 21,
						'lhs-line-to': 22
					})).to.be.false;
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.el.addEventListener('updated', test, { once: true });
		});

		it('should be true when change straddles viewport from', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				viewport: true,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue(macbeth),
				rhs: (setValue) => setValue(macbeth)
			});
			const test = () => {
				try {
					const { _is_change_in_view: isVisible } = editor._diffView;
					expect(isVisible('lhs', {from: 10, to: 20}, {
						'lhs-line-from': 5,
						'lhs-line-to': 11
					})).to.be.true;
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.el.addEventListener('updated', test, { once: true });
		});

		it('should be true when change straddles viewport to', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				viewport: true,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue(macbeth),
				rhs: (setValue) => setValue(macbeth)
			});
			const test = () => {
				try {
					const { _is_change_in_view: isVisible } = editor._diffView;
					expect(isVisible('lhs', {from: 10, to: 20}, {
						'lhs-line-from': 15,
						'lhs-line-to': 21
					})).to.be.true;
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.el.addEventListener('updated', test, { once: true });
		});

		it('should be true when change encompasses viewport', function (done) {
			const editor = init({
				height: 100,
				change_timeout: 0,
				viewport: true,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue(macbeth),
				rhs: (setValue) => setValue(macbeth)
			});
			const test = () => {
				try {
					const { _is_change_in_view: isVisible } = editor._diffView;
					expect(isVisible('lhs', {from: 10, to: 20}, {
						'lhs-line-from': 0,
						'lhs-line-to': 25
					})).to.be.true;
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.el.addEventListener('updated', test, { once: true });
		});
	});

	describe('security', () => {
		it('should not be vulnerable to XSS', function (done) {
			const xss = '<script id="injected">alert("omg - xss");</script>';
			const editor = init({
				height: 100,
				change_timeout: 0,
				license: 'lgpl-separate-notice',
				lhs: (setValue) => setValue(xss),
				rhs: (setValue) => setValue('')
			});
			// the value is as expected
			expect(editor.get('lhs')).to.equal(xss);
			// yet, shouldn't find injected script in DOM
			const found = document.querySelector('#injected');
			done(found !== null);
		});
	});
});
