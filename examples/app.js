require('codemirror/lib/codemirror.css');
require('../src/mergely.css');

$(document).ready(function () {
	$('#mergely').mergely({
		license: 'lgpl',
		cmsettings: {
			readOnly: false
		},
		_debug: '',
		lhs: function(setValue) {
			setValue('the quick red fox\njumped over the hairy dog');
		},
		rhs: function(setValue) {
			setValue('the quick brown fox\njumped over the lazy dog');
		}
	});
});
