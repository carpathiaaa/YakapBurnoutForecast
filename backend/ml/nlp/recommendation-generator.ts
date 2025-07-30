import { HfInference } from '@huggingface/inference';
import OpenAI from 'openai';
import nlp from 'compromise';

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

export class RecommendationGenerator {
  private hf: HfInference | null;
  private openai: OpenAI | null;
  private useOpenAI: boolean;

  constructor(apiKeys: { huggingface?: string; openai?: string } = {}) {
    this.hf = apiKeys.huggingface ? new HfInference(apiKeys.huggingface) : null;
    this.openai = apiKeys.openai ? new OpenAI({ apiKey: apiKeys.openai }) : null;
    this.useOpenAI = !!apiKeys.openai;
  }

  /**
   * Generate contextual recommendations using NLP
   */
  async generateRecommendations(context: RecommendationContext): Promise<GeneratedRecommendation[]> {
    try {
      if (this.useOpenAI && this.openai) {
        return await this.generateWithOpenAI(context);
      } else if (this.hf) {
        return await this.generateWithHuggingFace(context);
      } else {
        // No API keys provided, use template-based recommendations
        return this.generateTemplateRecommendations(context);
      }
    } catch (error) {
      console.error('NLP recommendation generation failed, falling back to template-based:', error);
      return this.generateTemplateRecommendations(context);
    }
  }

  /**
   * Generate recommendations using OpenAI GPT models
   */
  private async generateWithOpenAI(context: RecommendationContext): Promise<GeneratedRecommendation[]> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }
    
    const prompt = this.buildPrompt(context);
    
    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a wellness coach specializing in burnout prevention. Generate 3-5 actionable, specific recommendations based on the user's current state. Focus on practical, immediate actions they can take."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content || '';
    return this.parseOpenAIResponse(response, context);
  }

  /**
   * Generate recommendations using Hugging Face models
   */
  private async generateWithHuggingFace(context: RecommendationContext): Promise<GeneratedRecommendation[]> {
    if (!this.hf) {
      throw new Error('HuggingFace client not initialized');
    }
    
    const prompt = this.buildPrompt(context);
    
    // Use a text generation model for recommendations
    const response = await this.hf.textGeneration({
      model: "gpt2", // Fallback to GPT-2 if no specific model
      inputs: prompt,
      parameters: {
        max_length: 200,
        temperature: 0.7,
        do_sample: true
      }
    });

    return this.parseHuggingFaceResponse(response.generated_text, context);
  }

  /**
   * Build context-aware prompt for recommendation generation
   */
  private buildPrompt(context: RecommendationContext): string {
    const riskLevelDescription = this.getRiskLevelDescription(context.riskLevel);
    const factorDescription = this.getFactorDescription(context.primaryFactor);
    const weatherDescription = context.emotionalWeather.label;
    
    return `
Current Wellness State:
- Risk Level: ${riskLevelDescription}
- Emotional Weather: ${weatherDescription}
- Primary Factor: ${factorDescription}
- Overall Score: ${context.overallScore}
- Trend: ${context.trend}
- Signal Count: ${context.signalCount}

Negative Factors: ${context.factors.negative.join(', ')}
Positive Factors: ${context.factors.positive.join(', ')}

Generate 3-5 specific, actionable recommendations that address the primary factor and current risk level. Focus on practical steps the user can take immediately or in the next few days.
    `.trim();
  }

  /**
   * Parse OpenAI response into structured recommendations
   */
  private parseOpenAIResponse(response: string, context: RecommendationContext): GeneratedRecommendation[] {
    const recommendations: GeneratedRecommendation[] = [];
    const lines = response.split('\n').filter(line => line.trim());
    
    lines.forEach((line, index) => {
      const cleanedLine = line.replace(/^\d+\.\s*/, '').trim();
      if (cleanedLine) {
        recommendations.push({
          text: cleanedLine,
          category: this.determineCategory(cleanedLine, context),
          priority: this.determinePriority(cleanedLine, context),
          confidence: 0.8 + (Math.random() * 0.2), // 0.8-1.0 for AI-generated
          reasoning: `Generated based on ${context.primaryFactor.category} patterns and ${context.riskLevel} risk level`
        });
      }
    });

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  /**
   * Parse Hugging Face response into structured recommendations
   */
  private parseHuggingFaceResponse(response: string, context: RecommendationContext): GeneratedRecommendation[] {
    // Extract meaningful sentences from the generated text
    const doc = nlp(response);
    const sentences = doc.sentences().out('array');
    
    const recommendations: GeneratedRecommendation[] = [];
    
    sentences.slice(0, 5).forEach((sentence: string, index: number) => {
      const cleanedSentence = sentence.trim();
      if (cleanedSentence && cleanedSentence.length > 10) {
        recommendations.push({
          text: cleanedSentence,
          category: this.determineCategory(cleanedSentence, context),
          priority: this.determinePriority(cleanedSentence, context),
          confidence: 0.6 + (Math.random() * 0.3), // 0.6-0.9 for HF models
          reasoning: `Generated based on ${context.primaryFactor.category} analysis`
        });
      }
    });

    return recommendations;
  }

  /**
   * Fallback to template-based recommendations
   */
  private generateTemplateRecommendations(context: RecommendationContext): GeneratedRecommendation[] {
    const recommendations: GeneratedRecommendation[] = [];
    
    // Base recommendations by risk level
    switch (context.riskLevel) {
      case 'low':
        recommendations.push({
          text: 'Continue your current wellness practices and maintain regular check-ins',
          category: 'long-term',
          priority: 'low',
          confidence: 0.9,
          reasoning: 'Low risk level indicates good current practices'
        });
        break;
      case 'moderate':
        recommendations.push({
          text: 'Take short breaks throughout the day and review your workload',
          category: 'short-term',
          priority: 'medium',
          confidence: 0.8,
          reasoning: 'Moderate risk requires preventive measures'
        });
        break;
      case 'high':
        recommendations.push({
          text: 'Consider taking a day off or reducing your workload if possible',
          category: 'immediate',
          priority: 'high',
          confidence: 0.9,
          reasoning: 'High risk requires immediate intervention'
        });
        break;
      case 'critical':
        recommendations.push({
          text: 'Immediate action needed - consider taking time off and seek professional support',
          category: 'immediate',
          priority: 'high',
          confidence: 1.0,
          reasoning: 'Critical risk requires urgent intervention'
        });
        break;
    }

    // Add factor-specific recommendations
    const factorRecommendation = this.getFactorSpecificRecommendation(context.primaryFactor);
    if (factorRecommendation) {
      recommendations.push(factorRecommendation);
    }

    return recommendations;
  }

  /**
   * Determine recommendation category based on content and context
   */
  private determineCategory(text: string, context: RecommendationContext): 'immediate' | 'short-term' | 'long-term' {
    const immediateKeywords = ['immediate', 'now', 'today', 'urgent', 'right away', 'stop', 'take time off'];
    const shortTermKeywords = ['this week', 'next few days', 'short break', 'schedule', 'plan'];
    
    const lowerText = text.toLowerCase();
    
    if (immediateKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'immediate';
    } else if (shortTermKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'short-term';
    } else {
      return 'long-term';
    }
  }

  /**
   * Determine recommendation priority based on content and context
   */
  private determinePriority(text: string, context: RecommendationContext): 'high' | 'medium' | 'low' {
    if (context.riskLevel === 'critical' || context.riskLevel === 'high') {
      return 'high';
    }
    
    const highPriorityKeywords = ['urgent', 'immediate', 'critical', 'stop', 'seek help'];
    const lowerText = text.toLowerCase();
    
    if (highPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'high';
    } else if (context.riskLevel === 'moderate') {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get factor-specific template recommendations
   */
  private getFactorSpecificRecommendation(primaryFactor: RecommendationContext['primaryFactor']): GeneratedRecommendation | null {
    const recommendations: Record<string, GeneratedRecommendation> = {
      'check-in': {
        text: 'Complete a wellness check-in today to assess your current emotional state',
        category: 'immediate',
        priority: 'medium',
        confidence: 0.8,
        reasoning: 'No recent check-ins detected'
      },
      'task': {
        text: 'Break down complex tasks into smaller, manageable steps',
        category: 'short-term',
        priority: 'medium',
        confidence: 0.8,
        reasoning: 'Task completion rates are declining'
      },
      'calendar-event': {
        text: 'Consider declining non-essential meetings and block focus time',
        category: 'short-term',
        priority: 'medium',
        confidence: 0.8,
        reasoning: 'High meeting load detected'
      },
      'sleep': {
        text: 'Establish a consistent bedtime routine and aim for 7-8 hours of quality sleep',
        category: 'long-term',
        priority: 'medium',
        confidence: 0.8,
        reasoning: 'Sleep patterns need improvement'
      },
      'activity': {
        text: 'Start with short walks or gentle stretching breaks throughout the day',
        category: 'short-term',
        priority: 'low',
        confidence: 0.7,
        reasoning: 'Activity levels need attention'
      }
    };

    return recommendations[primaryFactor.category] || null;
  }

  /**
   * Get risk level descriptions
   */
  private getRiskLevelDescription(riskLevel: string): string {
    const descriptions = {
      'low': 'Low risk - maintaining good wellness practices',
      'moderate': 'Moderate risk - some attention needed',
      'high': 'High risk - immediate action recommended',
      'critical': 'Critical risk - urgent intervention required'
    };
    return descriptions[riskLevel as keyof typeof descriptions] || 'Unknown risk level';
  }

  /**
   * Get factor descriptions
   */
  private getFactorDescription(primaryFactor: RecommendationContext['primaryFactor']): string {
    return `${primaryFactor.category} (impact: ${primaryFactor.impact.toFixed(1)}) - ${primaryFactor.description}`;
  }
} 