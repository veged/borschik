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

function realpathSync(path) {
    if (!FS.existsSync(path)) return;
    return FS.realpathSync(path);
}
