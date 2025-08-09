export interface RecommendationContext {
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    primaryFactor: {
        category: string;
        impact: number;
        description: string;
    };
    emotionalWeather: {
        label: string;
        intensity: 'calm' | 'mild' | 'moderate' | 'stormy' | 'critical';
    };
    factors: {
        positive: string[];
        negative: string[];
        neutral: string[];
    };
    overallScore: number;
    trend: 'improving' | 'stable' | 'declining' | 'critical';
    signalCount: number;
}
export interface GeneratedRecommendation {
    text: string;
    category: 'immediate' | 'short-term' | 'long-term';
    priority: 'high' | 'medium' | 'low';
    confidence: number;
    reasoning: string;
}
export declare class RecommendationGenerator {
    private hf;
    private openai;
    private useOpenAI;
    constructor(apiKeys?: {
        huggingface?: string;
        openai?: string;
    });
    /**
     * Generate contextual recommendations using NLP
     */
    generateRecommendations(context: RecommendationContext): Promise<GeneratedRecommendation[]>;
    /**
     * Generate recommendations using OpenAI GPT models
     */
    private generateWithOpenAI;
    /**
     * Generate recommendations using Hugging Face models
     */
    private generateWithHuggingFace;
    /**
     * Build context-aware prompt for recommendation generation
     */
    private buildPrompt;
    /**
     * Parse OpenAI response into structured recommendations
     */
    private parseOpenAIResponse;
    /**
     * Parse Hugging Face response into structured recommendations
     */
    private parseHuggingFaceResponse;
    /**
     * Fallback to template-based recommendations
     */
    private generateTemplateRecommendations;
    /**
     * Determine recommendation category based on content and context
     */
    private determineCategory;
    /**
     * Determine recommendation priority based on content and context
     */
    private determinePriority;
    /**
     * Get factor-specific template recommendations
     */
    private getFactorSpecificRecommendation;
    /**
     * Get risk level descriptions
     */
    private getRiskLevelDescription;
    /**
     * Get factor descriptions
     */
    private getFactorDescription;
}
//# sourceMappingURL=recommendation-generator.d.ts.map