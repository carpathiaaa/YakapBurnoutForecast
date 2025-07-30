import { BurnoutForecastEngine } from './ml/heuristics/forecast-engine';
import { WellnessSignal, calculateSignalScore } from './ml/heuristics/scoring-rubric';

// Generate 2 weeks of realistic dummy data
function generateTwoWeekData(): WellnessSignal[] {
  const signals: WellnessSignal[] = [];
  const startDate = new Date(); // Use current date
  startDate.setDate(startDate.getDate() - 13); // Start 13 days ago (2 weeks total)
  
  // Week 1: Good wellness patterns
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    
    // Daily check-in (morning)
    signals.push({
      type: 'check-in',
      timestamp: new Date(currentDate.getTime() + 9 * 60 * 60 * 1000), // 9 AM
      value: 75 + Math.random() * 20, // 75-95 range
      metadata: {
        emotionalState: ['excellent', 'good', 'good', 'excellent', 'good', 'excellent', 'good'][day],
        energyLevel: ['high', 'moderate', 'high', 'moderate', 'high', 'moderate', 'high'][day],
        stressLevel: ['none', 'low', 'none', 'low', 'none', 'low', 'none'][day]
      }
    });
    
    // Task completion (afternoon)
    signals.push({
      type: 'task',
      timestamp: new Date(currentDate.getTime() + 14 * 60 * 60 * 1000), // 2 PM
      value: 80 + Math.random() * 15, // 80-95 range
      metadata: {
        completionRate: ['100%', '80-99%', '100%', '80-99%', '100%', '80-99%', '100%'][day],
        complexity: ['simple', 'moderate', 'simple', 'moderate', 'simple', 'moderate', 'simple'][day],
        deadlinePressure: ['no-deadline', 'distant', 'no-deadline', 'distant', 'no-deadline', 'distant', 'no-deadline'][day]
      }
    });
    
    // Calendar events (varied)
    const meetingCount = [1, 2, 1, 3, 1, 2, 1][day];
    for (let meeting = 0; meeting < meetingCount; meeting++) {
      signals.push({
        type: 'calendar-event',
        timestamp: new Date(currentDate.getTime() + (10 + meeting * 2) * 60 * 60 * 1000), // 10 AM, 12 PM, 2 PM
        value: 60 + Math.random() * 20, // 60-80 range
        metadata: {
          meetingFrequency: meetingCount <= 2 ? '0-2' : '3-5',
          meetingDuration: ['short', 'standard', 'short'][meeting] || 'standard',
          timeOfDay: ['morning', 'afternoon', 'afternoon'][meeting] || 'morning',
          meetingType: ['one-on-one', 'team-sync', 'one-on-one'][meeting] || 'team-sync'
        }
      });
    }
    
    // Sleep data (night before)
    signals.push({
      type: 'sleep',
      timestamp: new Date(currentDate.getTime() - 8 * 60 * 60 * 1000), // Previous night
      value: 70 + Math.random() * 20, // 70-90 range
      metadata: {
        sleepDuration: ['optimal', 'adequate', 'optimal', 'adequate', 'optimal', 'adequate', 'optimal'][day],
        sleepQuality: ['excellent', 'good', 'excellent', 'good', 'excellent', 'good', 'excellent'][day]
      }
    });
    
    // Activity data (work hours)
    signals.push({
      type: 'activity',
      timestamp: new Date(currentDate.getTime() + 8 * 60 * 60 * 1000), // 8 AM
      value: 65 + Math.random() * 20, // 65-85 range
      metadata: {
        workHours: ['optimal', 'moderate', 'optimal', 'moderate', 'optimal', 'moderate', 'optimal'][day],
        breakFrequency: ['regular', 'occasional', 'regular', 'occasional', 'regular', 'occasional', 'regular'][day]
      }
    });
  }
  
  // Week 2: Declining wellness patterns (simulating burnout)
  for (let day = 7; day < 14; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    
    // Daily check-in (morning) - declining
    signals.push({
      type: 'check-in',
      timestamp: new Date(currentDate.getTime() + 9 * 60 * 60 * 1000), // 9 AM
      value: 40 + Math.random() * 30, // 40-70 range (declining)
      metadata: {
        emotionalState: ['okay', 'poor', 'okay', 'terrible', 'poor', 'okay', 'terrible'][day - 7],
        energyLevel: ['low', 'exhausted', 'low', 'exhausted', 'low', 'exhausted', 'low'][day - 7],
        stressLevel: ['moderate', 'high', 'moderate', 'overwhelming', 'high', 'moderate', 'overwhelming'][day - 7]
      }
    });
    
    // Task completion (afternoon) - declining
    signals.push({
      type: 'task',
      timestamp: new Date(currentDate.getTime() + 14 * 60 * 60 * 1000), // 2 PM
      value: 30 + Math.random() * 40, // 30-70 range (declining)
      metadata: {
        completionRate: ['60-79%', '40-59%', '60-79%', '20-39%', '40-59%', '60-79%', '20-39%'][day - 7],
        complexity: ['complex', 'very-complex', 'complex', 'very-complex', 'complex', 'very-complex', 'complex'][day - 7],
        deadlinePressure: ['approaching', 'urgent', 'approaching', 'overdue', 'urgent', 'approaching', 'overdue'][day - 7]
      }
    });
    
    // Calendar events (increasing stress)
    const meetingCount = [4, 5, 4, 6, 5, 4, 6][day - 7];
    for (let meeting = 0; meeting < meetingCount; meeting++) {
      signals.push({
        type: 'calendar-event',
        timestamp: new Date(currentDate.getTime() + (9 + meeting * 1.5) * 60 * 60 * 1000), // More meetings
        value: 30 + Math.random() * 30, // 30-60 range (declining)
        metadata: {
          meetingFrequency: '6-8',
          meetingDuration: ['long', 'very-long', 'long', 'very-long', 'long', 'very-long', 'long'][meeting] || 'long',
          timeOfDay: ['evening', 'late-night', 'evening', 'late-night', 'evening', 'late-night', 'evening'][meeting] || 'evening',
          meetingType: ['presentation', 'client-meeting', 'performance-review', 'presentation', 'client-meeting', 'performance-review', 'presentation'][meeting] || 'presentation'
        }
      });
    }
    
    // Sleep data (night before) - declining
    signals.push({
      type: 'sleep',
      timestamp: new Date(currentDate.getTime() - 6 * 60 * 60 * 1000), // Less sleep
      value: 30 + Math.random() * 40, // 30-70 range (declining)
      metadata: {
        sleepDuration: ['insufficient', 'poor', 'insufficient', 'very-poor', 'poor', 'insufficient', 'very-poor'][day - 7],
        sleepQuality: ['fair', 'poor', 'fair', 'very-poor', 'poor', 'fair', 'very-poor'][day - 7]
      }
    });
    
    // Activity data (work hours) - declining
    signals.push({
      type: 'activity',
      timestamp: new Date(currentDate.getTime() + 8 * 60 * 60 * 1000), // 8 AM
      value: 20 + Math.random() * 40, // 20-60 range (declining)
      metadata: {
        workHours: ['long', 'excessive', 'long', 'excessive', 'long', 'excessive', 'long'][day - 7],
        breakFrequency: ['rare', 'none', 'rare', 'none', 'rare', 'none', 'rare'][day - 7]
      }
    });
  }
  
  return signals;
}

async function testRealisticData() {
  console.log('🧪 Testing with 2 Weeks of Realistic Data...\n');
  
  const twoWeekData = generateTwoWeekData();
  console.log(`📊 Generated ${twoWeekData.length} signals over 2 weeks`);
  
  // Show date range
  const dates = twoWeekData.map(s => s.timestamp.toDateString()).filter((v, i, a) => a.indexOf(v) === i);
  console.log(`📅 Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
  
  // Analyze signal distribution
  const signalTypes = twoWeekData.reduce((acc, signal) => {
    acc[signal.type] = (acc[signal.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\n📈 Signal Distribution:');
  Object.entries(signalTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} signals`);
  });
  
  // Test individual signal scoring
  console.log('\n📊 Sample Signal Scoring:');
  const sampleSignals = twoWeekData.slice(0, 5);
  sampleSignals.forEach((signal, index) => {
    const score = calculateSignalScore(signal);
    console.log(`Signal ${index + 1} (${signal.type}): Score ${score.score.toFixed(2)}, Category ${score.category}`);
  });
  
  // Test forecast engine with full dataset
  console.log('\n🔮 Full Forecast Analysis:');
  const engine = new BurnoutForecastEngine();
  
  try {
    const forecast = await engine.computeForecast('realistic-user-123', twoWeekData);
    
    console.log('✅ Realistic forecast generated successfully!');
    console.log(`Overall Score: ${forecast.overallScore.toFixed(2)}`);
    console.log(`Risk Level: ${forecast.riskLevel}`);
    console.log(`Confidence: ${(forecast.confidence * 100).toFixed(1)}%`);
    console.log(`Trend: ${forecast.trend}`);
    console.log(`Signal Count: ${forecast.metadata.signalCount}`);
    console.log(`Processing Time: ${forecast.metadata.processingTime}ms`);
    
    console.log('\n📋 Factors Analysis:');
    console.log(`  Positive: ${forecast.factors.positive.length} factors`);
    console.log(`  Negative: ${forecast.factors.negative.length} factors`);
    console.log(`  Neutral: ${forecast.factors.neutral.length} factors`);
    
    console.log('\n💡 Recommendations:');
    forecast.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
    console.log(`\n⏰ Next Check-in: ${forecast.nextCheckIn.toLocaleString()}`);
    
    // Test time-based analysis
    console.log('\n📅 Time-based Analysis:');
    const week1Signals = twoWeekData.slice(0, 35); // First week
    const week2Signals = twoWeekData.slice(35); // Second week
    
    const week1Forecast = await engine.computeForecast('week1-user', week1Signals);
    const week2Forecast = await engine.computeForecast('week2-user', week2Signals);
    
    console.log(`Week 1 - Score: ${week1Forecast.overallScore.toFixed(2)}, Risk: ${week1Forecast.riskLevel}, Confidence: ${(week1Forecast.confidence * 100).toFixed(1)}%`);
    console.log(`Week 2 - Score: ${week2Forecast.overallScore.toFixed(2)}, Risk: ${week2Forecast.riskLevel}, Confidence: ${(week2Forecast.confidence * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Error generating realistic forecast:', error);
  }
  
  console.log('\n✅ Realistic data testing completed!');
}

// Run the realistic data test
testRealisticData().catch(console.error); 