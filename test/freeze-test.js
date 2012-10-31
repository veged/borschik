var FREEZE = require('../lib/freeze'),
    FS = require('fs'),
    PATH = require('path'),
    ASSERT = require('assert'),

    testImagePath = './test/test.png',
    exec = require('child_process').exec;

function loadTestImage(path) {
    return readFile(path || testImagePath);
}

function readFile(path) {
    return FS.readFileSync(PATH.resolve(path));
}

describe('sha1Base64', function() {
    var sha1base64;

    beforeEach(function() {
        sha1base64 = FREEZE.sha1Base64(loadTestImage());
    });

    it('sha1base64', function() {
        ASSERT.equal(sha1base64, 'wFPs+e1B3wMRud8TzGw7YHjS08I=');
    });
});

describe('fixBase64', function() {

    it('+-a+b/c=', function() {
        ASSERT.equal(FREEZE.fixBase64('+-a+b/c='), 'a-b_c');
    });
});

describe('loadConfig', function() {

    it('path', function() {
        ASSERT.equal(FREEZE.path(PATH.resolve('./test/config_load')), '//test/test/');
    });

    it('freezePath', function() {
        ASSERT.ok(FREEZE.freezePath(PATH.resolve('./test/config_load')));
    });

    it('freezeDir', function() {
        ASSERT.equal(FREEZE.freezeDir(PATH.resolve('./test/config_load/file.png')),
                     FREEZE.freezePath(PATH.resolve('./test/config_load')));
    });

});

describe('freeze', function() {

    it('freeze path ok', function() {
        var path = FREEZE.freeze(FREEZE.realpathSync('./test/freeze_basic/test.png'));
        ASSERT.ok(/\/test\/test2\/wFPs-e1B3wMRud8TzGw7YHjS08I\.png$/g.test(path));
        FS.unlink(path);
    });
});

describe('isImageUrl', function() {

    it('isImageUrl ok', function() {
        ASSERT.ok(FREEZE.isImageUrl('xxx.jpg'));
        ASSERT.ok(FREEZE.isImageUrl('xxx.jpeg'));
        ASSERT.ok(FREEZE.isImageUrl('xxx.ico'));
        ASSERT.ok(FREEZE.isImageUrl('xxx.png'));
        ASSERT.ok(FREEZE.isImageUrl('xxx.gif'));
        ASSERT.ok(FREEZE.isImageUrl('xxx.svg'));
        ASSERT.ok(FREEZE.isImageUrl('xxx.swf'));
    });
});

describe('freeze from .css (-t css)', function() {
    var error,
        result,
        okCSS = readFile('./test/freeze_from_css/ok_css.css').toString();

    before(function(done) {
        exec('./bin/borschik -t css -i ./test/freeze_from_css/test.css', function(err, stdout, stderr) {
            error = err;
            result = stdout;
            done();
        });
    });

    it('freeze ok', function() {
        ASSERT.equal(result, okCSS);
    }) 

});

describe('freeze from .css (-t css-fast)', function() {
    var error,
        result,
        okCSS = readFile('./test/freeze_from_css/ok_cssfast.css').toString();

    before(function(done) {
        exec('./bin/borschik -t css-fast -i ./test/freeze_from_css/test.css', function(err, stdout, stderr) {
            error = err;
            result = stdout;
            done();
        });
    });

    it('freeze ok', function() {
        ASSERT.equal(result, okCSS);
    }) 

});
