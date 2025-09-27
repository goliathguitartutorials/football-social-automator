/*
 * ==========================================================
 * COMPONENT: MatchHubPage
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/MatchHubPage.js
 ==========================================================
 */
'use client';
import { useState, useEffect } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import styles from './MatchHubPage.module.css';
import { FixturesIcon, LiveIcon } from './MatchHubIcons';
import FixturesTab from './FixturesTab/FixturesTab';
import LiveTab from './LiveTab/LiveTab';
import AddMatchForm from './AddMatchForm/AddMatchForm';

// MODIFIED: Simplified back to a single component, no Suspense needed.
export default function MatchHubPage() {
    // MODIFIED: Get navigation state from context
    const { appData, navigationRequest, setNavigationRequest } = useAppContext();
    
    const [view, setView] = useState('fixtures');
    const [editingMatch, setEditingMatch] = useState(null);
    const [newMatchData, setNewMatchData] = useState(null);

    useEffect(() => {
        // This effect runs when the component loads or a navigation request changes.
        // It checks if a navigation request is targeted for this page.
        if (navigationRequest && navigationRequest.page === 'Match Hub' && navigationRequest.data) {
            const { editMatchId, newMatchDate } = navigationRequest.data;

            if (editMatchId) {
                const match = appData.matches.find(m => m.matchId === editMatchId);
                if (match) {
                    setEditingMatch(match);
                    setView('add_form');
                }
            } else if (newMatchDate) {
                setNewMatchData({ matchDate: newMatchDate });
                setView('add_form');
            }
            
            // Crucially, clear the request after it has been handled.
            setNavigationRequest(null);
        }
    }, [navigationRequest, setNavigationRequest, appData.matches]);

    const handleEditClick = (match) => {
        setEditingMatch(match);
        setView('add_form');
    };

    const handleFormClose = () => {
        setEditingMatch(null);
        setNewMatchData(null);
        setView('fixtures');
    };

    const renderContent = () => {
        if (view === 'add_form') {
            const formInitialData = editingMatch || newMatchData;
            return (
                <AddMatchForm 
                    initialData={formInitialData} 
                    onCancel={handleFormClose} 
                    onMatchAdded={handleFormClose} 
                />
            );
        }
        if (view === 'fixtures') {
            return <FixturesTab matches={appData.matches} onEditClick={handleEditClick} />;
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
                    <button className={`${styles.navButton} ${view === 'fixtures' ? styles.active : ''}`} onClick={() => setView('fixtures')}><span className={styles.navIcon}><FixturesIcon /></span><span className={styles.navLabel}>Fixtures</span></button>
                    <button className={`${styles.navButton} ${view === 'live' ? styles.active : ''}`} onClick={() => setView('live')}><span className={styles.navIcon}><LiveIcon /></span><span className={styles.navLabel}>Live</span></button>
                </nav>
                {view !== 'add_form' && (<button className={styles.addMatchButton} onClick={() => setView('add_form')}>+ Add New Match</button>)}
            </header>
            <main className={styles.contentContainer}>
                {renderContent()}
            </main>
        </div>
    );
}
