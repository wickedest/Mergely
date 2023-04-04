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

	const doc = new Mergely('#compare', {
		license: 'lgpl',
		lhs: (setValue) => setValue(lhs),
		rhs: (setValue) => setValue(rhs)
	});

	// On init, scroll to first diff
	doc.once('updated', () => {
		doc.scrollToDiff('next');
	});
};
