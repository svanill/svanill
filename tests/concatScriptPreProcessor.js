const fs = require('fs');

function escapeRegexp(text) {
    return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

const concatScriptPreProcessor = options => (
    (content, file, done, log) => {
        options = Object.assign({
            source: null,
            idList: [],
            append: true,
            debugResult: false,
            debugHasLineNumbers: true,
        }, options);

        if (!options.source || !fs.existsSync(options.source)) {
            throw new Error('prependScriptPreProcessor: source file does not exist');
        }

        const sourceContent = fs.readFileSync(options.source, 'utf8');
        let extractedScripts = [];
        for (let id of options['idList']) {
            const matchResult = sourceContent.match(new RegExp([
                `<script\\s+id\\s*=\\s*["']`,
                 escapeRegexp(id),
                 `["']`,
                 '.*?>([\\s\\S]*?)</script>'
            ].join('')));

            if (matchResult) {
                extractedScripts.push(matchResult[1]);
            }
        }

        let output = '';
        if (options.append) {
            output = [content].concat(extractedScripts).join('\n');
        } else {
            output = extractedScripts.concat([content]).join('\n');
        }

        if (options.debugResult) {
            let idx = 0;

            for (line of output.split('\n')) {
                if (options.debugHasLineNumbers) {
                    console.log(('      ' + ++idx).slice(-6), line);
                } else {
                    console.log(line);
                }
            }
        }

        done(output);
    }
);

module.exports = concatScriptPreProcessor;
