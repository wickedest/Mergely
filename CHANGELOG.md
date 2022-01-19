# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 4.3.9 (2022-01-19)


### Bug Fixes

* **#161:** Fixed issue with `options.ignorews` ([#162](https://github.com/wickedest/Mergely/issues/162)) ([650daaf](https://github.com/wickedest/Mergely/commit/650daaff63503f6426f64b12d8b33cfca6ef7185))

### 4.3.8 (2021-11-21)


### General

* Split code into individual files and tidier code ([#160](https://github.com/wickedest/Mergely/issues/160)) ([79cb0dd](https://github.com/wickedest/Mergely/commit/79cb0ddd6a07886435b0e17b0bac33416e67716d))

### 4.3.7 (2021-11-21)


### General

* removed unused dev-deps ([4d5c6fa](https://github.com/wickedest/Mergely/commit/4d5c6fa67c92dad461cfd3a7cc991e9b1ec4531b))

### 4.3.6 (2021-11-21)

### [4.3.5](https://github.com/wickedest/Mergely/compare/v4.0.13...v4.3.5) (2021-11-21)


### Features

* **#132:** added option to ignore accented characters ([#136](https://github.com/wickedest/Mergely/issues/136)) ([5a0cd15](https://github.com/wickedest/Mergely/commit/5a0cd15ddd54fdd60b42247e6f373a6a8e47d25d)), closes [#132](https://github.com/wickedest/Mergely/issues/132) [#132](https://github.com/wickedest/Mergely/issues/132)
* **#137:** added 'summary' method ([4610ed3](https://github.com/wickedest/Mergely/commit/4610ed353557300e45d98e31cf384bc996dbac58)), closes [#137](https://github.com/wickedest/Mergely/issues/137)


### General

* updated dependencies ([85b02ad](https://github.com/wickedest/Mergely/commit/85b02add899b90e4d6ced4474cfdee98838d272a))
----
### 4.3.5
* patch: fixed issue with build

### 4.3.4
* patch: Fixes inline diff rendering issue with whitespace [#139](https://github.com/wickedest/Mergely/issues/139).

### 4.3.3
* patch: Fixes resize issue when using zoom [#152](https://github.com/wickedest/Mergely/issues/152).

### 4.3.2
* patch: Reset the current change position when [setValue](https://mergely.com/doc##options_callbacks), [clear](https://mergely.com/doc#clear), [lhs](https://mergely.com/doc#lhs) or [rhs](https://mergely.com/doc#rhs) are called.

### 4.3.1
* patch: Updated README.md to fix incorrect option name.

### 4.3.0
* feat: Added `summary` method

### 4.2.4
* patch: fixes [#142](https://github.com/wickedest/Mergely/issues/142).  Added README.md to examples.

### 4.2.3
* patch: fixes [#147](https://github.com/wickedest/Mergely/issues/147).  Fixes the css style for the currently selected change.

### 4.2.2:
* patch: fixes issue where initial change was not being set causing next/prev and merge actions to not work as expected.

### 4.2.1:
* chore: updated dependencies, cleared security issues

### 4.2.0:
* minor: added new option `ignoreaccents` to ignore accented characters.

### 4.1.2:
* patch: fixes issue #134 where the readme had broken links.

### 4.1.1:
* patch: fixes issue #95 where cursor was not focusing correctly on init.

### 4.1.0:
* minor: emits 'updated' event after every change.
* patch: fixes `scrollTo` that no longer functioned after a codemirror update.
* patch: fixes `loaded` being called prematurely and after every resize, and is now is called once, after the 'updated' event.

### 4.0.16:
* patch: fixes rendering beyond change constraint

### 4.0.15
* patch: removed unnecessary addon mark-selected

### 4.0.14
* patch: fixes issue #104 where diff text conflicted with selected text

### 4.0.13
* patch: fixed issue where `lhs_cmsettings` and  `lhs_cmsettings` were ignored
* patch: updated documentation
* patch: fixed typos
* patch: fixes issue #115 merging deleted line(s) from lhs would munge rhs text
* patch: fixes two typos in README.md

### 4.0.11
* patch: fixes typo in example ajax.html

### 4.0.10
* patch: fixes bad 4.0.9 artifacts

### 4.0.9
* patch: fixes issue #106 merge edge-case with add

### 4.0.8
* chore: updated webpack

### 4.0.7
* chore: updated documentation

### 4.0.6

* patch: fixes issue #89 missing merge buttons

### 4.0.5

* patch: fixes issue #85 XSS vulnerability with DOM id

### 4.0.2

* patch: fixes issue #83 poor rendering performance

### 4.0.0

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
