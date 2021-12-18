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

	const doc = new Mergely('#mergely', {
		license: 'lgpl',
		ignorews: true,
		wrap_lines: true,
		cmsettings: {
			readOnly: false
		},
		lhs: function(setValue) {
			setValue(lhs);
		},
		rhs: function(setValue) {
			setValue(rhs);
		}
	});
};
