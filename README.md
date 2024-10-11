# Mergely

![mergely logo](https://www.mergely.com/images/mergely.png)

https://mergely.com

Mergely is a JavaScript component for differencing and merging files interactively in a browser (diff/merge). It provides a rich API that enables you to easily integrate Mergely into your existing web application. It is suitable for comparing text files online, such as .txt, .html, .xml, .c, .cpp, .java, .js, etc.

Mergely has a JavaScript implementation of the Longest Common Subsequence (LCS) diff algorithm, and a customizable markup engine. It computes the diff within the browser.

This is the latest version 5. The previous version 4 can be found [here](https://github.com/wickedest/Mergely/tree/v4.3.9#mergely).

## Usage

### Usage via React

The easiest and recommended way to use Mergely is with the [mergely-react](https://npmjs.com/package/mergely-react) component.

```bash
npm install mergely-react
```

### Usage via Angular

There is an Angular component for Mergely [mergely-angular](https://github.com/wickedest/mergely-angular), but it is out of date. I will accept MR for anyone willing to do the work.

### Usage via webpack

The source repository [mergely-webpack](https://github.com/wickedest/mergely-webpack) contains an example of how to get started with a new project that uses mergely and webpack.

```
git clone --depth 1 https://github.com/wickedest/mergely-webpack.git my-project
cd my-project
rm -rf .git
```

### Usage via CDN

Add the following to the `<head>` of your target HTML source file. Note that `codemirror` is bundled.

```html
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mergely/5.0.0/mergely.min.js"></script>
<link type="text/css" rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/mergely/5.0.0/mergely.css" />
```

### Synchronous initialization

If the editor contents are retrieved asynchronously (recommended), then retrieve the editor contents and set them:

```html
<body>
  <div id="compare"></div>

  <script>
    const doc = new Mergely('#compare', {
      lhs: 'the quick red fox\njumped over the hairy dog',
      rhs: 'the quick brown fox\njumped over the lazy dog'
    });
  </script>
</body>
```

### Asynchronous initialization

Mergely will emit an `updated` event when the editor is first initialized, and each time one of the editors changes. You can listen for one event to perform one-time initialization.

```html
<body>
  <div id="compare"></div>

  <script>
    const doc = new Mergely('#compare');
    doc.once('updated', () => {
      doc.lhs('the quick red fox\njumped over the hairy dog');
      doc.rhs('the quick brown fox\njumped over the lazy dog');
      // Scroll to first change on next update
      doc.once('updated', () => {
        doc.scrollToDiff('next');
      });
    });
  </script>
</body>
```

### Visualization modes

Mergely supports the following CodeMirror visualizations for [mode](codemirror.net/5/doc/manual.html#option_mode):

* go
* javascript
* htmlmixed
* markdown
* python

## Options

|Option|Type|Default value|Description|
|------|----|-------------|-----------|
|<a name="autoupdate"></a>autoupdate|boolean|true|Controls whether or not the [`changed`](#changed) event will trigger a diff.|
|<a name="bgcolor"></a>bgcolor|string|`#eeeeee`|The background color for the left-hand and right-hand margins.|
|<a name="change_timeout"></a>change_timeout|number|`150`|The timeout, after a text change, before Mergely calculates a diff. Only used when `readonly` is enabled.|
|<a name="cmsettings"></a>cmsettings|object|`{mode: 'text/plain', readOnly: false}`|CodeMirror settings (see [CodeMirror](https://codemirror.net)) that are combined with `lhs_cmsettings` and `rhs_cmsettings`.|
|<a name="ignorews"></a>ignorews|boolean|`false`|Ignores white-space.|
|<a name="ignorecase"></a>ignorecase|boolean|`false`|Ignores case.|
|<a name="ignoreaccents"></a>ignoreaccents|boolean|`false`|Ignores accented characters.|
|<a name="lcs"></a>lcs|boolean|`true`|Enables/disables LCS computation for paragraphs (char-by-char changes). Disabling can give a performance gain for large documents.|
|<a name="lhs"></a>lhs|boolean,`function handler(setValue)`|`null`|Sets the value of the editor on the left-hand side.|
|<a name="license"></a>license|string|`lgpl`|The choice of license to use with Mergely.  Valid values are: `lgpl`, `gpl`, `mpl` or `lgpl-separate-notice`, `gpl-separate-notice`, `mpl-separate-notice` (the license requirements are met in a separate notice file).|
|<a name="line_numbers"></a>line_numbers|boolean|`true`|Enables/disables line numbers. Enabling line numbers will toggle the visibility of the line number margins.|
|<a name="lhs_cmsettings"></a>lhs_cmsettings|object|`{}`|The CodeMirror settings (see [CodeMirror](https://codemirror.net)) for the left-hand side editor.|
|<a name="resize_timeout"></a>resize_timeout|number|`500`|The timeout, after a resize, before Mergely auto-resizes. Only used when autoresize enabled.|
|<a name="rhs"></a>rhs|boolean,`function handler(setValue)`|`null`|Sets the value of the editor on the right-hand side.|
|<a name="rhs_cmsettings"></a>rhs_cmsettings|object|`{}`|The CodeMirror settings (see [CodeMirror](https://codemirror.net)) for the right-hand side editor.|
|<a name="rhs_margin"></a>rhs_margin|string|`right`|Location for the rhs markup margin. Possible values: right, left.|
|<a name="sidebar"></a>sidebar|boolean|`true`|Enables/disables sidebar markers. Disabling can give a performance gain for large documents.|
|<a name="vpcolor"></a>vpcolor|string|`rgba(0, 0, 200, 0.5)`|The margin/viewport indicator color.|
|<a name="viewport"></a>viewport|boolean|`false`|Enables/disables the viewport. Enabling the viewport can give a performance gain for large documents.|
|<a name="wrap_lines"></a>wrap_lines|boolean|`false`|Enables/disables line wrapping. Enabling wrapping will wrap text to fit the editors.|

## Constructor

### <a name="constructor"></a>constructor(selector: string, options?: <a href="#options">object</a>)

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|selector|string|A CSS selector used to uniquely identify the DOM element that should be used to bind the instance of Mergely.|
|options|object|Configuration options for the instance.|

#### Example

```js
new Mergely('#editor', { ignorews: true });
```

## Methods

### <a name="clear"></a>clear(side: string)

Clears the editor contents for the specified `side`.

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|side|string|The editor side, either `lhs` or `rhs`.|

#### Example

```js
doc.clear('lhs');
```

### <a name="cm"></a>cm(side: string)

Gets the CodeMirror editor for the specified `side`.

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|side|string|The editor side, either `lhs` or `rhs`.|

#### Example

```js
doc.cm('lhs');
```

### <a name="diff"></a>diff()

Calculates and returns the current .diff file.

#### Parameters

None.

#### Example

```js
doc.diff();
```

### <a name="get"></a>get(side: string)

Gets the text editor contents for the specified `side`.

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|side|string|The editor side, either `lhs` or `rhs`.|

#### Example

```js
doc.get('lhs');
```

### <a name="lhs"></a>lhs(value: string)

Sets the value of the left-hand editor.

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|value|string|The editor text.|

#### Example
```js
doc.lhs('This is text');
```

### <a name="merge"></a>merge(side: string)

Merges whole file from the specified `side` to the opposite side.

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|side|string|The editor side, either `lhs` or `rhs`.|

#### Example

```js
doc.merge('lhs');
```

### <a name="mergeCurrentChange"></a>mergeCurrentChange(side: string)

Merges the current change from the specified `side` to the opposite side.

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|side|string|The editor side, either `lhs` or `rhs`.|

#### Example

```js
doc.mergeCurrentChange('lhs');
```

### <a name="on"></a>on(event: string, handler: function)

Sets up a `function` to be called when the specified `event` is emitted. The event handler will be automatically deregistered on <a href="#unbind">unbind</a>.

#### Parameters

None.

#### Example

```js
doc.on('updated', () => console.log('updated!'));
```

### <a name="once"></a>once(event: string, handler: function)

Sets up a `function` to be called when the specified `event` is emitted. The event handler will be automatically deregistered after the `handler` is called.

#### Parameters

None.

#### Example

```js
doc.unbind();
```

### <a name="options"></a>options(options?: <a href="#options">object</a>)

Gets or sets the editor <a href="#options">Options</a>. With no arguments, the function will return the currenty configured options. When supplied options to change, the editor will automatically update with the new settings.

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|options|object|The options to set.|

#### Example

```js
const currentOptions = doc.options();
doc.options({ line_numbers: true });
```

### <a name="resize"></a>resize()

Resizes the editor. It must be called explicitly if `autoresize` is disabled.

#### Parameters

None.

#### Example

```js
doc.resize();
```

### <a name="rhs"></a>rhs(value: string)

Sets the value of the right-hand editor.

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|value|string|The editor text.|

#### Example

```js
doc.rhs('This is text');
```

### <a name="scrollTo"></a>scrollTo(side: string, lineNum: integer)

Scrolls the editor `side` to line number specified by `lineNum`.

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|side|string|The editor side, either `lhs` or `rhs`.|
|lineNum|number|The line number.|

#### Example

```js
doc.scrollTo('lhs', 100);
```

### <a name="scrollToDiff"></a>scrollToDiff(direction: string)

Scrolls to the next change specified by `direction`.

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|direction|string|The direction to scroll, either `prev` or `next`.|

#### Example

```js
doc.scrollToDiff('next');
```

### <a name="search"></a>search(side: string, needle: string, direction: string = 'next')

Search the editor for `needle`, scrolling to the next available match. Repeating the call will find the next available token.

#### Parameters

|Name|Type|Description|
|----|----|-----------|
|side|string|The editor side, either `lhs` or `rhs`.|
|needle|string|The text for which to search.|
|direction|string|The direction to search, either `prev` or `next`.|

#### Example

```js
doc.search('lhs', 'banana');
```

### <a name="summary"></a>summary()

Gets a summary of the editors. Returns an object with summarized properties:

|Name|Description|
|----|-----------|
|a|The number of added lines.|
|c|The number of changed lines.|
|d|The number of deleted lines.|
|lhsLength|The number of characters in the lhs text.|
|rhsLength|The number of characters in the rhs text.|
|numChanges|The total number of changed lines.|

#### Parameters

None.

#### Example

```js
console.log(doc.summary());
// { a: 0, c: 1, d: 0, lhsLength: 44, rhsLength: 45, numChanges: 1 }
```

### <a name="swap"></a>swap()

Swaps the content of the left and right editors. The content cannot be swapped if either editor is read-only.

#### Parameters

None.

#### Example

```js
doc.swap();
```

### <a name="unmarkup"></a>unmarkup()

Clears the editor markup.

#### Parameters

None.

#### Example

```js
doc.unmarkup();
```

### <a name="unbind"></a>unbind()

Unbinds and destroys the editor DOM.

#### Parameters

None.

#### Example

```js
doc.unbind();
```

## Events

Event handlers are automatically unregistered when [unbind](#unbind) is called.

### changed

Triggered when one of the editors change, e.g. text was altered. The [change_timeout](#/change_timeout) controls how much time should pass after the `changed` event (e.g. keypress) before the [`updated`](#updated) event is triggered.

#### Example

```js
mergely.once('changed', () => { console.log('changed!'); }

mergely.on('changed', () => { console.log('changed!'); }
```

### resized

Triggered after the editor is resized.

#### Example

```js
mergely.once('resized', () => { console.log('resized!'); }

mergely.on('resized', () => { console.log('resized!'); }
```

### updated

Triggered after the editor finishes rendering. For example, text updates, options, or scroll events may trigger renders. This event is useful for handling a once-off initialization that should occur after the editor's first render.

#### Example

```js
mergely.once('updated', () => { console.log('updated!'); }

mergely.on('updated', () => { console.log('updated!'); }
```
