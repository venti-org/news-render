import * as fs from 'fs';
import * as path from 'path';

const ENUM_OR_STRUCT: number = 0;
const NAME: number = 1;
const LEFT: number = 2;
const KEY_OR_RIGHT: number = 3;
const ASSIGN_OR_COMMA: number = 4;
const VALUE: number = 5;
const COMMA_OR_RIGHT: number = 6;
const SEMICOLON: number = 7;
const COLON: number = 8; // :
const TYPE: number = 9;

const ROOT_NAME: string = 'StyleIndex';

function assert_token(token: string, value: string): void {
    if (token != value) {
        throw new Error(`except token ${value} but got ${token}`);
    }
}

function assert_ne(src: any, value: any): void {
    if (src == value) {
        throw new Error(`src == value: "${src}" == "${value}"`);
    }
}

function assert_var_name(token: string): void {
    let index: number = token.search(/[^a-zA-Z0-9_]/);
    let first: number = token.charCodeAt(0);

    if (index >= 0 || (first >= 48 && first <= 57)) {
        throw new Error(`not except var name ${token}`);
    }
}

function assert_int(token: string): number {
    let n: number = Number.parseInt(token);
    return n;
}

// 下划线转换驼峰
function toHump(name: string): string {
    return name.replace(/\_(\w)/g, function(all, letter){
        return letter.toUpperCase();
    });
}
// 驼峰转换下划线
function toLine(name: string, contain_line: boolean | null = null): string {
    if (contain_line === null) {
        contain_line = name.indexOf('_') >= 0
    }
    if (contain_line) {
        return name.toLowerCase().replace(/_/g, '-').replace(/^-+|-+$/g, '');
    } else {
        return name.replace(/([A-Z])/g,"-$1").toLowerCase().replace(/^-+|-+$/g, '');
    }
}

function parse_define(): { enum_values: any, struct_types: any } {
    let define_path: string = path.join(__dirname, 'style.define');
    let source: string = fs.readFileSync(define_path, 'utf-8');
    source = source.replace(/\/\/.*/g, '');
    let tokens: string[] = [];
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
    let status: number = ENUM_OR_STRUCT;
    let enum_values: any = {};
    let struct_types: any = {};
    let enum_v: any;
    let struct_t: any;
    let last_index: number = -1;
    let indexs: Set<number> = new Set();
    let name: string = '';
    let mode: string = '';
    let key: string = '';
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
                    assert_ne(key, '');
                    struct_t[key] = token;
                    status = ASSIGN_OR_COMMA;
                    break
                case ASSIGN_OR_COMMA:
                    if (token == '=') {
                        status = VALUE;
                    } else {
                        assert_token(token, ',');
                        let v: number = ++last_index;
                        if (indexs.has(v)) {
                            throw new Error(`${name} already exists index: ${v}`);
                        }
                        assert_ne(key, '');
                        if (enum_v[key] !== undefined) {
                            throw new Error(`${name} already exists key: ${key}`);
                        }
                        enum_v[key] = v;
                        status = KEY_OR_RIGHT;
                    }
                    break
                case VALUE:
                    status = COMMA_OR_RIGHT;
                    let v: number = assert_int(token);
                    if (indexs.has(v)) {
                        throw new Error(`${name} already exists index: ${v}`);
                    }
                    assert_ne(key, '');
                    if (enum_v[key] !== undefined) {
                        throw new Error(`${name} already exists key: ${key}`);
                    }
                    enum_v[key] = last_index = v;
                    key = '';
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

export {
    parse_define,
    ROOT_NAME,
    toLine,
}