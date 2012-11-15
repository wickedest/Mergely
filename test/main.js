require.config({
    paths: {
        'codemirror':           '../lib/codemirror',
        'mergely':              '../lib/mergely',
        'jsunit':               'lib/jsunit/jsunit'
    }
});

var OPTIONS = {debug:false};

require([
    'codemirror',
    'mergely',
    'jsunit',
    //test modules
    'tests',
], function(
    mergely,
    codemirror,
    JsUnit,
    tests
){
    tests();
    JsUnit.start();
});
