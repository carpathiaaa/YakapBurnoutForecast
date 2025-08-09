export type UIType = 
  | 'image-upload'
  | 'multi-checkbox'
  | 'multi-button'
  | 'single-button'
  | 'dropdown'
  | 'slider'
  | 'time-range'
  | 'radio'
  | 'button-select';

export interface OnboardingStep {
  id: string;
  section: string;
  question: string;
  uiType: UIType;
  options?: string[];
  min?: number;
  max?: number;
  label?: string;
  extra?: any;
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'profile_picture',
    section: 'Profile Setup',
    question: 'Upload Profile Picture',
    uiType: 'image-upload',
  },
  {
    id: 'stress_signals',
    section: 'Stress Signals / Burnout Signs',
    question: 'Which signs do you experience when nearing burnout?',
    uiType: 'multi-checkbox',
    options: [
      'Headaches or fatigue',
      'Trouble concentrating',
      'Irritability or mood swings',
      'Loss of motivation',
      'Sleep issues',
    ],
  },
  {
    id: 'recovery_strategies',
    section: 'Recovery Strategies',
    question: 'Which recovery strategies work best for you?',
    uiType: 'multi-checkbox',
    options: [
      'Naps or sleep',
      'Exercise',
      'Meditation / prayer',
      'Talking with friends/family',
      'Journaling',
      'Taking breaks from screens',
    ],
  },
  {
    id: 'work_arrangement',
    section: 'Work Preferences',
    question: 'Preferred work arrangement',
    uiType: 'button-select',
    options: ['Onsite', 'Hybrid', 'Remote'],
    extra: {
      descriptions: {
        Onsite: 'Traditional work mode (in-person).',
        Hybrid: 'Combination of onsite and offsite work.',
        Remote: 'Most work are completed offsite.'
      },
      icons: {
        Onsite: 'map-marker',
        Hybrid: 'sync',
        Remote: 'briefcase'
      }
    }
  },
  {
    id: 'department',
    section: 'Profile',
    question: 'Which department are you part of?',
    uiType: 'dropdown',
    options: [
      'Engineering',
      'Marketing',
      'Sales',
      'Human Resources',
      'Finance',
      'Operations',
      'Product',
      'Design',
      'Customer Support',
      'Legal',
      'IT',
      'Research & Development'
    ],
  },
  {
    id: 'productivity_time',
    section: 'Work Preferences',
    question: 'When are you most productive during the day?',
    uiType: 'single-button',
    options: ['Morning', 'Afternoon', 'Evening', 'Varies'],
  },
  {
    id: 'energized_days',
    section: 'Work Preferences',
    question: 'Which days do you feel most energized to work?',
    uiType: 'multi-button',
    options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  {
    id: 'focus_hours',
    section: 'Focus Hours',
    question: 'Select your focus hours',
    uiType: 'time-range',
    // No extra.weekdays
  },
  {
    id: 'meeting_tolerance',
    section: 'Meetings Tolerance',
    question: 'How many meetings per week can you comfortably handle?',
    uiType: 'slider',
    extra: {
      min: 0,
      max: 10,
      label: '0 = Prefer no meetings, 10+ = Comfortable with frequent meetings'
    },
  },
];