/*
 * ==========================================================
 * COMPONENT: MatchHubPage
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/MatchHubPage.js
 ==========================================================
 */
'use client';
import { useState, useEffect, Suspense } from 'react'; // Import Suspense
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import { useAppContext } from '@/app/context/AppContext';
import styles from './MatchHubPage.module.css';
import { FixturesIcon, LiveIcon } from './MatchHubIcons';
import FixturesTab from './FixturesTab/FixturesTab';
import LiveTab from './LiveTab/LiveTab';
import AddMatchForm from './AddMatchForm/AddMatchForm';

// Create a new component to handle the logic, so we can wrap it in Suspense
function MatchHubContent() {
    const { appData } = useAppContext();
    const searchParams = useSearchParams();
    
    const [view, setView] = useState('fixtures');
    const [editingMatch, setEditingMatch] = useState(null);
    const [newMatchDate, setNewMatchDate] = useState(null);

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
            setNewMatchDate(dateForNewMatch);
            setView('add_form');
        }
    }, [searchParams, appData.matches]);

    const handleEditClick = (match) => {
        setEditingMatch(match);
        setView('add_form');
    };

    const handleFormClose = () => {
        setEditingMatch(null);
        setNewMatchDate(null);
        setView('fixtures');
    };

    const renderContent = () => {
        if (view === 'add_form') {
            // If newMatchDate exists, create a new initialData object
            const formInitialData = editingMatch || (newMatchDate ? { matchDate: newMatchDate } : null);
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
                    <button className={`${styles.navButton} ${view === 'fixtures' ? styles.active : ''}`} onClick={() => setView('fixtures')}><FixturesIcon /><span>Fixtures</span></button>
                    <button className={`${styles.navButton} ${view === 'live' ? styles.active : ''}`} onClick={() => setView('live')}><LiveIcon /><span>Live</span></button>
                </nav>
                {view !== 'add_form' && (<button className={styles.addMatchButton} onClick={() => setView('add_form')}>+ Add New Match</button>)}
            </header>
            <main className={styles.contentContainer}>
                {renderContent()}
            </main>
        </div>
    );
}

// Wrap the main content in a Suspense boundary as required by useSearchParams
export default function MatchHubPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MatchHubContent />
        </Suspense>
    );
}
