# Yakap Burnout Forecast - Complete Project Analysis

## 1. Prototype Design and User Experience

### Onboarding Flow: Define how users create personalized Wellness Passports, selecting burnout indicators, recovery strategies, and work preferences.

**Current Implementation:**

- **Multi-step Onboarding Process**: Implemented in `frontend/features/onboarding/OnboardingScreen.tsx` with guided step-by-step flow
- **Wellness Passport Creation**: Users build personalized profiles through interactive components in `frontend/features/onboarding/components/OnboardingStep.tsx`
- **Burnout Indicators Selection**: Users select from predefined stress signals including:
  - Headaches or fatigue
  - Trouble concentrating
  - Irritability or mood swings
  - Loss of motivation
  - Sleep issues
- **Recovery Strategies**: Users choose from options like:
  - Naps or sleep
  - Exercise
  - Meditation / prayer
  - Talking with friends/family
  - Journaling
  - Taking breaks from screens
- **Work Preferences**: Users configure:
  - Work arrangement (Onsite/Hybrid/Remote)
  - Focus hours (start/end times)
  - Department selection
  - Productive time periods
  - Energized days of the week
  - Meeting comfort levels

**UI Components:**

- **Interactive Selection Cards**: Replaced checkboxes with clickable elements for better UX
- **Slider Components**: For rating scales (energy levels, meeting tolerance)
- **Time Picker Integration**: For focus hours configuration
- **Image Upload**: Profile picture selection capability
- **Responsive Design**: Adapts to different screen sizes with consistent styling

### Visual Metaphors: Develop and test the Emotional Weather Forecast system using engaging, easy-to-understand icons and language.

**Weather System Implementation:**

- **Emotional Weather States**: Defined in `frontend/services/forecast-service.ts` with 5 intensity levels:
  - **Calm**: "Clear Skies" or "Mostly Sunny" (low risk)
  - **Mild**: "Partly Cloudy" (moderate risk)
  - **Moderate**: "Cloudy with Rising Tension" (moderate risk, declining)
  - **Stormy**: "Storm Watch" (high risk)
  - **Critical**: "Critical Storm" (critical risk)
- **Icon System**: Implemented in `frontend/components/SvgIcon.tsx` with emoji-based icons:
  - ☀️ Sun (clear skies)
  - ⛅ Partly cloudy
  - ☁️ Cloudy
  - ⛈️ Stormy
  - 🚨 Critical
- **Language Design**: User-friendly descriptions that explain wellness status in relatable terms
- **Risk Level Classification**: Color-coded system (green, yellow, red, dark red) for quick visual assessment

### Interaction Design: Build daily check-in flows, interactive charts, and recommendation action buttons focusing on non-intrusive user engagement.

**Daily Check-in Flow:**

- **Modal-based Interface**: Implemented in `frontend/navigation/MainNavigator.tsx` with non-intrusive modal popup
- **Quick Assessment**: 2-question format (energy rating 1-5, sleep hours)
- **Smart Scheduling**: Appears once per day with duplicate prevention
- **Automatic Processing**: Generates forecast immediately after submission

**Interactive Charts:**

- **Sleep Analytics**: 7-day bar charts in `frontend/screens/BurnoutMirrorScreen.tsx`
  - Interactive bar selection with value display
  - Average line indicators
  - Professional analytics styling
  - Responsive touch interactions
- **Meeting Analytics**: Similar interactive charts for meeting frequency
- **Task Distribution**: Visual breakdown of urgent vs. total tasks

**Recommendation Action Buttons:**

- **Contextual Display**: Recommendations appear in insight bubbles
- **Priority-based Organization**: Immediate, short-term, long-term categorization
- **Actionable Language**: Clear, specific suggestions users can implement
- **Non-intrusive Presentation**: Integrated into existing UI without disrupting workflow

### Privacy Controls: Design granular user permissions allowing full control over data sharing and visibility.

**Privacy Implementation:**

- **Granular Permissions**: Implemented in `frontend/screens/SettingsScreen.tsx`
  - Check-in reminders (on/off)
  - Forecast notifications (on/off)
  - Passport sharing with managers (on/off)
  - Trello integration (on/off)
  - Auto forecast generation (on/off)
  - Weekly insights (on/off)
- **User Consent Workflow**: Explicit opt-in for all data sharing features
- **Data Visibility Controls**: Users control what information is shared with managers
- **Transparency**: Clear descriptions of what each setting controls

## 2. Data Integration and Signal Processing

### Data Sources: Specify which self-reported inputs (energy, mood, sleep quality), calendar metadata, and task management data (e.g., Trello integration) are included.

**Self-Reported Inputs:**

- **Energy Levels**: 1-5 scale daily ratings
- **Sleep Data**: Duration (hours) and quality assessments
- **Emotional State**: Mood indicators and stress levels
- **Work Preferences**: Arrangement, focus hours, productivity times

**Calendar Metadata:**

- **Meeting Frequency**: Daily meeting counts tracked in `meetings_daily` collection
- **Meeting Patterns**: Duration, time of day, meeting types
- **Schedule Analysis**: Work hours and break patterns

**Task Management Integration:**

- **Trello Integration**: Implemented in `frontend/services/trello-service.ts`
- **Task Metrics**: Total tasks, overdue tasks, due today, due this week
- **Urgency Levels**: Color-coded priority system
- **Workload Assessment**: Task complexity and deadline pressure correlation

### Data Collection: Outline mechanisms for daily check-ins and automated data pulling, ensuring minimal user friction.

**Daily Check-in Mechanism:**

- **Automatic Prompting**: Modal appears once per day in `MainNavigator.tsx`
- **Duplicate Prevention**: Checks `daily_checkins` collection before allowing submission
- **Seamless Integration**: 2-minute completion time with minimal friction
- **Automatic Processing**: Generates wellness signals and forecasts immediately

**Automated Data Pulling:**

- **Trello API Integration**: Automated fetching of board data
- **Real-time Updates**: Focus-based refresh when screens come into view
- **Pull-to-Refresh**: Manual refresh capabilities on all data screens
- **Background Processing**: Data updates without user intervention

**Data Storage Strategy:**

- **Firestore Collections**: Organized data structure
  - `daily_checkins`: User check-in data
  - `meetings_daily`: Meeting frequency data
  - `wellness_signals`: Raw signal data
  - `burnout_forecasts`: Generated forecasts
  - `users`: User profiles and preferences

### Signal Transformation: Develop algorithms to standardize heterogeneous data into wellness signals suitable for analytics.

**Signal Processing Pipeline:**

- **Data Standardization**: Implemented in `frontend/services/forecast-service.ts`
- **Wellness Signal Interface**:
  ```typescript
  interface WellnessSignal {
    type: "check-in" | "task" | "calendar-event" | "sleep" | "activity";
    timestamp: string;
    value: number;
    metadata?: Record<string, any>;
  }
  ```
- **Signal Generation**: Raw data transformed into standardized signals
- **Temporal Analysis**: Pattern recognition across time periods
- **Quality Assessment**: Data validation and reliability scoring

**Unified Data Processing:**

- **Shared Utility Functions**: Consistent data handling across screens
  - `buildLastNDates()`: Standardized date range generation
  - `getSleepDataForDateRange()`: Unified sleep data fetching
  - `calculateSleepDelta()`: Consistent sleep trend calculations
- **Cross-Screen Consistency**: Same data sources and calculations used everywhere

## 3. Machine Learning and Risk Assessment

### Heuristic Development: Create baseline rules or models that capture meaningful burnout risk signals (e.g., increased meeting load combined with poor sleep).

**Risk Signal Heuristics:**

- **Sleep Quality Correlation**: Poor sleep + high meeting load = increased risk
- **Energy Level Patterns**: Declining energy over time = risk indicator
- **Task Urgency Impact**: High overdue tasks + low sleep = critical risk
- **Meeting Frequency**: Sudden increase in meetings = stress indicator

**Baseline Rules Implementation:**

- **Scoring Algorithm**: Implemented in `backend/ml/heuristics/forecast-engine.ts`
- **Multi-factor Analysis**: Combines sleep, energy, meetings, and task data
- **Threshold-based Classification**: Risk levels based on composite scores
- **Confidence Scoring**: Statistical confidence based on data quality and quantity

### Risk Scoring: Define risk levels (low, moderate, high, critical) and compute confidence scores using statistical or lightweight ML methods.

**Risk Level Classification:**

- **Low Risk**: Score ≥ 67, "Clear Skies" weather
- **Moderate Risk**: Score 34-66, "Partly Cloudy" weather
- **High Risk**: Score < 34, "Storm Watch" weather
- **Critical Risk**: Score < 20, "Critical Storm" weather

**Confidence Scoring:**

- **Data Quality Assessment**: Based on signal count and consistency
- **Statistical Confidence**: Calculated from data variance and sample size
- **Default Confidence**: 70% for initial forecasts
- **Dynamic Adjustment**: Confidence increases with more data points

**Scoring Implementation:**

```typescript
const overallScore = Math.round(
  signals.reduce((s, cur) => s + (isFinite(cur.value) ? cur.value : 0), 0) /
    Math.max(1, signals.length)
);
```

### Trend Analysis: Analyze wellness signal trajectories to detect improving or declining patterns.

**Trend Detection:**

- **Pattern Recognition**: Analyzes signal trajectories over time
- **Trend Categories**: Improving, stable, declining, critical
- **Statistical Analysis**: Uses moving averages and variance analysis
- **Visual Indicators**: Trend arrows and weather changes reflect patterns

**Implementation Details:**

- **Historical Data Analysis**: Compares current vs. baseline patterns
- **Delta Calculations**: Sleep delta, meeting frequency changes
- **Pattern Matching**: Identifies recurring stress patterns
- **Predictive Elements**: Forecasts future risk based on current trends

## 4. Recommendation Engine

### Context-Aware Suggestions: Formulate personalized recommendations based on user patterns, such as scheduling breaks or adjusting workloads.

**Recommendation Generation:**

- **Context Analysis**: Implemented in `frontend/services/recommendation-service.ts`
- **Pattern-based Suggestions**: Recommendations based on user's specific patterns
- **Sleep-focused Recommendations**:
  - Sleep down 10%+ → "Schedule recovery block and target earlier wind-down"
  - Sleep up 10%+ → "Protect this pattern by keeping sleep window consistent"
- **Meeting-focused Recommendations**:
  - Meetings up 20%+ → "Decline low-priority invites and block focus time"
  - Meetings down 20%+ → "Use this window for deep-work tasks"

**Personalization Factors:**

- **User Preferences**: Considers work arrangement and productivity times
- **Historical Patterns**: Based on user's past behavior and responses
- **Current Context**: Adapts to immediate workload and stress levels
- **Recovery Strategies**: Aligns with user's preferred recovery methods

### Priority Setting: Design multi-tier recommendations (immediate, short-term, long-term) aligned with risk levels.

**Priority System:**

- **Immediate Actions**: High-priority interventions for critical situations
  - "High risk detected. Reduce workload for 24 hours and add restorative breaks"
  - "Sleep is down 31%. Schedule a 20-30 minute recovery block"
- **Short-term Strategies**: Weekly planning and habit formation
  - "Fewer meetings this week. Use this window for deep-work tasks"
  - "Great sleep pattern. Protect this by keeping sleep window consistent"
- **Long-term Planning**: Sustainable lifestyle and work pattern changes
  - Focus on habit formation and sustainable practices
  - Work pattern optimization and boundary setting

**Risk-based Prioritization:**

- **High/Critical Risk**: Immediate actions prioritized
- **Moderate Risk**: Short-term strategies emphasized
- **Low Risk**: Long-term planning and maintenance focus

### User Feedback Loop: Implement mechanisms for users to rate recommendations and provide qualitative feedback.

**Feedback Collection:**

- **Recommendation Display**: Clear presentation in insight bubbles
- **Action Tracking**: Users can implement and track recommendation effectiveness
- **Qualitative Feedback**: Space for users to provide additional context
- **Continuous Learning**: Feedback used to improve future recommendations

**Implementation Status:**

- **Basic Framework**: Recommendation display system in place
- **Future Enhancement**: User rating and feedback collection planned
- **Learning Integration**: Feedback will inform recommendation algorithm improvements

## 5. Privacy, Security, and Ethical Considerations

### Consent Framework: Establish opt-in workflows for data collection and sharing, aligned with GDPR and local regulations.

**Consent Implementation:**

- **Explicit Opt-in**: All data sharing requires explicit user consent
- **Granular Controls**: Users control each type of data sharing separately
- **Transparent Communication**: Clear descriptions of what data is collected and why
- **Easy Withdrawal**: Users can revoke consent at any time through settings

**Privacy Settings:**

- **Data Sharing Controls**: Implemented in Settings screen
- **Manager Sharing**: Optional sharing with managers for wellness support
- **Team Analytics**: Aggregated, anonymized data only
- **Individual Control**: Users decide what information is visible to others

### Data Storage: Design encrypted local and cloud storage strategies ensuring data protection at rest and in transit.

**Storage Strategy:**

- **Firebase Firestore**: Secure cloud storage with built-in encryption
- **Local Caching**: AsyncStorage for offline functionality
- **Data Isolation**: User-specific data with proper access controls
- **Secure Authentication**: Firebase Auth with Google Sign-In

**Security Measures:**

- **Firestore Security Rules**: Implemented in `backend/firestore.rules`
- **User-based Access**: Users can only access their own data
- **Encrypted Transit**: HTTPS for all data transmission
- **Secure Authentication**: OAuth 2.0 with Google

**Data Protection:**

- **At Rest Encryption**: Firebase provides automatic encryption
- **In Transit Security**: All communications use TLS/SSL
- **Access Controls**: Role-based permissions and user isolation
- **Audit Logging**: Firebase provides comprehensive audit trails

### Transparency: Provide clear user communication on data usage, alongside export and deletion options.

**Transparency Features:**

- **Clear Communication**: Settings screen explains each data usage
- **Data Export**: Users can export their data (planned feature)
- **Data Deletion**: Users can delete their account and all associated data
- **Usage Transparency**: Clear explanation of how data is used for recommendations

**User Rights:**

- **Data Portability**: Export functionality for user data
- **Right to Deletion**: Complete account and data removal
- **Access Rights**: Users can view all their stored data
- **Correction Rights**: Users can update and correct their information

**Communication Strategy:**

- **Privacy Policy**: Clear documentation of data practices
- **Terms of Service**: Transparent terms and conditions
- **User Education**: In-app explanations of privacy features
- **Regular Updates**: Communication about privacy changes and improvements

---

**Implementation Status Summary:**

- ✅ **Completed**: Core features, data integration, basic ML heuristics, privacy controls
- 🚧 **In Progress**: Advanced analytics, user feedback collection
- 📋 **Planned**: Data export, advanced ML models, team features
- 🔮 **Future**: Ecosystem integrations, advanced privacy features
