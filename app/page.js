'use client';

import { useState } from 'react';
import styles from './page.module.css';
import Navigation from '@/components/Navigation/Navigation';
import SquadAnnouncement from '@/components/SquadAnnouncement/SquadAnnouncement';
import MatchResult from '@/components/MatchResult/MatchResult';

export default function HomePage() {
  // State to track which tab is active. 'squad' is the default.
  const [activeTab, setActiveTab] = useState('squad');

  return (
    <main className={styles.main}>
      <h1 className={styles.mainTitle}>Social Media Automator</h1>
      <div className={styles.container}>
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Conditionally render the component based on the active tab */}
        {activeTab === 'squad' && <SquadAnnouncement />}
        {activeTab === 'result' && <MatchResult />}
      </div>
    </main>
  );
}
