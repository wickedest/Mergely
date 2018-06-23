const jQuery = require('jquery');
const CodeMirror = require('CodeMirror');
const mergely = require('../src/mergely');
const macbeth = require('./data/macbeth').join('\n');
const $ = jQuery;

(function($) {
    $.fn.hasScrollBar = function() {
        return this.get(0).scrollHeight - 2 > this.height();
    }
})(jQuery);


describe('mergely', function () {
	function init(options) {
		$('body').css({'margin': '0px'}).append('<div id="mergely"></div>');
		const editor = $('#mergely');
		editor.mergely(options);
		return editor;
	};

	afterEach(() => {
		const mergely = $('#mergely');
		mergely.mergely('unbind');
		mergely.mergelyUnregister();
		mergely.remove();
	});

	describe('initialization', () => {
		it('initializes without arguments', function (done) {
			$(document).ready(() => {
				const editor = init({
					height: 100,
					license: 'lgpl-separate-notice'
				});
				editor.id = 1;
				expect(editor).to.exist;
				expect(editor.mergely).to.exist;
				const children = editor.children();
				expect(children.length).to.equal(6);
				expect($(children[0]).attr('id')).to.equal('mergely-splash');
				expect($(children[1]).attr('class')).to.equal('mergely-margin');
				expect($(children[2]).attr('class')).to.equal('mergely-column');
				expect($(children[3]).attr('class')).to.equal('mergely-canvas');
				expect($(children[4]).attr('class')).to.equal('mergely-column');
				expect($(children[5]).attr('class')).to.equal('mergely-margin');
				//expect($('body').hasScrollBar()).to.equal(false);
				expect($('.mergely-editor-lhs .CodeMirror-code').text()).to.equal('');
				expect($('.mergely-editor-rhs .CodeMirror-code').text()).to.equal('');
				done();
			});
		});

		it('initializes with static arguments for lhs/rhs text', function (done) {
			$(document).ready(() => {
				const editor = init({
					height: 100,
					license: 'lgpl-separate-notice',
					lhs: (setValue) => setValue('left-hand side text'),
					rhs: (setValue) => setValue('right-hand side text')
				});
				expect(editor).to.exist;
				expect(editor.mergely).to.exist;
				const children = editor.children();
				expect(children.length).to.equal(6);
				expect($(children[0]).attr('id')).to.equal('mergely-splash');
				expect($(children[1]).attr('class')).to.equal('mergely-margin');
				expect($(children[2]).attr('class')).to.equal('mergely-column');
				expect($(children[3]).attr('class')).to.equal('mergely-canvas');
				expect($(children[4]).attr('class')).to.equal('mergely-column');
				expect($(children[5]).attr('class')).to.equal('mergely-margin');
				expect($('#mergely-editor-lhs .CodeMirror-code .CodeMirror-line').text()).to.equal('left-hand side text');
				expect($('#mergely-editor-rhs .CodeMirror-code .CodeMirror-line').text()).to.equal('right-hand side text');
				done();
			});
		});

		it('initializes with no sidebar', function (done) {
			$(document).ready(() => {
				const editor = init({
					height: 100,
					license: 'lgpl-separate-notice',
					sidebar: false
				});
				expect(editor).to.exist;
				expect(editor.mergely).to.exist;
				const children = editor.children();
				expect(children.length).to.equal(6);
				expect($(children[0]).attr('id')).to.equal('mergely-splash');
				expect($(children[1]).attr('class')).to.equal('mergely-margin');
				expect($(children[1]).css('display')).to.equal('none');
				expect($(children[2]).attr('class')).to.equal('mergely-column');
				expect($(children[3]).attr('class')).to.equal('mergely-canvas');
				expect($(children[4]).attr('class')).to.equal('mergely-column');
				expect($(children[5]).attr('class')).to.equal('mergely-margin');
				expect($(children[5]).css('display')).to.equal('none');
				done();
			});
		});
	});

	describe('get', () => {
		it('gets lhs and rhs text', function (done) {
			$(document).ready(() => {
				const editor = init({
					height: 100,
					license: 'lgpl-separate-notice',
					lhs: (setValue) => setValue('left-hand side text'),
					rhs: (setValue) => setValue('right-hand side text')
				});
				expect($('#mergely').mergely('get', 'lhs')).to.equal('left-hand side text');
				expect($('#mergely').mergely('get', 'rhs')).to.equal('right-hand side text');
				done();
			});
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
		}];

		opts.forEach((opt, i) => {
			it(`merge-case-${i} should merge change to ${opt.dir} where ${opt.name}`, function (done) {
				$(document).ready(() => {
					const editor = init({
						height: 100,
						license: 'lgpl-separate-notice',
						change_timeout: 0,
						lhs: (setValue) => setValue(opt.lhs),
						rhs: (setValue) => setValue(opt.rhs)
					});
					expect($('#mergely').mergely('get', 'lhs')).to.equal(opt.lhs);
					expect($('#mergely').mergely('get', 'rhs')).to.equal(opt.rhs);
					setTimeout(() => {
						for (let i = 0; i < opt.next; ++i) {
							$('#mergely').mergely('scrollToDiff', 'next');
						}
						$('#mergely').mergely('mergeCurrentChange', opt.dir);
						if (opt.dir === 'lhs') {
							expect($('#mergely').mergely('get', 'lhs')).to.equal(opt.expect || opt.rhs);
							expect($('#mergely').mergely('get', 'rhs')).to.equal(opt.rhs);
						} else {
							expect($('#mergely').mergely('get', 'lhs')).to.equal(opt.lhs);
							expect($('#mergely').mergely('get', 'rhs')).to.equal(opt.expect || opt.lhs);
						}
						done();
					}, 10);
				});
			});
		});
	});

	describe('_is_change_in_view', () => {
		it('should be false when change less-than viewport', function (done) {
			$(document).ready(() => {
				const editor = init({
					height: 100,
					viewport: true,
					license: 'lgpl-separate-notice',
					lhs: (setValue) => setValue(macbeth),
					rhs: (setValue) => setValue(macbeth)
				});
				const { mergely } = $('#mergely');
				expect($('#mergely').mergely('_is_change_in_view', 'lhs', {from: 10, to: 20}, {
					'lhs-line-from': 0,
					'lhs-line-to': 9
				})).to.be.false;
				done();
			});
		});

		it('should be true when change less-than-equal viewport', function (done) {
			$(document).ready(() => {
				const editor = init({
					height: 100,
					viewport: true,
					license: 'lgpl-separate-notice',
					lhs: (setValue) => setValue(macbeth),
					rhs: (setValue) => setValue(macbeth)
				});
				const { mergely } = $('#mergely');
				expect($('#mergely').mergely('_is_change_in_view', 'lhs', {from: 10, to: 20}, {
					'lhs-line-from': 0,
					'lhs-line-to': 10
				})).to.be.true;
				done();
			});
		});

		it('should be false when change greater-than viewport', function (done) {
			$(document).ready(() => {
				const editor = init({
					height: 100,
					viewport: true,
					license: 'lgpl-separate-notice',
					lhs: (setValue) => setValue(macbeth),
					rhs: (setValue) => setValue(macbeth)
				});
				const { mergely } = $('#mergely');
				expect($('#mergely').mergely('_is_change_in_view', 'lhs', {from: 10, to: 20}, {
					'lhs-line-from': 21,
					'lhs-line-to': 22
				})).to.be.false;
				done();
			});
		});

		it('should be true when change straddles viewport from', function (done) {
			$(document).ready(() => {
				const editor = init({
					height: 100,
					viewport: true,
					license: 'lgpl-separate-notice',
					lhs: (setValue) => setValue(macbeth),
					rhs: (setValue) => setValue(macbeth)
				});
				const { mergely } = $('#mergely');
				expect($('#mergely').mergely('_is_change_in_view', 'lhs', {from: 10, to: 20}, {
					'lhs-line-from': 5,
					'lhs-line-to': 11
				})).to.be.true;
				done();
			});
		});

		it('should be true when change straddles viewport to', function (done) {
			$(document).ready(() => {
				const editor = init({
					height: 100,
					viewport: true,
					license: 'lgpl-separate-notice',
					lhs: (setValue) => setValue(macbeth),
					rhs: (setValue) => setValue(macbeth)
				});
				const { mergely } = $('#mergely');
				expect($('#mergely').mergely('_is_change_in_view', 'lhs', {from: 10, to: 20}, {
					'lhs-line-from': 15,
					'lhs-line-to': 21
				})).to.be.true;
				done();
			});
		});

		it('should be true when change encompasses viewport', function (done) {
			$(document).ready(() => {
				const editor = init({
					height: 100,
					viewport: true,
					license: 'lgpl-separate-notice',
					lhs: (setValue) => setValue(macbeth),
					rhs: (setValue) => setValue(macbeth)
				});
				const { mergely } = $('#mergely');
				expect($('#mergely').mergely('_is_change_in_view', 'lhs', {from: 10, to: 20}, {
					'lhs-line-from': 0,
					'lhs-line-to': 25
				})).to.be.true;
				done();
			});
		});

<<<<<<< HEAD
		it('should not be vulnerable to XSS', function (done) {
			function initXSS(options) {
				$('body').get(0).innerHTML = "<!DOCTYPE html><html lang=\"en\"><body><div id='mergely<script id=\"injected\">alert(123)</script>'></div></body></html>";
				const divs = document.getElementsByTagName('div');
				editor = $(divs[0]);
=======
		it.only('should not be vulnerable to XSS', function (done) {
			function initXSS(options) {
				// $('body').css({'margin': '0px'}).append("<div id='mergely<script>alert(123)</script>' />");

				$('body').get(0).innerHTML = "<div id='mergely\"<script id='injected'>alert(123)</script>'></div>";

				const editor = $('#mergely');
>>>>>>> master
				editor.mergely(options);
				return editor;
			};

			$(document).ready(() => {
				const editor = initXSS({
					height: 100,
					viewport: true,
					license: 'lgpl-separate-notice',
					lhs: (setValue) => setValue(macbeth),
					rhs: (setValue) => setValue(macbeth)
				});
				expect($('body').find('#injected')).to.have.length(0, 'expected no div with id injected');
				const divs = document.getElementsByTagName('div');
				expect(divs).to.have.length(1);
				expect(divs[0].id).to.equal('mergely<script id="injected">alert(123)</script>');
				done();
			});
		});
	});
});
