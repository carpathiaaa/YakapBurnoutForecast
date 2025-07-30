# Yakap Burnout Forecast Engine

This directory contains the backend implementation for the Yakap Burnout Forecast app, including the ML scoring system, forecast computation engine, and Firestore integration.

## Architecture Overview

```
backend/
├── ml/heuristics/           # ML scoring and forecast logic
│   ├── scoring-rubric.ts    # Signal scoring system
│   └── forecast-engine.ts   # Main forecast computation
├── firestore/               # Database integration
│   └── forecast-service.ts  # Firestore operations
├── cloud-functions/         # Firebase Cloud Functions
│   └── generate-forecast.ts # API endpoints
└── index.ts                 # Main exports
```

## Core Components

### 1. Scoring Rubric (`ml/heuristics/scoring-rubric.ts`)

Defines how different wellness signals are scored:

- **Check-ins**: Emotional state, energy level, stress level
- **Tasks**: Completion rate, complexity, deadline pressure
- **Calendar Events**: Meeting frequency, duration, time of day, type
- **Sleep**: Duration and quality
- **Activity**: Work hours and break frequency

Each signal type has different weights in the overall calculation:

- Check-ins: 35% (highest weight - direct user input)
- Tasks: 25% (medium weight - completion patterns)
- Calendar events: 20% (medium weight - schedule stress)
- Sleep: 15% (lower weight - inferred patterns)
- Activity: 5% (lowest weight - background activity)

### 2. Forecast Engine (`ml/heuristics/forecast-engine.ts`)

The main computation engine that:

- Processes wellness signals within a configurable time window
- Calculates weighted overall scores
- Determines risk levels (low, moderate, high, critical)
- Analyzes trends (improving, stable, declining, critical)
- Generates personalized recommendations
- Calculates confidence levels based on data quality

### 3. Firestore Service (`firestore/forecast-service.ts`)

Handles all database operations:

- Save and retrieve burnout forecasts
- Store wellness signals with metadata
- Manage user profiles and preferences
- Clean up old data automatically

### 4. Cloud Functions (`cloud-functions/generate-forecast.ts`)

Provides REST API endpoints:

- `generateForecast`: Create new forecast from signals
- `getLatestForecast`: Retrieve most recent forecast
- `getForecastHistory`: Get forecast timeline
- `saveSignals`: Store wellness signals
- `getUserSignals`: Retrieve user signals
- `saveUserProfile`: Update user preferences
- `getUserProfile`: Get user data

## Data Models

### WellnessSignal

```typescript
interface WellnessSignal {
  type: "check-in" | "task" | "calendar-event" | "sleep" | "activity";
  timestamp: Date;
  value: number; // 0-100 scale
  metadata?: Record<string, any>;
}
```

### BurnoutForecast

```typescript
interface BurnoutForecast {
  userId: string;
  timestamp: Date;
  overallScore: number; // -100 to 100 scale
  riskLevel: "low" | "moderate" | "high" | "critical";
  confidence: number; // 0-1 scale
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  recommendations: string[];
  nextCheckIn: Date;
  trend: "improving" | "stable" | "declining" | "critical";
  signals: SignalScore[];
  metadata: {
    signalCount: number;
    timeRange: { start: Date; end: Date };
    processingTime: number;
  };
}
```

## Usage Examples

### Generate a Forecast

```typescript
import { BurnoutForecastEngine } from "./ml/heuristics/forecast-engine";

const engine = new BurnoutForecastEngine();
const signals = [
  {
    type: "check-in",
    timestamp: new Date(),
    value: 70,
    metadata: {
      emotionalState: "good",
      energyLevel: "moderate",
      stressLevel: "low",
    },
  },
];

const forecast = await engine.computeForecast("user123", signals);
console.log(`Risk Level: ${forecast.riskLevel}`);
console.log(`Score: ${forecast.overallScore}`);
```

### Save to Firestore

```typescript
import { ForecastService } from "./firestore/forecast-service";

const service = new ForecastService();
await service.saveForecast(forecast);
await service.saveSignals(signals, "user123", "manual");
```

## Configuration

The forecast engine can be configured with different parameters:

```typescript
const config = {
  analysisWindow: 14, // days
  minSignalsRequired: 5,
  riskThresholds: {
    low: 30,
    moderate: 10,
    high: -10,
    critical: -30,
  },
};

const engine = new BurnoutForecastEngine(config);
```

## Security

- All Firestore operations require user authentication
- Users can only access their own data
- Cloud Functions validate input and handle errors gracefully
- Sensitive data is not logged

## Deployment

1. Install dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Build the project:

   ```bash
   npm run build
   ```

3. Deploy to Firebase:

   ```bash
   npm run deploy
   ```

4. Set up Firestore indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

## Testing

Run the test suite:

```bash
npm test
```

## Monitoring

The system includes comprehensive logging for:

- Forecast generation performance
- Signal processing errors
- Database operation success/failure
- User interaction patterns

## Future Enhancements

1. **Machine Learning Integration**: Replace heuristic scoring with trained ML models
2. **Real-time Processing**: Stream processing for immediate insights
3. **Advanced Analytics**: Trend analysis and predictive modeling
4. **Integration APIs**: Connect with external wellness platforms
5. **A/B Testing**: Test different scoring algorithms
6. **Personalization**: User-specific scoring adjustments

## Contributing

1. Follow TypeScript best practices
2. Add comprehensive error handling
3. Include unit tests for new features
4. Update documentation for API changes
5. Ensure security best practices

## Support

For questions or issues, please refer to the main project documentation or create an issue in the repository.
