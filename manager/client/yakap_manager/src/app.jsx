import React, { useState, useEffect } from 'react'
import SignIn from './components/SignIn.jsx'
import Dashboard from './components/Dashboard.jsx'
import { onAuthStateChange } from './firebase/firebaseMain.js'

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

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
        <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      {user ? <Dashboard /> : <SignIn />}
    </div>
  )
}

export default App