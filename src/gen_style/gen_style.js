const {
    parse_define,
    ROOT_NAME,
    toLine,
} = require('./parse_define');

function gen_style() {
    let {
        enum_values,
        struct_types,
    } = parse_define();
    let name_values = {};
    let style_index = enum_values[ROOT_NAME];
    let max_index = -1;
    for (let name in style_index) {
        let result_type = null;
        let index = style_index[name];
        let enum_v = enum_values[struct_types[ROOT_NAME][name]];
        if (enum_v !== undefined) {
            let contain_line = false;
            for (let key in enum_v) {
                if (key.indexOf('_') >= 0) {
                    contain_line = true;
                    break;
                }
            }
            result_type = [];
            for (let key in enum_v) {
                new_key = toLine(key, contain_line);
                result_type.push([new_key, enum_v[key]]);
            }
        }
        if (max_index < index) {
            max_index = index;
        }
        name_values[index.toString()] = {
            name: toLine(name),
            result_type: result_type,
        };
    }
    return {
        max_index: max_index,
        name_values: name_values,
    };
}

module.exports = {
    gen_style,
};
