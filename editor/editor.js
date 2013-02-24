String.prototype.random = function(length) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var randomstring = ''
	for (var i=0; i<length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}
function getParameters() {
	var parameters = {};
	window.location.search.substr(1).split('&').forEach(function(pair) {
		if (pair === '') return;
		var parts = pair.split('=');
		if (parts[1] == 'true') parameters[parts[0]] = true;
		else if (parts[1] == 'false') parameters[parts[0]] = false;
		else parameters[parts[0]] = parts[1] && decodeURIComponent(parts[1].replace(/\+/g, ' '));
	});
	return {
		get: function(name, defaultValue) {
			if (parameters.hasOwnProperty(name)) return parameters[name];
			return defaultValue;
		}
	};
}

$(document).ready(function () {
	$('.button-search').button({icons:{primary:'ui-icon-search'}, text:false});
	$('.button-merger').button({icons:{primary:'ui-icon-arrowreturnthick-1-e'}, text:false});
	$('.button-mergel').button({icons:{primary:'ui-icon-arrowreturnthick-1-w'}, text:false});
	$('.button-swap').button({icons:{primary:'ui-icon-transferthick-e-w'}, text:false});
	$('.button-clear').button({icons:{primary:'ui-icon-circle-close'}, text:false});
	$('.button-download').button({icons:{primary:'ui-icon-disk'}, text:false});
	$('.button-upload').button({icons:{primary:'ui-icon-folder-open'}, text:false});
	$('.button-share').button({icons:{primary:'ui-icon-triangle-1-s'}, text:true});
	$('button').button();
	$('.button-download-diff').button({icons:{primary:'ui-icon-script'}, text:false});
	$('#new').on('click', function() {
		window.location = '/';
	});
	$('#share').on({
		mouseenter: function () { $('#share-menu').fadeIn(500); },
		mouseleave: function () {
			if (hover_timeout) clearTimeout(hover_timeout);
			hover_timeout = setTimeout(function(){$('#share-menu').hide();}, 100);
		}
	});
	$('#share-menu').on({
		mouseenter: function () { if (hover_timeout) clearTimeout(hover_timeout); },
		mouseleave: function () { 
			if (hover_timeout) clearTimeout(hover_timeout);
			hover_timeout = setTimeout(function(){$('#share-menu').hide();}, 100);
		}
	});
	var hover_timeout = null;

	$('#lhs-upload, #rhs-upload').button({icons:{primary:'ui-icon-folder-open'}, text:false}).upload({
		upload: function(target, evt) {
			var files = evt.target.files;
			var side = target.attr('id').split('-')[0];
			var sides = [side];
			if (files.length > 1) {
				if (side == 'lhs') sides.push('rhs');
				else sides.push('lhs');
			}
			// html5 file upload to browser
			function load_file(side, file) {
				var reader = new FileReader();
				reader.onprogress = function (evt) { }
				reader.onload = function (evt) {
					$('#compare').mergely(side, evt.target.result);
					document.body.style.cursor = 'default';
				}
				reader.onerror = function (evt) {
					alert( evt.target.error.name );
				}
				try {
					reader.readAsText(file, "UTF-8");
				}
				catch (e) {
					alert(e);
					document.body.style.cursor = 'default';
				}
			}
			if (files.length >= 1) load_file(sides[0], files[0]);
			if (files.length >= 2) load_file(sides[1], files[1]);
		}
	});
	
	var parameters = getParameters();
	
	$('#compare').mergely({
		ignorews: parameters.get('ws', false),
		lcs: parameters.get('lcs', true),
		sidebar: parameters.get('sb', true),
		height: function(h) {
			return h - 100;
		},
		loaded: function() {
			$('.toolbar, .title').fadeIn('fast');
			$('button').css({'visibility':'visible'});
		},
		resized: function() {
			var lhsx = $('#compare-editor-lhs .CodeMirror-gutter').offset().left + $('#compare-editor-lhs .CodeMirror-gutter').width() + 1;
			var rhsx = $('#compare-editor-rhs .CodeMirror-gutter').offset().left + $('#compare-editor-rhs .CodeMirror-gutter').width() + 1 - $('#lhs-toolbar').width();
			$('#lhs-toolbar, #title-lhs').css({'position':'relative', 'left':lhsx});
			$('#rhs-toolbar, #title-rhs').css({'position':'relative', 'left':rhsx});
			$('#title-rhs').css({'left':rhsx});
		},
		cmsettings: {
			mode: 'text/plain',
			lineWrapping: parameters.get('wrap') || false,
			readOnly: (key == '4qsmsDyb') || parameters.get('ro')
		}
	});
	if (key.length == 8) {
        $.when(
            $.ajax({
                type: 'GET', async: true, dataType: 'text',
                data: { 'key':key, 'name': 'lhs' },
                url: '/ajax/handle_get.php',
                success: function (response) {
                    $('#compare').mergely('lhs', response);
                },
                error: function(xhr, ajaxOptions, thrownError){
                }
            }),
            $.ajax({
                type: 'GET', async: true, dataType: 'text',
                data: { 'key':key, 'name': 'rhs' },
                url: '/ajax/handle_get.php',
                success: function (response) {
                    $('#compare').mergely('rhs', response);
                },
                error: function(xhr, ajaxOptions, thrownError){
                }
            })
        ).done(function() {
            var anchor = window.location.hash.substring(1);
            if (anchor) {
                // if an anchor has been provided, then parse the anchor in the
                // form of: 'lhs' or 'rhs', followed by a line, e.g: lhs100.
                var m = anchor.match(/([lr]hs)([0-9]+)/);
                if (m.length == 3) {
                    console.log(m);
                    $('#compare').mergely('scrollTo', m[1], parseInt(m[2],10));
                }
            }
        });
	}
	else {
		if (newbie) {
			$('#compare').mergely('lhs', 'the quick brown fox jumped over\nthe hairy cat\n');
			$('#compare').mergely('rhs', 'the quick brown fox jumped over\nthe lazy dog\n');
		}
	}
	$('#lhs-search, #rhs-search').click(function(){
		var side = $(this).attr('id').split('-')[0];
		var text = $('#' + side + '-search-text').val();
		$('#compare').mergely('search', side, text);
		return false;
	});
	$('#lhs-search-text, #rhs-search-text').keydown(function (ev) {
		var id = $(this).attr('id').split('-')[0];
		if (ev.which === $.ui.keyCode.ENTER) { $('#' + id + '-search').click(); return false; }
		return true;
	});
	$('#lhs-clear, #rhs-clear').click(function(){
		var side = $(this).attr('id').split('-')[0];
		$('#compare').mergely('clear', side);
		return false;
	});
	$('#lhs-swap, #rhs-swap').click(function(){
		$('#compare').mergely('swap');
		return false;
	});
	$('#lhs-merge, #rhs-merge').click(function(){
		var side = $(this).attr('id').split('-')[0];
		// clicking rhs-merge means 'merge left'
		if (side == 'rhs') side = 'lhs';
		else side = 'rhs';
		$('#compare').mergely('merge', side);
		return false;
	});
	$('#save, #fork').click(function(){
		var fork = $(this).attr('id') == 'fork';
		if (key == '') key = ''.random(8);
		var count = 0;
		function post_save(side, text) {
			$.ajax({
				type: 'POST', async: true, dataType: 'text',
				url: '/ajax/handle_file.php',
				data: { 'key': key,  'name': side, 'content': text },
				success: function (nkey) {
					++count;
					if (count == 2) {
						var url = '/ajax/handle_save.php?key=' + key;
						if (fork) url += '&nkey=' + ''.random(8);
						$.ajax({
							type: 'GET', async: false, dataType: 'text',
							url: url,
							success: function (nkey) {
								// redirect
								if (nkey.length) window.location.href = '/' + $.trim(nkey) + '/';
							},
							error: function(xhr, ajaxOptions, thrownError){
							}
						});
					}
				},
				error: function(xhr, ajaxOptions, thrownError){
					alert(thrownError);
				}
			});
		}
		function call_save() {
			var lhs = $('#compare').mergely('get', 'lhs');
			var rhs = $('#compare').mergely('get', 'rhs');
			post_save('lhs', lhs);
			post_save('rhs', rhs);
		}
		
		if ($(this).attr('id') == 'save') {
			$( '#dialog-confirm' ).dialog({
				resizable: false, height:210, modal: true,
				buttons: {
					"Save for Sharing": function() {
						$( this ).dialog( "close" );
						call_save();
					},
					Cancel: function() {
						$( this ).dialog( "close" );
					}
				}
			});
		}
		else {
			call_save();
		}
		return false;
	});
	
	$('#lhs-download, #rhs-download').click(function(){
		var side = $(this).attr('id').split('-')[0];
		var content = $('#compare').mergely('get', side);

		var MIME_TYPE = 'text/plain';
		console.log('downloading...');
		var windowURL = window.webkitURL || window.URL;
		var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;		
		var bb = new BlobBuilder();
		bb.append(content);
		var a = document.createElement('a');
		a.download = side + '.txt';
		a.target = '_blank';
		a.href = windowURL.createObjectURL(bb.getBlob(MIME_TYPE));
		a.textContent = 'Download ready';
		a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(':');
		a.draggable = true;
		a = $(a);
		window.open(a.attr('href'), '_blank');
		windowURL.revokeObjectURL()
		return false;
	});
	$('#lhs-download-diff, #rhs-download-diff').click(function(){
		var text = $('#compare').mergely('diff');
		if (key == '') key = ''.random(8);
		$.post('/ajax/handle_download.php', { 'key': key, 'content': text }, function(response) {
			window.location = response;
		});
		return false;
	});
	
	var dlg = $('#dialog-settings').css('visibility','visible').hide();
    var f = $.farbtastic('#picker');
	var sd = $('<span style="display:none" class="mergely ch d lhs">C</span>');
	var sa = $('<span style="display:none" class="mergely bg a rhs start end">C</span>');
	var sc = $('<span style="display:none" class="mergely c rhs start end">C</span>');
	$('body').append(sd);
	$('body').append(sa);
	$('body').append(sc);
	var conf = {
		'c-border': {id: '#c-border', defaultColor: '#cccccc', getColor: function() { return sc.css('border-top-color'); }, setColor: function(color) { $('#'+this.id).val(color) }},
		'c-bg': 	{id: '#c-bg', 	  defaultColor: '#fafafa', getColor: function() { return sc.css('background-color'); }, setColor: function(color) { $('#'+this.id).val(color) }},
		'a-border': {id: '#a-border', defaultColor: '#a3d1ff', getColor: function() { return sa.css('border-top-color'); }, setColor: function(color) { $('#'+this.id).val(color) }},
		'd-border': {id: '#d-border', defaultColor: '#ff7f7f', getColor: function() { return sd.css('border-top-color'); }, setColor: function(color) { $('#'+this.id).val(color) }},
		'a-bg': 	{id: '#a-bg', 	  defaultColor: '#ddeeff', getColor: function() { return sa.css('background-color'); }, setColor: function(color) { $('#'+this.id).val(color) }},
		'd-bg': 	{id: '#d-bg', 	  defaultColor: '#edc0c0', getColor: function() { return sd.css('background-color'); }, setColor: function(color) { $('#'+this.id).val(color) }},
	};
	
	var ignorews = $('#compare').mergely('options').ignorews;
	var lineWrapping = $('#compare').mergely('cm', 'lhs').getOption('lineWrapping') || $('#compare').mergely('cm', 'rhs').getOption('lineWrapping');
	var readOnly = $('#compare').mergely('cm', 'lhs').getOption('readOnly') || $('#compare').mergely('cm', 'rhs').getOption('readOnly');
	var lcs = $('#compare').mergely('options').lcs;
	var sidebar = $('#compare').mergely('options').sidebar;
	
	$.each(conf, function(key, item){ $(item.id).val(item.getColor()); });
	$('#ignore-ws').prop('checked', ignorews);
	$('#wraplines').prop('checked', lineWrapping);
	$('#readonly').prop('checked', readOnly);
	$('#lcs').prop('checked', lcs);
	$('#sidebar').prop('checked', sidebar);
	
	$('#settings').click(function(){
		dlg.dialog({
			width: 490, modal: true,
			buttons: {
				Apply: function() {
					var cborder = $('#c-border').val();
					var aborder = $('#a-border').val();
					var dborder = $('#d-border').val();
					var abg = $('#a-bg').val();
					var dbg = $('#d-bg').val();
					var cbg = $('#c-bg').val();
					var ignorews = $('#ignore-ws').prop('checked');
					var wraplines = $('#wraplines').prop('checked');
					var readonly = $('#readonly').prop('checked');
					var lcs = $('#lcs').prop('checked');
					var sidebar = $('#sidebar').prop('checked');
					var text =
						'.mergely.a.rhs.start { border-top: 1px solid ' + aborder + '; }\n\
						.mergely.a.lhs.start.end,\n\
						.mergely.a.rhs.end { border-bottom: 1px solid ' + aborder + '; }\n\
						.mergely.a.rhs { background-color: ' + abg + '; }\n\
						.mergely.d.lhs { background-color: ' + dbg + '; }\n\
						.mergely.d.lhs.end,\n\
						.mergely.d.rhs.start.end { border-bottom: 1px solid ' + dborder + '; }\n\
						.mergely.d.rhs.start.end.first { border-bottom: 0; border-top: 1px solid ' + dborder + '; }\n\
						.mergely.d.lhs.start { border-top: 1px solid ' + dborder + '; }\n\
						.mergely.c.lhs,\n\
						.mergely.c.rhs { background-color: ' + cbg + '; }\n\
						.mergely.c.lhs.start,\n\
						.mergely.c.rhs.start { border-top: 1px solid ' + cborder + '; }\n\
						.mergely.c.lhs.end,\n\
						.mergely.c.rhs.end { border-bottom: 1px solid ' + cborder + '; }\n\
						.mergely.ch.a.rhs { background-color: ' + abg + '; }\n\
						.mergely.ch.d.lhs { background-color: ' + dbg + '; text-decoration: line-through; color: #888; }';
					$('<style type="text/css">' + text + '</style>').appendTo('head');
					
					$('#compare').mergely('options', {ignorews: ignorews, lcs: lcs, sidebar: sidebar, fgcolor:{a:aborder,c:cborder,d:dborder}});
					$('#compare').mergely('cm', 'lhs').setOption('lineWrapping', wraplines);
					$('#compare').mergely('cm', 'rhs').setOption('lineWrapping', wraplines);
					$('#compare').mergely('cm', 'lhs').setOption('readOnly', readonly);
					$('#compare').mergely('cm', 'rhs').setOption('readOnly', readonly);
					
					$('#compare').mergely('update');
				},
				Reset: function() {
					$.each(conf, function(key){
						var id = '#'+key;
						f.linkTo($(id).get(0));
						f.setColor(conf[key].defaultColor);
					});
				},
				Close: function() {
					$(this).dialog('close');
				}
			}
		}); 
	});
    $('.colorwell').each(function(){ f.linkTo(this); }).focus(function(){
		var tthis = $(this);
		f.linkTo(this);
		var item = conf[tthis.attr('id')];
		f.setColor(item.getColor());
	});
	
});
