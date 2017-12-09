# Changes

## 4.0.0

### Breaking changes

* Lighter distribution (no longer bundling codemirror or the Mergely editor).
* Using `npm` as the preferred distribution method.
* The `editor_width` option has been removed.
* The `editor_height` option has been removed.
* Added `width` option.  When width is `auto`, both editors will fill their parent container's width.

### Minor features

* Added license feature

### Fixes

* Previously `width: 'auto'` would unnecessarily account for a scroll bar width, now it does not.
