export interface Message {
    content: string;
    role: 'user' | 'assistant' | 'system';
}

export interface ParsedResponse {
    generatedSQL?: string;
    visualization?: any;
    textResponse?: string;
    responseFormat?: string;
    chartType?: string;
}