import React, { useState } from 'react';
import { handleGoogleSignIn } from '../firebase/firebaseMain.js';

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      await handleGoogleSignIn();
      // The App component will automatically handle the redirect to Dashboard
      // due to the auth state change listener
    } catch (error) {
      console.error('Sign-in error:', error);
      setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#808080',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif',
      backgroundImage: `
        linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.1) 50%),
        linear-gradient(0deg, transparent 50%, rgba(255,255,255,0.1) 50%)
      `,
      backgroundSize: '20px 20px',
      position: 'relative'
    }}>
      <div style={{
        backgroundColor: '#f0f0f0',
        padding: '40px',
        borderRadius: '30px',
        border: '3px dashed #333',
        textAlign: 'center',
        width: '400px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 1
      }}>
        <h1 style={{
          fontSize: '24px',
          marginBottom: '60px',
          color: '#333'
        }}>
          Welcome to<br />
          YAKAP: Burnout<br />
          Forecast
        </h1>
        
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        
        <button 
          onClick={handleSignIn}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#ccc' : 'transparent',
            border: '2px solid #333',
            borderRadius: '25px',
            padding: '12px 40px',
            fontSize: '16px',
            marginBottom: '20px',
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '80%',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>
        
        <br />
        
        <p style={{
          textDecoration: 'underline',
          fontSize: '14px',
          marginBottom: '20px',
          cursor: 'pointer'
        }}>
          Already have an account?
        </p>
        
        <p style={{
          fontSize: '12px',
          color: '#666'
        }}>
          By signing up or signing in you agree to<br />
          our <span style={{fontWeight: 'bold'}}>Privacy Policy</span> and <span style={{fontWeight: 'bold'}}>Terms of Service</span>
        </p>
      </div>
    </div>
  );
};

export default SignIn;