var INHERIT = require('inherit'),
    FREEZE = require('../freeze'),
    base = require('../tech'),
    PATH = require('path'),
    CSSO = require('csso'),
    FS = require('fs'),
    U = require('../util'),
    AUTOPREFIXER = require('autoprefixer');

exports.Tech = INHERIT(base.Tech, {

    process: function(path, out) {
        // NOTE: Passing path of source file into process(). This could lead to
        // incorrect paths in the resulting file if it will be stored in another
        // directory then source file.
        var res = this.createFile(path, 'include').process(path);

        return U.writeFile(out, this.opts.minimize? this.minimize(this.addPrefixes(res, path)) : this.addPrefixes(res, path));
    },

    addPrefixes: function(res, path) {
        return AUTOPREFIXER.compile(res, this.getAutoprefixerConfig(path));
    },

    getAutoprefixerConfig: function(path) {
        // Looks for .autoprefixer config file 3 dirs up from path (page, bundles and project levels)
        var dir = '',
            pathToConfig;

        for (var i = 0; i < 3; i++) {
            dir += '../';
            pathToConfig = PATH.resolve(path, dir, '.autoprefixer');

            if (FS.existsSync(pathToConfig)) return eval(FS.readFileSync(pathToConfig, 'utf8'));
        }
    },

    minimize: function(content) {
        return CSSO.justDoIt(content);
    },

    File: exports.File = INHERIT(base.File, {

        processLink: function(path) {
            var url = this.path,
                i = url.indexOf('?'),
                postUrl = '';

            if (i > -1) {
                postUrl = url.substring(i);
                url = url.substring(0, i);
            }

            if (this.tech.opts.freeze && this.isFreezableUrl(url)) {
                url = FREEZE.processPath(url);
            }

            var resolved = FREEZE.resolveUrl2(url);

            url = (resolved == url ? PATH.relative(PATH.dirname(path), url) : resolved) + postUrl;

            return JSON.stringify(url);
        },

        isFreezableUrl: function(url) {
            return FREEZE.isFreezableUrl(url);
        }

    })

});
