const fs = require('fs');
const path = require('path');

const ENUM_OR_STRUCT = 0;
const NAME = 1;
const LEFT = 2;
const KEY_OR_RIGHT = 3;
const ASSIGN_OR_COMMA = 4;
const VALUE = 5;
const COMMA_OR_RIGHT = 6;
const SEMICOLON = 7;
const COLON = 8; // :
const TYPE = 9;

const ROOT_NAME = 'StyleIndex';

function assert_token(token, value) {
    if (token != value) {
        throw new Error(`except token ${value} but got ${token}`);
    }
}

function assert_var_name(token) {
    let index = token.indexOf(/[^a-zA-Z0-9_]/);
    let first = token.charCodeAt(0);

    if (index >= 0 || (first >= 48 && first <= 57)) {
        throw new Error(`not except var name ${token}`);
    }
}

function assert_int(token) {
    let n = Number.parseInt(token);
    return n;
}

// 下划线转换驼峰
function toHump(name) {
    return name.replace(/\_(\w)/g, function(all, letter){
        return letter.toUpperCase();
    });
}
// 驼峰转换下划线
function toLine(name, contain_line=null) {
    if (contain_line === null) {
        contain_line = name.indexOf('_') >= 0
    }
    if (contain_line) {
        return name.toLowerCase().replaceAll('_', '-').replace(/^-+|-+$/g, '');
    } else {
        return name.replace(/([A-Z])/g,"-$1").toLowerCase().replace(/^-+|-+$/g, '');
    }
}

function parse_define() {
    let define_path = path.join(__dirname, 'style.define');
    let source = fs.readFileSync(define_path, 'utf-8');
    source = source.replaceAll(/\/\/.*/g, '');
    let tokens = [];
    for (let token of source.split(/\s+/)) {
        if (token.length == 1) {
            tokens.push(token);
            continue;
        }
        if (token.startsWith('{')
            || token.startsWith('}')
            || token.startsWith('=')) {
            tokens.push(token[0]);
            tokens.push(token.substring(1));
        } else if (token.endsWith(',') || token.endsWith(':')) {
            tokens.push(token.substring(0, token.length - 1));
            tokens.push(token.substring(token.length - 1));
        } else {
            tokens.push(token);
        }
    }
    let status = ENUM_OR_STRUCT;
    let enum_values = {};
    let struct_types = {};
    let enum_v;
    let struct_t;
    let last_index = -1;
    let indexs = new Set();
    let name = '';
    let mode = '';
    for (let token of tokens) {
        if (!token) {
            continue;
        }
        while (true) {
            switch (status) {
                case ENUM_OR_STRUCT:
                    if (token == 'struct') {
                        mode = 'struct';
                    } else {
                        assert_token(token, 'enum');
                        mode = 'enum';
                    }
                    status = NAME;
                    break
                case NAME:
                    assert_var_name(token);
                    name = token;
                    enum_v = {};
                    if (enum_values[name] !== undefined) {
                        throw new Error(`already exists enum name ${name}`);
                    }
                    enum_values[name] = enum_v;
                    if (mode === 'struct') {
                        struct_t = {};
                        struct_types[name] = struct_t;
                    }
                    status = LEFT;
                    last_index = -1;
                    indexs = new Set();
                    break
                case LEFT:
                    assert_token(token, '{');
                    status = KEY_OR_RIGHT;
                    break
                case KEY_OR_RIGHT:
                    if (token == '}') {
                        status = SEMICOLON;
                    } else {
                        assert_var_name(token);
                        key = token;
                        if (mode == 'enum') {
                            status = ASSIGN_OR_COMMA;
                        } else {
                            status = COLON;
                        }
                    }
                    break
                case COLON:
                    if (token == ':') {
                        status = TYPE;
                    } else {
                        status = ASSIGN_OR_COMMA;
                        continue;
                    }
                    break
                case TYPE:
                    if (enum_values[token] === undefined) {
                        throw new Error(`not exists enum ${token}`);
                    }
                    struct_t[key] = token;
                    status = ASSIGN_OR_COMMA;
                    break
                case ASSIGN_OR_COMMA:
                    if (token == '=') {
                        status = VALUE;
                    } else {
                        assert_token(token, ',');
                        let v = ++last_index;
                        if (indexs.has(v)) {
                            throw new Error(`${name} already exists index: ${v}`);
                        }
                        if (enum_v[key] !== undefined) {
                            throw new Error(`${name} already exists key: ${key}`);
                        }
                        enum_v[key] = v;
                        status = KEY_OR_RIGHT;
                    }
                    break
                case VALUE:
                    status = COMMA_OR_RIGHT;
                    let v = assert_int(token);
                    if (indexs.has(v)) {
                        throw new Error(`${name} already exists index: ${v}`);
                    }
                    if (enum_v[key] !== undefined) {
                        throw new Error(`${name} already exists key: ${key}`);
                    }
                    enum_v[key] = last_index = v;
                    break
                case COMMA_OR_RIGHT:
                    if (token == '}') {
                        status = SEMICOLON;
                    } else {
                        assert_token(token, ',');
                        status = KEY_OR_RIGHT;
                    }
                    break
                case SEMICOLON:
                    status = ENUM_OR_STRUCT;
                    break
                default:
                    throw new Error(`not except status: ${status}`);
            }
            break;
        }
    }
    return {
        enum_values,
        struct_types,
    }
}

module.exports = {
    parse_define,
    ROOT_NAME,
    toLine,
}