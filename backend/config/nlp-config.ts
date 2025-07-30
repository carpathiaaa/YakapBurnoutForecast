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

export const DEFAULT_NLP_CONFIG: NLPConfig = {
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

export function getNLPConfig(): NLPConfig {
  return {
    ...DEFAULT_NLP_CONFIG,
    openai: {
      ...DEFAULT_NLP_CONFIG.openai!,
      apiKey: process.env.OPENAI_API_KEY || DEFAULT_NLP_CONFIG.openai!.apiKey
    },
    huggingface: {
      ...DEFAULT_NLP_CONFIG.huggingface!,
      apiKey: process.env.HUGGINGFACE_API_KEY || DEFAULT_NLP_CONFIG.huggingface!.apiKey
    }
  };
} 