var CRYPTO = require('crypto'),
    FS = require('fs'),
    PATH = require('path'),
    configs = {
        paths: {}
    },
    config = {
        paths: {},
        freezePaths: {},
        followSymlinks: {}
    };

var processImage = exports.processImage = function(filePath) {
    freeze(realpathSync(filePath));
};

var sha1Base64 = exports.sha1Base64 = function(content) {
    var sha1 = CRYPTO.createHash('sha1');
    sha1.update(content);
    return sha1.digest('base64');
};

var fixBase64 = exports.fixBase64 = function(base64) {
    base64 = base64.replace(/\+/g, '-');
    base64 = base64.replace(/\//g, '_');
    base64 = base64.replace(/^[+-]+/g, ''); // NONPRJ-497
    return base64;
};

var freeze = exports.freeze = function(filePath, content) {
    if (filePath !== realpathSync(filePath)) throw new Error();

    var _freezeDir = freezeDir(filePath);

    if (_freezeDir) {

        if (content === undefined) {
            if (!FS.existsSync(filePath)) throw new Error();
            if (FS.statSync(filePath).isDirectory()) throw new Error();

            content = FS.readFileSync(filePath);
        }

        var hash = fixBase64(sha1Base64(content));

        filePath = _freezeDir + '/' + hash + PATH.extname(filePath);

        if (content && !FS.existsSync(filePath)) {
            save(filePath, content);
        }
    }

    return filePath;
};

var freezeDir = exports.freezeDir = function(filePath) {
    if (filePath !== realpathSync(filePath)) throw Error();

    var suffix = filePath,
        prefix = '',
        freezeDir,
        rePrefix = /^(\/+[^\/]+)/,
        matched;

    while (matched = filePath.match(rePrefix)) {
        prefix += matched[0];
        freezeDir = freezePath(prefix) || freezeDir;
        filePath = filePath.replace(rePrefix, '');
    }

    return freezeDir;
};

var freezePath = exports.freezePath = function(path) {
    loadConfig(path);
    return config.freezePaths[path];
};

var followSymlinks = exports.followSymlinks = function(path) {
    loadConfig(path);
    return config.followSymlinks[path];
};

var loadConfig = exports.loadConfig = function(path) {
    if (configs.paths[path] === undefined) {

        if (FS.existsSync(path + '/.tstcfg')) {
            configs.paths[path] = true;
            
            var _config = JSON.parse(FS.readFileSync(path + '/.tstcfg'));

            var paths = _config.paths || _config.pathmap || {};
            for (var dir in paths) {
                var realpath = realpathSync(PATH.resolve(path, dir));
                if (!config.paths[realpath]) {
                    var value = paths[dir];
                    if (value) value = value.replace(/\*/g, '/');
                    config.paths[realpath] = value;
                }
            }

            var freezePaths = _config.freeze_paths || _config.hashsum_paths || {};
            for (var dir in freezePaths) {
                var realpath = realpathSync(PATH.resolve(path, dir));
                if (!config.freezePaths[realpath]) {
                    var value = freezePaths[dir];
                    value = realpathSync(PATH.resolve(PATH.resolve(path, dir), value));
                    if (value) value = value.replace(/\*/g, '/');
                    config.freezePaths[realpath] = value;
                }
            }

            var followSymlinks = _config.follow_symlinks || {};
            for (var dir in followSymlinks) {
                var realpath = realpathSync(PATH.resolve(path, dir));
                if (!config.followSymlinks[realpath]) {
                    config.freezePaths[realpath] = followSymlinks[dir];
                }
            }

        } else {
            configs.paths[path] = false;
        }
    }
};

function mkpath(path) {
    var dirs = path.split('/'),
        _path = '';

    dirs.forEach(function(dir) {
        if (dir) {
            _path += '/' + dir;
            if (!FS.existsSync(_path)) {
                FS.mkdirSync(_path);
            }
        }
    });
}

function save(filePath, content) {
    mkpath(PATH.dirname(filePath));
    FS.writeFileSync(filePath, content);
}

var realpathSync = exports.realpathSync = function(path) {
    path = PATH.resolve(process.cwd(), path);

    if (!/^\//.test(path)) throw new Error();

    var folders = path.split(/\/+/);

    for (var i = 1; i < folders.length; i++) {
        var name = folders[i];

        if (name === '..') {
            folders.splice(i - 1, 2);
            continue;
        }

        var prefix = subArrayJoin(folders, '/', 0, i - 1);
        var _followSymlinks = false;

        for (var j = 0; j < i; j++) {
            var subprefix = subArrayJoin(folders, '/', 0, j);
            var followSymlinksJ = followSymlinks(subprefix);
            if (followSymlinksJ !== undefined) _followSymlinks = followSymlinksJ;
        }

        if (_followSymlinks && isSymLink(prefix + '/' + name)) {
            var link = FS.readlinkSync(prefix + '/' + name);
            var linkParts = link.split(/\/+/);
            linkParts.shift();
            if (/^\//.test(link)) {
                linkParts.shift();
                folders = arraySplice(folders, 0, i + 1, linkParts);
            } else {
                folders = arraySplice(folders, i, i + 1, linkParts);
            }
        } else {
            i++;
        }
    }

    return '/' + folders.join('/');
};

function subArrayJoin(a, separator, from, to) {
    var s = '';

    for (var i = from; i <= to; i++) {
        s += separator + a[i];
    }

    return s;
}

function arraySplice(a1, from, to, a2) {
    var aL = a1.slice(0, from),
        aR = a1.slice(to);

    return aL.concat(a2).concat(aR);
}

function isSymLink(path) {
    return FS.fstatSync(path).isSymbolicLink();
}
