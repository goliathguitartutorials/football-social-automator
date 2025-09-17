/*
 * ==========================================================
 * COMPONENT: App Context
 * PAGE: (Global)
 * FILE: /app/context/AppContext.js
 * ==========================================================
 */
'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [appData, setAppData] = useState({ players: [], backgrounds: [], badges: [], matches: [], scheduledPosts: [] });
    const [authKey, setAuthKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [authStatus, setAuthStatus] = useState('idle'); // idle, success, error

    // NEW: Effect to rehydrate state from sessionStorage on initial load
    useEffect(() => {
        const savedKey = sessionStorage.getItem('authKey');
        const savedData = sessionStorage.getItem('appData');
        if (savedKey && savedData) {
            setAuthKey(savedKey);
            const parsedData = JSON.parse(savedData);
            processData(parsedData); // Use processData to ensure format is correct
            setAuthStatus('success');
        }
    }, []);

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
        sessionStorage.removeItem('authKey');

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
            
            setAuthKey(key); // Set the key in state
            sessionStorage.setItem('authKey', key); // Save key to session
            sessionStorage.setItem('appData', JSON.stringify(dataArray));
            setAuthStatus('success');
            
        } catch (err) {
            setError(err.message);
            setAuthStatus('error');
            setAppData({ players: [], backgrounds: [], badges: [], matches: [], scheduledPosts: [] });
        } finally {
            setLoading(false);
        }
    };

    const processData = (dataArray) => {
        const players = dataArray.filter((item) => item.class === 'player');
        const assets = dataArray.filter((item) => item.class === 'asset');
        
        // MODIFIED: Changed 'scheduled_post' to 'scheduledPost' to match new data format
        const scheduledPosts = dataArray.filter((item) => item.class === 'scheduledPost');
        scheduledPosts.sort((a, b) => new Date(a.scheduled_time_utc) - new Date(b.scheduled_time_utc));

        const backgrounds = assets.filter((asset) => asset.Type === 'background');
        const badges = assets.filter((asset) => asset.Type === 'badge');
        badges.sort((a, b) => a.Name.localeCompare(b.Name));

        const matches = dataArray.filter((item) => item.type === 'Match');
        matches.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

        setAppData({ players, backgrounds, badges, matches, scheduledPosts });
    };
    
    const handleSetAuthKey = (key) => {
        setAuthKey(key);
        if (authStatus !== 'idle') {
            setAuthStatus('idle');
            setError(null);
        }
    };
    
    const refreshAppData = async () => {
        const currentKey = authKey || sessionStorage.getItem('authKey');
        if (currentKey) {
            // Re-fetch data using the stored key
            await authorizeAndFetchData(currentKey);
        } else {
            setError("Cannot refresh data: No authorization key is present.");
            setAuthStatus('idle'); // Force re-login if key is missing
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
