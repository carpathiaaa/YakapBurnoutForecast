import { BurnoutForecastEngine } from './ml/heuristics/forecast-engine';
import { WellnessSignal, calculateSignalScore, SIGNAL_WEIGHTS } from './ml/heuristics/scoring-rubric';

// Test data with more varied signals
const debugSignals: WellnessSignal[] = [
  {
    type: 'check-in',
    timestamp: new Date(),
    value: 75,
    metadata: {
      emotionalState: 'excellent',
      energyLevel: 'high',
      stressLevel: 'none'
    }
  },
  {
    type: 'task',
    timestamp: new Date(),
    value: 60,
    metadata: {
      completionRate: '100%',
      complexity: 'simple',
      deadlinePressure: 'no-deadline'
    }
  },
  {
    type: 'calendar-event',
    timestamp: new Date(),
    value: 50,
    metadata: {
      meetingFrequency: '0-2',
      meetingDuration: 'short',
      timeOfDay: 'morning',
      meetingType: 'one-on-one'
    }
  },
  {
    type: 'sleep',
    timestamp: new Date(),
    value: 70,
    metadata: {
      sleepDuration: 'optimal',
      sleepQuality: 'excellent'
    }
  },
  {
    type: 'activity',
    timestamp: new Date(),
    value: 65,
    metadata: {
      workHours: 'optimal',
      breakFrequency: 'regular'
    }
  }
];

async function debugForecastEngine() {
  console.log('🔍 Debugging Burnout Forecast Engine...\n');

  // Debug individual signal scoring
  console.log('📊 Debug: Individual Signal Scoring');
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  debugSignals.forEach((signal, index) => {
    const score = calculateSignalScore(signal);
    const weightedScore = score.score * score.weight;
    
    console.log(`Signal ${index + 1} (${signal.type}):`);
    console.log(`  Raw Score: ${score.score.toFixed(2)}`);
    console.log(`  Weight: ${score.weight}`);
    console.log(`  Weighted Score: ${weightedScore.toFixed(2)}`);
    console.log(`  Category: ${score.category}`);
    console.log('');
    
    totalWeightedScore += weightedScore;
    totalWeight += score.weight;
  });
  
  console.log(`Total Weighted Score: ${totalWeightedScore.toFixed(2)}`);
  console.log(`Total Weight: ${totalWeight.toFixed(2)}`);
  console.log(`Expected Overall Score: ${(totalWeightedScore / totalWeight).toFixed(2)}`);
  console.log('');

  // Test forecast engine
  console.log('🔮 Debug: Forecast Engine');
  const engine = new BurnoutForecastEngine();
  
  try {
    const forecast = await engine.computeForecast('debug-user-123', debugSignals);
    
    console.log('✅ Forecast generated successfully!');
    console.log(`Overall Score: ${forecast.overallScore.toFixed(2)}`);
    console.log(`Risk Level: ${forecast.riskLevel}`);
    console.log(`Confidence: ${(forecast.confidence * 100).toFixed(1)}%`);
    console.log(`Trend: ${forecast.trend}`);
    console.log(`Signal Count: ${forecast.metadata.signalCount}`);
    console.log(`Processing Time: ${forecast.metadata.processingTime}ms`);
    
    console.log('\n📋 Factors:');
    console.log(`  Positive: ${forecast.factors.positive.length} factors`);
    console.log(`  Negative: ${forecast.factors.negative.length} factors`);
    console.log(`  Neutral: ${forecast.factors.neutral.length} factors`);
    
    console.log('\n💡 Recommendations:');
    forecast.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
  } catch (error) {
    console.error('❌ Error generating forecast:', error);
  }

  // Test with negative signals
  console.log('\n⚠️ Debug: Negative Signals Test');
  const negativeSignals: WellnessSignal[] = [
    {
      type: 'check-in',
      timestamp: new Date(),
      value: 25,
      metadata: {
        emotionalState: 'terrible',
        energyLevel: 'exhausted',
        stressLevel: 'overwhelming'
      }
    },
    {
      type: 'task',
      timestamp: new Date(),
      value: 30,
      metadata: {
        completionRate: '0-19%',
        complexity: 'very-complex',
        deadlinePressure: 'overdue'
      }
    }
  ];
  
  try {
    const negativeForecast = await engine.computeForecast('debug-user-456', negativeSignals);
    console.log('✅ Negative forecast generated!');
    console.log(`Overall Score: ${negativeForecast.overallScore.toFixed(2)}`);
    console.log(`Risk Level: ${negativeForecast.riskLevel}`);
    console.log(`Confidence: ${(negativeForecast.confidence * 100).toFixed(1)}%`);
  } catch (error) {
    console.error('❌ Error generating negative forecast:', error);
  }

  console.log('\n✅ Debug completed!');
}

// Run the debug
debugForecastEngine().catch(console.error); 