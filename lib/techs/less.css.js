var INHERIT = require('inherit'),
    base = require('./css-fast.js'),
    path = require('path'),
    Q = require('q'),
    QFS = require('q-fs'),
    less = require('less');

exports.Tech = INHERIT(base.Tech, {

    File: exports.File = INHERIT(base.File, {
        
        write: function(output) {

            var res = this.process(this.path),
                compiled = this.compile(res);
                
            // save res to file with .css extension
            if (typeof output === 'string') {
                return QFS.write(output, compiled);
            }

            // output res to stdout
            if (output === process.stdout) {
                output.write(compiled);
                return Q.resolve();
            }

            // write res to writable stream of opened file
            var defer = Q.defer();

            output.on('error', function(err) {
                defer.reject(err);
            });

            output.once('close', function() {
                defer.resolve();
            });

            output.once('end', function() {
                defer.resolve();
            });

            output.write(compiled);
            output.end();

            return defer.promise;

        },
        
        compile: function (input) {
			var that = this,
            options = {
                  paths: [path.dirname(this.path)]
                , optimization: 0
                , filename: this.path && this.path.replace(/.*(?=\/)\//, '')
            };

            try {
              // instantiate new parser with options
              new less.Parser(options)
                // parse data into tree
                .parse(input, function (err, tree) {
                  if (err) {
                    if (err.type == 'Parse') {
                      // parse error
                      console.log("LESS_CSS: Parser error" + (err.filename ? ' in ' + err.filename : '') + '\n')
                    } else {
                      // other exception
                      console.log("LESS_CSS: " +err.name + ": " + err.message + ' of ' + err.filename + '\n')
                    }
                    // add extra line for readability after error log
                    console.log(" ")
                  }
                  that.compiled = tree.toCSS({})    
                })
            } catch (err) {
              console.log(
                  "LESSCSS: Parse error: "
                + err.message                
              )
            }
			return that.compiled;
		}
    })
});
