# Mergely

http://mergely.com

Mergely is a javascript component to diff/merge files interactively in a browser, providing rich API that enables you to easily integrate Mergely into your existing web application.  It is suitable for comparing text files online, e.g. .txt, .html, .xml, .c, .cpp, .java, etc.  Mergely has a javascript implementation of the Longest Common Subsequence diff algorithm (LCS) and a customizable markup engine.

## Installation

### Installation via npm/webpack
The recommended way to install mergely is to use npm and [webpack](https://webpack.js.org/) to install mergely and its dependencies.
```sh
npm install mergely --save-dev
npm install codemirror jquery --save-dev
```

### Installation via distribution

An alternative installation method is available on http://mergely.com/downloads.

## Usage via webpack

Add the following to the `<head>` of your target html source file:
```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.32.0/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.32.0/addon/search/searchcursor.min.js"></script>
```

Create a div for the editor:
```html
<div id="mergely"></div>
```

Add the following to your target source javascript file:
```js
require('codemirror/lib/codemirror.js');
require('codemirror/addon/search/searchcursor.js');
require('codemirror/lib/codemirror.css');
require('mergely/lib/mergely.js');
require('mergely/lib/mergely.css');
```

Initialize mergely using a jQuery selector:
```js
$('#mergely').mergely();
```

### Synchronous initialization
Initialize the diff with the mergely jquery plugin, setting [options](#options) as required.  The following example can be used to initialize the `lhs` and `rhs` editors synchronously (i.e. their contents are already known).:

```js
$(document).ready(function () {
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

### Aynchronous initialization
If the editor contents are retrieved asynchronously (recommended), then retrieve the editor contents and set them:

```js
$(document).ready(function () {
    $('#mergely').mergely();
    
    // async get lhs editor, then set lhs content
    $('#mergely').mergely('lhs', lhsResponse);
    
    // async get rhs editor, then set rhs content
    $('#mergely').mergely('rhs', rhsResponse);
});
```


## Options

### autoresize - boolean
Enables/disables the auto-resizing of the editor. Defaults to `true`.

### autoupdate - boolean
Enables/disables the auto-updating of the editor when changes are made. Defaults to `true`.

### bgcolor - string
The background color that mergely fills the margin canvas with. Defaults to `#eeeeee`.

### change_timeout - number
The timeout, after a text change, before Mergely calcualtes a diff. Only used when `readonly` enabled. Defaults to `500`.

### cmsettings - object

CodeMirror settings (see [CodeMirror](http://codemirror.net])). Defaults to `{mode: 'application/xml', readOnly: false, lineWrapping: false, lineNumbers: true}`.

### editor_width - string

Starting width. Defaults to `400px`.

### editor_height - string

Starting height. Defaults to `400px`.

### fadein - string

A jQuery [fadein](http://api.jquery.com/fadein) value to enable the editor to fade in. Set to empty string to disable. Defaults to `fast`.

### fgcolor - string|number|object

The foreground color that mergely marks changes with on the canvas. The defaults are as follows:
```js
{
    // foreground colors for non-active differences
    a:'#4ba3fa',    // additions
    c:'#a3a3a3',    // changes
    d:'#ff7f7f',    // deletions
    // foreground colors for active differences
    ca:'#4b73ff',   // active addition
    cc:'#434343',   // active change
    cd:'#ff4f4f'    // active deletion
}
```

### ignorews - boolean

Ignores white-space. Defaults to `false`.

### ignorecase - boolean

Ignores case when differientiating.  Defaults to `false`.

### lcs - boolean

Enables/disables LCS computation for paragraphs (word-by-word changes). Disabling can give a performance gain for large documents. Defaults to `true`.

### line_numbers - boolean

Enables/disables line numbers. Enabling line numbers will toggle the visibility of the line number margins. Defaults to `true`.

### resize_timeout

The timeout, after a resize, before Mergely auto-resizes. Only used when autoresize enabled. Defaults to `500`.

### rhs_margin
Location for the rhs markup margin is either right or left. Defaults to `right`.

### sidebar - boolean
Enables/disables sidebar markers. Disabling can give a performance gain for large documents. Defaults to `true`.

### vpcolor - string

The margin/viewport indicator color. Defaults to `rgba(0, 0, 200, 0.5)`.

### viewport - boolean

Enables/disables the viewport. Enabling the viewport can give a performance gain for large documents. Defaults to `false`.

### wrap_lines - boolean
Enables/disables line wrapping. Enabling wrapping will wrap text to fit the editors. Defaults to `false`.

## Callbacks

The following callbacks are available on initialization:

### lhs(function setValue(string))

Allows the opportunity to set the value of the left-hand editor on initialization. A handle to a setValue function is passed as an argument.

### rhs(function setValue(string))

Allows the opportunity to set the value of the right-hand editor on initialization. A handle to a setValue function is passed as an argument.

### loaded()

A callback to indicate that Mergely has finished initializing and is loaded.

### resized()

A callback to indicate that the container window has been resized.

## Methods

The following methods are available after initialization:

### $(selector).mergely('clear', side)

Clears the editor contents.

### $(selector).mergely('cm', side)

Gets the CodeMirror editor from side.

### $(selector).mergely('diff')

Returns the current .diff file.

### $(selector).mergely('get', side)

Gets the editor contents.

### $(selector).mergely('lhs', value)

Set the value of the left-hand editor. Best used with ajax.

### $(selector).mergely('merge', side)

Merges whole file from side to the opposite side.

### $(selector).mergely('mergeCurrentChange', side)
Merges current cahnge from side to the opposite side.

### $(selector).mergely('options', options)

Sets the editor options. After setting, call "update".

### $(selector).mergely('options')

Gets the current editor options.

### $(selector).mergely('resize')

Resize the editor.

### $(selector).mergely('rhs', value)

Set the value of the right-hand editor. Best used with ajax.

### $(selector).mergely('scrollTo', side, num)

Scrolls the side to line number num.

### $(selector).mergely('scrollToDiff', direction)

Scrolls to the next change specified by direction, where direction is either prev or next.

### $(selector).mergely('search', side, text)

Search the editor for text. Repeating the call will find the next available token.

### $(selector).mergely('swap')

Swap the content of the left and right editors.

### $(selector).mergely('unmarkup')

Clears the editor markup.

### $(selector).mergely('update')

Manual update; recalculates diff and applies new settings.

## Styles

The following styles will allow you to brand your own editor:

### .mergely-column

The editors.

### .mergely-active

The active editor.

### .mergely-canvas

The mergely canvas elements

### mergely.a.rhs

Styles an addition to the right-hand side, regardless of starting or ending lines

### mergely.a.rhs.start

Styles the starting line of an addition to the right-hand side

### mergely.a.rhs.end

Styles the ending line of an addition to the right-hand side

### mergely.a.rhs.start.end

Styles the start and ending line of an addition to the right-hand side when the start and end are the same line

### mergely.d.lhs

Styles a deletion from the left-hand side, regardless of starting or ending lines

### mergely.d.lhs.start

Styles the starting line of a deletion from the left-hand side

### mergely.d.lhs.end

Styles the ending line of a deletion from the left-hand side

### mergely.d.lhs.start.end

Styles the start and ending line of a deletion from the left-hand side when the start and end are the same line

### mergely.c.lhs

Styles a change to the left-hand side, regardless of starting or ending lines

### mergely.c.lhs.start

Styles the starting line of a change to the left-hand side

### mergely.c.lhs.end

Styles the starting line of a change to the left-hand side

### mergely.c.rhs

Styles a change to the right-hand side, regardless of starting or ending lines

### mergely.c.rhs.start

Styles the starting line of a change to the right-hand side

### mergely.c.rhs.end

Styles the starting line of a change to the right-hand side

### mergely.ch.a.rhs

Styles the text of a change to the right-hand side

### mergely.ch.a.lhs

Styles the text of a change to the right-hand side
