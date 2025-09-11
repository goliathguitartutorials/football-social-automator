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
    // MODIFIED: Added 'matches' to the initial appData state
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
            // MODIFIED: Fetch app data and match data concurrently for efficiency
            const [appDataResponse, matchDataResponse] = await Promise.all([
                fetch('/api/get-app-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ authKey: key }),
                }),
                fetch('/api/get-match-data', { // NEW: Endpoint for match data
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ authKey: key }),
                })
            ]);

            if (appDataResponse.status === 401 || matchDataResponse.status === 401) {
                throw new Error("Authorization failed. Please check your key.");
            }
            if (!appDataResponse.ok || !matchDataResponse.ok) {
                throw new Error("Failed to fetch all required app data from the server.");
            }

            const appRawData = await appDataResponse.json();
            const matchesRawData = await matchDataResponse.json();
            
            // MODIFIED: Pass both datasets to be processed
            processData(appRawData, matchesRawData);
            
            // Store both raw datasets in session storage
            sessionStorage.setItem('appData', JSON.stringify({ appRawData, matchesRawData }));
            setAuthStatus('success');
            
        } catch (err) {
            setError(err.message);
            setAuthStatus('error');
            // MODIFIED: Ensure matches are also cleared on error
            setAppData({ players: [], backgrounds: [], badges: [], matches: [] });
        } finally {
            setLoading(false);
        }
    };

    // MODIFIED: Updated to process both app data and match data
    const processData = (appRawData, matchesRawData) => {
        const players = appRawData.filter((item) => item.class === 'player');
        const assets = appRawData.filter((item) => item.class === 'asset');
        const backgrounds = assets.filter((asset) => asset.Type === 'background');
        const badges = assets.filter((asset) => asset.Type === 'badge');
        badges.sort((a, b) => a.Name.localeCompare(b.Name));

        // NEW: Process and sort the matches by date
        const matches = matchesRawData.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

        setAppData({ players, backgrounds, badges, matches });
    };
    
    const handleSetAuthKey = (key) => {
        setAuthKey(key);
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
        authStatus,
        authorizeAndFetchData,
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
