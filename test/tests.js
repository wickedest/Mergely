Object.equals = function( x, y ) {
	if ( x === y ) return true;
	if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
	if ( x.constructor !== y.constructor ) return false;
	for ( var p in x ) {
		if ( ! x.hasOwnProperty( p ) ) continue;
		if ( ! y.hasOwnProperty( p ) ) return false;
		if ( x[ p ] === y[ p ] ) continue;
		if ( typeof( x[ p ] ) !== "object" ) return false;
		if ( ! Object.equals( x[ p ],  y[ p ] ) ) return false;
	}
	for ( p in y ) {
		if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
	}
	return true;
}

$(document).ready(function(){
	var DMERGELY = $('\
<div id="test-mergely" style="border:1px solid #ccc;height:400px;width:400px;">\
	<div style="width:100%" id="mergely"></div>\
</div>');
	
	var init = function(options) {
		$('body').append(DMERGELY);
		console.log($('#test-mergely').length);
		var mergely = new Mgly.mergely();
		mergely.init($('#mergely'), {
			ignorews: (options && options['ignorews']) || false,
			height: function(h) { return 400; }
		});
		return mergely;
	};

	(function (JsUnit) {
		JsUnit.module('Tests');
		
		// Summary:
		//      Add one line to the rhs where the lhs is empty.
		// Description:
		//      This tests inserting one line in the rhs only.  The visual markup change for the
		//      lhs usually starts at the end of the change which, when drawing the border, is
		//      the bottom, but in this case, there are no lines, so there is no bottom.  In this
		//      case, the border must be drawn on the top.  The margin markup must also take this
		//      into account, and visually, it starts from the top of the line, rather than the
		//      bottom.  The rhs markup starts and ends on the same line.
		// Example:
		//                  one
		JsUnit.test('case-1-rhs-add-one-line', function() {
			mergely = init();
            mergely.lhs('');
            mergely.rhs('one');
			
            JsUnit.okay(mergely.get('lhs') == '', 'Expected ""');
            JsUnit.okay(mergely.get('rhs') == 'one', 'Expected "one"');
            var diff = '0a1\n'+
                '> one\n';
            JsUnit.okay(mergely.diff() == diff, 'Unexpected change diff');
            console.log('diff', mergely.diff());
			
            var d = new Mgly.diff(mergely.get('lhs'), mergely.get('rhs'));
            var changes = mergely._parse_diff('#mergely-lhs', '#mergely-rhs', d.normal_form());
            console.log('changes', changes);
            changes = mergely._calculate_offsets('mergely-lhs', 'mergely-rhs', changes);
            mergely._markup_changes('mergely-lhs', 'mergely-rhs', changes);
            console.log('changes', changes);
            JsUnit.okay(changes.length == 1, 'Expected 1 change');
            
            // test lhs classes
            var lhs_info = mergely.editor['mergely-lhs'].lineInfo(0);
            var classes = lhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'a', 'lhs', 'start'];
            var notok_classes = ['d', 'c', 'end'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs row to have class, "' + clazz + '"');
            }
			
            // test rhs classes
            var rhs_info = mergely.editor['mergely-rhs'].lineInfo(0);
            var classes = rhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'a', 'rhs', 'start', 'end'];
            var notok_classes = ['d', 'c'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs row to have class, "' + clazz + '"');
            }
            
            var rhs_info = mergely.editor['mergely-rhs'].lineInfo(0);
            var classes = lhs_info.bgClass.split(' ');
            for (var clazz in ['mergely', 'a', 'rhs', 'start', 'end']) {
                JsUnit.okay($.inArray(clazz, classes), 'Expected lhs row to have class, "' + clazz + '"');
            }
            
            var extents = mergely._get_extents();
            console.log('extents', extents);
            var valign = 2.0;//vertical, esthetic alignment
            var change = changes[0];
            // diff
            JsUnit.okay(change['lhs-line-from'] == 0, 'Expected lhs change to be start from 0');
            JsUnit.okay(change['lhs-line-to'] == 0, 'Expected lhs change to be finish at 0');
            JsUnit.okay(change['rhs-line-from'] == 0, 'Expected rhs change to be finish at 0');
            JsUnit.okay(change['rhs-line-to'] == 0, 'Expected rhs change to be finish at 0');
            // markup
            JsUnit.okay(change['lhs-y-start'] == change['rhs-y-start'], 'Expected lhs/rhs start to be the same');
            JsUnit.okay(change['lhs-y-end'] < change['rhs-y-end'], 'Expected lhs/rhs end to be different');
            JsUnit.okay(change['lhs-y-start'] > 0.0, 'Expected lhs start to be more than 0');
            JsUnit.okay(change['lhs-y-end'] > 0.0, 'Expected lhs end to be more than 0');
            JsUnit.okay(change['rhs-y-start'] > 0.0, 'Expected rhs start to be more than 0');
            JsUnit.okay(change['rhs-y-end'] > 0.0, 'Expected rhs end to be more than 0');
            JsUnit.okay(change['lhs-y-end'] == change['lhs-y-start'] - valign, 'Expected lhs start/end to be the same');
            JsUnit.okay(change['rhs-y-end'] == (change['rhs-y-start'] + extents['em-height'] * 1 - valign), 'Expected rhs end to be 1 line more');

			if (window[this.name] != true) {
				mergely.unbind();
				$('#test-mergely').remove();
			}
			window[this.name] = true;
		});
		
		// Summary:
		//      Add one line to the rhs at the end of text.
		// Description:
		//      This tests inserting one line in the rhs only at the end of text.  The visual markup 
		//      change for the lhs starts at the end of the lhs change (normal case), and the rhs 
		//      markup starts and ends on the same line.  This is normal insertion.
		// Example:
		//      one         one
		//                  two
		JsUnit.test('case-2-rhs-add-one-line-after', function() {
			mergely = init();
			mergely.lhs('one');
			mergely.rhs('one\ntwo');
			JsUnit.okay(mergely.get('lhs') == 'one', 'Expected "one"');
			JsUnit.okay(mergely.get('rhs') == 'one\ntwo', 'Expected "one two"');
			var diff = '1a2\n'+
				'> two\n';
			JsUnit.okay(mergely.diff() == diff, 'Unexpected change diff');
			console.log('diff', mergely.diff());
			
			var d = new Mgly.diff(mergely.get('lhs'), mergely.get('rhs'));
			var changes = mergely._parse_diff('#mergely-lhs', '#mergely-rhs', d.normal_form());
			console.log('changes', changes);
			changes = mergely._calculate_offsets('mergely-lhs', 'mergely-rhs', changes);
			mergely._markup_changes('mergely-lhs', 'mergely-rhs', changes);
			console.log('changes', changes);
			JsUnit.okay(changes.length == 1, 'Expected 1 change');
			
			// test lhs classes
			var lhs_info = mergely.editor['mergely-lhs'].lineInfo(0);
			var classes = lhs_info.bgClass.split(' ');
			var ok_classes = ['mergely', 'a', 'lhs', 'start', 'end'];
			var notok_classes = ['d', 'c'];
			for (var i in ok_classes) {
				var clazz = ok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
			}
			for (var i in notok_classes) {
				var clazz = notok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs row to have class, "' + clazz + '"');
			}
			
			// test rhs classes
			var rhs_info = mergely.editor['mergely-rhs'].lineInfo(1);
			var classes = rhs_info.bgClass.split(' ');
			var ok_classes = ['mergely', 'a', 'rhs', 'start', 'end'];
			var notok_classes = ['d', 'c'];
			for (var i in ok_classes) {
				var clazz = ok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
			}
			for (var i in notok_classes) {
				var clazz = notok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs row to have class, "' + clazz + '"');
			}
			
			var extents = mergely._get_extents();
			console.log('extents', extents);
			var valign = 2.0;//vertical, esthetic alignment
			var change = changes[0];
			// diff
			JsUnit.okay(change['lhs-line-from'] == 0, 'Expected lhs change to be start from 0');
			JsUnit.okay(change['lhs-line-to'] == 0, 'Expected lhs change to be finish at 0');
			JsUnit.okay(change['rhs-line-from'] == 1, 'Expected rhs change to be finish at 1');
			JsUnit.okay(change['rhs-line-to'] == 1, 'Expected rhs change to be finish at 1');
			// markup
			JsUnit.okay(change['lhs-y-start'] == change['rhs-y-start'], 'Expected lhs/rhs start to be the same');
			JsUnit.okay(change['lhs-y-end'] < change['rhs-y-end'], 'Expected lhs/rhs end to be different');
			JsUnit.okay(change['lhs-y-start'] > 0.0, 'Expected lhs start to be more than 0');
			JsUnit.okay(change['lhs-y-end'] > 0.0, 'Expected lhs end to be more than 0');
			JsUnit.okay(change['rhs-y-start'] > 0.0, 'Expected rhs start to be more than 0');
			JsUnit.okay(change['rhs-y-end'] > 0.0, 'Expected rhs end to be more than 0');
			JsUnit.okay(change['lhs-y-end'] == change['lhs-y-start'] - valign, 'Expected lhs start/end to be the same');
			JsUnit.okay(change['rhs-y-end'] == (change['rhs-y-start'] + extents['em-height'] * 1 - valign), 'Expected rhs end to be 1 line more');

			if (window[this.name] != true) {
				mergely.unbind();
				$('#test-mergely').remove();
			}
			window[this.name] = true;
		});
		
        // summary:
        //      Add one line to the rhs before the start of text.
        // description:
        //      This tests inserting one line in the rhs only before the start of text.  The 
        //      The visual markup change for the lhs starts at the end of the lhs change 
        //      (normal case), and the rhs markup starts and ends on the same line.  This is 
        //      normal insertion.
        // example:
        //      one         1
        //                  one
        JsUnit.test('case-3-rhs-add-one-line-before', function() {
			mergely = init();
            mergely.lhs('one');
            mergely.rhs('1\none');
            JsUnit.okay(mergely.get('lhs') == 'one', 'Expected "one"');
            JsUnit.okay(mergely.get('rhs') == '1\none', 'Expected "1 one"');
            var diff = '0a1\n'+
                '> 1\n';
            JsUnit.okay(mergely.diff() == diff, 'Unexpected change diff');
            console.log('diff', mergely.diff());
            
            var d = new Mgly.diff(mergely.get('lhs'), mergely.get('rhs'));
            var changes = mergely._parse_diff('#mergely-lhs', '#mergely-rhs', d.normal_form());
            console.log('changes', changes);
            changes = mergely._calculate_offsets('mergely-lhs', 'mergely-rhs', changes);
            mergely._markup_changes('mergely-lhs', 'mergely-rhs', changes);
            console.log('changes', changes);
            JsUnit.okay(changes.length == 1, 'Expected 1 change');
            
            // test lhs classes
            var lhs_info = mergely.editor['mergely-lhs'].lineInfo(0);
            var classes = lhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'a', 'lhs', 'start'];
            var notok_classes = ['d', 'c', 'end'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs row to have class, "' + clazz + '"');
            }
            
            // test rhs classes
            var rhs_info = mergely.editor['mergely-rhs'].lineInfo(0);
            var classes = rhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'a', 'rhs', 'start', 'end'];
            var notok_classes = ['d', 'c'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs row to have class, "' + clazz + '"');
            }
            
            var extents = mergely._get_extents();
            console.log('extents', extents);
            var valign = 2.0;//vertical, esthetic alignment
            var change = changes[0];
            // diff
            JsUnit.okay(change['lhs-line-from'] == 0, 'Expected lhs change to be start from 0');
            JsUnit.okay(change['lhs-line-to'] == 0, 'Expected lhs change to be finish at 0');
            JsUnit.okay(change['rhs-line-from'] == 0, 'Expected rhs change to be finish at 0');
            JsUnit.okay(change['rhs-line-to'] == 0, 'Expected rhs change to be finish at 0');
            // markup
            JsUnit.okay(change['lhs-y-start'] == change['rhs-y-start'], 'Expected lhs/rhs start to be the same');
            JsUnit.okay(change['lhs-y-end'] < change['rhs-y-end'], 'Expected lhs/rhs end to be different');
            JsUnit.okay(change['lhs-y-start'] > 0.0, 'Expected lhs start to be more than 0');
            JsUnit.okay(change['lhs-y-end'] > 0.0, 'Expected lhs end to be more than 0');
            JsUnit.okay(change['rhs-y-start'] > 0.0, 'Expected rhs start to be more than 0');
            JsUnit.okay(change['rhs-y-end'] > 0.0, 'Expected rhs end to be more than 0');
            JsUnit.okay(change['lhs-y-end'] == change['lhs-y-start'] - valign, 'Expected lhs start/end to be the same');
            JsUnit.okay(change['rhs-y-end'] == (change['rhs-y-start'] + extents['em-height'] * 1 - valign), 'Expected rhs end to be 1 line more');

			if (window[this.name] != true) {
				mergely.unbind();
				$('#test-mergely').remove();
			}
			window[this.name] = true;
        });

        // summary:
        //      Add one line to the rhs in the middle of text.
        // description:
        //      This tests inserting one line in the rhs only in the middle of text.  The visual markup 
        //      change for the lhs starts at the end of the lhs change (normal case), and the rhs 
        //      markup starts and ends on the same line.  This is normal insertion.
        // example:
        //      one         one
        //      three       two
        //                  three
        JsUnit.test('case-4-rhs-add-one-line-inbetween', function() {
            $('body').append($('<div id="test-mergely" style="border:1px solid #ccc;height:400px;width:400px;"><div style="width:100%" id="mergely"></div></div>'));
            var mergely = new Mgly.mergely;
            mergely.init($('#mergely'), {
                height: function(h) { return 400; }
            });
            mergely.lhs('one\nthree');
            mergely.rhs('one\ntwo\nthree');
            JsUnit.okay(mergely.get('lhs') == 'one\nthree', 'Expected "one three"');
            JsUnit.okay(mergely.get('rhs') == 'one\ntwo\nthree', 'Expected "one two three"');
            var diff = '1a2\n'+
                '> two\n';
            JsUnit.okay(mergely.diff() == diff, 'Unexpected change diff');
            console.log('diff', mergely.diff());
            
            var d = new Mgly.diff(mergely.get('lhs'), mergely.get('rhs'));
            var changes = mergely._parse_diff('#mergely-lhs', '#mergely-rhs', d.normal_form());
            console.log('changes', changes);
            changes = mergely._calculate_offsets('mergely-lhs', 'mergely-rhs', changes);
            mergely._markup_changes('mergely-lhs', 'mergely-rhs', changes);
            console.log('changes', changes);
            JsUnit.okay(changes.length == 1, 'Expected 1 change');
            
            // test lhs classes
            var lhs_info = mergely.editor['mergely-lhs'].lineInfo(0);
            var classes = lhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'a', 'lhs', 'start', 'end'];
            var notok_classes = ['d', 'c'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs row to have class, "' + clazz + '"');
            }
            
            // test rhs classes
            var rhs_info = mergely.editor['mergely-rhs'].lineInfo(1);
            var classes = rhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'a', 'rhs', 'start', 'end'];
            var notok_classes = ['d', 'c'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs row to have class, "' + clazz + '"');
            }
            
            var extents = mergely._get_extents();
            console.log('extents', extents);
            var valign = 2.0;//vertical, esthetic alignment
            var change = changes[0];
            // diff
            JsUnit.okay(change['lhs-line-from'] == 0, 'Expected lhs change to be start from 0');
            JsUnit.okay(change['lhs-line-to'] == 0, 'Expected lhs change to be finish at 0');
            JsUnit.okay(change['rhs-line-from'] == 1, 'Expected rhs change to be finish at 1');
            JsUnit.okay(change['rhs-line-to'] == 1, 'Expected rhs change to be finish at 1');
            // markup
            JsUnit.okay(change['lhs-y-start'] == change['rhs-y-start'], 'Expected lhs/rhs start to be the same');
            JsUnit.okay(change['lhs-y-end'] < change['rhs-y-end'], 'Expected lhs/rhs end to be different');
            JsUnit.okay(change['lhs-y-start'] > 0.0, 'Expected lhs start to be more than 0');
            JsUnit.okay(change['lhs-y-end'] > 0.0, 'Expected lhs end to be more than 0');
            JsUnit.okay(change['rhs-y-start'] > 0.0, 'Expected rhs start to be more than 0');
            JsUnit.okay(change['rhs-y-end'] > 0.0, 'Expected rhs end to be more than 0');
            JsUnit.okay(change['lhs-y-end'] == change['lhs-y-start'] - valign, 'Expected lhs start/end to be the same');
            JsUnit.okay(change['rhs-y-end'] == (change['rhs-y-start'] + extents['em-height'] * 1 - valign), 'Expected rhs end to be 1 line more');
			
			if (window[this.name] != true) {
				mergely.unbind();
				$('#test-mergely').remove();
			}
			window[this.name] = true;
        });
        
        // summary:
        //      Add three lines to the rhs in the middle of text.
        // description:
        //      This tests inserting three lines in the rhs only in the middle of text.  The visual markup 
        //      change for the lhs starts at the end of the lhs change (normal case), and the rhs 
        //      markup starts on line one of the first change, and the final line has 'end' markup
        // example:
        //      one         one
        //      five        two
        //                  three
        //                  four
        //                  five
        JsUnit.test('case-5-rhs-add-three-lines-inbetween', function() {
            $('body').append($('<div id="test-mergely" style="border:1px solid #ccc;height:400px;width:400px;"><div style="width:100%" id="mergely"></div></div>'));
            var mergely = new Mgly.mergely;
            mergely.init($('#mergely'), {
                height: function(h) { return 400; }
            });
            mergely.lhs('one\nfive');
            mergely.rhs('one\ntwo\nthree\nfour\nfive');
            JsUnit.okay(mergely.get('lhs') == 'one\nfive', 'Expected "one five"');
            JsUnit.okay(mergely.get('rhs') == 'one\ntwo\nthree\nfour\nfive', 'Expected "one two three four five"');
            var diff = '1a2,4\n'+
                '> two\n' +
                '> three\n' +
                '> four\n';
            JsUnit.okay(mergely.diff() == diff, 'Unexpected change diff');
            console.log('diff', mergely.diff());
            
            var d = new Mgly.diff(mergely.get('lhs'), mergely.get('rhs'));
            var changes = mergely._parse_diff('#mergely-lhs', '#mergely-rhs', d.normal_form());
            console.log('changes', changes);
            changes = mergely._calculate_offsets('mergely-lhs', 'mergely-rhs', changes);
            mergely._markup_changes('mergely-lhs', 'mergely-rhs', changes);
            console.log('changes', changes);
            JsUnit.okay(changes.length == 1, 'Expected 1 change');
            
            // test lhs classes
            var lhs_info = mergely.editor['mergely-lhs'].lineInfo(0);
            var classes = lhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'a', 'lhs', 'start', 'end'];
            var notok_classes = ['d', 'c'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs row to have class, "' + clazz + '"');
            }
            
            // test rhs classes
            var rhs_info = mergely.editor['mergely-rhs'].lineInfo(1);
            var classes = rhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'a', 'rhs', 'start'];
            var notok_classes = ['d', 'c', 'end'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs row to have class, "' + clazz + '"');
            }
            var rhs_info = mergely.editor['mergely-rhs'].lineInfo(2);
            var classes = rhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'a', 'rhs'];
            var notok_classes = ['d', 'c', 'start', 'end'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs row to have class, "' + clazz + '"');
            }
            var rhs_info = mergely.editor['mergely-rhs'].lineInfo(3);
            var classes = rhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'a', 'rhs', 'end'];
            var notok_classes = ['d', 'c', 'start'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs row to have class, "' + clazz + '"');
            }

            var extents = mergely._get_extents();
            console.log('extents', extents);
            var valign = 2.0;//vertical, esthetic alignment
            var change = changes[0];
            // diff
            JsUnit.okay(change['lhs-line-from'] == 0, 'Expected lhs change to be start from 0');
            JsUnit.okay(change['lhs-line-to'] == 0, 'Expected lhs change to be finish at 0');
            JsUnit.okay(change['rhs-line-from'] == 1, 'Expected rhs change to be finish at 1');
            JsUnit.okay(change['rhs-line-to'] == 3, 'Expected rhs change to be finish at 3');
            // markup
            JsUnit.okay(change['lhs-y-start'] == change['rhs-y-start'], 'Expected lhs/rhs start to be the same');
            JsUnit.okay(change['lhs-y-end'] < change['rhs-y-end'], 'Expected lhs/rhs end to be different');
            JsUnit.okay(change['lhs-y-start'] > 0.0, 'Expected lhs start to be more than 0');
            JsUnit.okay(change['lhs-y-end'] > 0.0, 'Expected lhs end to be more than 0');
            JsUnit.okay(change['rhs-y-start'] > 0.0, 'Expected rhs start to be more than 0');
            JsUnit.okay(change['rhs-y-end'] > 0.0, 'Expected rhs end to be more than 0');
            JsUnit.okay(change['lhs-y-end'] == change['lhs-y-start'] - valign, 'Expected lhs start/end to be the same');
            JsUnit.okay(change['rhs-y-end'] == (change['rhs-y-start'] + extents['em-height'] * 3 - valign), 'Expected rhs end to be 3 line more');
			
			if (window[this.name] != true) {
				mergely.unbind();
				$('#test-mergely').remove();
			}
			window[this.name] = true;
        });
        
        // summary:
        //      Remove one line from the lhs where the rhs is empty.
        // description:
        //      This tests removing one line from the lhs only.  The visual markup change for the
        //      rhs usually starts at the end of the change which, when drawing the border, is
        //      the bottom, but in this case, there are no lines, so there is no bottom.  In this
        //      case, the border must be drawn on the top.  The margin markup must also take this
        //      into account, and visually, it starts from the top of the line, rather than the
        //      bottom.  The rhs markup starts and ends on the same line.
        // example:
        //      one         
        JsUnit.test('case-6-lhs-remove-one-line', function() {
            $('body').append($('<div id="test-mergely" style="border:1px solid #ccc;height:400px;width:400px;"><div style="width:100%" id="mergely"></div></div>'));
            var mergely = new Mgly.mergely;
            mergely.init($('#mergely'), {
                height: function(h) { return 400; }
            });
            mergely.lhs('one');
            mergely.rhs('');
            JsUnit.okay(mergely.get('rhs') == '', 'Expected ""');
            JsUnit.okay(mergely.get('lhs') == 'one', 'Expected "one"');
            var diff = '1d0\n'+
                '< one\n';
            JsUnit.okay(mergely.diff() == diff, 'Unexpected change diff');
            console.log('diff', mergely.diff());
            
            var d = new Mgly.diff(mergely.get('lhs'), mergely.get('rhs'));
            var changes = mergely._parse_diff('#mergely-lhs', '#mergely-rhs', d.normal_form());
            console.log('changes', changes);
            changes = mergely._calculate_offsets('mergely-lhs', 'mergely-rhs', changes);
            mergely._markup_changes('mergely-lhs', 'mergely-rhs', changes);
            console.log('changes', changes);
            JsUnit.okay(changes.length == 1, 'Expected 1 change');
            
            // test lhs classes
            var lhs_info = mergely.editor['mergely-lhs'].lineInfo(0);
            var classes = lhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'd', 'lhs', 'start', 'end'];
            var notok_classes = ['a', 'c'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs row to have class, "' + clazz + '"');
            }
            
            // test rhs classes
            var rhs_info = mergely.editor['mergely-rhs'].lineInfo(0);
            var classes = rhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'd', 'rhs', 'start'];
            var notok_classes = ['a', 'c', 'end'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs row to have class, "' + clazz + '"');
            }
            
            var rhs_info = mergely.editor['mergely-rhs'].lineInfo(0);
            var classes = lhs_info.bgClass.split(' ');
            for (var clazz in ['mergely', 'a', 'rhs', 'start', 'end']) {
                JsUnit.okay($.inArray(clazz, classes), 'Expected lhs row to have class, "' + clazz + '"');
            }
            
            var extents = mergely._get_extents();
            console.log('extents', extents);
            var valign = 2.0;//vertical, esthetic alignment
            var change = changes[0];
            // diff
            JsUnit.okay(change['lhs-line-from'] == 0, 'Expected lhs change to be start from 0');
            JsUnit.okay(change['lhs-line-to'] == 0, 'Expected lhs change to be finish at 0');
            JsUnit.okay(change['rhs-line-from'] == 0, 'Expected rhs change to be finish at 0');
            JsUnit.okay(change['rhs-line-to'] == 0, 'Expected rhs change to be finish at 0');
            // markup
            JsUnit.okay(change['lhs-y-start'] == change['rhs-y-start'], 'Expected lhs/rhs start to be the same');
            JsUnit.okay(change['lhs-y-end'] != change['rhs-y-end'], 'Expected lhs/rhs end to be the different');
            JsUnit.okay(change['lhs-y-start'] > 0.0, 'Expected lhs start to be more than 0');
            JsUnit.okay(change['lhs-y-end'] > 0.0, 'Expected lhs end to be more than 0');
            JsUnit.okay(change['rhs-y-start'] > 0.0, 'Expected rhs start to be more than 0');
            JsUnit.okay(change['rhs-y-end'] > 0.0, 'Expected rhs end to be more than 0');
            JsUnit.okay(change['rhs-y-end'] == change['rhs-y-start'] - valign, 'Expected rhs start/end to be the same');
            JsUnit.okay(change['lhs-y-end'] == (change['lhs-y-start'] + extents['em-height'] * 1 - valign), 'Expected lhs end to be 1 line more');
			
			if (window[this.name] != true) {
				mergely.unbind();
				$('#test-mergely').remove();
			}
			window[this.name] = true;
        });
        
        // summary:
        //      Remove one line from the lhs at the end of text.
        // description:
        //      This tests inserting one line in the rhs only at the end of text.  The visual markup 
        //      change for the lhs starts at the end of the lhs change (normal case), and the rhs 
        //      markup starts and ends on the same line.  This is normal insertion.
        // example:
        //      one         one
        //      two         
        JsUnit.test('case-7-lhs-remove-one-line-at-end', function() {
            $('body').append($('<div id="test-mergely" style="border:1px solid #ccc;height:400px;width:400px;"><div style="width:100%" id="mergely"></div></div>'));
            var mergely = new Mgly.mergely;
            mergely.init($('#mergely'), {
                height: function(h) { return 400; }
            });
            mergely.lhs('one\ntwo');
            mergely.rhs('one');
            JsUnit.okay(mergely.get('lhs') == 'one\ntwo', 'Expected "one two"');
            JsUnit.okay(mergely.get('rhs') == 'one', 'Expected "one"');
            var diff = '2d1\n'+
                '< two\n';
            JsUnit.okay(mergely.diff() == diff, 'Unexpected change diff');
            console.log('diff', mergely.diff());
            
            var d = new Mgly.diff(mergely.get('lhs'), mergely.get('rhs'));
            var changes = mergely._parse_diff('#mergely-lhs', '#mergely-rhs', d.normal_form());
            console.log('changes', changes);
            changes = mergely._calculate_offsets('mergely-lhs', 'mergely-rhs', changes);
            mergely._markup_changes('mergely-lhs', 'mergely-rhs', changes);
            console.log('changes', changes);
            JsUnit.okay(changes.length == 1, 'Expected 1 change');
            
            // test lhs classes
            var lhs_info = mergely.editor['mergely-lhs'].lineInfo(1);
            var classes = lhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'd', 'lhs', 'start', 'end'];
            var notok_classes = ['a', 'c'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs row to have class, "' + clazz + '"');
            }
            
            // test rhs classes
            var rhs_info = mergely.editor['mergely-rhs'].lineInfo(0);
            var classes = rhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'd', 'rhs', 'start', 'end'];
            var notok_classes = ['a', 'c'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs row to have class, "' + clazz + '"');
            }
            
            var extents = mergely._get_extents();
            console.log('extents', extents);
            var valign = 2.0;//vertical, esthetic alignment
            var change = changes[0];
            // diff
            JsUnit.okay(change['lhs-line-from'] == 1, 'Expected lhs change to be start from 1');
            JsUnit.okay(change['lhs-line-to'] == 1, 'Expected lhs change to be finish at 1');
            JsUnit.okay(change['rhs-line-from'] == 0, 'Expected rhs change to be finish at 0');
            JsUnit.okay(change['rhs-line-to'] == 0, 'Expected rhs change to be finish at 0');
            // markup
            JsUnit.okay(change['lhs-y-start'] == change['rhs-y-start'], 'Expected lhs/rhs start to be the same');
            JsUnit.okay(change['lhs-y-end'] != change['rhs-y-end'], 'Expected lhs/rhs end to be different');
            JsUnit.okay(change['lhs-y-start'] > 0.0, 'Expected lhs start to be more than 0');
            JsUnit.okay(change['lhs-y-end'] > 0.0, 'Expected lhs end to be more than 0');
            JsUnit.okay(change['rhs-y-start'] > 0.0, 'Expected rhs start to be more than 0');
            JsUnit.okay(change['rhs-y-end'] > 0.0, 'Expected rhs end to be more than 0');
            JsUnit.okay(change['rhs-y-end'] == change['rhs-y-start'] - valign, 'Expected rhs start/end to be the same');
            JsUnit.okay(change['lhs-y-end'] == (change['rhs-y-start'] + extents['em-height'] * 1 - valign), 'Expected rhs end to be 1 line more');
			
			if (window[this.name] != true) {
				mergely.unbind();
				$('#test-mergely').remove();
			}
			window[this.name] = true;
        });
        
        // summary:
        //      Remove one line from the lhs before the start of text.
        // description:
        //      This tests removing one line from the lhs before the start of text.  The 
        //      The visual markup change for the lhs starts at the end of the lhs change 
        //      (normal case), and the rhs markup starts and ends on the same line.  This is 
        //      normal insertion.
        // example:
        //      1           one
        //      one
        JsUnit.test('case-8-lhs-remove-one-line-before', function() {
            $('body').append($('<div id="test-mergely" style="border:1px solid #ccc;height:400px;width:400px;"><div style="width:100%" id="mergely"></div></div>'));
            var mergely = new Mgly.mergely;
            mergely.init($('#mergely'), {
                height: function(h) { return 400; }
            });
            mergely.lhs('1\none');
            mergely.rhs('one');
            JsUnit.okay(mergely.get('lhs') == '1\none', 'Expected "1 one"');
            JsUnit.okay(mergely.get('rhs') == 'one', 'Expected "one"');
            var diff = '1d0\n'+
                '< 1\n';
            JsUnit.okay(mergely.diff() == diff, 'Unexpected change diff');
            console.log('diff', mergely.diff());
            
            var d = new Mgly.diff(mergely.get('lhs'), mergely.get('rhs'));
            var changes = mergely._parse_diff('#mergely-lhs', '#mergely-rhs', d.normal_form());
            console.log('changes', changes);
            changes = mergely._calculate_offsets('mergely-lhs', 'mergely-rhs', changes);
            mergely._markup_changes('mergely-lhs', 'mergely-rhs', changes);
            console.log('changes', changes);
            JsUnit.okay(changes.length == 1, 'Expected 1 change');
            
            // test lhs classes
            var lhs_info = mergely.editor['mergely-lhs'].lineInfo(0);
            var classes = lhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'd', 'lhs', 'start', 'end'];
            var notok_classes = ['a', 'c'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs row to have class, "' + clazz + '"');
            }
            
            // test rhs classes
            var rhs_info = mergely.editor['mergely-rhs'].lineInfo(0);
            var classes = rhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'd', 'rhs', 'start'];
            var notok_classes = ['a', 'c'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs row to have class, "' + clazz + '"');
            }
            
            var extents = mergely._get_extents();
            console.log('extents', extents);
            var valign = 2.0;//vertical, esthetic alignment
            var change = changes[0];
            // diff
            JsUnit.okay(change['lhs-line-from'] == 0, 'Expected lhs change to be start from 0');
            JsUnit.okay(change['lhs-line-to'] == 0, 'Expected lhs change to be finish at 0');
            JsUnit.okay(change['rhs-line-from'] == 0, 'Expected rhs change to be finish at 0');
            JsUnit.okay(change['rhs-line-to'] == 0, 'Expected rhs change to be finish at 0');
            // markup
            JsUnit.okay(change['lhs-y-start'] == change['rhs-y-start'], 'Expected lhs/rhs start to be the same');
            JsUnit.okay(change['lhs-y-end'] != change['rhs-y-end'], 'Expected lhs/rhs end to be different');
            JsUnit.okay(change['lhs-y-start'] > 0.0, 'Expected lhs start to be more than 0');
            JsUnit.okay(change['lhs-y-end'] > 0.0, 'Expected lhs end to be more than 0');
            JsUnit.okay(change['rhs-y-start'] > 0.0, 'Expected rhs start to be more than 0');
            JsUnit.okay(change['rhs-y-end'] > 0.0, 'Expected rhs end to be more than 0');
            JsUnit.okay(change['rhs-y-end'] == change['rhs-y-start'] - valign, 'Expected rhs start/end to be the same');
            JsUnit.okay(change['lhs-y-end'] == (change['lhs-y-start'] + extents['em-height'] * 1 - valign), 'Expected lhs end to be 1 line more');
			
			if (window[this.name] != true) {
				mergely.unbind();
				$('#test-mergely').remove();
			}
			window[this.name] = true;
        });
        
        // summary:
        //      Remove one line from the lhs in the middle of text.
        // description:
        //      This tests removing one line from the lhs in the middle of text.  The visual markup
        //      change for the rhs start at the end of the rhs change (normal case), and the lhs
        //      markup starts and ends on the same line.  This is normal delete.
        // example:
        //      one         one
        //      two         three
        //      three
        JsUnit.test('case-9-rhs-remove-one-line-inbetween', function() {
            $('body').append($('<div id="test-mergely" style="border:1px solid #ccc;height:400px;width:400px;"><div style="width:100%" id="mergely"></div></div>'));
            var mergely = new Mgly.mergely;
            mergely.init($('#mergely'), {
                height: function(h) { return 400; }
            });
            mergely.lhs('one\ntwo\nthree');
            mergely.rhs('one\nthree');
            JsUnit.okay(mergely.get('lhs') == 'one\ntwo\nthree', 'Expected "one two three"');
            JsUnit.okay(mergely.get('rhs') == 'one\nthree', 'Expected "one three"');
            var diff = '2d1\n'+
                '< two\n';
            JsUnit.okay(mergely.diff() == diff, 'Unexpected change diff');
            console.log('diff', mergely.diff());
            
            var d = new Mgly.diff(mergely.get('lhs'), mergely.get('rhs'));
            var changes = mergely._parse_diff('#mergely-lhs', '#mergely-rhs', d.normal_form());
            console.log('changes', changes);
            changes = mergely._calculate_offsets('mergely-lhs', 'mergely-rhs', changes);
            mergely._markup_changes('mergely-lhs', 'mergely-rhs', changes);
            console.log('changes', changes);
            JsUnit.okay(changes.length == 1, 'Expected 1 change');
            
            // test lhs classes
            var lhs_info = mergely.editor['mergely-lhs'].lineInfo(1);
            var classes = lhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'd', 'lhs', 'start', 'end'];
            var notok_classes = ['a', 'c'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs row to have class, "' + clazz + '"');
            }
            
            // test rhs classes
            var rhs_info = mergely.editor['mergely-rhs'].lineInfo(0);
            var classes = rhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'd', 'rhs', 'start', 'end'];
            var notok_classes = ['a', 'c'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs row to have class, "' + clazz + '"');
            }
            
            var extents = mergely._get_extents();
            console.log('extents', extents);
            var valign = 2.0;//vertical, esthetic alignment
            var change = changes[0];
            // diff
            JsUnit.okay(change['lhs-line-from'] == 1, 'Expected lhs change to be start from 1');
            JsUnit.okay(change['lhs-line-to'] == 1, 'Expected lhs change to be finish at 1');
            JsUnit.okay(change['rhs-line-from'] == 0, 'Expected rhs change to be finish at 0');
            JsUnit.okay(change['rhs-line-to'] == 0, 'Expected rhs change to be finish at 0');
            // markup
            JsUnit.okay(change['lhs-y-start'] == change['rhs-y-start'], 'Expected lhs/rhs start to be the same');
            JsUnit.okay(change['lhs-y-end'] != change['rhs-y-end'], 'Expected lhs/rhs end to be different');
            JsUnit.okay(change['lhs-y-start'] > 0.0, 'Expected lhs start to be more than 0');
            JsUnit.okay(change['lhs-y-end'] > 0.0, 'Expected lhs end to be more than 0');
            JsUnit.okay(change['rhs-y-start'] > 0.0, 'Expected rhs start to be more than 0');
            JsUnit.okay(change['rhs-y-end'] > 0.0, 'Expected rhs end to be more than 0');
            JsUnit.okay(change['rhs-y-end'] == change['rhs-y-start'] - valign, 'Expected rhs start/end to be the same');
            JsUnit.okay(change['lhs-y-end'] == (change['lhs-y-start'] + extents['em-height'] * 1 - valign), 'Expected lhs end to be 1 line more');
			
			if (window[this.name] != true) {
				mergely.unbind();
				$('#test-mergely').remove();
			}
			window[this.name] = true;
        });
        
        // summary:
        //      Remove three lines from the lhs in the middle of text.
        // description:
        //      This tests the removal of three lines from the lhs in the middle of text.
        //      
        //      This tests inserting three lines in the rhs only in the middle of text.  The visual markup 
        //      change for the lhs starts at the end of the lhs change (normal case), and the rhs 
        //      markup starts on line one of the first change, and the final line has 'end' markup.
        // example:
        //      one         one
        //      two         five
        //      three
        //      four
        //      five
        JsUnit.test('case-10-lhs-remove-three-lines-inbetween', function() {
            $('body').append($('<div id="test-mergely" style="border:1px solid #ccc;height:400px;width:400px;"><div style="width:100%" id="mergely"></div></div>'));
            var mergely = new Mgly.mergely;
            mergely.init($('#mergely'), {
                height: function(h) { return 400; }
            });
            mergely.lhs('one\ntwo\nthree\nfour\nfive');
            mergely.rhs('one\nfive');
            JsUnit.okay(mergely.get('lhs') == 'one\ntwo\nthree\nfour\nfive', 'Expected "one two three four five"');
            JsUnit.okay(mergely.get('rhs') == 'one\nfive', 'Expected "one five"');
            var diff = '2,4d1\n'+
                '< two\n' +
                '< three\n' +
                '< four\n';
            JsUnit.okay(mergely.diff() == diff, 'Unexpected change diff');
            console.log('diff', mergely.diff());
            
            var d = new Mgly.diff(mergely.get('lhs'), mergely.get('rhs'));
            var changes = mergely._parse_diff('#mergely-lhs', '#mergely-rhs', d.normal_form());
            console.log('changes', changes);
            changes = mergely._calculate_offsets('mergely-lhs', 'mergely-rhs', changes);
            mergely._markup_changes('mergely-lhs', 'mergely-rhs', changes);
            console.log('changes', changes);
            JsUnit.okay(changes.length == 1, 'Expected 1 change');
            
            // test lhs classes
            var lhs_info = mergely.editor['mergely-lhs'].lineInfo(1);
            var classes = lhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'd', 'lhs', 'start'];
            var notok_classes = ['a', 'c', 'end'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs row to have class, "' + clazz + '"');
            }
            var lhs_info = mergely.editor['mergely-lhs'].lineInfo(2);
            var classes = lhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'd', 'lhs'];
            var notok_classes = ['a', 'c', 'start', 'end'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs row to have class, "' + clazz + '"');
            }
            var lhs_info = mergely.editor['mergely-lhs'].lineInfo(3);
            var classes = lhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'd', 'lhs', 'end'];
            var notok_classes = ['a', 'c', 'start'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs row to have class, "' + clazz + '"');
            }
            
            // test rhs classes
            var rhs_info = mergely.editor['mergely-rhs'].lineInfo(0);
            var classes = rhs_info.bgClass.split(' ');
            var ok_classes = ['mergely', 'd', 'rhs', 'start', 'end'];
            var notok_classes = ['a', 'c'];
            for (var i in ok_classes) {
                var clazz = ok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
            }
            for (var i in notok_classes) {
                var clazz = notok_classes[i];
                JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs row to have class, "' + clazz + '"');
            }

            var extents = mergely._get_extents();
            console.log('extents', extents);
            var valign = 2.0;//vertical, esthetic alignment
            var change = changes[0];
            // diff
            JsUnit.okay(change['lhs-line-from'] == 1, 'Expected lhs change to be start from 1');
            JsUnit.okay(change['lhs-line-to'] == 3, 'Expected lhs change to be finish at 3');
            JsUnit.okay(change['rhs-line-from'] == 0, 'Expected rhs change to be finish at 0');
            JsUnit.okay(change['rhs-line-to'] == 0, 'Expected rhs change to be finish at 0');
            // markup
            JsUnit.okay(change['lhs-y-start'] == change['rhs-y-start'], 'Expected lhs/rhs start to be the same');
            JsUnit.okay(change['lhs-y-end'] != change['rhs-y-end'], 'Expected lhs/rhs end to be different');
            JsUnit.okay(change['lhs-y-start'] > 0.0, 'Expected lhs start to be more than 0');
            JsUnit.okay(change['lhs-y-end'] > 0.0, 'Expected lhs end to be more than 0');
            JsUnit.okay(change['rhs-y-start'] > 0.0, 'Expected rhs start to be more than 0');
            JsUnit.okay(change['rhs-y-end'] > 0.0, 'Expected rhs end to be more than 0');
            JsUnit.okay(change['rhs-y-end'] == change['rhs-y-start'] - valign, 'Expected rhs start/end to be the same');
            JsUnit.okay(change['lhs-y-end'] == (change['lhs-y-start'] + extents['em-height'] * 3 - valign), 'Expected rhs end to be 3 line more');
			
			if (window[this.name] != true) {
				mergely.unbind();
				$('#test-mergely').remove();
			}
			window[this.name] = true;
        });
		
		JsUnit.test('case-11-diff-file-100k-same', function() {
			var data = macbeth.join('\n');
			console.log('size', data.length);
			var t0 = new Date().getTime();
			var diff = new Mgly.diff(data, data);
			var t1 = new Date().getTime();
			console.log('diff', diff, 'time: ' + (t1 - t0));
		});

		JsUnit.test('case-11-diff-file-500k-many-changes', function() {
			var data = '';
			for (var i = 0; i < 5; ++i) {
				data += macbeth.join('\n');
			}
			// replace ',' with '$' in all lines
			var data2 = data.replace(/,/g, '$');
			console.log('size', data.length);
			console.log('size', data2.length);
			var t0 = new Date().getTime();
			var diff = new Mgly.diff(data, data2);
			var t1 = new Date().getTime();
			console.log('diff', diff, 'time: ' + (t1 - t0));
		});

		// Summary:
		//      Compare two lines where only difference is white-space, with ignore white-space disabled.
		// Description:
		//      This tests comparing two lines that differ only in white-space, without ignoring 
		//		white-space.
		// Example:
		//      one         one.
		//      two         .two
		JsUnit.test('case-12-whitespace-not-ignore', function() {
			mergely = init();
			mergely.lhs('one\ntwo');
			mergely.rhs('one\t\n two');
			JsUnit.okay(mergely.get('lhs') == 'one\ntwo', 'Expected "one\ntwo"');
			JsUnit.okay(mergely.get('rhs') == 'one\t\n two', 'Expected "one\t\n two"');
			var diff = '1,2c1,2\n' +
				'< one\n' +
				'< two\n' +
				'---\n' +
				'> one\t\n' +
				'>  two\n';
			JsUnit.okay(mergely.diff() == diff, 'Unexpected change diff');
			console.log('diff', mergely.diff());
			
			var d = new Mgly.diff(mergely.get('lhs'), mergely.get('rhs'));
			var changes = mergely._parse_diff('#mergely-lhs', '#mergely-rhs', d.normal_form());
			console.log('changes', changes);
			changes = mergely._calculate_offsets('mergely-lhs', 'mergely-rhs', changes);
			mergely._markup_changes('mergely-lhs', 'mergely-rhs', changes);
			console.log('changes', changes);
			JsUnit.okay(changes.length == 1, 'Expected 1 change');
			
			// test lhs classes
			var lhs_info = mergely.editor['mergely-lhs'].lineInfo(0);
			var classes = lhs_info.bgClass.split(' ');
			var ok_classes = ['mergely', 'c', 'lhs', 'start'];
			var notok_classes = ['d', 'a', 'end'];
			for (var i in ok_classes) {
				var clazz = ok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs[0] row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
			}
			for (var i in notok_classes) {
				var clazz = notok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs[0] row to have class, "' + clazz + '"');
			}
			lhs_info = mergely.editor['mergely-lhs'].lineInfo(1);
			classes = lhs_info.bgClass.split(' ');
			ok_classes = ['mergely', 'c', 'lhs', 'end'];
			notok_classes = ['d', 'a', 'start'];
			for (var i in ok_classes) {
				var clazz = ok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs[1] row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
			}
			for (var i in notok_classes) {
				var clazz = notok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs[1] row to have class, "' + clazz + '"');
			}
			
			// test rhs classes
			var rhs_info = mergely.editor['mergely-rhs'].lineInfo(0);
			var classes = rhs_info.bgClass.split(' ');
			var ok_classes = ['mergely', 'c', 'rhs', 'start'];
			var notok_classes = ['d', 'a', 'end'];
			for (var i in ok_classes) {
				var clazz = ok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row[0] to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
			}
			for (var i in notok_classes) {
				var clazz = notok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs[0] row to have class, "' + clazz + '"');
			}
			var rhs_info = mergely.editor['mergely-rhs'].lineInfo(1);
			classes = rhs_info.bgClass.split(' ');
			ok_classes = ['mergely', 'a', 'rhs', 'end'];
			notok_classes = ['d', 'start'];
			for (var i in ok_classes) {
				var clazz = ok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row[1] to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
			}
			for (var i in notok_classes) {
				var clazz = notok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs[1] row to have class, "' + clazz + '"');
			}
			
			var extents = mergely._get_extents();
			console.log('extents', extents);
			var valign = 2.0;//vertical, esthetic alignment
			var change = changes[0];
			// diff
			JsUnit.okay(change['lhs-line-from'] == 0, 'Expected lhs change to be start from 0');
			JsUnit.okay(change['lhs-line-to'] == 1, 'Expected lhs change to be finish at 1');
			JsUnit.okay(change['rhs-line-from'] == 0, 'Expected rhs change to be finish at 0');
			JsUnit.okay(change['rhs-line-to'] == 1, 'Expected rhs change to be finish at 1');
			// markup
			JsUnit.okay(change['lhs-y-start'] == change['rhs-y-start'], 'Expected lhs/rhs start to be the same');
			JsUnit.okay(change['lhs-y-end'] == change['rhs-y-end'], 'Expected lhs/rhs end to be the same');
			JsUnit.okay(change['lhs-y-start'] > 0.0, 'Expected lhs start to be more than 0');
			JsUnit.okay(change['lhs-y-end'] > 0.0, 'Expected lhs end to be more than 0');
			JsUnit.okay(change['rhs-y-start'] > 0.0, 'Expected rhs start to be more than 0');
			JsUnit.okay(change['rhs-y-end'] > 0.0, 'Expected rhs end to be more than 0');

			if (window[this.name] != true) {
				mergely.unbind();
				$('#test-mergely').remove();
			}
			window[this.name] = true;
		});

		// Summary:
		//      Compare two lines where only difference is white-space, with ignore white-space.
		// Description:
		//      This tests comparing two lines that differ only in white-space, ignoring 
		//		white-space.
		// Example:
		//      one         one.
		//      two         .two
		JsUnit.test('case-13-whitespace-ignore', function() {
			mergely = init({ignorews: true});
			mergely.lhs('one\ntwo');
			mergely.rhs('one\t\n two');
			JsUnit.okay(mergely.get('lhs') == 'one\ntwo', 'Expected "one\ntwo"');
			JsUnit.okay(mergely.get('rhs') == 'one\t\n two', 'Expected "one\t\n two"');
			var diff = '';
			JsUnit.okay(mergely.diff() == diff, 'Unexpected change diff');
			console.log('diff', mergely.diff());
			
			var d = new Mgly.diff(mergely.get('lhs'), mergely.get('rhs'));
			var changes = mergely._parse_diff('#mergely-lhs', '#mergely-rhs', d.normal_form());
			console.log('changes', changes);
			changes = mergely._calculate_offsets('mergely-lhs', 'mergely-rhs', changes);
			mergely._markup_changes('mergely-lhs', 'mergely-rhs', changes);
			console.log('changes', changes);
			JsUnit.okay(changes.length == 1, 'Expected 1 change');
			
			// test lhs classes
			var lhs_info = mergely.editor['mergely-lhs'].lineInfo(0);
			var classes = lhs_info.bgClass.split(' ');
			var ok_classes = ['mergely', 'c', 'lhs', 'start'];
			var notok_classes = ['d', 'a', 'end'];
			for (var i in ok_classes) {
				var clazz = ok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs[0] row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
			}
			for (var i in notok_classes) {
				var clazz = notok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs[0] row to have class, "' + clazz + '"');
			}
			lhs_info = mergely.editor['mergely-lhs'].lineInfo(1);
			classes = lhs_info.bgClass.split(' ');
			ok_classes = ['mergely', 'c', 'lhs', 'end'];
			notok_classes = ['d', 'a', 'start'];
			for (var i in ok_classes) {
				var clazz = ok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected lhs[1] row to have class, "' + clazz + '", classes: ' + lhs_info.bgClass);
			}
			for (var i in notok_classes) {
				var clazz = notok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect lhs[1] row to have class, "' + clazz + '"');
			}
			
			// test rhs classes
			var rhs_info = mergely.editor['mergely-rhs'].lineInfo(0);
			var classes = rhs_info.bgClass.split(' ');
			var ok_classes = ['mergely', 'c', 'rhs', 'start'];
			var notok_classes = ['d', 'a', 'end'];
			for (var i in ok_classes) {
				var clazz = ok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row[0] to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
			}
			for (var i in notok_classes) {
				var clazz = notok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs[0] row to have class, "' + clazz + '"');
			}
			var rhs_info = mergely.editor['mergely-rhs'].lineInfo(1);
			classes = rhs_info.bgClass.split(' ');
			ok_classes = ['mergely', 'a', 'rhs', 'end'];
			notok_classes = ['d', 'start'];
			for (var i in ok_classes) {
				var clazz = ok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) >= 0, 'Expected rhs row[1] to have class, "' + clazz + '", classes: ' + rhs_info.bgClass);
			}
			for (var i in notok_classes) {
				var clazz = notok_classes[i];
				JsUnit.okay($.inArray(clazz, classes) < 0, 'Did not expect rhs[1] row to have class, "' + clazz + '"');
			}
			
			var extents = mergely._get_extents();
			console.log('extents', extents);
			var valign = 2.0;//vertical, esthetic alignment
			var change = changes[0];
			// diff
			JsUnit.okay(change['lhs-line-from'] == 0, 'Expected lhs change to be start from 0');
			JsUnit.okay(change['lhs-line-to'] == 1, 'Expected lhs change to be finish at 1');
			JsUnit.okay(change['rhs-line-from'] == 0, 'Expected rhs change to be finish at 0');
			JsUnit.okay(change['rhs-line-to'] == 1, 'Expected rhs change to be finish at 1');
			// markup
			JsUnit.okay(change['lhs-y-start'] == change['rhs-y-start'], 'Expected lhs/rhs start to be the same');
			JsUnit.okay(change['lhs-y-end'] == change['rhs-y-end'], 'Expected lhs/rhs end to be the same');
			JsUnit.okay(change['lhs-y-start'] > 0.0, 'Expected lhs start to be more than 0');
			JsUnit.okay(change['lhs-y-end'] > 0.0, 'Expected lhs end to be more than 0');
			JsUnit.okay(change['rhs-y-start'] > 0.0, 'Expected rhs start to be more than 0');
			JsUnit.okay(change['rhs-y-end'] > 0.0, 'Expected rhs end to be more than 0');

			if (window[this.name] != true) {
				mergely.unbind();
				$('#test-mergely').remove();
			}
			window[this.name] = true;
		});
		
		JsUnit.start();
	}(JsUnit));
});


