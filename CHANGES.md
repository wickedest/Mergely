# Changes

## 4.0.7
* chore: updated documentation

## 4.0.6

* #89: fixes missing merge buttons

## 4.0.5

* #85: fixes XSS vulnerability with DOM id

## 4.0.2

* #83: fixes poor rendering performance

## 4.0.0

### Breaking changes

* Now using `npm` as the preferred distribution method.
* Improved width/height options.  Removed options `editor_width` and `editor_height`, and added `width` and `height`.  The options are equivalent.
* Added license option to indicate which type of license to use.
* Only distributing the minimized version as `mergely.js` (was `mergely.min.js`).
* No longer bundling CodeMirror.  You will need to get the appropriate source files from a CDN.

### Minor features

* Created `mergely-webpack` example.
* Lighter distribution (no longer bundling CodeMirror or the Mergely editor).
* Made it easier to set CodeMirror settings via `cmsettings` for both editors, then applies `lhs_cmsettings` for the left-hand editor, and `rhs_cmsettings` for the right-hand editor.

### Fixes

* Previously `width: 'auto'` would unnecessarily account for a scroll bar width, now it does not.
