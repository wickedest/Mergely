<?php
$key = '';
if (isset($_GET['key'])) {
	$key = $_GET['key'];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" /><title>Mergely - Diff online, merge documents</title>
	<meta http-equiv="content-type" content="text/html; charset=UTF-8"/>
	<meta name="description" content="Merge and Diff your documents with diff online and share" />
	<meta name="keywords" content="diff,merge,compare,jsdiff,comparison,difference,file,text,unix,patch,algorithm,saas,longest common subsequence,diff online" />
	<meta name="author" content="Jamie Peabody" />
	<link rel="shortcut icon" href="http://www.mergely.com/favicon.ico" />
	<link rel="canonical" href="http://www.mergely.com" />
    <link href='http://fonts.googleapis.com/css?family=Noto+Sans:400,700' rel='stylesheet' type='text/css' />
	<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js"></script>
	<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.10.1/jquery-ui.min.js"></script>
	<link type="text/css" rel="stylesheet" href="/style/mergely-theme/jquery-ui-1.10.1.custom.css" />
    <link type='text/css' rel='stylesheet' href='/Mergely/editor/lib/wicked-ui.css' />
	<script type="text/javascript" src="/Mergely/editor/lib/wicked-ui.js"></script>

    <link type='text/css' rel='stylesheet' href='/Mergely/editor/lib/tipsy/tipsy.css' />
	<script type="text/javascript" src="/Mergely/editor/lib/tipsy/jquery.tipsy.js"></script>
	<script type="text/javascript" src="/Mergely/editor/lib/farbtastic/farbtastic.js"></script>
	<link type="text/css" rel="stylesheet" href="/Mergely/editor/lib/farbtastic/farbtastic.css" />

	<script type="text/javascript" src="/Mergely/editor/editor.js"></script>
    <link type='text/css' rel='stylesheet' href='/Mergely/editor/editor.css' />
    
	<script type="text/javascript" src="/Mergely/lib/mergely.min.js"></script>
    <!--
	<script type="text/javascript" src="/Mergely/lib/mergely.js"></script>
    -->
	<link type="text/css" rel="stylesheet" href="/Mergely/lib/mergely.css" />
	<script type="text/javascript" src="/Mergely/lib/codemirror.min.js"></script>
	<script type="text/javascript" src="/Mergely/lib/searchcursor.js"></script>
	<link type="text/css" rel="stylesheet" href="/Mergely/lib/codemirror.css" />

	<script type="text/javascript">
        var key = '<?php echo $key; ?>';
        var isSample = key == '4qsmsDyb';
    </script>
    
    <!-- analytics -->
    <script type="text/javascript">
        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', 'UA-85576-5']);
        _gaq.push(['_trackPageview']);
        (function() {
            var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
            ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
        })();
    </script>
    
    <!-- google +1 -->
	<script type="text/javascript" src="https://apis.google.com/js/plusone.js"></script>
    
    <!-- stumbleupon -->
    <script type="text/javascript">
      (function() {
        var li = document.createElement('script'); li.type = 'text/javascript'; li.async = true;
        li.src = ('https:' == document.location.protocol ? 'https:' : 'http:') + '//platform.stumbleupon.com/1/widgets.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(li, s);
      })();
    </script>
    
</head>
<body>
<script>(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/all.js#xfbml=1";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));</script>


    <div id="banner"></div>
    
    <!-- menu -->
    <ul id="main-menu">
        <li accesskey="f">
            File
            <ul>
                <li id="file-new" accesskey="n" data-hotkey="Alt+N">New</li>
                <li id="file-import" data-icon="icon-import">Import...</li>
                <li id="file-save" accesskey="s" data-hotkey="Alt+S" data-icon="icon-save">Save .diff</li>
                <li class="separator"></li>
                <li id="file-share" data-icon="icon-share">Share</li>
            </ul>
        </li>
        <li accesskey="l">
            Left
            <ul>
                <li id="edit-left-undo" accesskey="z" data-hotkey="Ctrl+Z" data-icon="icon-undo">Undo</li>
                <li id="edit-left-redo" accesskey="y" data-hotkey="Ctrl+Y" data-icon="icon-redo">Redo</li>
                <li id="edit-left-find">Find</li>
                <li class="separator"></li>
                <li id="edit-left-merge-right" data-icon="icon-arrow-right-v">Merge right</li>
                <li id="edit-left-readonly">Read only</li>
                <li class="separator"></li>
                <li id="edit-left-clear">Clear</li>
            </ul>
        </li>
        <li accesskey="r">
            Right
            <ul>
                <li id="edit-right-undo" accesskey="z" data-hotkey="Ctrl+Z" data-icon="icon-undo">Undo</li>
                <li id="edit-right-redo" accesskey="y" data-hotkey="Ctrl+Y" data-icon="icon-redo">Redo</li>
                <li id="edit-right-find">Find</li>
                <li class="separator"></li>
                <li id="edit-right-merge-left" data-icon="icon-arrow-left-v">Merge left</li>
                <li id="edit-right-readonly">Read only</li>
                <li class="separator"></li>
                <li id="edit-right-clear">Clear</li>
            </ul>
        </li>
        <li accesskey="v">
            View
            <ul>
                <li id="view-swap" data-icon="icon-swap">Swap sides</li>
                <li class="separator"></li>
                <li id="view-refresh" accesskey="v" data-hotkey="Alt+V" title="Generates diff markup">Render diff view</li>
                <li id="view-clear" accesskey="c" data-hotkey="Alt+C" title="Clears diff markup">Clear render</li>
            </ul>
        </li>
        <li accesskey="o">
            Options
            <ul>
                <li id="options-wrap">Wrap lines</li>
                <li id="options-ignorews">Ignore white space</li>
                <li class="separator"></li>
                <li id="options-viewport" title="Improves performance for large files">Enable viewport</li>
                <li id="options-sidebars" title="Improves performance for large files">Enable side bars</li>
                <li id="options-swapmargin">Swap right margin</li>
                <li id="options-linenumbers">Enable line numbers</li>
                <li class="separator"></li>
                <li id="options-autodiff" title="Diffs are computed automatically">Enable auto-diff</li>
                <li class="separator"></li>
                <li id="options-colors">Colors...</li>
            </ul>
        </li>
        <li accesskey="m">
            Mergely
            <ul>
                <li><a class="link" href="/" target="site">Home</a></li>
                <li><a class="link" href="/about" target="site">About</a></li>
                <li><a class="link" href="/license" target="site">License</a></li>
                <li><a class="link" href="/download" target="site">Download</a></li>
                <li><a class="link" href="/doc" target="site">Mergely development guide</a></li>
                <li class="separator"></li>
                <li><a class="link" href="/4qsmsDyb/" target="_blank">United States Declaration of Independence Draft</a></li>
            </ul>
        </li>
        <li accesskey="s">
            Social
            <ul>
                <li id="social-twitter">
                    <div style="padding: 10px 10px 5px 10px" title="Twitter">
                        <a href="https://twitter.com/share" class="twitter-share-button" data-via="jamiepeabody">Tweet</a>
                        <script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>
                    </div>
                </li>
                <li id="social-google">
                    <div style="padding: 10px 10px 5px 10px" title="Google+"><g:plusone></g:plusone></div>
                </li>
                <li id="social-facebook">
                    <div style="padding: 10px 10px 5px 10px" title="Facebook">
                        <div class="fb-like" data-href="http://www.mergely.com" data-send="true" data-width="200" data-show-faces="true"></div>
                    </div>
                </li>
                <li id="social-stumbleupon">
                    <div style="padding: 10px 10px 5px 10px" title="StumbleUpon"><su:badge layout="3"></su:badge></div>
                </li>
                <li id="social-reddit">
                    <div style="padding: 10px 10px 5px 10px" title="Reddit">
                        <a target="_blank" href="http://www.reddit.com/submit" onclick="window.location = 'http://www.reddit.com/submit?url=' + encodeURIComponent(window.location); return false"><img src="http://www.reddit.com/static/spreddit1.gif" alt="submit to reddit" border="0" /> 
                        </a>
                    </div>
                </li>
                <li id="social-bebo">
                    <div target="_blank" style="padding: 10px 10px 5px 10px;" title="Bebo">
                        <script>function bebo_click() {u=location.href;t=document.title;window.open('http://www.bebo.com/c/share?Url='+encodeURIComponent(u)+'&Title='+encodeURIComponent(t)+'&MID=8974376238&TUUID=fc7850b8-964c-47bd-8a91-db1d2a5cad3c','sharer','toolbar=0,status=0,width=626,height=436');return false;}</script><style> html .b_share_link { padding:2px 0 0 20px; height:16px; background:url(http://s.bebo.com/img/bebo_b_16x16.gif) no-repeat top left; }</style><a style="color:black" href="http://www.bebo.com/c/share?Url=<url>" onclick="return bebo_click()" target="_blank" class="b_share_link">Share on Bebo</a>
                    </div>
                </li>
                <li id="delicious">
                    <div target="_blank" style="padding: 10px 10px 5px 10px;" title="Delicious">
                        <img src="http://delicious.com/static/img/logo.png" height="16" width="16" alt="Delicious" />
                          <a style="color:black" target="_blank" href="#" onclick="window.open('http://delicious.com/save?v=5&provider=Mergely&noui&jump=close&url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title), 'delicious','toolbar=no,width=550,height=550'); return false;"> Save this on Delicious</a>
                    </div>
                </li>
            </ul>
        </li>
    </ul>

    <!-- toolbar -->
    <ul id="toolbar">
        <li id="tb-file-share" data-icon="icon-share" title="Share">Share</li>
        <li class="separator"></li>
        <li id="tb-file-import" data-icon="icon-import" title="Import">Import</li>
        <li id="tb-file-save" data-icon="icon-save" title="Save .diff">Save .diff</li>
        <li class="separator"></li>
        <li id="tb-edit-right-merge-left" data-icon="icon-arrow-left-v" title="Merge left">Merge left</li>
        <li id="tb-edit-left-merge-right" data-icon="icon-arrow-right-v" title="Merge right">Merge right</li>
        <li id="tb-view-swap" data-icon="icon-swap" title="Swap sides">Swap sides</li>
    </ul>

    <!-- dialog upload -->
    <div id="dialog-upload" title="File import" style="display:none">
        <div class="tabs">
            <ul>
                <li><a href="#tabs-1">Import File</a></li>
                <li><a href="#tabs-2">Import URL</a></li>
            </ul>
            <div id="tabs-1">
                <p>
                    Files are imported directly into your browser.  They are <em>not</em> uploaded to the server.
                </p>
                <label for="file-lhs">Left file</label> <input id="file-lhs" style="display:inline-block" type="file"><div id="file-lhs-progress"><div class="progress-label">Loading...</div></div><br />
                <label for="file-rhs">Right file</label> <input id="file-rhs" style="display:inline-block" type="file"><div id="file-rhs-progress"><div class="progress-label">Loading...</div></div><br />
            </div>
            <div id="tabs-2">
                <p>
                    Files are imported directly into your browser.  They are <em>not</em> uploaded to the server.
                </p>
                <label for="url-lhs">Left URL</label> <input id="url-lhs" type="input" size="40"><div id="file-lhs-progress"><div class="progress-label">Loading...</div></div><br />
                <label for="url-rhs">Right URL</label> <input id="url-rhs" type="input" size="40"><div id="file-rhs-progress"><div class="progress-label">Loading...</div></div><br />
            </div>
        </div>
    </div>
    
    <!-- dialog colors -->
	<div id="dialog-colors" title="Mergely Color Settings" style="display:none">
		<div id="picker" style="float: right;"></div>
		<fieldset>
			<legend>Changed</legend>
			<label for="c-border">Border:</label><input type="text" id="c-border" name="c-border" class="colorwell" />
			<br />
			<label for="c-bg">Background:</label><input type="text" id="c-bg" name="c-bg" class="colorwell" />
			<br />
		</fieldset>
		<fieldset>
			<legend>Added</legend>
			<label for="a-border">Border:</label><input type="text" id="a-border" name="a-border" class="colorwell" />
			<br />
			<label for="a-bg">Background:</label><input type="text" id="a-bg" name="a-bg" class="colorwell" />
			<br />
		</fieldset>
		<fieldset>
			<legend>Deleted</legend>
			<label for="d-border">Border:</label><input type="text" id="d-border" name="d-border" class="colorwell" />
			<br />
			<label for="d-bg">Background:</label><input type="text" id="d-bg" name="d-bg" class="colorwell" />
			<br />
		</fieldset>
	</div>

    <!-- dialog confirm -->
	<div id="dialog-confirm" title="Save a Permanent Copy?" style="display:none;">
		<p>
			Are you sure you want to save? A permanent copy will be
			created at the server and a link will be provided for you to share the URL 
            in an email, blog, twitter, etc.
		</p>
	</div>
    
    <!-- find -->
    <div class="find">
        <input type="text" />
        <button class="find-prev"><span class="icon icon-arrow-up"></span></button>
        <button class="find-next"><span class="icon icon-arrow-down"></span></button>
        <button class="find-close"><span class="icon icon-x-mark"></span></button>
    </div>
    
    <!-- editor -->
    <div style="position: absolute;top: 73px;bottom: 10px;left: 5px;right: 5px;overflow-y: hidden;padding-bottom: 2px;">
        <div id="mergely">
        </div>
    </div>
    
</body>
</html>
