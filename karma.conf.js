const path = require('path');
const concatScriptPreProcessor = require('./tests/concatScriptPreProcessor');

module.exports = function (config) {
    'use strict';

    config.set({
        frameworks: ['jasmine', 'sinon'],
        files: ['tests/main.test.js'],
        reporters: ['mocha'],
        port: 9876,  // karma web server port
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['ChromeHeadless', 'Firefox'],
        autoWatch: false,
        singleRun: true,
        concurrency: Infinity,
        preprocessors: {
          // keep this as generic as possible since `karma-generic-preprocessor`
          // has it's own matcher
          'tests/*': ['generic'],
        },
        genericPreprocessor: {
            rules: [
                {
                    match: "**/*.test.js",
                    process: concatScriptPreProcessor({
                        source: path.join(__dirname, 'vanillacrypto.html'),
                        idList: ['the-script'],
                        append: false,
                    }),
                },
                {
                    // if no match is specified all the files matched by
                    // `preprocessors` config above will be processed
                    process: function (content, file, done, log) {
                        done(content);
                    }
                },
            ],
        },
    });
}