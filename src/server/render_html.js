function get_vision(elem) {
    let rect = elem.getClientRects()[0];
    if (rect) {
        let visible = Number(getComputedStyle(elem)['visibility'] != 'hidden');
        return `${Math.floor(rect.width)};${Math.floor(rect.height)};${Math.floor(rect.x)};${Math.floor(rect.y)};${visible}`;
    } else {
        return '0;0;0;0;0';
    }
}

function get_style(elem, gen_style) {
    let style = getComputedStyle(elem);
    let {
        max_index,
        name_values,
    } = gen_style;

    let result = [];
    for (let i = 0; i <= max_index; i++) {
        let name_value = name_values[i.toString()];
        if (name_value === undefined) {
            result.push('');
            continue;
        }
        let {
            name,
            result_type,
        } = name_value;
        if (!result_type) {
            let value = style[name];
            if (value.endsWith('px')) {
                result.push(Number(value.substring(0, value.length - 2)));
                continue;
            } else if (name == 'z-index' && value == 'auto') {
                result.push(0);
                continue;
            } else if (name.indexOf('color') >= 0) {
                if (value.startsWith('rgb(')) {
                    let rgb = value.slice(4,-1).split(', ').map(Number).reduce((i, a) => i << 8 + a);
                    result.push(rgb);
                    continue;
                }
                if (value.startsWith('rgba(')) {
                    let rgb = value.slice(5,-1).split(', ').map(Number).slice(0, -1).reduce((i, a) => i << 8 + a);
                    result.push(rgb);
                    continue;
                }
            }
            result.push(Number(value));
        } else {
            let value = style[name];
            let v = undefined;
            for (let item of result_type) {
                let key = item[0];
                if (key == value) {
                    v = item[1].toString();
                    break;
                }
            }
            if (v === undefined) {
                v = '0';
            }
            result.push(v);
        }
    }
    return result.join(';');
}

function render(gen_style) {
    document.querySelectorAll('*').forEach(elem => {
        elem.setAttribute('surface_vision_info', get_vision(elem));
        elem.setAttribute('dom_style_info', get_style(elem, gen_style));
    });
    return true;
}

render("GEN_STYLE");
