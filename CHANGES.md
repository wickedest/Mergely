# Changes

## 4.0.0

### Breaking changes

* Now using `npm` as the preferred distribution method.
* Improved width/height options.  Removed options `editor_width` and `editor_height`, and added `width` and `height`.  The options are equivalent.
* Added license option to indicate which type of license to use.

### Minor features

* Lighter distribution (no longer bundling jQuery, CodeMirror, or the Mergely editor).
* Made it easier to set CodeMirror settings via `cmsettings` for both editors, then applies `lhs_cmsettings` for the left-hand editor, and `rhs_cmsettings` for the right-hand editor.

### Fixes

* Previously `width: 'auto'` would unnecessarily account for a scroll bar width, now it does not.
