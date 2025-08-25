import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';
import { Line, Pie, Doughnut, Bar } from 'react-chartjs-2';
import { 
  handleSignOut, 
  getCurrentUser,
  fetchMeetingsDaily,
  fetchUsers,
  fetchWellnessSignals,
  fetchBurnoutForecasts
} from '../firebase/firebaseMain.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    meetingsDaily: [],
    users: [],
    wellnessSignals: [],
    burnoutForecasts: []
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [meetingsDaily, users, wellnessSignals, burnoutForecasts] = await Promise.all([
          fetchMeetingsDaily(),
          fetchUsers(),
          fetchWellnessSignals(),
          fetchBurnoutForecasts()
        ]);

        setData({
          meetingsDaily,
          users,
          wellnessSignals,
          burnoutForecasts
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchAllData();
  }, []);

  const handleSignOutClick = async () => {
    try {
      await handleSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Process data for charts
  const processMeetingsData = () => {
    if (!data.meetingsDaily || !data.meetingsDaily.length) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Daily Meetings Count',
          data: [0],
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true
        }]
      };
    }
    
    const sortedData = data.meetingsDaily.sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sortedData.map(item => new Date(item.date).toLocaleDateString());
    const counts = sortedData.map(item => item.count || 0);
    
    return {
      labels,
      datasets: [{
        label: 'Daily Meetings Count',
        data: counts,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  };

     // Calculate department averages
   const calculateDepartmentAverages = () => {
     if (!data.users || !data.users.length) {
       return [{ department: 'No Data', average: 0 }];
     }

     const departmentStats = {};
     data.users.forEach(user => {
       const dept = user.department || 'Unknown';
       if (!departmentStats[dept]) {
         departmentStats[dept] = { count: 0 };
       }
       departmentStats[dept].count++;
     });

     return Object.entries(departmentStats).map(([dept, stats]) => ({
       department: dept,
       average: stats.count
     }));
   };

     // Calculate energy level averages
   const calculateEnergyLevelAverages = () => {
     if (!data.wellnessSignals || !data.wellnessSignals.length) {
       return [{ level: 'No Data', average: 0 }];
     }

     const energyStats = {};
     data.wellnessSignals.forEach(signal => {
       const level = signal.metadata?.energyLevel || 'Unknown';
       if (!energyStats[level]) {
         energyStats[level] = { count: 0 };
       }
       energyStats[level].count++;
     });

     return Object.entries(energyStats).map(([level, stats]) => ({
       level: level,
       average: stats.count
     }));
   };

     // Calculate emotional state averages
   const calculateEmotionalStateAverages = () => {
     if (!data.wellnessSignals || !data.wellnessSignals.length) {
       return [{ state: 'No Data', average: 0 }];
     }

     const emotionalStats = {};
     data.wellnessSignals.forEach(signal => {
       const state = signal.metadata?.emotionalState || 'Unknown';
       if (!emotionalStats[state]) {
         emotionalStats[state] = { count: 0 };
       }
       emotionalStats[state].count++;
     });

     return Object.entries(emotionalStats).map(([state, stats]) => ({
       state: state,
       average: stats.count
     }));
   };

     // Calculate overall burnout score mean
   const calculateOverallBurnoutMean = () => {
     if (!data.burnoutForecasts || !data.burnoutForecasts.length) {
       return 0;
     }

     const numericScores = data.burnoutForecasts
       .map(forecast => forecast.overallScore)
       .filter(score => typeof score === 'number' && !isNaN(score));

     if (numericScores.length === 0) {
       return 0;
     }

     const sum = numericScores.reduce((acc, score) => acc + score, 0);
     return (sum / numericScores.length).toFixed(2);
   };

       // Calculate productivity lost in USD
    const calculateProductivityLost = () => {
      const burnoutMean = parseFloat(calculateOverallBurnoutMean()) || 0;
      
      // Calculate daily meetings impact (too many meetings = productivity loss)
      const avgMeetingsPerDay = data.meetingsDaily && data.meetingsDaily.length > 0 
        ? data.meetingsDaily.reduce((sum, day) => sum + (day.count || 0), 0) / data.meetingsDaily.length 
        : 0;
      
      // Calculate risk level impact
      let riskLevelImpact = 0;
      if (data.burnoutForecasts && data.burnoutForecasts.length > 0) {
        const riskCounts = {};
        data.burnoutForecasts.forEach(forecast => {
          const risk = forecast.riskLevel || 'Unknown';
          riskCounts[risk] = (riskCounts[risk] || 0) + 1;
        });
        
        // Assign productivity loss weights: Low=0, Medium=50, High=100, Critical=150
        const riskWeights = { 'Low': 0, 'Medium': 50, 'High': 100, 'Critical': 150 };
        const totalRiskImpact = Object.entries(riskCounts).reduce((sum, [risk, count]) => {
          return sum + ((riskWeights[risk] || 0) * count);
        }, 0);
        riskLevelImpact = totalRiskImpact / data.burnoutForecasts.length;
      }
      
      // Calculate trend impact
      let trendImpact = 0;
      if (data.burnoutForecasts && data.burnoutForecasts.length > 0) {
        const trendCounts = {};
        data.burnoutForecasts.forEach(forecast => {
          const trend = forecast.trend || 'Unknown';
          trendCounts[trend] = (trendCounts[trend] || 0) + 1;
        });
        
        // Assign productivity loss weights: Stable=0, Improving=25, Declining=75
        const trendWeights = { 'Stable': 0, 'Improving': 25, 'Declining': 75 };
        const totalTrendImpact = Object.entries(trendCounts).reduce((sum, [trend, count]) => {
          return sum + ((trendWeights[trend] || 0) * count);
        }, 0);
        trendImpact = totalTrendImpact / data.burnoutForecasts.length;
      }
      
             // Calculate wellness metrics impact
       const energyLevelMean = parseFloat(calculateEnergyLevelMean()) || 0;
       const emotionalStateMean = parseFloat(calculateEmotionalStateMean()) || 0;
       const stressLevelMean = parseFloat(calculateStressLevelMean()) || 0;
       
       // Wellness impact: based on total counts of wellness signals
       const energyImpact = energyLevelMean * 10; // More signals = potential productivity impact
       const stressImpact = stressLevelMean * 15; // More stress signals = more productivity loss
       const emotionalImpact = emotionalStateMean * 12; // More emotional signals = potential impact
      
      // Calculate total productivity lost
      // Base calculation: burnout mean * 100 + meetings impact + risk impact + trend impact + wellness impact
      const baseProductivityLost = burnoutMean * 100;
      const meetingsImpact = Math.max(0, (avgMeetingsPerDay - 3) * 25); // Penalty for >3 meetings/day
      const wellnessImpact = energyImpact + stressImpact + emotionalImpact;
      const totalProductivityLost = baseProductivityLost + meetingsImpact + riskLevelImpact + trendImpact + wellnessImpact;
      
      return Math.round(totalProductivityLost);
    };

    // Calculate energy level mean
    const calculateEnergyLevelMean = () => {
      if (!data.wellnessSignals || !data.wellnessSignals.length) {
        return 0;
      }

      // Count unique energy levels
      const energyLevels = {};
      data.wellnessSignals.forEach(signal => {
        const level = signal.metadata?.energyLevel || 'Unknown';
        energyLevels[level] = (energyLevels[level] || 0) + 1;
      });

      const totalCount = Object.values(energyLevels).reduce((sum, count) => sum + count, 0);
      return totalCount > 0 ? totalCount : 0;
    };

    // Calculate emotional state mean
    const calculateEmotionalStateMean = () => {
      if (!data.wellnessSignals || !data.wellnessSignals.length) {
        return 0;
      }

      // Count unique emotional states
      const emotionalStates = {};
      data.wellnessSignals.forEach(signal => {
        const state = signal.metadata?.emotionalState || 'Unknown';
        emotionalStates[state] = (emotionalStates[state] || 0) + 1;
      });

      const totalCount = Object.values(emotionalStates).reduce((sum, count) => sum + count, 0);
      return totalCount > 0 ? totalCount : 0;
    };

    // Calculate stress level mean
    const calculateStressLevelMean = () => {
      if (!data.wellnessSignals || !data.wellnessSignals.length) {
        return 0;
      }

      // Count unique stress levels
      const stressLevels = {};
      data.wellnessSignals.forEach(signal => {
        const level = signal.metadata?.stressLevel || 'Unknown';
        stressLevels[level] = (stressLevels[level] || 0) + 1;
      });

      const totalCount = Object.values(stressLevels).reduce((sum, count) => sum + count, 0);
      return totalCount > 0 ? totalCount : 0;
    };

     const processWellnessData = () => {
     const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
     
     const processField = (field) => {
       if (!data.wellnessSignals || !data.wellnessSignals.length) {
         return {
           labels: ['No Data'],
           datasets: [{
             data: [1],
             backgroundColor: ['#CCCCCC'],
             borderWidth: 2,
             borderColor: '#fff'
           }]
         };
       }
       
       const counts = {};
       data.wellnessSignals.forEach(signal => {
         const value = signal.metadata?.[field] || 'Unknown';
         counts[value] = (counts[value] || 0) + 1;
       });
       
       return {
         labels: Object.keys(counts),
         datasets: [{
           data: Object.values(counts),
           backgroundColor: colors.slice(0, Object.keys(counts).length),
           borderWidth: 2,
           borderColor: '#fff'
         }]
       };
     };
     
           return {
        stressLevel: processField('stressLevel'),
        energyLevel: processField('energyLevel'),
        emotionalState: processField('emotionalState')
      };
    };

  const processBurnoutData = () => {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    
    const processField = (field) => {
      if (!data.burnoutForecasts || !data.burnoutForecasts.length) {
        return {
          labels: ['No Data'],
          datasets: [{
            data: [1],
            backgroundColor: ['#CCCCCC'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        };
      }
      
      const counts = {};
      data.burnoutForecasts.forEach(forecast => {
        const value = forecast[field] || 'Unknown';
        counts[value] = (counts[value] || 0) + 1;
      });
      
      return {
        labels: Object.keys(counts),
        datasets: [{
          data: Object.values(counts),
          backgroundColor: colors.slice(0, Object.keys(counts).length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };
    };
    
    return {
      overallScore: processField('overallScore'),
      riskLevel: processField('riskLevel'),
      trend: processField('trend')
    };
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#808080',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading Dashboard...</div>
      </div>
    );
  }

           const wellnessData = processWellnessData();
    const burnoutData = processBurnoutData();
    const departmentAverages = calculateDepartmentAverages();
    const energyLevelAverages = calculateEnergyLevelAverages();
    const emotionalStateAverages = calculateEmotionalStateAverages();
    const overallBurnoutMean = calculateOverallBurnoutMean();
    const energyLevelMean = calculateEnergyLevelMean();
    const emotionalStateMean = calculateEmotionalStateMean();
    const stressLevelMean = calculateStressLevelMean();
    const productivityLost = calculateProductivityLost();

  return (
         <div style={{
       backgroundColor: '#808080',
       minHeight: '100vh',
       fontFamily: 'Arial, sans-serif',
       padding: '30px'
     }}>
             <div style={{
         backgroundColor: '#f0f0f0',
         borderRadius: '15px',
         padding: '40px',
         maxWidth: '2000px',
         margin: '0 auto',
         boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
         border: '3px dashed #333'
       }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #333'
        }}>
          <div>
            <h1 style={{ color: '#333', margin: 0, fontSize: '28px' }}>YAKAP Analytics Dashboard</h1>
            {user && (
              <p style={{ color: '#666', margin: '5px 0 0 0' }}>
                Welcome, {user.displayName} | {user.email}
              </p>
            )}
          </div>
          <button
            onClick={handleSignOutClick}
            style={{
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Sign Out
          </button>
        </div>

        {/* Summary Overview */}
        <div style={{
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '15px',
          border: '2px dashed #333'
        }}>
          <h3 style={{ color: '#333', marginBottom: '15px', textAlign: 'center' }}>
            Summary Overview
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            textAlign: 'center'
          }}>
            <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '10px' }}>
              <h4 style={{ color: '#2d5a2d', margin: '0 0 10px 0' }}>Total Users</h4>
              <p style={{ color: '#4a7c4a', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                {data.users ? data.users.length : 0}
              </p>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '10px' }}>
              <h4 style={{ color: '#856404', margin: '0 0 10px 0' }}>Wellness Signals</h4>
              <p style={{ color: '#856404', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                {data.wellnessSignals ? data.wellnessSignals.length : 0}
              </p>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f8d7da', borderRadius: '10px' }}>
              <h4 style={{ color: '#721c24', margin: '0 0 10px 0' }}>Burnout Forecasts</h4>
              <p style={{ color: '#721c24', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                {data.burnoutForecasts ? data.burnoutForecasts.length : 0}
              </p>
            </div>
                         <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '10px' }}>
               <h4 style={{ color: '#0c5460', margin: '0 0 10px 0' }}>Meeting Records</h4>
               <p style={{ color: '#0c5460', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                 {data.meetingsDaily ? data.meetingsDaily.length : 0}
               </p>
             </div>
           </div>
         </div>

         {/* Productivity Lost - Full Width Block */}
         <div style={{
           marginBottom: '30px',
           padding: '25px',
           backgroundColor: 'white',
           borderRadius: '15px',
           border: '2px solid #721c24',
           boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
           width: '100%',
           overflow: 'hidden'
         }}>
           <h3 style={{ color: '#721c24', marginBottom: '20px', textAlign: 'center' }}>
             Productivity Lost (USD)
           </h3>
           <div style={{
             display: 'flex',
             justifyContent: 'center',
             alignItems: 'center',
             padding: '20px',
             backgroundColor: '#f8d7da',
             borderRadius: '10px',
             border: '1px solid #721c24'
           }}>
             <div style={{ textAlign: 'center' }}>
               <p style={{ 
                 margin: 0, 
                 fontSize: '48px', 
                 fontWeight: 'bold', 
                 color: '#721c24',
                 textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
               }}>
                 ${productivityLost.toLocaleString()}
               </p>
               <p style={{ 
                 margin: '10px 0 0 0', 
                 fontSize: '16px', 
                 color: '#666',
                 fontStyle: 'italic'
               }}>
                 Calculated based on burnout scores, meeting trends, risk levels, and trend distribution
               </p>
             </div>
           </div>
         </div>

         {/* Charts Grid */}
         <div style={{
           display: 'grid',
           gridTemplateColumns: 'repeat(auto-fit, minmax(550px, 1fr))',
           gap: '70px',
           marginTop: '20px'
         }}>
                     {/* Meetings Daily Chart */}
                       <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '15px',
              border: '2px solid #4CAF50',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              width: '100%',
              overflow: 'hidden',
              margin: '10px 0'
            }}>
            <h3 style={{ color: '#4CAF50', marginBottom: '20px', textAlign: 'center' }}>
              Daily Meetings Trend
            </h3>
                         <Line 
               data={processMeetingsData()} 
               options={{
                 responsive: true,
                 maintainAspectRatio: true,
                 plugins: {
                   legend: { display: false },
                   title: { display: false }
                 },
                 scales: {
                   y: { beginAtZero: true },
                   x: {
                     ticks: {
                       maxRotation: 45,
                       minRotation: 45
                     }
                   }
                 }
               }}
             />
          </div>

                     {/* Department Averages List */}
                       <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '15px',
              border: '2px solid #36A2EB',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              width: '100%',
              overflow: 'hidden',
              margin: '10px 0'
            }}>
                         <h3 style={{ color: '#36A2EB', marginBottom: '20px', textAlign: 'center' }}>
               Department Distribution
             </h3>
             <div style={{ marginBottom: '20px' }}>
               <Bar 
                 data={{
                   labels: departmentAverages.map(item => item.department),
                   datasets: [{
                     label: 'Department Count',
                     data: departmentAverages.map(item => item.average),
                     backgroundColor: '#36A2EB',
                     borderColor: '#36A2EB',
                     borderWidth: 1
                   }]
                 }}
                 options={{
                   responsive: true,
                   maintainAspectRatio: true,
                   plugins: {
                     legend: { display: false }
                   },
                   scales: {
                     y: { 
                       beginAtZero: true,
                       ticks: {
                         stepSize: 1
                       }
                     },
                     x: {
                       ticks: {
                         maxRotation: 45,
                         minRotation: 45
                       }
                     }
                   }
                 }}
               />
             </div>
             <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
               {departmentAverages.map((item, index) => (
                 <div key={index} style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   padding: '10px',
                   borderBottom: '1px solid #eee',
                   backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
                 }}>
                   <span style={{ fontWeight: 'bold', color: '#333' }}>{item.department}</span>
                   <span style={{ color: '#36A2EB', fontWeight: 'bold' }}>{item.average}</span>
                 </div>
               ))}
             </div>
                            <div style={{
                 marginTop: '15px',
                 padding: '10px',
                 backgroundColor: '#f8f9fa',
                 borderRadius: '8px',
                 textAlign: 'center',
                 border: '1px solid #e9ecef'
               }}>
                 <p style={{ margin: 0, color: '#36A2EB', fontWeight: 'bold', fontSize: '16px' }}>
                   Total Departments: {departmentAverages.length}
                 </p>
                 <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px', fontStyle: 'italic' }}>
                   Shows distribution across different departments
                 </p>
               </div>
          </div>

                     {/* Energy Level Averages List */}
                       <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '15px',
              border: '2px solid #FF6384',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              width: '100%',
              overflow: 'hidden',
              margin: '10px 0'
            }}>
                         <h3 style={{ color: '#FF6384', marginBottom: '20px', textAlign: 'center' }}>
               Energy Level Distribution
             </h3>
             <div style={{ marginBottom: '20px' }}>
               <Doughnut 
                 data={wellnessData.energyLevel}
                 options={{
                   responsive: true,
                   maintainAspectRatio: true,
                   plugins: {
                     legend: { 
                       position: 'bottom',
                       labels: {
                         boxWidth: 12,
                         padding: 8
                       }
                     }
                   }
                 }}
               />
             </div>
             <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
               {energyLevelAverages.map((item, index) => (
                 <div key={index} style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   padding: '10px',
                   borderBottom: '1px solid #eee',
                   backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
                 }}>
                   <span style={{ fontWeight: 'bold', color: '#333' }}>{item.level}</span>
                   <span style={{ color: '#FF6384', fontWeight: 'bold' }}>{item.average}</span>
                 </div>
               ))}
             </div>
             <div style={{
               marginTop: '15px',
               padding: '10px',
               backgroundColor: '#f8f9fa',
               borderRadius: '8px',
               textAlign: 'center',
               border: '1px solid #e9ecef'
             }}>
               <p style={{ margin: 0, color: '#FF6384', fontWeight: 'bold', fontSize: '16px' }}>
                 Average Energy Level: {energyLevelMean}
               </p>
               <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px', fontStyle: 'italic' }}>
                 Lower energy levels indicate potential productivity loss
               </p>
             </div>
          </div>

                     {/* Emotional State Averages List */}
                       <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '15px',
              border: '2px solid #FFCE56',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              width: '100%',
              overflow: 'hidden',
              margin: '10px 0'
            }}>
                         <h3 style={{ color: '#FFCE56', marginBottom: '20px', textAlign: 'center' }}>
               Emotional State Distribution
             </h3>
             <div style={{ marginBottom: '20px' }}>
               <Pie 
                 data={wellnessData.emotionalState}
                 options={{
                   responsive: true,
                   maintainAspectRatio: true,
                   plugins: {
                     legend: { 
                       position: 'bottom',
                       labels: {
                         boxWidth: 12,
                         padding: 8
                       }
                     }
                   }
                 }}
               />
             </div>
             <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
               {emotionalStateAverages.map((item, index) => (
                 <div key={index} style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   padding: '10px',
                   borderBottom: '1px solid #eee',
                   backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
                 }}>
                   <span style={{ fontWeight: 'bold', color: '#333' }}>{item.state}</span>
                   <span style={{ color: '#FFCE56', fontWeight: 'bold' }}>{item.average}</span>
                 </div>
               ))}
             </div>
             <div style={{
               marginTop: '15px',
               padding: '10px',
               backgroundColor: '#f8f9fa',
               borderRadius: '8px',
               textAlign: 'center',
               border: '1px solid #e9ecef'
             }}>
               <p style={{ margin: 0, color: '#FFCE56', fontWeight: 'bold', fontSize: '16px' }}>
                 Average Emotional State: {emotionalStateMean}
               </p>
               <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px', fontStyle: 'italic' }}>
                 Lower emotional state scores indicate potential productivity loss
               </p>
             </div>
          </div>

                     {/* Stress Level Distribution */}
                       <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '15px',
              border: '2px solid #4BC0C0',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              width: '100%',
              overflow: 'hidden',
              margin: '10px 0'
            }}>
            <h3 style={{ color: '#4BC0C0', marginBottom: '20px', textAlign: 'center' }}>
              Stress Level Distribution
            </h3>
                                                   <Doughnut 
                data={wellnessData.stressLevel} 
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: { 
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        padding: 8
                      }
                    }
                  }
                }}
              />
                          <div style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #e9ecef'
              }}>
                <p style={{ margin: 0, color: '#4BC0C0', fontWeight: 'bold', fontSize: '16px' }}>
                  Average Stress Level: {stressLevelMean}
                </p>
                <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px', fontStyle: 'italic' }}>
                  Higher stress levels indicate potential productivity loss
                </p>
              </div>
          </div>

                                           {/* Overall Burnout Score */}
                        <div style={{
               backgroundColor: 'white',
               padding: '25px',
               borderRadius: '15px',
               border: '2px solid #9966FF',
               boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
               width: '100%',
               overflow: 'hidden',
               margin: '10px 0'
             }}>
             <h3 style={{ color: '#9966FF', marginBottom: '20px', textAlign: 'center' }}>
               Overall Burnout Score
             </h3>
                          <Bar 
                data={burnoutData.overallScore} 
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: { 
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    },
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45
                      }
                    }
                  }
                }}
              />
                         <div style={{
               marginTop: '15px',
               padding: '10px',
               backgroundColor: '#f8f9fa',
               borderRadius: '8px',
               textAlign: 'center',
               border: '1px solid #e9ecef'
             }}>
               <p style={{ margin: 0, color: '#9966FF', fontWeight: 'bold', fontSize: '16px' }}>
                 Average Burnout Score: {overallBurnoutMean}
               </p>
               <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px', fontStyle: 'italic' }}>
                 Higher burnout score = more productivity lost
               </p>
             </div>
          </div>

                     {/* Risk Level Distribution - Bar Chart */}
                       <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '15px',
              border: '2px solid #FF9F40',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              width: '100%',
              overflow: 'hidden',
              margin: '10px 0'
            }}>
            <h3 style={{ color: '#FF9F40', marginBottom: '20px', textAlign: 'center' }}>
              Risk Level Distribution
            </h3>
                         <Bar 
               data={burnoutData.riskLevel} 
               options={{
                 responsive: true,
                 maintainAspectRatio: true,
                 plugins: {
                   legend: { display: false }
                 },
                 scales: {
                   y: { 
                     beginAtZero: true,
                     ticks: {
                       stepSize: 1
                     }
                   },
                   x: {
                     ticks: {
                       maxRotation: 45,
                       minRotation: 45
                     }
                   }
                 }
               }}
             />
          </div>

                                 <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '15px',
              border: '2px solid #FF6384',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              width: '100%',
              overflow: 'hidden',
              margin: '10px 0'
            }}>
            <h3 style={{ color: '#FF6384', marginBottom: '20px', textAlign: 'center' }}>
              Trend Distribution
            </h3>
                         <Pie 
               data={burnoutData.trend} 
               options={{
                 responsive: true,
                 maintainAspectRatio: true,
                 plugins: {
                   legend: { 
                     position: 'bottom',
                     labels: {
                       boxWidth: 12,
                       padding: 8
                     }
                   }
                 }
               }}
             />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
