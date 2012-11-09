var INHERIT = require('inherit'),
    FREEZE = require('../freeze'),
    util = require('util'),
    base = require('../tech');

exports.Tech = INHERIT(base.Tech, {
    File: exports.File = INHERIT(base.File, {

        processLink: function(path) {
            var url = this.path,
                i = this.path.indexOf('?'),
                postUrl = '';

            if (i > 0) {
                postUrl = url.substring(i);
                url = url.substring(0, i);
            }

            if (FREEZE.isImageUrl(url)) {
                url = FREEZE.resolveUrl2(FREEZE.processImage(url), '') + postUrl;
            } else {
                url = this.pathFrom(path);
            }

            return JSON.stringify(url)
        }

    })
});
