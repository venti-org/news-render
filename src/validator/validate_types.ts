type RenderRequest = {
    url: string;
    enable_js?: boolean;
    javascript?: string;
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