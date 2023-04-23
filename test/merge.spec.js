const simple = require('simple-mock');
require('codemirror')
require('../src/mergely');


describe('mergeCurrentChange', () => {
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
		const itfn = opt.only ? it.only : it;
		const debug = !!opt.only;

        itfn(`merge-case-${i} should merge change to ${opt.dir} where ${opt.name}`, function (done) {
            const editor = init({
                height: 100,
                license: 'lgpl-separate-notice',
                change_timeout: 0,
				_debug: debug,
                lhs: (setValue) => setValue(opt.lhs),
                rhs: (setValue) => setValue(opt.rhs)
            });
            const test = () => {
                try {
                    expect(editor.get('lhs')).to.equal(opt.lhs);
                    expect(editor.get('rhs')).to.equal(opt.rhs);
                    expect(editor.el.querySelectorAll('.merge-button').length > 0).to.be.true;
                    done();
                } catch (ex) {
                    done(ex);
                }
            };
            editor.once('updated', test);
        });
    });
});
