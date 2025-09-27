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
import { FixturesIcon, LiveIcon, ArchiveIcon } from './MatchHubIcons';
import FixturesTab from './FixturesTab/FixturesTab';
import LiveTab from './LiveTab/LiveTab';
import AddMatchForm from './AddMatchForm/AddMatchForm';
import ArchiveTab from './ArchiveTab/ArchiveTab';

export default function MatchHubPage() {
    const { appData, navigationRequest, setNavigationRequest } = useAppContext();
    
    const [view, setView] = useState('fixtures');
    const [editingMatch, setEditingMatch] = useState(null);
    const [newMatchData, setNewMatchData] = useState(null);

    useEffect(() => {
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
            
            setNavigationRequest(null);
        }
    }, [navigationRequest, setNavigationRequest, appData.matches]);

    const handleEditClick = (match) => {
        setEditingMatch(match);
        setView('add_form');
    };
    
    // NEW: Function to handle the "Add New Match" action, to be passed to FixturesTab
    const handleAddNewMatch = () => {
        setEditingMatch(null);
        setNewMatchData(null);
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
            // MODIFIED: Passed the onAddNewMatch handler to the FixturesTab
            return <FixturesTab matches={appData.matches} onEditClick={handleEditClick} onAddNewMatch={handleAddNewMatch} />;
        }
        if (view === 'live') {
            return <LiveTab />;
        }
        if (view === 'archive') {
            return <ArchiveTab matches={appData.matches} />;
        }
        return null;
    };
    
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <nav className={styles.tabNav}>
                    <button className={`${styles.navButton} ${view === 'fixtures' ? styles.active : ''}`} onClick={() => setView('fixtures')}><span className={styles.navIcon}><FixturesIcon /></span><span className={styles.navLabel}>Fixtures</span></button>
                    <button className={`${styles.navButton} ${view === 'live' ? styles.active : ''}`} onClick={() => setView('live')}><span className={styles.navIcon}><LiveIcon /></span><span className={styles.navLabel}>Live</span></button>
                    <button className={`${styles.navButton} ${view === 'archive' ? styles.active : ''}`} onClick={() => setView('archive')}><span className={styles.navIcon}><ArchiveIcon /></span><span className={styles.navLabel}>Archive</span></button>
                </nav>
                {/* MODIFIED: The "+ Add New Match" button has been removed from the header */}
            </header>
            <main className={styles.contentContainer}>
                {renderContent()}
            </main>
        </div>
    );
}
