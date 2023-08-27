const simple = require('simple-mock');
require('codemirror')
require('../src/mergely');


describe('markup', () => {
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
			return;
		}
		editor && editor.unbind();
		simple.restore();
		editor.el.parentNode.removeChild(editor.el);
	});

	const LHS_LINE_START = '.mergely.lhs.d.CodeMirror-linebackground.start';
	const LHS_LINE_END = '.mergely.lhs.d.CodeMirror-linebackground.end';
	const LHS_LINE_NO_START = '.mergely.lhs.d.no-start.end.CodeMirror-linebackground';
	const LHS_LINE_NO_END = '.mergely.lhs.d.CodeMirror-linebackground.start.no-end';
	const LHS_LINE = 'span.mergely.d.lhs';

	const RHS_LINE_NO_START = '.mergely.rhs.a.no-start.end.CodeMirror-linebackground';
	const RHS_LINE_NO_END = '.mergely.rhs.a.CodeMirror-linebackground.start.no-end';
	const RHS_LINE_START = '.mergely.rhs.a.CodeMirror-linebackground.start';
	const RHS_LINE_END = '.mergely.rhs.a.CodeMirror-linebackground.end';
	const RHS_LINE_TEXT = 'span.mergely.a.rhs';

	const LHS_CHANGE_START = '.mergely.lhs.c.CodeMirror-linebackground.start';
	const LHS_CHANGE_END = '.mergely.lhs.c.CodeMirror-linebackground.end';
	const RHS_CHANGE_START = '.mergely.rhs.c.CodeMirror-linebackground.start';
	const RHS_CHANGE_END = '.mergely.rhs.c.CodeMirror-linebackground.end';

	const LHS_INLINE_TEXT = '.mergely.lhs.ind';
	const RHS_INLINE_TEXT = '.mergely.rhs.ina';

	const opts = [
		{
			name: 'Added and removed from the start and end (lhs)',
			lhs: 'the quick brown fox\njumped over the lazy dog\n',
			rhs: '\nthe quick red fox\njumped over the hairy dog\n',
			check: (editor) => {
				expect(editor.querySelectorAll(LHS_LINE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_LINE_END + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_LINE + '.cid-0')).to.have.length(2);
				expect(editor.querySelectorAll(LHS_LINE_NO_START + '.cid-1')).to.have.length(1);

				expect(editor.querySelectorAll(RHS_LINE_NO_END + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_START + '.cid-1')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_END + '.cid-1')).to.have.length(1);
			}
		},
		{
			name: 'Added and removed from the start and end (rhs)',
			lhs: '\nthe quick red fox\njumped over the hairy dog\n',
			rhs: 'the quick brown fox\njumped over the lazy dog\n',
			check: (editor) => {
				expect(editor.querySelectorAll(LHS_LINE_NO_END + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_LINE_START + '.cid-1')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_LINE_END + '.cid-1')).to.have.length(1);

				expect(editor.querySelectorAll(RHS_LINE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_END + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_NO_START + '.cid-1')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_TEXT + '.cid-0')).to.have.length(2);
			}
		},
		{
			name: 'Added and removed from the middle (lhs)',
			lhs: '\nthe quick red fox\njumped over the hairy dog\n\n',
			rhs: '\n\nthe quick brown fox\njumped over the lazy dog\n',
			check: (editor) => {
				expect(editor.querySelectorAll(LHS_LINE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_LINE_END + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_LINE + '.cid-0')).to.have.length(2);
				expect(editor.querySelectorAll(LHS_LINE_NO_START + '.cid-1')).to.have.length(1);

				expect(editor.querySelectorAll(RHS_LINE_NO_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_START + '.cid-1')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_END + '.cid-1')).to.have.length(1);
			}
		},
		{
			name: 'Added and removed from the middle (rhs)',
			lhs: '\n\nthe quick brown fox\njumped over the lazy dog\n',
			rhs: '\nthe quick red fox\njumped over the hairy dog\n\n',
			check: (editor) => {
				expect(editor.querySelectorAll(LHS_LINE_NO_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_LINE_START + '.cid-1')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_LINE_END + '.cid-1')).to.have.length(1);

				expect(editor.querySelectorAll(RHS_LINE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_END + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_NO_START + '.cid-1')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_TEXT + '.cid-0')).to.have.length(2);
			}
		},
		{
			name: 'One line with the other empty (lhs)',
			lhs: 'the quick brown fox\n',
			rhs: '',
			check: (editor) => {
				expect(editor.querySelectorAll(LHS_LINE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_LINE_END + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_NO_END + '.cid-0')).to.have.length(1);
			}
		},
		{
			name: 'One line with the other empty (rhs)',
			lhs: '',
			rhs: 'the quick brown fox\n',
			check: (editor) => {
				expect(editor.querySelectorAll(LHS_LINE_NO_END + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_LINE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_END + '.cid-0')).to.have.length(1);
			}
		},
		{
			name: 'Multiple lines with the other empty (lhs)',
			lhs: 'the quick brown fox\njumped over the lazy dog\n',
			rhs: '',
			check: (editor) => {
				expect(editor.querySelectorAll(LHS_LINE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_LINE_END + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_NO_END + '.cid-0')).to.have.length(1);
			}
		},
		{
			name: 'Multiple lines with the other empty (rhs)',
			lhs: '',
			rhs: 'the quick brown fox\njumped over the lazy dog\n',
			check: (editor) => {
				expect(editor.querySelectorAll(LHS_LINE_NO_END + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_LINE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_END + '.cid-0')).to.have.length(1);
			}
		},

		{
			name: 'Added and removed from the end (lhs)',
			lhs: 'the quick brown fox\njumped over the lazy dog',
			rhs: 'the quick brown fox\njumped over the lazy dog\n\nand the fence',
			check: (editor) => {
				expect(editor.querySelectorAll(LHS_LINE_NO_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_END + '.cid-0')).to.have.length(1);
			}
		},
		{
			name: 'Added and removed from the end (rhs)',
			lhs: 'the quick brown fox\njumped over the lazy dog\n\nand the fence',
			rhs: 'the quick brown fox\njumped over the lazy dog',
			check: (editor) => {
				expect(editor.querySelectorAll(LHS_LINE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_LINE_END + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_LINE_NO_START + '.cid-0')).to.have.length(1);
			}
		},

		{
			name: 'No changes (empty)',
			lhs: '',
			rhs: '',
			check: (editor) => {
				expect(editor.querySelectorAll('.mergely.lhs')).to.have.length(0);
				expect(editor.querySelectorAll('.mergely.rhs')).to.have.length(0);
			}
		},
		{
			name: 'No changes (with text)',
			lhs: 'the quick brown fox\njumped over the lazy dog',
			rhs: 'the quick brown fox\njumped over the lazy dog',
			check: (editor) => {
				expect(editor.querySelectorAll('.mergely.lhs')).to.have.length(0);
				expect(editor.querySelectorAll('.mergely.rhs')).to.have.length(0);
			}
		},
		{
			name: 'Changed lines (lhs)',
			lhs: 'the quick red fox\njumped over the hairy dog',
			rhs: 'the quick brown fox\njumped over the lazy dog',
			check: (editor) => {
				expect(editor.querySelectorAll(LHS_CHANGE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_CHANGE_END + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_CHANGE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_CHANGE_END + '.cid-0')).to.have.length(1);
				const lhs_spans = editor.querySelectorAll(LHS_INLINE_TEXT + '.cid-0');
				expect(lhs_spans).to.have.length(3);
				expect(lhs_spans[0].innerText).to.equal('ed');
				expect(lhs_spans[1].innerText).to.equal('h');
				expect(lhs_spans[2].innerText).to.equal('ir');
				const rhs_spans = editor.querySelectorAll(RHS_INLINE_TEXT + '.cid-0');
				expect(rhs_spans).to.have.length(4);
				expect(rhs_spans[0].innerText).to.equal('b');
				expect(rhs_spans[1].innerText).to.equal('own');
				expect(rhs_spans[2].innerText).to.equal('l');
				expect(rhs_spans[3].innerText).to.equal('z');
			}
		},
		{
			name: 'Changed lines (rhs)',
			lhs: 'the quick brown fox\njumped over the lazy dog',
			rhs: 'the quick red fox\njumped over the hairy dog',
			check: (editor) => {
				expect(editor.querySelectorAll(LHS_CHANGE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_CHANGE_END + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_CHANGE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_CHANGE_END + '.cid-0')).to.have.length(1);
				const lhs_spans = editor.querySelectorAll(LHS_INLINE_TEXT + '.cid-0');
				expect(lhs_spans).to.have.length(4);
				expect(lhs_spans[0].innerText).to.equal('b');
				expect(lhs_spans[1].innerText).to.equal('own');
				expect(lhs_spans[2].innerText).to.equal('l');
				expect(lhs_spans[3].innerText).to.equal('z');
				const rhs_spans = editor.querySelectorAll(RHS_INLINE_TEXT + '.cid-0');
				expect(rhs_spans).to.have.length(3);
				expect(rhs_spans[0].innerText).to.equal('ed');
				expect(rhs_spans[1].innerText).to.equal('h');
				expect(rhs_spans[2].innerText).to.equal('ir');
			}
		},
		{
			name: 'Changed lines with inline words (lhs)',
			lhs: 'the quick red fox\njumped over the hairy dog',
			rhs: 'the quick brown fox\njumped over the lazy dog',
			options: { inline: 'words' },
			check: (editor) => {
				expect(editor.querySelectorAll(LHS_CHANGE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_CHANGE_END + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_CHANGE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_CHANGE_END + '.cid-0')).to.have.length(1);
				const lhs_spans = editor.querySelectorAll(LHS_INLINE_TEXT + '.cid-0');
				expect(lhs_spans).to.have.length(2);
				expect(lhs_spans[0].innerText).to.equal('red');
				expect(lhs_spans[1].innerText).to.equal('hairy');
				const rhs_spans = editor.querySelectorAll(RHS_INLINE_TEXT + '.cid-0');
				expect(rhs_spans).to.have.length(2);
				expect(rhs_spans[0].innerText).to.equal('brown');
				expect(rhs_spans[1].innerText).to.equal('lazy');
			}
		},
		{
			name: 'Changed lines (rhs)',
			lhs: 'the quick brown fox\njumped over the lazy dog',
			rhs: 'the quick red fox\njumped over the hairy dog',
			options: { inline: 'words' },
			check: (editor) => {
				expect(editor.querySelectorAll(LHS_CHANGE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(LHS_CHANGE_END + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_CHANGE_START + '.cid-0')).to.have.length(1);
				expect(editor.querySelectorAll(RHS_CHANGE_END + '.cid-0')).to.have.length(1);
				const lhs_spans = editor.querySelectorAll(LHS_INLINE_TEXT + '.cid-0');
				expect(lhs_spans).to.have.length(2);
				expect(lhs_spans[0].innerText).to.equal('brown');
				expect(lhs_spans[1].innerText).to.equal('lazy');
				const rhs_spans = editor.querySelectorAll(RHS_INLINE_TEXT + '.cid-0');
				expect(rhs_spans).to.have.length(2);
				expect(rhs_spans[0].innerText).to.equal('red');
				expect(rhs_spans[1].innerText).to.equal('hairy');
			}
		}
	];

	// to debug, add `only: true` to the test `opts` above, and run `npm run debug`
	opts.forEach((opt, i) => {
		const itfn = opt.only ? it.only : it;
		const debug = !!opt.only;
		itfn(`markup-case-${i} should markup ${opt.name}`, function (done) {
			const editor = init({
				height: 100,
				license: 'lgpl-separate-notice',
				change_timeout: 0,
				_debug: debug,
				lhs: opt.lhs,
				rhs: opt.rhs,
				...opt.options
			});
			const test = () => {
				try {
					opt.check(editor.el);
					done();
				} catch (ex) {
					done(ex);
				}
			};
			editor.once('updated', test);
		});
	});
});
