'use client';

import { useState } from 'react';
import styles from './page.module.css';
import Sidebar from '@/components/Layout/Sidebar';
import SquadAnnouncement from '@/components/SquadAnnouncement/SquadAnnouncement';
import MatchResult from '@/components/MatchResult/MatchResult';

// A simple component to render the correct view based on state
const MainContent = ({ view }) => {
  switch (view) {
    case 'squad':
      return <SquadAnnouncement />;
    case 'result':
      return <MatchResult />;
    // Add cases for 'preview', 'signing', 'generic' here later
    default:
      return <p>Select a post type to begin.</p>;
  }
};

export default function HomePage() {
  const [activeView, setActiveView] = useState('squad');

  return (
    <>
      <Sidebar activeView={activeView} setView={setActiveView} />
      <main className={styles.main}>
        <MainContent view={activeView} />
      </main>
    </>
  );
}
