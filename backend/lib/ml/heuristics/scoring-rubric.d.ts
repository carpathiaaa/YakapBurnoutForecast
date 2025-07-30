export interface WellnessSignal {
    type: 'check-in' | 'task' | 'calendar-event' | 'sleep' | 'activity';
    timestamp: Date;
    value: number;
    metadata?: Record<string, any>;
}
export interface SignalScore {
    signal: WellnessSignal;
    score: number;
    weight: number;
    category: 'positive' | 'negative' | 'neutral';
}
export declare const SIGNAL_WEIGHTS: {
    'check-in': number;
    task: number;
    'calendar-event': number;
    sleep: number;
    activity: number;
};
export declare const CHECKIN_SCORING: {
    emotionalStates: {
        excellent: {
            score: number;
            weight: number;
        };
        good: {
            score: number;
            weight: number;
        };
        okay: {
            score: number;
            weight: number;
        };
        poor: {
            score: number;
            weight: number;
        };
        terrible: {
            score: number;
            weight: number;
        };
    };
    energyLevels: {
        high: {
            score: number;
            weight: number;
        };
        moderate: {
            score: number;
            weight: number;
        };
        low: {
            score: number;
            weight: number;
        };
        exhausted: {
            score: number;
            weight: number;
        };
    };
    stressLevels: {
        none: {
            score: number;
            weight: number;
        };
        low: {
            score: number;
            weight: number;
        };
        moderate: {
            score: number;
            weight: number;
        };
        high: {
            score: number;
            weight: number;
        };
        overwhelming: {
            score: number;
            weight: number;
        };
    };
};
export declare const TASK_SCORING: {
    completionRates: {
        '100%': {
            score: number;
            weight: number;
        };
        '80-99%': {
            score: number;
            weight: number;
        };
        '60-79%': {
            score: number;
            weight: number;
        };
        '40-59%': {
            score: number;
            weight: number;
        };
        '20-39%': {
            score: number;
            weight: number;
        };
        '0-19%': {
            score: number;
            weight: number;
        };
    };
    complexity: {
        simple: {
            score: number;
            weight: number;
        };
        moderate: {
            score: number;
            weight: number;
        };
        complex: {
            score: number;
            weight: number;
        };
        'very-complex': {
            score: number;
            weight: number;
        };
    };
    deadlinePressure: {
        'no-deadline': {
            score: number;
            weight: number;
        };
        distant: {
            score: number;
            weight: number;
        };
        approaching: {
            score: number;
            weight: number;
        };
        urgent: {
            score: number;
            weight: number;
        };
        overdue: {
            score: number;
            weight: number;
        };
    };
};
export declare const CALENDAR_SCORING: {
    meetingFrequency: {
        '0-2': {
            score: number;
            weight: number;
        };
        '3-5': {
            score: number;
            weight: number;
        };
        '6-8': {
            score: number;
            weight: number;
        };
        '9+': {
            score: number;
            weight: number;
        };
    };
    meetingDuration: {
        short: {
            score: number;
            weight: number;
        };
        standard: {
            score: number;
            weight: number;
        };
        long: {
            score: number;
            weight: number;
        };
        'very-long': {
            score: number;
            weight: number;
        };
    };
    timeOfDay: {
        morning: {
            score: number;
            weight: number;
        };
        afternoon: {
            score: number;
            weight: number;
        };
        evening: {
            score: number;
            weight: number;
        };
        'late-night': {
            score: number;
            weight: number;
        };
    };
    meetingType: {
        'one-on-one': {
            score: number;
            weight: number;
        };
        'team-sync': {
            score: number;
            weight: number;
        };
        presentation: {
            score: number;
            weight: number;
        };
        'client-meeting': {
            score: number;
            weight: number;
        };
        'performance-review': {
            score: number;
            weight: number;
        };
    };
};
export declare const SLEEP_SCORING: {
    sleepDuration: {
        optimal: {
            score: number;
            weight: number;
        };
        adequate: {
            score: number;
            weight: number;
        };
        insufficient: {
            score: number;
            weight: number;
        };
        poor: {
            score: number;
            weight: number;
        };
        'very-poor': {
            score: number;
            weight: number;
        };
    };
    sleepQuality: {
        excellent: {
            score: number;
            weight: number;
        };
        good: {
            score: number;
            weight: number;
        };
        fair: {
            score: number;
            weight: number;
        };
        poor: {
            score: number;
            weight: number;
        };
        'very-poor': {
            score: number;
            weight: number;
        };
    };
};
export declare const ACTIVITY_SCORING: {
    workHours: {
        optimal: {
            score: number;
            weight: number;
        };
        moderate: {
            score: number;
            weight: number;
        };
        long: {
            score: number;
            weight: number;
        };
        excessive: {
            score: number;
            weight: number;
        };
    };
    breakFrequency: {
        regular: {
            score: number;
            weight: number;
        };
        occasional: {
            score: number;
            weight: number;
        };
        rare: {
            score: number;
            weight: number;
        };
        none: {
            score: number;
            weight: number;
        };
    };
};
/**
 * Calculate score for a wellness signal based on its type and metadata
 */
export declare function calculateSignalScore(signal: WellnessSignal): SignalScore;
//# sourceMappingURL=scoring-rubric.d.ts.map