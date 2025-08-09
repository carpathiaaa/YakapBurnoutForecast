export interface NLPConfig {
    openai?: {
        apiKey: string;
        model: string;
        maxTokens: number;
        temperature: number;
    };
    huggingface?: {
        apiKey: string;
        model: string;
        maxLength: number;
        temperature: number;
    };
    fallbackToTemplates: boolean;
    enableNLP: boolean;
}
export declare const DEFAULT_NLP_CONFIG: NLPConfig;
export declare function getNLPConfig(): NLPConfig;
//# sourceMappingURL=nlp-config.d.ts.map