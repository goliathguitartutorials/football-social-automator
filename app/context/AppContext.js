'use client';

import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [authKey, setAuthKey] = useState('');
  const [appData, setAppData] = useState({ players: [], backgrounds: [], badges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // NEW: State to track the authorization status for clear UI feedback
  const [authStatus, setAuthStatus] = useState('idle'); // 'idle', 'success', 'error'

  // MODIFIED: This function is now called MANUALLY by the new button
  const authorizeAndFetchData = async (key) => {
    if (!key) {
      setError("Please enter a key.");
      setAuthStatus('error');
      return;
    }

    setLoading(true);
    setError(null);
    setAuthStatus('idle');
    sessionStorage.removeItem('appData'); // Clear old cache on new attempt

    try {
      const response = await fetch('/api/get-app-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey: key }),
      });

      if (response.status === 401) {
        throw new Error("Authorization failed. Please check your key.");
      }
      if (!response.ok) {
        throw new Error("Failed to fetch app data from the server.");
      }

      const rawData = await response.json();
      processData(rawData);
      sessionStorage.setItem('appData', JSON.stringify(rawData));
      setAuthStatus('success'); // SUCCESS!
      
    } catch (err) {
      setError(err.message);
      setAuthStatus('error'); // FAILURE!
      setAppData({ players: [], backgrounds: [], badges: [] }); // Clear data on error
    } finally {
      setLoading(false);
    }
  };

  const processData = (rawData) => {
    const players = rawData.filter((item) => item.class === 'player');
    const assets = rawData.filter((item) => item.class === 'asset');
    const backgrounds = assets.filter((asset) => asset.Type === 'background');
    const badges = assets.filter((asset) => asset.Type === 'badge');
    badges.sort((a, b) => a.Name.localeCompare(b.Name));
    setAppData({ players, backgrounds, badges });
  };
  
  // MODIFIED: The main set function no longer triggers a fetch
  const handleSetAuthKey = (key) => {
    setAuthKey(key);
    // When the user starts typing again, reset the status
    if (authStatus !== 'idle') {
        setAuthStatus('idle');
        setError(null);
    }
  };

  const value = {
    authKey,
    setAuthKey: handleSetAuthKey,
    appData,
    loading,
    error,
    authStatus, // Expose the new status
    authorizeAndFetchData, // Expose the manual fetch function
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
