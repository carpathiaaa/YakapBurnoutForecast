import { BurnoutForecastEngine } from './ml/heuristics/forecast-engine';
import { WellnessSignal, calculateSignalScore } from './ml/heuristics/scoring-rubric';

// Mock data for testing
const mockSignals: WellnessSignal[] = [
  {
    type: 'check-in',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    value: 75,
    metadata: {
      emotionalState: 'good',
      energyLevel: 'moderate',
      stressLevel: 'low'
    }
  },
  {
    type: 'task',
    timestamp: new Date('2024-01-15T14:00:00Z'),
    value: 60,
    metadata: {
      completionRate: '80-99%',
      complexity: 'moderate',
      deadlinePressure: 'approaching'
    }
  },
  {
    type: 'calendar-event',
    timestamp: new Date('2024-01-15T09:00:00Z'),
    value: 50,
    metadata: {
      meetingFrequency: '3-5',
      meetingDuration: 'standard',
      timeOfDay: 'morning',
      meetingType: 'team-sync'
    }
  },
  {
    type: 'sleep',
    timestamp: new Date('2024-01-14T23:00:00Z'),
    value: 70,
    metadata: {
      sleepDuration: 'adequate',
      sleepQuality: 'good'
    }
  },
  {
    type: 'activity',
    timestamp: new Date('2024-01-15T08:00:00Z'),
    value: 65,
    metadata: {
      workHours: 'optimal',
      breakFrequency: 'regular'
    }
  }
];

async function testForecastEngine() {
  console.log('🧪 Testing Burnout Forecast Engine...\n');

  // Test 1: Individual signal scoring
  console.log('📊 Test 1: Individual Signal Scoring');
  mockSignals.forEach((signal, index) => {
    const score = calculateSignalScore(signal);
    console.log(`Signal ${index + 1} (${signal.type}):`);
    console.log(`  Score: ${score.score.toFixed(2)}`);
    console.log(`  Category: ${score.category}`);
    console.log(`  Weight: ${score.weight}`);
    console.log('');
  });

  // Test 2: Full forecast computation
  console.log('🔮 Test 2: Full Forecast Computation');
  const engine = new BurnoutForecastEngine();
  
  try {
    const forecast = await engine.computeForecast('test-user-123', mockSignals);
    
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
    
    console.log(`\n⏰ Next Check-in: ${forecast.nextCheckIn.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error generating forecast:', error);
  }

  // Test 3: Edge cases
  console.log('\n🔍 Test 3: Edge Cases');
  
  // Test with insufficient data
  const insufficientSignals = mockSignals.slice(0, 2);
  const insufficientForecast = await engine.computeForecast('test-user-456', insufficientSignals);
  console.log(`Insufficient data forecast - Risk Level: ${insufficientForecast.riskLevel}`);
  
  // Test with no data
  const noDataForecast = await engine.computeForecast('test-user-789', []);
  console.log(`No data forecast - Risk Level: ${noDataForecast.riskLevel}`);
  
  console.log('\n✅ All tests completed!');
}

// Run the tests
testForecastEngine().catch(console.error); 