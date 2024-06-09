# [5.2.0](https://github.com/wickedest/Mergely/compare/v5.1.4...v5.2.0) (2024-06-09)


### Features

* Allows height to be not explicit height, e.g. 'inherit' or '100%' ([#196](https://github.com/wickedest/Mergely/issues/196)) ([b9e3641](https://github.com/wickedest/Mergely/commit/b9e3641c852a8926db5efdf33e65a607d5f2df5e))

## [5.1.4](https://github.com/wickedest/Mergely/compare/v5.1.3...v5.1.4) (2024-05-17)


### Bug Fixes

* removed accidental change that enabled code display modes (e.g. javascript, python, html) ([692d01f](https://github.com/wickedest/Mergely/commit/692d01f1653ae8f1163a2c6228f457549086b75d))

## [5.1.3](https://github.com/wickedest/Mergely/compare/v5.1.2...v5.1.3) (2024-05-06)


### Bug Fixes

* **chore:** updated deps ([#195](https://github.com/wickedest/Mergely/issues/195)) ([c4c6e8a](https://github.com/wickedest/Mergely/commit/c4c6e8abd8f02762d5803774789673f76a95e932))

## [5.1.2](https://github.com/wickedest/Mergely/compare/v5.1.1...v5.1.2) (2024-05-06)


### Bug Fixes

* trace only when debug enabled ([#194](https://github.com/wickedest/Mergely/issues/194)) ([60d18f8](https://github.com/wickedest/Mergely/commit/60d18f8d5c0df349b4806b2e8a6c0f79d9f8074e))

## [5.1.1](https://github.com/wickedest/Mergely/compare/v5.1.0...v5.1.1) (2024-03-11)


### Bug Fixes

* **#183:** fixes undefined 'k' due to scoped 'let' ([02e383d](https://github.com/wickedest/Mergely/commit/02e383d94d685e41cb68d945b9726bbcbfeb0ccf))

# [5.1.0](https://github.com/wickedest/Mergely/compare/v5.0.4...v5.1.0) (2023-08-27)


### Features

* support CM modes: go, javascript, htmlmixed, markdown, python ([827487a](https://github.com/wickedest/Mergely/commit/827487a5983cb89ef41415435d44239e35983b9a))

## [5.0.4](https://github.com/wickedest/Mergely/compare/v5.0.3...v5.0.4) (2023-08-27)


### Bug Fixes

* updated CDN example ([dec1e95](https://github.com/wickedest/Mergely/commit/dec1e9509d94811914e77cbc33dc1aaedf154f7c))

## [5.0.3](https://github.com/wickedest/Mergely/compare/v5.0.2...v5.0.3) (2023-08-27)


### Bug Fixes

* Updated docs with CDN example ([254adf1](https://github.com/wickedest/Mergely/commit/254adf15ab09fe9c5c3dff542d0a7f62ce2c9782))

## [5.0.2](https://github.com/wickedest/Mergely/compare/v5.0.1...v5.0.2) (2023-04-24)


### Bug Fixes

* **scroll:** fixed issue where first rhs scroll was unlinked ([7b2040c](https://github.com/wickedest/Mergely/commit/7b2040c6ad17ea70a09720f54d9a255cdc57cd67))

## [5.0.1](https://github.com/wickedest/Mergely/compare/v5.0.0...v5.0.1) (2023-04-23)


### Bug Fixes

* update release ([a8b497b](https://github.com/wickedest/Mergely/commit/a8b497bc9b68beb5d8265106d9f010aa9489dd17))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [5.0.0](https://github.com/wickedest/Mergely/compare/v4.3.9...v5.0.0) (2023-04-23)


### BREAKING CHANGES

- Mergely is no longer a jQuery plugin.
- Removed options.autoresize
- Removed options.editor_width
- Removed options.editor_height
- Removed options.fadein
- Removed options.fgcolor
- Removed options.resize
- Removed options.width
- Removed options.height
- Removed options.loaded callback
- Removed options.resized callback
- Removed styles .mergely-resizer, .mergely-full-screen-0, and .mergely-full-screen-8
- Changed default for options.change_timeout changed from 150 to 50.
- No longer automatically scrolls to first change.

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
