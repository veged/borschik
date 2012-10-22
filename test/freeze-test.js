var FREEZE = require('../lib/freeze'),
    FS = require('fs'),
    PATH = require('path'),
    ASSERT = require('assert'),

    testImagePath = './test/test.png';

function loadTestImage(path) {
    return FS.readFileSync(PATH.resolve(path || testImagePath));
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
