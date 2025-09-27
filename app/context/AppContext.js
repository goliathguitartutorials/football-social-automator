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
            setAppData({ players: [], backgrounds: [], badges: [], matches: [], scheduledPosts: [] });
        } finally {
            setLoading(false);
        }
    };

    const processData = (dataArray) => {
        const players = dataArray.filter((item) => item.hasOwnProperty('playerId'));
        const assets = dataArray.filter((item) => item.class === 'asset');
        const scheduledPosts = dataArray.filter((item) => item.class === 'scheduledPost');
        const backgrounds = assets.filter((asset) => asset.Type === 'background');
        const badges = assets.filter((asset) => asset.Type === 'badge');
        const matches = dataArray.filter((item) => item.hasOwnProperty('matchId'));

        matches.sort((a, b) => new Date(a.matchDate + ' ' + a.matchTime) - new Date(b.matchDate + ' ' + b.matchTime));
        badges.sort((a, b) => a.Name.localeCompare(b.Name));
        scheduledPosts.sort((a, b) => new Date(a.scheduled_time_utc) - new Date(b.scheduled_time_utc));

        setAppData({ players, backgrounds, badges, matches, scheduledPosts });
    };

    // MODIFIED: Renamed and updated logic to handle both adding and updating a match.
    const addOrUpdateMatch = (matchData) => {
        setAppData(prevData => {
            const existingMatchIndex = prevData.matches.findIndex(m => m.matchId === matchData.matchId);
            let updatedMatches;

            if (existingMatchIndex > -1) {
                // This is an update. Replace the existing match.
                updatedMatches = prevData.matches.map((match, index) => 
                    index === existingMatchIndex ? matchData : match
                );
            } else {
                // This is a new match. Add it to the list.
                updatedMatches = [...prevData.matches, matchData];
            }

            // Re-sort matches by date after the add/update
            updatedMatches.sort((a, b) => new Date(a.matchDate + ' ' + a.matchTime) - new Date(b.matchDate + ' ' + b.matchTime));
            return { ...prevData, matches: updatedMatches };
        });
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
        addOrUpdateMatch, // MODIFIED: Expose the new function
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
