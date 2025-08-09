"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVITY_SCORING = exports.SLEEP_SCORING = exports.CALENDAR_SCORING = exports.TASK_SCORING = exports.CHECKIN_SCORING = exports.SIGNAL_WEIGHTS = void 0;
exports.calculateSignalScore = calculateSignalScore;
// Scoring weights for different signal types
exports.SIGNAL_WEIGHTS = {
    'check-in': 0.35, // High weight - direct user input
    'task': 0.25, // Medium weight - completion patterns
    'calendar-event': 0.20, // Medium weight - schedule stress
    'sleep': 0.15, // Lower weight - inferred from patterns
    'activity': 0.05 // Lowest weight - background activity
};
// Check-in scoring rubric
exports.CHECKIN_SCORING = {
    // Emotional state scoring (0-100 scale)
    emotionalStates: {
        'excellent': { score: 80, weight: 1.0 },
        'good': { score: 60, weight: 0.8 },
        'okay': { score: 40, weight: 0.6 },
        'poor': { score: 20, weight: 0.4 },
        'terrible': { score: 0, weight: 0.2 }
    },
    // Energy level scoring
    energyLevels: {
        'high': { score: 70, weight: 1.0 },
        'moderate': { score: 50, weight: 0.8 },
        'low': { score: 30, weight: 0.6 },
        'exhausted': { score: 10, weight: 0.4 }
    },
    // Stress level scoring (inverted - higher stress = lower score)
    stressLevels: {
        'none': { score: 90, weight: 1.0 },
        'low': { score: 70, weight: 0.9 },
        'moderate': { score: 40, weight: 0.7 },
        'high': { score: 20, weight: 0.5 },
        'overwhelming': { score: 0, weight: 0.3 }
    }
};
// Task completion scoring rubric
exports.TASK_SCORING = {
    // Completion rate impact
    completionRates: {
        '100%': { score: 80, weight: 1.0 },
        '80-99%': { score: 70, weight: 0.9 },
        '60-79%': { score: 50, weight: 0.7 },
        '40-59%': { score: 30, weight: 0.5 },
        '20-39%': { score: 10, weight: 0.3 },
        '0-19%': { score: -20, weight: 0.2 }
    },
    // Task complexity impact
    complexity: {
        'simple': { score: 10, weight: 0.3 },
        'moderate': { score: 0, weight: 0.5 },
        'complex': { score: -10, weight: 0.7 },
        'very-complex': { score: -20, weight: 0.9 }
    },
    // Deadline pressure
    deadlinePressure: {
        'no-deadline': { score: 20, weight: 0.5 },
        'distant': { score: 10, weight: 0.6 },
        'approaching': { score: -10, weight: 0.8 },
        'urgent': { score: -30, weight: 1.0 },
        'overdue': { score: -50, weight: 1.0 }
    }
};
// Calendar event scoring rubric
exports.CALENDAR_SCORING = {
    // Meeting frequency impact
    meetingFrequency: {
        '0-2': { score: 20, weight: 0.5 },
        '3-5': { score: 0, weight: 0.7 },
        '6-8': { score: -10, weight: 0.8 },
        '9+': { score: -30, weight: 1.0 }
    },
    // Meeting duration impact
    meetingDuration: {
        'short': { score: 10, weight: 0.4 },
        'standard': { score: 0, weight: 0.6 },
        'long': { score: -15, weight: 0.8 },
        'very-long': { score: -25, weight: 1.0 }
    },
    // Time of day impact
    timeOfDay: {
        'morning': { score: 5, weight: 0.5 },
        'afternoon': { score: 0, weight: 0.6 },
        'evening': { score: -5, weight: 0.7 },
        'late-night': { score: -15, weight: 0.9 }
    },
    // Meeting type impact
    meetingType: {
        'one-on-one': { score: 5, weight: 0.4 },
        'team-sync': { score: 0, weight: 0.6 },
        'presentation': { score: -10, weight: 0.8 },
        'client-meeting': { score: -15, weight: 0.9 },
        'performance-review': { score: -25, weight: 1.0 }
    }
};
// Sleep scoring rubric
exports.SLEEP_SCORING = {
    // Sleep duration impact
    sleepDuration: {
        'optimal': { score: 60, weight: 1.0 },
        'adequate': { score: 40, weight: 0.8 },
        'insufficient': { score: 20, weight: 0.6 },
        'poor': { score: 0, weight: 0.4 },
        'very-poor': { score: -20, weight: 0.2 }
    },
    // Sleep quality impact
    sleepQuality: {
        'excellent': { score: 60, weight: 1.0 },
        'good': { score: 40, weight: 0.8 },
        'fair': { score: 20, weight: 0.6 },
        'poor': { score: 0, weight: 0.4 },
        'very-poor': { score: -20, weight: 0.2 }
    }
};
// Activity scoring rubric
exports.ACTIVITY_SCORING = {
    // Work hours impact
    workHours: {
        'optimal': { score: 20, weight: 0.5 },
        'moderate': { score: 0, weight: 0.6 },
        'long': { score: -10, weight: 0.8 },
        'excessive': { score: -30, weight: 1.0 }
    },
    // Break frequency impact
    breakFrequency: {
        'regular': { score: 15, weight: 0.5 },
        'occasional': { score: 5, weight: 0.6 },
        'rare': { score: -10, weight: 0.8 },
        'none': { score: -25, weight: 1.0 }
    }
};
/**
 * Calculate score for a wellness signal based on its type and metadata
 */
function calculateSignalScore(signal) {
    const baseWeight = exports.SIGNAL_WEIGHTS[signal.type];
    let score = 0;
    // Calculate score based on signal type
    switch (signal.type) {
        case 'check-in':
            score = calculateCheckinScore(signal);
            break;
        case 'task':
            score = calculateTaskScore(signal);
            break;
        case 'calendar-event':
            score = calculateCalendarScore(signal);
            break;
        case 'sleep':
            score = calculateSleepScore(signal);
            break;
        case 'activity':
            score = calculateActivityScore(signal);
            break;
        default:
            score = 0;
    }
    // Determine category based on score
    let category;
    if (score > 20)
        category = 'positive';
    else if (score < -20)
        category = 'negative';
    else
        category = 'neutral';
    return {
        signal,
        score,
        weight: baseWeight,
        category
    };
}
function calculateCheckinScore(signal) {
    const { emotionalState, energyLevel, stressLevel } = signal.metadata || {};
    let score = 0;
    if (emotionalState && exports.CHECKIN_SCORING.emotionalStates[emotionalState]) {
        score += exports.CHECKIN_SCORING.emotionalStates[emotionalState].score;
    }
    if (energyLevel && exports.CHECKIN_SCORING.energyLevels[energyLevel]) {
        score += exports.CHECKIN_SCORING.energyLevels[energyLevel].score;
    }
    if (stressLevel && exports.CHECKIN_SCORING.stressLevels[stressLevel]) {
        score += exports.CHECKIN_SCORING.stressLevels[stressLevel].score;
    }
    return score / 3; // Average of all factors
}
function calculateTaskScore(signal) {
    const { completionRate, complexity, deadlinePressure } = signal.metadata || {};
    let score = 0;
    if (completionRate && exports.TASK_SCORING.completionRates[completionRate]) {
        score += exports.TASK_SCORING.completionRates[completionRate].score;
    }
    if (complexity && exports.TASK_SCORING.complexity[complexity]) {
        score += exports.TASK_SCORING.complexity[complexity].score;
    }
    if (deadlinePressure && exports.TASK_SCORING.deadlinePressure[deadlinePressure]) {
        score += exports.TASK_SCORING.deadlinePressure[deadlinePressure].score;
    }
    return score;
}
function calculateCalendarScore(signal) {
    const { meetingFrequency, meetingDuration, timeOfDay, meetingType } = signal.metadata || {};
    let score = 0;
    if (meetingFrequency && exports.CALENDAR_SCORING.meetingFrequency[meetingFrequency]) {
        score += exports.CALENDAR_SCORING.meetingFrequency[meetingFrequency].score;
    }
    if (meetingDuration && exports.CALENDAR_SCORING.meetingDuration[meetingDuration]) {
        score += exports.CALENDAR_SCORING.meetingDuration[meetingDuration].score;
    }
    if (timeOfDay && exports.CALENDAR_SCORING.timeOfDay[timeOfDay]) {
        score += exports.CALENDAR_SCORING.timeOfDay[timeOfDay].score;
    }
    if (meetingType && exports.CALENDAR_SCORING.meetingType[meetingType]) {
        score += exports.CALENDAR_SCORING.meetingType[meetingType].score;
    }
    return score;
}
function calculateSleepScore(signal) {
    const { sleepDuration, sleepQuality } = signal.metadata || {};
    let score = 0;
    if (sleepDuration && exports.SLEEP_SCORING.sleepDuration[sleepDuration]) {
        score += exports.SLEEP_SCORING.sleepDuration[sleepDuration].score;
    }
    if (sleepQuality && exports.SLEEP_SCORING.sleepQuality[sleepQuality]) {
        score += exports.SLEEP_SCORING.sleepQuality[sleepQuality].score;
    }
    return score / 2; // Average of duration and quality
}
function calculateActivityScore(signal) {
    const { workHours, breakFrequency } = signal.metadata || {};
    let score = 0;
    if (workHours && exports.ACTIVITY_SCORING.workHours[workHours]) {
        score += exports.ACTIVITY_SCORING.workHours[workHours].score;
    }
    if (breakFrequency && exports.ACTIVITY_SCORING.breakFrequency[breakFrequency]) {
        score += exports.ACTIVITY_SCORING.breakFrequency[breakFrequency].score;
    }
    return score / 2; // Average of work hours and break frequency
}
//# sourceMappingURL=scoring-rubric.js.map