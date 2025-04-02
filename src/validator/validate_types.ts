type RenderRequest = {
    url: string;
    enable_js?: boolean;
    enable_image?: boolean;
    disable_network?: boolean;
    enable_media?: boolean;
    javascript?: string;
    body?: string;
    key?: string;
};

type RenderResponse = {
    render_error?: string;
    render_html?: string;
    javascript_error?: string;
    javascript_result?: string;
};

type CombileType = {
    RenderRequest?: RenderRequest,
    RenderResponse?: RenderResponse,
}

const CombileTypeName = {
    RenderRequest: 'RenderRequest',
    RenderResponse: 'RenderResponse',
};

export {
    RenderRequest,
    RenderResponse,
    CombileType,
    CombileTypeName,
};