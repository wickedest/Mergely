require('codemirror');
require('codemirror/addon/search/searchcursor.js');
require('codemirror/addon/selection/mark-selection.js');
require('codemirror/lib/codemirror.css');
require('../src/mergely.css');

const lhs = `hello`;

const rhs = `hello\ngoodbye`;


document.onreadystatechange = function () {
	if (document.readyState !== 'complete') {
		return;
	}

	const mergely = new Mergely('#compare', {
		license: 'lgpl',
		inline: 'words',
		lhs,
		rhs
	});

	// On init, scroll to first diff
	mergely.once('updated', () => {
		mergely.scrollToDiff('next');
	});
};
