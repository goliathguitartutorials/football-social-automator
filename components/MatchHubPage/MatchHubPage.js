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
import { FixturesIcon, LiveIcon } from './MatchHubIcons';
import FixturesTab from './FixturesTab/FixturesTab';
import LiveTab from './LiveTab/LiveTab';
import AddMatchForm from './AddMatchForm/AddMatchForm';

export default function MatchHubPage() {
    const { authKey } = useAppContext();
    const [view, setView] = useState('fixtures'); // 'fixtures', 'live', or 'add_form'
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
            setMatches(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
            setMatches([]);
        } finally {
            setIsLoading(false);
        }
    }, [authKey]);

    useEffect(() => {
        // Fetch matches only when the fixtures tab is active and not adding a form
        if (view === 'fixtures') {
            fetchMatches();
        }
    }, [view, fetchMatches]);

    const handleMatchAdded = () => {
        setView('fixtures'); // Switch back to fixtures tab
        // The useEffect will automatically trigger a re-fetch
    };

    const renderContent = () => {
        if (view === 'add_form') {
            // Pass the handler to fix the "is not a function" error
            return <AddMatchForm onCancel={() => setView('fixtures')} onMatchAdded={handleMatchAdded} />;
        }
        if (view === 'fixtures') {
            return <FixturesTab matches={matches} isLoading={isLoading} error={error} />;
        }
        if (view === 'live') {
            return <LiveTab />;
        }
        return null;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <nav className={styles.tabNav}>
                    <button
                        className={`${styles.navButton} ${view === 'fixtures' ? styles.active : ''}`}
                        onClick={() => setView('fixtures')}
                    >
                        <span className={styles.navIcon}><FixturesIcon /></span>
                        <span className={styles.navLabel}>Fixtures</span>
                    </button>
                    <button
                        className={`${styles.navButton} ${view === 'live' ? styles.active : ''}`}
                        onClick={() => setView('live')}
                    >
                        <span className={styles.navIcon}><LiveIcon /></span>
                        <span className={styles.navLabel}>Live</span>
                    </button>
                </nav>
                {/* Show button only when not in the form view */}
                {view !== 'add_form' && (
                    <button className={styles.addMatchButton} onClick={() => setView('add_form')}>
                        + Add New Match
                    </button>
                )}
            </header>
            <main className={styles.contentContainer}>
                {renderContent()}
            </main>
        </div>
    );
}
