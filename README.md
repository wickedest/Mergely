# Mergely

http://mergely.com

Mergely is a javascript component to diff/merge files interactively in a browser, providing rich API that enables you to easily integrate Mergely into your existing web application.  It is suitable for comparing text files online, e.g. .txt, .html, .xml, .c, .cpp, .java, etc.  Mergely has a javascript implementation of the Longest Common Subsequence diff algorithm (LCS) and a customizable markup engine.

## Installation

### Installation via webpack
The recommended way to install mergely is to use npm and [webpack](https://webpack.js.org/) to install mergely and its dependencies.  It is highly recommended that you start by cloning [mergely-webpack](https://github.com/wickedest/mergely-webpack).  It has everything that you need to get started.

### Angular 6.1.1
You can also use mergely within angular.  You can start by cloning [mergely-angular](https://github.com/wickedest/mergely-angular).

### Installation via .tgz

Unpack mergely.tgz into a folder, e.g. `./lib`, and then add the following to the `<head>` of your target html source file.

```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.32.0/codemirror.min.js"></script>
<link rel="stylesheet" media="all" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.32.0/codemirror.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.32.0/addon/search/searchcursor.min.js"></script>
<script src="lib/mergely/lib/mergely.js" type="text/javascript"></script>
<link rel="stylesheet" media="all" href="lib/mergely/lib/mergely.css" />
```

Create a div for the editor in `<body>`.  This example uses a style that provides 8px padding (`mergely-full-screen-8`):

```html
<div class="mergely-full-screen-8">
  <div class="mergely-resizer">
    <div id="mergely"></div>
  </div>
</div>
```

Then initialize mergely, setting [options](#options) as required.

```js
$(document).ready(function () {
    $('#mergely').mergely();
});
```

### Synchronous content initialization

The following example can be used to set the `lhs` and `rhs` editors synchronously (i.e. their contents are already known):

```js
$(document).ready(function () {
    // set editor content
    $('#mergely').mergely({
        lhs: function(setValue) {
            setValue('the quick red fox\njumped over the hairy dog');
        },
        rhs: function(setValue) {
            setValue('the quick brown fox\njumped over the lazy dog');
        }
    });
});
```

### Asynchronous initialization

If the editor contents are retrieved asynchronously (recommended), then retrieve the editor contents and set them:

```js
$(document).ready(function () {
    // initialize mergely
    $('#mergely').mergely();
    
    // get async lhsResponse, then set lhs value
    $('#mergely').mergely('lhs', lhsResponse);
    
    // get async rhsResponse, then set rhs value
    $('#mergely').mergely('rhs', rhsResponse);
});
```

## Options


|Option|Type|Default value|Description|
|------|----|-------------|-----------|
|<a name="autoresize"></a>autoresize|boolean|`true`|Enables/disables the auto-resizing of the editor.|
|<a name="autoupdate"></a>autoupdate|boolean|`true`|Enables/disables the auto-updating of the editor when changes are made.|
|<a name="bgcolor"></a>bgcolor|string|`#eeeeee`|The background color that mergely fills the margin canvas with.|
|<a name="change_timeout"></a>change_timeout|number|`500`|The timeout, after a text change, before Mergely calcualtes a diff. Only used when `readonly` enabled.|
|<a name="cmsettings"></a>cmsettings|object|`{mode: 'text/plain', readOnly: false}`|CodeMirror settings (see [CodeMirror](http://codemirror.net])) that are combined with `lhs_cmsettings` and `rhs_cmsettings`.|
|<a name="editor_width"></a>editor_width|string|`400px`|Starting width.|
|<a name="editor_height"></a>editor_height|string|`400px`|Starting height.|
|<a name="fadein"></a>fadein|string|`fast`|A jQuery [fadein](http://api.jquery.com/fadein) value to enable the editor to fade in. Set to empty string to disable.|
|<a name="fgcolor"></a>fgcolor|string\|number\|object|`{a:'#4ba3fa', c:'#a3a3a3', d:'#ff7f7f', ca:'#4b73ff', cc:'#434343', cd:'#ff4f4f'}`|The foreground color that mergely marks changes with on the canvas.  The value **a** is additions, **c** changes, **d** deletions, and the prefix *c* indicates current/active change (e.g. **cd** current delection).|
|<a name="ignorews"></a>ignorews|boolean|`false`|Ignores white-space.|
|<a name="ignorecase"></a>ignorecase|boolean|`false`|Ignores case when differientiating.
|<a name="lcs"></a>lcs|boolean|`true`|Enables/disables LCS computation for paragraphs (word-by-word changes). Disabling can give a performance gain for large documents.|
|<a name="license"></a>license|string|`lgpl`|The choice of license to use with Mergely.  Valid values are: `lgpl`, `gpl`, `mpl` or `lgpl-separate-notice`, `gpl-separate-notice`, `mpl-separate-notice` (the license requirements are met in a separate notice file).|
|<a name="line_numbers"></a>line_numbers|boolean|`true`|Enables/disables line numbers. Enabling line numbers will toggle the visibility of the line number margins.|
|<a name="lhs_cmsettings"></a>lhs_cmsettings|object|`{}`|The CodeMirror settings (see [CodeMirror](http://codemirror.net])) for the left-hand side editor.|
|<a name="resize_timeout"></a>resize_timeout|number|`500`|The timeout, after a resize, before Mergely auto-resizes. Only used when autoresize enabled.|
|<a name="rhs_cmsettings"></a>rhs_cmsettings|object|`{}`|The CodeMirror settings (see [CodeMirror](http://codemirror.net])) for the right-hand side editor.|
|<a name="rhs_margin"></a>rhs_margin|string|`right`|Location for the rhs markup margin is either right or left.|
|<a name="sidebar"></a>sidebar|boolean|`true`|Enables/disables sidebar markers. Disabling can give a performance gain for large documents.|
|<a name="vpcolor"></a>vpcolor|string|`rgba(0, 0, 200, 0.5)`|The margin/viewport indicator color.|
|<a name="viewport"></a>viewport|boolean|`false`|Enables/disables the viewport. Enabling the viewport can give a performance gain for large documents.|
|<a name="wrap_lines"></a>wrap_lines|boolean|`false`|Enables/disables line wrapping. Enabling wrapping will wrap text to fit the editors.|

## Options - Callbacks

|Option|Parameters|Description|
|------|----|-----------|
|<a name="lhs"></a>lhs|`function setValue(string)`|A callback that allows the value of the left-hand editor to be set on initialization synchronously. A handle to a `setValue` function is passed as an argument to be used to initialize the editor.|
|<a name="loaded"></a>loaded| |A callback to indicate that Mergely has finished initializing and is loaded.|
|<a name="resized"></a>resized| |A callback to indicate that the container window has been resized.|
|<a name="rhs"></a>rhs|`function setValue(string)`|A callback that allows the value of the right-hand editor to be set on initialization synchronously. A handle to a `setValue` function is passed as an argument to be used to initialize the editor.|

## Methods

### <a name="clear"></a>clear

Clears the editor contents for the specified `side`.

#### Parameters
|Name|Type|Description|
|----|----|-----------|
|side|string|The editor side, either `lhs` or `rhs`.|

#### Example
```js
$('#mergely').mergely('clear', 'lhs');
```

### <a name="cm"></a>cm

Gets the CodeMirror editor for the specified `side`.

#### Parameters
|Name|Type|Description|
|----|----|-----------|
|side|string|The editor side, either `lhs` or `rhs`.|

#### Example
```js
$('#mergely').mergely('cm', 'lhs');
```

### diff

Calculates and returns the current .diff file.

#### Parameters
None.

#### Example

```js
$('#mergely').mergely('diff');
```

### get

Gets the text editor contents for the specified `side`.

#### Parameters
|Name|Type|Description|
|----|----|-----------|
|side|string|The editor side, either `lhs` or `rhs`.|

#### Example
```js
$('#mergely').mergely('get', 'lhs');
```

### lhs

Sets the value of the left-hand editor.

#### Parameters
|Name|Type|Description|
|----|----|-----------|
|value|string|The editor text.|

#### Example
```js
$('#mergely').mergely('lhs', 'This is text');
```

### merge

Merges whole file from the specified `side` to the opposite side.

#### Parameters
|Name|Type|Description|
|----|----|-----------|
|side|string|The editor side, either `lhs` or `rhs`.|

#### Example
```js
$('#mergely').mergely('merge', 'lhs');
```

### mergeCurrentChange

Merges the current change from the specified `side` to the opposite side.

#### Parameters
|Name|Type|Description|
|----|----|-----------|
|side|string|The editor side, either `lhs` or `rhs`.|

#### Example
```js
$('#mergely').mergely('mergeCurrentChange', 'lhs');
```


### options

Sets the editor options.  Will automatically update with the new settings unless `autoupdate` is disabled, in which case, you will need to explicitly call `update`.

#### Parameters
|Name|Type|Description|
|----|----|-----------|
|options|object|The options to set.|

#### Example
```js
$('#mergely').mergely('options', { line_numbers: true });
```

### options

Gets the editor options.

#### Parameters
None.

#### Example
```js
$('#mergely').mergely('options');
```

### resize

Resize the editor.  Must be called explicitly if `autoresize` is disabled.

#### Parameters
None.

#### Example
```js
$('#mergely').mergely('resize');
```

### rhs

Sets the value of the right-hand editor.

#### Parameters
|Name|Type|Description|
|----|----|-----------|
|value|string|The editor text.|

#### Example
```js
$('#mergely').mergely('rhs', 'This is text');
```

### scrollTo

Scrolls the `side` to line number specified by `num`.

#### Parameters
|Name|Type|Description|
|----|----|-----------|
|side|string|The editor side, either `lhs` or `rhs`.|
|num|number|The line number.|

#### Example
```js
$('#mergely').mergely('scrollTo', 'lhs', 100);
```

### scrollToDiff

Scrolls to the next change specified by `direction`.

#### Parameters
|Name|Type|Description|
|----|----|-----------|
|direction|string|The direction to scroll, either `prev` or `next`.|

#### Example
```js
$('#mergely').mergely('scrollToDiff', 'next');
```

### search

Search the editor for `text`, scrolling to the next available match. Repeating the call will find the next available token.

#### Parameters
|Name|Type|Description|
|----|----|-----------|
|side|string|The editor side, either `lhs` or `rhs`.|
|text|string|The text to search.|

#### Example
```js
$('#mergely').mergely('search', 'lhs', 'needle');
```

### swap

Swap the content of the left and right editors.

#### Parameters
None.

#### Example
```js
$('#mergely').mergely('swap');
```

### unmarkup

Clears the editor markup.

#### Parameters
None.

#### Example
```js
$('#mergely').mergely('unmarkup');
```

### update

Manual update; recalculates diff and applies new settings.

#### Parameters
None.

#### Example
```js
$('#mergely').mergely('update');
```
