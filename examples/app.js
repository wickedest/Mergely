require('codemirror');
require('codemirror/addon/search/searchcursor.js');
require('codemirror/addon/selection/mark-selection.js');
require('codemirror/lib/codemirror.css');
require('../src/mergely.css');

const lhs = `\
the quick red fox
jumped over the hairy dog
`;

const rhs = `\
the quick brown fox
jumped over the lazy dog
`;


document.onreadystatechange = function () {
	if (document.readyState !== 'complete') {
		return;
	}

	const mergely = new Mergely('#compare', {
		factory: CodeMirror,
		license: 'lgpl',
		lhs,
		rhs
	});

	// On init, scroll to first diff
	mergely.once('updated', () => {
		mergely.scrollToDiff('next');
	});
};
