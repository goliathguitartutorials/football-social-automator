/*
 * ==========================================================
 * COMPONENT: MatchHubPage
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/MatchHubPage.js
 ==========================================================
 */
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import styles from './MatchHubPage.module.css';
import FixturesTab from './FixturesTab/FixturesTab';
import AddMatchForm from './AddMatchForm/AddMatchForm';
import LiveTab from './LiveTab/LiveTab'; // Assuming you have this placeholder

export default function MatchHubPage() {
    const { authKey } = useAppContext();
    const [view, setView] = useState('FIXTURES'); // FIXTURES, LIVE, ADD_FORM
    const [matches, setMatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchMatches = useCallback(async () => {
        if (!authKey) {
            setError("Authorization key is missing. Cannot fetch matches.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('/api/get-matches', {
                headers: { 'Authorization': `Bearer ${authKey}` }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to fetch matches.");
            }
            const data = await response.json();
            // Ensure data is an array before setting state
            setMatches(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
            setMatches([]); // Clear matches on error
        } finally {
            setIsLoading(false);
        }
    }, [authKey]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    const handleMatchAdded = () => {
        setView('FIXTURES');
        fetchMatches(); // Re-fetch matches to show the newly added one
    };

    const renderContent = () => {
        if (view === 'ADD_FORM') {
            return <AddMatchForm onCancel={() => setView('FIXTURES')} onMatchAdded={handleMatchAdded} />;
        }
        if (view === 'LIVE') {
            return <LiveTab />;
        }
        // Default to FIXTURES view
        return <FixturesTab matches={matches} isLoading={isLoading} error={error} />;
    };

    return (
        <div className={styles.hubContainer}>
            <div className={styles.header}>
                <div className={styles.tabs}>
                    <button 
                        className={`${styles.tabButton} ${view === 'FIXTURES' ? styles.active : ''}`} 
                        onClick={() => setView('FIXTURES')}>
                        Fixtures
                    </button>
                    <button 
                        className={`${styles.tabButton} ${view === 'LIVE' ? styles.active : ''}`} 
                        onClick={() => setView('LIVE')}>
                        Live
                    </button>
                </div>
                {view !== 'ADD_FORM' && (
                    <button className={styles.addMatchButton} onClick={() => setView('ADD_FORM')}>
                        + Add New Match
                    </button>
                )}
            </div>
            <div className={styles.content}>
                {renderContent()}
            </div>
        </div>
    );
}
