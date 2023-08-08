import gen_style from './gen_style';
import gen_rust from './gen_rust';
import gen_cpp from './gen_cpp';

export {
    gen_cpp,
    gen_style,
};

function main() {
    let support_langs: { [key: string]: any } = {
        'rust': gen_rust,
        'cpp': gen_cpp,
    };
    let cmd = process.argv.slice(0, 2).join(' ');
    let args = process.argv.slice(2);
    if (args.length <= 0) {
        console.log('usage:');
        console.log(`    ${cmd} lang`);
        let langs: string[] = [];
        for (let lang in support_langs) {
            langs.push(lang);
        }
        console.log('support lang: ' + langs.join(', '));
        return;
    }
    let lang = args[0];
    let action = support_langs[lang];
    if (!action) {
        console.log(`not support ${lang}`);
        return;
    }
    let result = action();
}

if (require.main === module) {
    main();
}