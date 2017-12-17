# Changes

## 4.0.0

### Breaking changes

* Lighter distribution (no longer bundling codemirror or the Mergely editor).
* Using `npm` as the preferred distribution method.
* Improved width/height options.  Removed options `editor_width` and `editor_height`, and added `width` and `height`.  The options are equivalent.
* Added license option to indicate which type of license to use.

### Minor features


### Fixes

* Previously `width: 'auto'` would unnecessarily account for a scroll bar width, now it does not.
