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
		wrap_lines: true,
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
				.replace(/love/g, 'hate')
				.replace(/heart/g, 'head'));
		},
		_debug: 'api,event,scroll,change,diff',
		// _debug: 'draw,event,diff,change'//'event,scroll,diff,draw'
	});

	// On init, scroll to first diff
	doc.once('updated', () => {
		doc.scrollToDiff('next');
	});
};
