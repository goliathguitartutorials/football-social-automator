'use client';

import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // State to hold the key, the fetched data, and loading/error status
  const [authKey, setAuthKey] = useState('');
  const [appData, setAppData] = useState({ players: [], backgrounds: [], badges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // This function is called ONCE when the key is first validated
  const fetchInitialData = async (key) => {
    if (!key) return; // Don't run if the key is empty

    setLoading(true);
    setError(null);
    
    // Check session storage first
    const cachedData = sessionStorage.getItem('appData');
    if (cachedData) {
      processData(JSON.parse(cachedData));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/get-app-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey: key }),
      });

      if (response.status === 401) {
        throw new Error("Invalid Authorization Key. Data could not be loaded.");
      }
      if (!response.ok) {
        throw new Error("Failed to fetch app data from the server.");
      }

      const rawData = await response.json();
      processData(rawData);
      sessionStorage.setItem('appData', JSON.stringify(rawData)); // Cache on success

    } catch (err) {
      setError(err.message);
      // Clear data on error
      setAppData({ players: [], backgrounds: [], badges: [] });
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
  
  // This is the function the sidebar will call
  const handleSetAuthKey = (key) => {
    setAuthKey(key);
    // As soon as a key is entered, we try to fetch the data
    if (key) {
      fetchInitialData(key);
    } else {
      // If key is cleared, clear data
      sessionStorage.removeItem('appData');
      setAppData({ players: [], backgrounds: [], badges: [] });
      setError(null);
    }
  };

  const value = {
    authKey,
    setAuthKey: handleSetAuthKey, // Use our new handler function
    appData,
    loading,
    error,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook remains the same
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
