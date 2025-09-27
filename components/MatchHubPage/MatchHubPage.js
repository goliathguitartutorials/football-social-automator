/*
 * ==========================================================
 * COMPONENT: MatchHubPage
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/MatchHubPage.js
 ==========================================================
 */
'use client';
import { useState } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import styles from './MatchHubPage.module.css';
import { FixturesIcon, LiveIcon } from './MatchHubIcons';
import FixturesTab from './FixturesTab/FixturesTab';
import LiveTab from './LiveTab/LiveTab';
import AddMatchForm from './AddMatchForm/AddMatchForm';

export default function MatchHubPage() {
    const { appData } = useAppContext();
    const [view, setView] = useState('fixtures');
    const [editingMatch, setEditingMatch] = useState(null); // State to hold the match being edited

    const handleEditClick = (match) => {
        setEditingMatch(match); // Set the match to edit
        setView('add_form');    // Switch to the form view
    };

    const handleFormClose = () => {
        setEditingMatch(null); // Clear the editing match
        setView('fixtures');     // Switch back to fixtures
    };

    const renderContent = () => {
        if (view === 'add_form') {
            return (
                <AddMatchForm 
                    // Pass the match data to the form if we are editing, otherwise pass null
                    initialData={editingMatch} 
                    onCancel={handleFormClose} 
                    onMatchAdded={handleFormClose} 
                />
            );
        }
        if (view === 'fixtures') {
            return (
                <FixturesTab 
                    matches={appData.matches} 
                    onEditClick={handleEditClick} // Pass the handler to the fixtures tab
                />
            );
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
