require('codemirror/addon/selection/mark-selection.js');
require('codemirror/lib/codemirror.css');
require('../src/mergely.css');

var lhs = `\
the quick red fox
jumped over the hairy dog
`;

var rhs = `\
the quick brown fox
jumped over the lazy dog
`;

$(document).ready(function () {
	$('#mergely').mergely({
		license: 'lgpl',
		ignorews: true,
		cmsettings: {
			readOnly: false
		},
		_debug: '',
		lhs: function(setValue) {
			setValue(lhs);
		},
		rhs: function(setValue) {
			setValue(rhs);
		}
	});
});
