/*
 * ==========================================================
 * COMPONENT: FixturesTab
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/FixturesTab/FixturesTab.js
 ==========================================================
 */
'use client';
import { useState } from 'react';
import styles from './FixturesTab.module.css';
import AddMatchForm from '../AddMatchForm/AddMatchForm';
import { PlusIcon } from '../MatchHubIcons';

export default function FixturesTab() {
    const [view, setView] = useState('list'); // 'list' or 'add_form'

    // This will eventually fetch and display a list of matches
    const MatchListView = () => (
        <div>
            <div className={styles.toolbar}>
                <button className={styles.addMatchButton} onClick={() => setView('add_form')}>
                    <PlusIcon />
                    Add New Match
                </button>
            </div>
            <div className={styles.placeholder}>
                <p>Upcoming and past matches will be listed here.</p>
            </div>
        </div>
    );

    if (view === 'add_form') {
        return <AddMatchForm onCancel={() => setView('list')} />;
    }

    return <MatchListView />;
}
