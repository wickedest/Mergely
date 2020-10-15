# Changes

## 4.2.0:
* minor: added new option `ignoreaccents` to ignore accented characters.

## 4.1.2:
* patch: fixes issue #134 where the readme had broken links.

## 4.1.1:
* patch: fixes issue #95 where cursor was not focusing correctly on init.

## 4.1.0:
* minor: emits 'updated' event after every change.
* patch: fixes `scrollTo` that no longer functioned after a codemirror update.
* patch: fixes `loaded` being called prematurely and after every resize, and is now is called once, after the 'updated' event.

## 4.0.16:
* patch: fixes rendering beyond change constraint

## 4.0.15
* patch: removed unnecessary addon mark-selected

## 4.0.14
* patch: fixes issue #104 where diff text conflicted with selected text

## 4.0.13
* patch: fixed issue where `lhs_cmsettings` and  `lhs_cmsettings` were ignored
* patch: updated documentation
* patch: fixed typos
* patch: fixes issue #115 merging deleted line(s) from lhs would munge rhs text
* patch: fixes two typos in README.md

## 4.0.11
* patch: fixes typo in example ajax.html

## 4.0.10
* patch: fixes bad 4.0.9 artifacts

## 4.0.9
* patch: fixes issue #106 merge edge-case with add

## 4.0.8
* chore: updated webpack

## 4.0.7
* chore: updated documentation

## 4.0.6

* patch: fixes issue #89 missing merge buttons

## 4.0.5

* patch: fixes issue #85 XSS vulnerability with DOM id

## 4.0.2

* patch: fixes issue #83 poor rendering performance

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
