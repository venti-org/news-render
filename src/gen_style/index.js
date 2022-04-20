const { 
    gen_style, 
} = require('./gen_style');

module.exports = {
    gen_style,
};

function main() {
    const gen_rust = require('./gen_rust');
    let support_langs = {
        'rust': gen_rust,
    };
    let cmd = process.argv.slice(0, 2).join(' ');
    let args = process.argv.slice(2);
    if (args.length <= 0) {
        console.log('usage:');
        console.log(`    ${cmd} lang`);
        let langs = [];
        for (let lang in support_langs) {
            langs.push(lang);
        }
        console.log('support lang: ' + langs.join(', '));
        return;
    }
    let lang = args[0];
    let action = support_langs[lang];
    let result = action();
}

if (require.main === module) {
    main();
}