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
    // MODIFIED: Added scheduledPosts to the initial state
    const [appData, setAppData] = useState({ players: [], backgrounds: [], badges: [], matches: [], scheduledPosts: [] });
    const [authKey, setAuthKey] = useState('');
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
            
            const dataArray = Array.isArray(rawData) ? rawData : rawData.data || [];
            
            processData(dataArray);
            
            sessionStorage.setItem('appData', JSON.stringify(dataArray));
            setAuthStatus('success');
            
        } catch (err) {
            setError(err.message);
            setAuthStatus('error');
            // MODIFIED: Ensure scheduledPosts is cleared on error
            setAppData({ players: [], backgrounds: [], badges: [], matches: [], scheduledPosts: [] });
        } finally {
            setLoading(false);
        }
    };

    const processData = (dataArray) => {
        // Filter by the 'class' property for players and assets
        const players = dataArray.filter((item) => item.class === 'player');
        const assets = dataArray.filter((item) => item.class === 'asset');
        
        // NEW: Filter for scheduled posts
        const scheduledPosts = dataArray.filter((item) => item.class === 'scheduled_post');
        scheduledPosts.sort((a, b) => new Date(a.scheduled_time_utc) - new Date(b.scheduled_time_utc));

        // Further filter assets by their 'Type' property
        const backgrounds = assets.filter((asset) => asset.Type === 'background');
        const badges = assets.filter((asset) => asset.Type === 'badge');
        badges.sort((a, b) => a.Name.localeCompare(b.Name));

        // Filter by the 'type' property for matches
        const matches = dataArray.filter((item) => item.type === 'Match');
        matches.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

        // MODIFIED: Add scheduledPosts to the final appData object
        setAppData({ players, backgrounds, badges, matches, scheduledPosts });
    };
    
    const handleSetAuthKey = (key) => {
        setAuthKey(key);
        if (authStatus !== 'idle') {
            setAuthStatus('idle');
            setError(null);
        }
    };
    
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
        refreshAppData,
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
