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
// MODIFIED: Imported new ArchiveIcon
import { FixturesIcon, LiveIcon, ArchiveIcon } from './MatchHubIcons';
import FixturesTab from './FixturesTab/FixturesTab';
import LiveTab from './LiveTab/LiveTab';
import AddMatchForm from './AddMatchForm/AddMatchForm';
// MODIFIED: Imported new ArchiveTab component
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
        // MODIFIED: Added render logic for the new ArchiveTab
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
                    {/* MODIFIED: Added the new Archive tab button */}
                    <button className={`${styles.navButton} ${view === 'archive' ? styles.active : ''}`} onClick={() => setView('archive')}><span className={styles.navIcon}><ArchiveIcon /></span><span className={styles.navLabel}>Archive</span></button>
                </nav>
                {view !== 'add_form' && (<button className={styles.addMatchButton} onClick={() => setView('add_form')}>+ Add New Match</button>)}
            </header>
            <main className={styles.contentContainer}>
                {renderContent()}
            </main>
        </div>
    );
}
