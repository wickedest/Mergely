require('codemirror/addon/selection/mark-selection.js');
require('codemirror/lib/codemirror.css');
require('../src/mergely.css');

document.onreadystatechange = function () {
	if (document.readyState !== 'complete') {
		return;
	}

	new Mergely('#mergely0', {
		license: 'lgpl-separate-notice',
		lhs: (setValue) => setValue('the quick brown fox\njumped over the lazy dog\n'),
		rhs: (setValue) => setValue('\nthe quick red fox\njumped over the hairy dog\n')
	});
	new Mergely('#mergely1', {
		license: 'lgpl-separate-notice',
		lhs: (setValue) => setValue('\nthe quick red fox\njumped over the hairy dog\n'),
		rhs: (setValue) => setValue('the quick brown fox\njumped over the lazy dog\n')
	});

	new Mergely('#mergely2', {
		license: 'lgpl-separate-notice',
		lhs: (setValue) => setValue('\nthe quick red fox\njumped over the hairy dog\n\n'),
		rhs: (setValue) => setValue('\n\nthe quick brown fox\njumped over the lazy dog\n')
	});
	new Mergely('#mergely3', {
		license: 'lgpl-separate-notice',
		lhs: (setValue) => setValue('\nthe quick brown fox\njumped over the lazy dog\n\n'),
		rhs: (setValue) => setValue('\n\nthe quick red fox\njumped over the hairy dog\n')
	});

	new Mergely('#mergely4', {
		license: 'lgpl-separate-notice',
		lhs: (setValue) => setValue('the quick brown fox\n'),
	});
	new Mergely('#mergely5', {
		license: 'lgpl-separate-notice',
		rhs: (setValue) => setValue('the quick brown fox\n')
	});

	new Mergely('#mergely6', {
		license: 'lgpl-separate-notice',
		lhs: (setValue) => setValue('the quick brown fox\njumped over the lazy dog\n'),
	});
	new Mergely('#mergely7', {
		license: 'lgpl-separate-notice',
		rhs: (setValue) => setValue('the quick brown fox\njumped over the lazy dog\n')
	});

	new Mergely('#mergely8', {
		license: 'lgpl-separate-notice',
		lhs: (setValue) => setValue('the quick brown fox\njumped over the lazy dog'),
		rhs: (setValue) => setValue('the quick brown fox\njumped over the lazy dog\n\nand the fence')
	});
	new Mergely('#mergely9', {
		license: 'lgpl-separate-notice',
		lhs: (setValue) => setValue('the quick brown fox\njumped over the lazy dog\n\nand the fence'),
		rhs: (setValue) => setValue('the quick brown fox\njumped over the lazy dog')
	});

	new Mergely('#mergely10', {
		license: 'lgpl-separate-notice',
	});
	new Mergely('#mergely11', {
		license: 'lgpl-separate-notice',
		lhs: (setValue) => setValue('the quick brown fox\njumped over the lazy dog'),
		rhs: (setValue) => setValue('the quick brown fox\njumped over the lazy dog')
	});

	new Mergely('#mergely12', {
		license: 'lgpl-separate-notice',
		lhs: (setValue) => setValue('the quick red fox\njumped over the hairy dog'),
		rhs: (setValue) => setValue('the quick brown fox\njumped over the lazy dog')
	});
	new Mergely('#mergely13', {
		license: 'lgpl-separate-notice',
		lhs: (setValue) => setValue('\nthe quick red fox\njumped over the hairy dog'),
		rhs: (setValue) => setValue('\nthe quick brown fox\njumped over the lazy dog')
	});

	new Mergely('#mergely14', {
		license: 'lgpl-separate-notice',
		ignorecase: true,
		ignorews: true,
		ignoreaccents: true,
		lhs: (setValue) => setValue('ignore ws\n\nignore CASE\n\nignore áccents\n'),
		rhs: (setValue) => setValue('ignore\tws\n\nignore case\n\nignore accents\n')
	});
};
