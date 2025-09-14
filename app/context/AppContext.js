/*
 * ==========================================================
 * COMPONENT: App Context
 * PAGE: (Global)
 * FILE: /app/context/AppContext.js
 * ==========================================================
 */
'use client';

import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [authKey, setAuthKey] = useState('');
    const [appData, setAppData] = useState({ players: [], backgrounds: [], badges: [], matches: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [authStatus, setAuthStatus] = useState('idle');

    const authorizeAndFetchData = async (key) => {
        if (!key) {
            setError("Please enter a key.");
            setAuthStatus('error');
            return;
        }

        setLoading(true);
        setError(null);
        setAuthStatus('idle');
        sessionStorage.removeItem('appData');

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
            
            // --- THIS IS THE FIX ---
            // This ensures we are working with an array, whether the API returns a
            // direct array `[]` or a nested object like `{ "data": [...] }`.
            const dataArray = Array.isArray(rawData) ? rawData : rawData.data || [];
            
            // Pass the guaranteed-to-be-an-array data to the processing function.
            processData(dataArray);
            
            sessionStorage.setItem('appData', JSON.stringify(dataArray));
            setAuthStatus('success');
            
        } catch (err) {
            setError(err.message);
            setAuthStatus('error');
            setAppData({ players: [], backgrounds: [], badges: [], matches: [] });
        } finally {
            setLoading(false);
        }
    };

    const processData = (dataArray) => {
        // Filter by the 'class' property for players and assets
        const players = dataArray.filter((item) => item.class === 'player');
        const assets = dataArray.filter((item) => item.class === 'asset');
        
        // Further filter assets by their 'Type' property
        const backgrounds = assets.filter((asset) => asset.Type === 'background');
        const badges = assets.filter((asset) => asset.Type === 'badge');
        badges.sort((a, b) => a.Name.localeCompare(b.Name));

        // Filter by the 'type' property for matches
        const matches = dataArray.filter((item) => item.type === 'Match');
        matches.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

        setAppData({ players, backgrounds, badges, matches });
    };
    
    const handleSetAuthKey = (key) => {
        setAuthKey(key);
        if (authStatus !== 'idle') {
            setAuthStatus('idle');
            setError(null);
        }
    };
    
    // --- MODIFIED: The function to refresh data is authorizeAndFetchData ---
    // We pass the authKey which is already stored in our state.
    const refreshAppData = () => {
        if (authKey) {
            authorizeAndFetchData(authKey);
        } else {
            setError("Cannot refresh data: No authorization key is present.");
        }
    };

    const value = {
        authKey,
        setAuthKey: handleSetAuthKey,
        appData,
        loading,
        error,
        authStatus,
        authorizeAndFetchData,
        refreshAppData, // --- NEW: Exposing a dedicated refresh function
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
