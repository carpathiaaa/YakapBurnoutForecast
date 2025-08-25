# YAKAP Manager - Render.com Deployment Guide

## Frontend Deployment (React App)

### Build Settings on Render.com:

1. **Build Command:** `npm run build`
2. **Publish Directory:** `dist`
3. **Environment Variables:** None required for frontend

### New Analytics Dashboard Features:

- **Line Chart**: Daily meetings count trend from `meetings_daily` collection
- **Pie Charts**: Department distribution from `users` collection
- **Doughnut Charts**: Wellness signals (energyLevel, emotionalState, stressLevel) from `wellness_signals` collection
- **Pie Charts**: Burnout forecasts (overallScore, riskLevel, trend) from `burnout_forecasts` collection
- **Summary Statistics**: Real-time data counts for all collections
- **Colorful Design**: Matches login page style with dashed borders and vibrant colors

### Dependencies Added:
- `chart.js`: Core charting library
- `react-chartjs-2`: React wrapper for Chart.js

### Important Notes:

- The app now properly handles authentication state
- After successful sign-in, users will be redirected to the Analytics Dashboard
- The app includes proper error handling and loading states
- CORS is configured to work with the deployed domain
- Charts automatically fetch and display data from Firestore collections

## Backend Deployment (Express Server)

### Build Settings on Render.com:

1. **Build Command:** `npm install`
2. **Start Command:** `node main/main.js`
3. **Environment Variables:**
   - `PORT` (automatically set by Render)
   - Firebase Admin SDK credentials (if using service account)

### CORS Configuration:

The server is configured to accept requests from:
- `https://yakap-manager-web.onrender.com` (production)
- `http://localhost:5173` (local development)
- `http://localhost:3000` (local development)

## Data Collections Required

The dashboard expects the following Firestore collections:

1. **meetings_daily**: Contains `count` and `date` fields
2. **users**: Contains `department` field
3. **wellness_signals**: Contains `energyLevel`, `emotionalState`, and `stressLevel` fields
4. **burnout_forecasts**: Contains `overallScore`, `riskLevel`, and `trend` fields

## Troubleshooting

### Common Issues:

1. **Authentication gets stuck after sign-in:**
   - ✅ Fixed: Added proper authentication state management
   - ✅ Fixed: Added Analytics Dashboard component for post-authentication flow

2. **CORS errors:**
   - ✅ Fixed: Updated CORS configuration for production domains

3. **Build failures:**
   - Ensure all dependencies are in package.json
   - Check that build command is correct

4. **Charts not displaying data:**
   - Verify Firestore collections exist and contain data
   - Check browser console for any Firebase connection errors
   - Ensure Firebase configuration is correct

### Testing the Fix:

1. Deploy the updated code to Render.com
2. Try signing in with Google
3. You should now see the Analytics Dashboard after successful authentication
4. Verify that all charts are loading and displaying data
5. The sign-out button should work properly

## File Structure

```
manager/client/yakap_manager/
├── src/
│   ├── components/
│   │   ├── SignIn.jsx (updated with dashed border background)
│   │   └── Dashboard.jsx (new analytics dashboard with charts)
│   ├── firebase/
│   │   ├── firebaseMain.js (updated with Firestore data fetching)
│   │   └── config/
│   │       └── firebaseConfig.js
│   └── app.jsx (updated with auth state handling)
├── public/
│   └── _redirects (for client-side routing)
├── package.json (updated with chart dependencies)
└── vite.config.js (updated for production)
```

## Chart Types Used

1. **Line Chart**: For time-series data (meetings daily trend)
2. **Pie Charts**: For categorical data distribution (departments, burnout metrics)
3. **Doughnut Charts**: For wellness signals with better visual appeal
4. **Summary Cards**: For quick statistics overview
