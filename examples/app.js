require('codemirror/addon/selection/mark-selection.js');
require('codemirror/lib/codemirror.css');
require('../src/mergely.css');

const macbeth = require('../test/data/macbeth');

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

	const doc = new Mergely('#mergely', {
		license: 'lgpl',
		ignorews: true,
		wrap_lines: false,
		// change_timeout: 0,
		viewport: true,
		cmsettings: {
			readOnly: false
		},
		lhs: function(setValue) {
			setValue(macbeth.join('\n'));
		},
		rhs: function(setValue) {
			setValue(macbeth.join('\n')
				.replace(/\brain\b/g, 'sleet')
				.replace(/\bfog\b/g, 'smog'));
				//.replace(/heart/g, 'head'));
		},
		_debug: ''
		// _debug: 'draw,change,event'
	});

	// On init, scroll to first diff
	doc.once('updated', () => {
		doc.scrollToDiff('next');
	});
};
