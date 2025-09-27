/*
 * ==========================================================
 * COMPONENT: MatchHubPage
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/MatchHubPage.js
 ==========================================================
 */
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import styles from './MatchHubPage.module.css';
import { FixturesIcon, LiveIcon } from './MatchHubIcons';
import FixturesTab from './FixturesTab/FixturesTab';
import LiveTab from './LiveTab/LiveTab';
import AddMatchForm from './AddMatchForm/AddMatchForm';

// This inner component contains the page logic and can safely use searchParams
function MatchHubContent() {
    const { appData } = useAppContext();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [view, setView] = useState('fixtures');
    const [editingMatch, setEditingMatch] = useState(null);
    const [newMatchData, setNewMatchData] = useState(null);

    useEffect(() => {
        const matchIdToEdit = searchParams.get('editMatchId');
        const dateForNewMatch = searchParams.get('newMatchDate');

        if (matchIdToEdit) {
            const match = appData.matches.find(m => m.matchId === matchIdToEdit);
            if (match) {
                setEditingMatch(match);
                setView('add_form');
            }
        } else if (dateForNewMatch) {
            setNewMatchData({ matchDate: dateForNewMatch });
            setView('add_form');
        }
    }, [searchParams, appData.matches]);

    const handleEditClick = (match) => {
        setEditingMatch(match);
        setView('add_form');
    };

    const handleFormClose = () => {
        setEditingMatch(null);
        setNewMatchData(null);
        setView('fixtures');
        // Clean up URL parameters after closing the form
        router.replace('/match-hub', { scroll: false });
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

// Next.js requires `useSearchParams` to be used within a <Suspense> boundary.
// This wrapper component provides that boundary.
export default function MatchHubPage() {
    return (
        <Suspense fallback={<div style={{textAlign: 'center', padding: '2rem'}}>Loading Match Hub...</div>}>
            <MatchHubContent />
        </Suspense>
    );
}
