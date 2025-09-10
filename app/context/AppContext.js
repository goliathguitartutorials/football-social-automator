'use client';

import React, { createContext, useState, useContext } from 'react';

// Create the context
const AppContext = createContext();

// Create the provider component
export function AppProvider({ children }) {
  // State for authentication, data, loading, and errors
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appData, setAppData] = useState({ players: [], backgrounds: [], badges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // The core function to authenticate and fetch data
  const authenticate = async (authKey) => {
    setLoading(true);
    setError(null);

    // Clear previous data and session on new attempt
    sessionStorage.removeItem('appData');
    setIsAuthenticated(false);

    try {
      const response = await fetch('/api/get-app-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey }),
      });

      if (response.status === 401) {
        // NEW: Custom error message as you requested
        throw new Error("You do not have sufficient credentials to use this app. Please contact support to discuss terms.");
      }
      if (!response.ok) {
        throw new Error("An unexpected error occurred. Please try again.");
      }

      const rawData = await response.json();
      processData(rawData);
      sessionStorage.setItem('appData', JSON.stringify(rawData));
      setIsAuthenticated(true); // SUCCESS!

    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Logout function to reset state
  const logout = () => {
    sessionStorage.removeItem('appData');
    setIsAuthenticated(false);
    setAppData({ players: [], backgrounds: [], badges: [] });
    setError(null);
  };

  // Helper function to process the raw data from the API
  const processData = (rawData) => {
    const players = rawData.filter((item) => item.class === 'player');
    const assets = rawData.filter((item) => item.class === 'asset');
    const backgrounds = assets.filter((asset) => asset.Type === 'background');
    const badges = assets.filter((asset) => asset.Type === 'badge');
    badges.sort((a, b) => a.Name.localeCompare(b.Name));
    setAppData({ players, backgrounds, badges });
  };

  // Value provided to all child components
  const value = {
    isAuthenticated,
    appData,
    loading,
    error,
    authenticate,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook to easily use the context in any component
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
