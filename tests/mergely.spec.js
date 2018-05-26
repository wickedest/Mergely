const jQuery = require('jquery');
const CodeMirror = require('CodeMirror');
const mergely = require('../src/mergely');
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

	describe('initialization', () => {
		it('initializes without arguments', function (done) {
			$(document).ready(() => {
				const editor = init({
					height: 100,
					license: 'lgpl-separate-notice'
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
				expect($('body').hasScrollBar()).to.equal(false);
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
					lhs: (setValue) => {
						console.log('here');
						setValue('left-hand side text')
					},
					rhs: (setValue) => setValue('right-hand side text'),
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
				expect($('body').hasScrollBar()).to.equal(false);
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
});
