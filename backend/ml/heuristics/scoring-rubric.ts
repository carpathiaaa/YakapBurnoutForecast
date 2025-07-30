export interface WellnessSignal {
  type: 'check-in' | 'task' | 'calendar-event' | 'sleep' | 'activity';
  timestamp: Date;
  value: number; // 0-100 scale
  metadata?: Record<string, any>;
}

export interface SignalScore {
  signal: WellnessSignal;
  score: number; // -100 to 100 scale
  weight: number; // 0-1 scale
  category: 'positive' | 'negative' | 'neutral';
}

// Scoring weights for different signal types
export const SIGNAL_WEIGHTS = {
  'check-in': 0.35, // High weight - direct user input
  'task': 0.25,     // Medium weight - completion patterns
  'calendar-event': 0.20, // Medium weight - schedule stress
  'sleep': 0.15,    // Lower weight - inferred from patterns
  'activity': 0.05  // Lowest weight - background activity
};

// Check-in scoring rubric
export const CHECKIN_SCORING = {
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
export const TASK_SCORING = {
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
export const CALENDAR_SCORING = {
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
export const SLEEP_SCORING = {
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
export const ACTIVITY_SCORING = {
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
export function calculateSignalScore(signal: WellnessSignal): SignalScore {
  const baseWeight = SIGNAL_WEIGHTS[signal.type];
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
  let category: 'positive' | 'negative' | 'neutral';
  if (score > 20) category = 'positive';
  else if (score < -20) category = 'negative';
  else category = 'neutral';
  
  return {
    signal,
    score,
    weight: baseWeight,
    category
  };
}

function calculateCheckinScore(signal: WellnessSignal): number {
  const { emotionalState, energyLevel, stressLevel } = signal.metadata || {};
  let score = 0;
  
  if (emotionalState && CHECKIN_SCORING.emotionalStates[emotionalState as keyof typeof CHECKIN_SCORING.emotionalStates]) {
    score += CHECKIN_SCORING.emotionalStates[emotionalState as keyof typeof CHECKIN_SCORING.emotionalStates].score;
  }
  
  if (energyLevel && CHECKIN_SCORING.energyLevels[energyLevel as keyof typeof CHECKIN_SCORING.energyLevels]) {
    score += CHECKIN_SCORING.energyLevels[energyLevel as keyof typeof CHECKIN_SCORING.energyLevels].score;
  }
  
  if (stressLevel && CHECKIN_SCORING.stressLevels[stressLevel as keyof typeof CHECKIN_SCORING.stressLevels]) {
    score += CHECKIN_SCORING.stressLevels[stressLevel as keyof typeof CHECKIN_SCORING.stressLevels].score;
  }
  
  return score / 3; // Average of all factors
}

function calculateTaskScore(signal: WellnessSignal): number {
  const { completionRate, complexity, deadlinePressure } = signal.metadata || {};
  let score = 0;
  
  if (completionRate && TASK_SCORING.completionRates[completionRate as keyof typeof TASK_SCORING.completionRates]) {
    score += TASK_SCORING.completionRates[completionRate as keyof typeof TASK_SCORING.completionRates].score;
  }
  
  if (complexity && TASK_SCORING.complexity[complexity as keyof typeof TASK_SCORING.complexity]) {
    score += TASK_SCORING.complexity[complexity as keyof typeof TASK_SCORING.complexity].score;
  }
  
  if (deadlinePressure && TASK_SCORING.deadlinePressure[deadlinePressure as keyof typeof TASK_SCORING.deadlinePressure]) {
    score += TASK_SCORING.deadlinePressure[deadlinePressure as keyof typeof TASK_SCORING.deadlinePressure].score;
  }
  
  return score;
}

function calculateCalendarScore(signal: WellnessSignal): number {
  const { meetingFrequency, meetingDuration, timeOfDay, meetingType } = signal.metadata || {};
  let score = 0;
  
  if (meetingFrequency && CALENDAR_SCORING.meetingFrequency[meetingFrequency as keyof typeof CALENDAR_SCORING.meetingFrequency]) {
    score += CALENDAR_SCORING.meetingFrequency[meetingFrequency as keyof typeof CALENDAR_SCORING.meetingFrequency].score;
  }
  
  if (meetingDuration && CALENDAR_SCORING.meetingDuration[meetingDuration as keyof typeof CALENDAR_SCORING.meetingDuration]) {
    score += CALENDAR_SCORING.meetingDuration[meetingDuration as keyof typeof CALENDAR_SCORING.meetingDuration].score;
  }
  
  if (timeOfDay && CALENDAR_SCORING.timeOfDay[timeOfDay as keyof typeof CALENDAR_SCORING.timeOfDay]) {
    score += CALENDAR_SCORING.timeOfDay[timeOfDay as keyof typeof CALENDAR_SCORING.timeOfDay].score;
  }
  
  if (meetingType && CALENDAR_SCORING.meetingType[meetingType as keyof typeof CALENDAR_SCORING.meetingType]) {
    score += CALENDAR_SCORING.meetingType[meetingType as keyof typeof CALENDAR_SCORING.meetingType].score;
  }
  
  return score;
}

function calculateSleepScore(signal: WellnessSignal): number {
  const { sleepDuration, sleepQuality } = signal.metadata || {};
  let score = 0;
  
  if (sleepDuration && SLEEP_SCORING.sleepDuration[sleepDuration as keyof typeof SLEEP_SCORING.sleepDuration]) {
    score += SLEEP_SCORING.sleepDuration[sleepDuration as keyof typeof SLEEP_SCORING.sleepDuration].score;
  }
  
  if (sleepQuality && SLEEP_SCORING.sleepQuality[sleepQuality as keyof typeof SLEEP_SCORING.sleepQuality]) {
    score += SLEEP_SCORING.sleepQuality[sleepQuality as keyof typeof SLEEP_SCORING.sleepQuality].score;
  }
  
  return score / 2; // Average of duration and quality
}

function calculateActivityScore(signal: WellnessSignal): number {
  const { workHours, breakFrequency } = signal.metadata || {};
  let score = 0;
  
  if (workHours && ACTIVITY_SCORING.workHours[workHours as keyof typeof ACTIVITY_SCORING.workHours]) {
    score += ACTIVITY_SCORING.workHours[workHours as keyof typeof ACTIVITY_SCORING.workHours].score;
  }
  
  if (breakFrequency && ACTIVITY_SCORING.breakFrequency[breakFrequency as keyof typeof ACTIVITY_SCORING.breakFrequency]) {
    score += ACTIVITY_SCORING.breakFrequency[breakFrequency as keyof typeof ACTIVITY_SCORING.breakFrequency].score;
  }
  
  return score / 2; // Average of work hours and break frequency
} 