import { assert } from 'console';
import { parse_define, ROOT_NAME } from './parse_define';

function gen_cpp(): void {
  const { enum_values, struct_types } = parse_define();
  const style_index: any = enum_values[ROOT_NAME];
  const struct_type: any = struct_types[ROOT_NAME];
  const style_index_items: string[] = [];
  const style_key_type = new Map<string, string>();
  const type_names: string[] = [];
  const info_keys: string[] = [];

  console.log("#include <string>");
  console.log("#include <vector>");

  const default_type = 'int';
  for (let key in style_index) {
    info_keys.push(key);
    const index = style_index[key];
    style_index_items.push(`${key} = ${index},`);
    let key_type = struct_type[key];
    if (!key_type) {
      key_type = default_type;
    } else {
      if (type_names.indexOf(key_type) == -1) {
        type_names.push(key_type);
      }
    }
    style_key_type.set(key, key_type);
  }

  const style_index_src = `enum StyleIndex {
    ${style_index_items.join('\n    ').toUpperCase()}
};`;

  console.log(style_index_src);
  console.log();

  let zero_keys = new Map<String, String>();
  zero_keys.set(default_type, '0');
  for (let type_name of type_names) {
    const items: string[] = [];
    const enum_v = enum_values[type_name];
    let zero_key = null;

    for (let key in enum_v) {
      const index = enum_v[key];
      key = type_name.toUpperCase() + "_" + key.toUpperCase();
      if (index == 0) {
        zero_key = key;
      }
      items.push(`${key} = ${index},`);
    }

    const src = `enum ${type_name} {
    ${items.join('\n    ')}
};`;

    console.log(src);
    console.log();

    if (zero_key) {
        zero_keys.set(type_name, zero_key);
    }
  }

  const style_info_src = `struct StyleInfo {
    ${info_keys.map(key => {
      let key_type = style_key_type.get(key) || '';
      assert(key_type);
      let default_value = zero_keys.get(key_type);
      if (default_value) {
        return key_type + " " + key + " = " + default_value + ";";
      } else {
        return key_type + " " + key + ";";
      }
    }).join('\n    ')}
};`;

  console.log(style_info_src);

  console.log(`
std::vector<std::string> splitString(const std::string& input, char delimiter) {
    std::vector<std::string> tokens;
    size_t start = 0;
    size_t end = input.find(delimiter);

    while (end != std::string::npos) {
        tokens.push_back(input.substr(start, end - start));
        start = end + 1;
        end = input.find(delimiter, start);
    }

    tokens.push_back(input.substr(start));
    return tokens;
}

void parse_style_info(const std::string& s, StyleInfo& style) {
    std::vector<std::string> items = splitString(s, ';');

    ${info_keys.map(key => "style." +
        key + " = (" + style_key_type.get(key) + ")std::stoi(items[" + key.toUpperCase() + "]);").join('\n    ')}
}

struct VisionInfo {
  int width = -1;
  int height = -1;
  int x = -1;
  int y = -1;
  bool visible = false;
};

void parse_vision_info(const std::string& s, VisionInfo& vision) {
  std::vector<std::string> items = splitString(s, ';');
  vision.width = (int)std::stoi(items[0]);
  vision.height = (int)std::stoi(items[1]);
  vision.x = (int)std::stoi(items[2]);
  vision.y = (int)std::stoi(items[3]);
  vision.visible = (bool)std::stoi(items[4]);
}`);
}

export default gen_cpp;
