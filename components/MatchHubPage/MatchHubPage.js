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
    // MODIFIED: We now get appData (which includes matches) directly from the context
    const { appData } = useAppContext();
    const [view, setView] = useState('fixtures'); // 'fixtures', 'live', or 'add_form'

    // This function is now simpler: it just switches the view back.
    const handleMatchAdded = () => {
        setView('fixtures');
    };

    const renderContent = () => {
        if (view === 'add_form') {
            return <AddMatchForm onCancel={() => setView('fixtures')} onMatchAdded={handleMatchAdded} />;
        }
        if (view === 'fixtures') {
            // MODIFIED: We pass the matches directly from the global appData state
            return <FixturesTab matches={appData.matches} isLoading={false} error={null} />;
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
