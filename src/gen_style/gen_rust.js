const {
    parse_define,
    ROOT_NAME,
} = require('./parse_define');

function gen_rust() {
    let {
        enum_values,
        struct_types,
    } = parse_define();
    let style_index = enum_values[ROOT_NAME];
    let struct_type = struct_types[ROOT_NAME];
    let style_index_items = [];
    let style_info_items = [];
    let type_names = [];
    let info_keys = [];
    for (let key in style_index) {
        info_keys.push(key);
        let index = style_index[key];
        style_index_items.push(`${key} = ${index},`);
        let key_type = struct_type[key];
        if (!key_type) {
            key_type = 'i32';
        } else {
            if (type_names.indexOf(key_type) == -1) {
                type_names.push(key_type);
            }
        }
        style_info_items.push(`${key}: ${key_type},`);
    }
    let style_index_src = `#[derive(FromPrimitive, ToPrimitive)]
pub enum StyleIndex {
    ${style_index_items.join('\n    ')}
}`;
    let style_info_src = `pub struct StyleInfo {
    ${style_info_items.join('\n    ')}
}`;
    console.log('#![allow(non_camel_case_types)]');
    console.log();
    console.log(style_index_src);
    console.log();
    console.log(`struct Value<'a>(&'a str);

impl<'a> Into<i32> for Value<'a> {
    fn into(self) -> i32 {
        self.0.parse::<>().unwrap_or_default()
    }
}

impl<'a> Into<u32> for Value<'a> {
    fn into(self) -> u32 {
        self.0.parse::<>().unwrap_or_default()
    }
}`);
    for (let type_name of type_names) {
        let items = [];
        let enum_v = enum_values[type_name];
        let zero_key = null;
        for (let key in enum_v) {
            let index = enum_v[key];
            if (index == 0) {
                zero_key = key;
            }
            items.push(`${key} = ${index},`)
        }
        let src = `#[derive(FromPrimitive, ToPrimitive)]
pub enum ${type_name} {
    ${items.join('\n    ')}
}`;
        console.log(src);
        console.log();
        console.log(`impl<'a> Into<${type_name}> for Value<'a> {
    fn into(self) -> ${type_name} {
        self.0.parse::<u32>().map(|x| num::FromPrimitive::from_u32(x)).ok().unwrap_or_default().unwrap_or_default()
    }
}
`);
        if (zero_key) {
            console.log(`impl Default for ${type_name} {
    fn default() -> Self {
        ${type_name}::${zero_key}
    }
}
`);
        }
    }
    console.log(style_info_src);

    console.log(`
impl Default for StyleInfo {
    fn default() -> Self {
        Self {
            ${info_keys.map(s => s + ': Default::default(),').join('\n            ')}
        }
    }
}

macro_rules! parse_style {
    ($v: ident, $items: ident, $($name: ident), +) => {
        $(
            if $items.len() > StyleIndex::$name as usize {
                $v.$name = Value($items[StyleIndex::$name as usize]).into();
            }
        )+
    };
}

pub fn parse_style_info(s: &str, style: &mut StyleInfo) {
    let items = s.split(';').into_iter().collect::<Vec<_>>();
    parse_style!(style, items,
        ${info_keys.join(',\n        ')}
    );
}`);
}

module.exports = gen_rust;