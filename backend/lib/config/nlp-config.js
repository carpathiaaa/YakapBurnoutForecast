"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_NLP_CONFIG = void 0;
exports.getNLPConfig = getNLPConfig;
exports.DEFAULT_NLP_CONFIG = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-3.5-turbo',
        maxTokens: 500,
        temperature: 0.7
    },
    huggingface: {
        apiKey: process.env.HUGGINGFACE_API_KEY || '',
        model: 'gpt2',
        maxLength: 200,
        temperature: 0.7
    },
    fallbackToTemplates: true,
    enableNLP: true
};
function getNLPConfig() {
    return {
        ...exports.DEFAULT_NLP_CONFIG,
        openai: {
            ...exports.DEFAULT_NLP_CONFIG.openai,
            apiKey: process.env.OPENAI_API_KEY || exports.DEFAULT_NLP_CONFIG.openai.apiKey
        },
        huggingface: {
            ...exports.DEFAULT_NLP_CONFIG.huggingface,
            apiKey: process.env.HUGGINGFACE_API_KEY || exports.DEFAULT_NLP_CONFIG.huggingface.apiKey
        }
    };
}
//# sourceMappingURL=nlp-config.js.map