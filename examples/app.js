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
			setValue('a\nb\nc');
		},
		rhs: function(setValue) {
			setValue('a\nb\nx\nc');
		}
	});
});
