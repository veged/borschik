var INHERIT = require('inherit'),
    BORSCHIK = require('borschik'),
    FREEZE = BORSCHIK.require('./freeze'),
    base = BORSCHIK.require('./tech'),
    PATH = require('path');

// XXX: c&p from borschik/lib/freeze.js
// Freezable test extensions
var freezableExts = (process.env.BORSCHIK_FREEZABLE_EXTS ||
        'jpg jpeg gif ico png swf svg ttf eot otf woff css js webm mp4 ogv').split(/\s+/),
    linksRe = "(?:[\\w./-]+?\\.(?:" + freezableExts.join('|') + '))',
    linksStringRx = new RegExp('^' + linksRe + '$'),
    allRe = new RegExp(linksRe, 'g');

exports.Tech = INHERIT(base.Tech, {

    File: exports.File = INHERIT(base.File, {

        processLink: function(path) {
            var url = this.path,
                i = url.indexOf('?'),
                postUrl = '';

            if (i > -1) {
                postUrl = url.substring(i);
                url = url.substring(0, i);
            }

            if (this.tech.opts.freeze && FREEZE.isFreezableUrl(url)) {
                url = FREEZE.processPath(url);
            }

            var resolved = FREEZE.resolveUrl2(url);

            url = (resolved == url ? PATH.relative(PATH.dirname(path), url) : resolved) + postUrl;

            return url;
        },

        parseInclude: function(content) {
            var m, found = [];

            if (Buffer.isBuffer(content)) content = content.toString('utf8');

            while (m = allRe.exec(content)) {
                if (linksStringRx.test(m[0])) {
                    var url = m[0];
                    if (isLinkProcessable(url)) found.push({
                        type: 'link',
                        url: url,
                        range: [m.index, allRe.lastIndex - 1]
                    });
                }            }

            return makeParsed(found, content);
        },

        processInclude: function(path, content) {
            var parsed = content || this.content;

            for(var i = 0; i < parsed.length; i++) {
                var item = parsed[i];

                if (item.type === 'link') {
                    parsed[i] = this.child('link', item.url).process(path);
                }

            }

            return parsed.join('');
        },

        processPath: function(path) {
            return path.replace(/^(.*?)(\?|$)/, '$1');
        }

    })
});

function isLinkProcessable(url) {
    return !(~['#', '?', '/'].indexOf(url.charAt(0)) || isAbsoluteUrl(url));
}

function isAbsoluteUrl(url) {
    return /^\w+:/.test(url);
}

function makeParsed(items, content) {
    var result = [],
        lastInd = 0;

    items.forEach(function(item) {
        if (lastInd > item.range[0]) throw 'index out of range';

        if (lastInd < item.range[0]) result.push(content.substring(lastInd, item.range[0]));

        result.push(item);
        lastInd = item.range[1] + 1;
    });

    if (lastInd < content.length) result.push(content.substring(lastInd));

    return result;
}
