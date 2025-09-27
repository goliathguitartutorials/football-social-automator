/*
 * ==========================================================
 * COMPONENT: MatchHubPage
 * PAGE: Match Hub
 * FILE: /components/MatchHubPage/MatchHubPage.js
 ==========================================================
 */
'use client';
import { useState } from 'react';
import styles from './MatchHubPage.module.css';
import { FixturesIcon, LiveIcon } from './MatchHubIcons';
import FixturesTab from './FixturesTab/FixturesTab';
import LiveTab from './LiveTab/LiveTab';

export default function MatchHubPage() {
    const [activeTab, setActiveTab] = useState('fixtures'); // 'fixtures' or 'live'

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <nav className={styles.tabNav}>
                    <button 
                        className={`${styles.navButton} ${activeTab === 'fixtures' ? styles.active : ''}`} 
                        onClick={() => setActiveTab('fixtures')}
                    >
                        <span className={styles.navIcon}><FixturesIcon /></span>
                        <span className={styles.navLabel}>Fixtures</span>
                    </button>
                    <button 
                        className={`${styles.navButton} ${activeTab === 'live' ? styles.active : ''}`} 
                        onClick={() => setActiveTab('live')}
                    >
                        <span className={styles.navIcon}><LiveIcon /></span>
                        <span className={styles.navLabel}>Live</span>
                    </button>
                </nav>
            </header>
            <main className={styles.contentContainer}>
                {activeTab === 'fixtures' && <FixturesTab />}
                {activeTab === 'live' && <LiveTab />}
            </main>
        </div>
    );
}
