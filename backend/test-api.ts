import { BurnoutForecastEngine } from './ml/heuristics/forecast-engine';
import { WellnessSignal } from './ml/heuristics/scoring-rubric';

// Test data
const testSignals: WellnessSignal[] = [
  {
    type: 'check-in',
    timestamp: new Date(),
    value: 75,
    metadata: {
      emotionalState: 'good',
      energyLevel: 'moderate',
      stressLevel: 'low'
    }
  },
  {
    type: 'task',
    timestamp: new Date(),
    value: 60,
    metadata: {
      completionRate: '80-99%',
      complexity: 'moderate',
      deadlinePressure: 'approaching'
    }
  }
];

async function testCloudFunctions() {
  console.log('🧪 Testing Cloud Functions...\n');

  // Test the forecast engine directly
  console.log('🔮 Testing Forecast Engine Directly');
  const engine = new BurnoutForecastEngine();
  
  try {
    const forecast = await engine.computeForecast('test-user-123', testSignals);
    console.log('✅ Direct forecast generation successful!');
    console.log(`Overall Score: ${forecast.overallScore.toFixed(2)}`);
    console.log(`Risk Level: ${forecast.riskLevel}`);
    console.log(`Confidence: ${(forecast.confidence * 100).toFixed(1)}%`);
    console.log(`Trend: ${forecast.trend}`);
    console.log(`Signal Count: ${forecast.metadata.signalCount}`);
    
    console.log('\n📋 Factors:');
    console.log(`  Positive: ${forecast.factors.positive.length} factors`);
    console.log(`  Negative: ${forecast.factors.negative.length} factors`);
    console.log(`  Neutral: ${forecast.factors.neutral.length} factors`);
    
    console.log('\n💡 Recommendations:');
    forecast.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
  } catch (error) {
    console.error('❌ Error in direct forecast generation:', error);
  }

  // Test different configurations
  console.log('\n⚙️ Testing Different Configurations');
  
  const customConfig = {
    analysisWindow: 7, // 1 week
    minSignalsRequired: 2,
    confidenceThresholds: {
      low: 0.2,
      moderate: 0.5,
      high: 0.8
    },
    riskThresholds: {
      low: 20,
      moderate: 0,
      high: -20,
      critical: -40
    }
  };
  
  try {
    const customForecast = await engine.computeForecast('test-user-456', testSignals, customConfig);
    console.log('✅ Custom config forecast successful!');
    console.log(`Overall Score: ${customForecast.overallScore.toFixed(2)}`);
    console.log(`Risk Level: ${customForecast.riskLevel}`);
    console.log(`Confidence: ${(customForecast.confidence * 100).toFixed(1)}%`);
  } catch (error) {
    console.error('❌ Error in custom config forecast:', error);
  }

  console.log('\n✅ API testing completed!');
}

// Run the API tests
testCloudFunctions().catch(console.error); 