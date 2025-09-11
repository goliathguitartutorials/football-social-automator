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
    // MODIFIED: Added 'matches' to the initial state
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
            // MODIFIED: Reverted to fetching from a single endpoint
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
            
            // The processData function will now handle the combined array
            processData(rawData);
            
            sessionStorage.setItem('appData', JSON.stringify(rawData));
            setAuthStatus('success');
            
        } catch (err) {
            setError(err.message);
            setAuthStatus('error');
            setAppData({ players: [], backgrounds: [], badges: [], matches: [] });
        } finally {
            setLoading(false);
        }
    };

    // MODIFIED: Updated to process a single, combined data array
    const processData = (rawData) => {
        // Filter by 'class' for players and assets
        const players = rawData.filter((item) => item.class === 'player');
        const assets = rawData.filter((item) => item.class === 'asset');
        
        // Further filter assets by 'Type'
        const backgrounds = assets.filter((asset) => asset.Type === 'background');
        const badges = assets.filter((asset) => asset.Type === 'badge');
        badges.sort((a, b) => a.Name.localeCompare(b.Name));

        // NEW: Filter by 'type' for matches
        const matches = rawData.filter((item) => item.type === 'Match');
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
