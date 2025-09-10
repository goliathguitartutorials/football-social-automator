'use client';

import { useState } from 'react';
import styles from './page.module.css';
import Sidebar from '@/components/Layout/Sidebar';
import SquadAnnouncement from '@/components/SquadAnnouncement/SquadAnnouncement';
import MatchResult from '@/components/MatchResult/MatchResult';
import MatchDayAnnouncement from '@/components/MatchDayAnnouncement/MatchDayAnnouncement';
import { useAppContext } from './context/AppContext'; // Import the context

// MainContent is always visible
const MainContent = ({ view }) => {
  switch (view) {
    case 'squad':
      return <SquadAnnouncement />;
    case 'matchDay':
      return <MatchDayAnnouncement />;
    case 'result':
      return <MatchResult />;
    default:
      return <p>Select a post type to begin.</p>;
  }
};

export default function HomePage() {
  const [activeView, setActiveView] = useState('matchDay');
  
  // We no longer need any special logic here. The UI always shows.
  // Child components will get the authKey and data from the context.

  return (
    <>
      <Sidebar
        activeView={activeView}
        setView={setActiveView}
      />
      <main className={styles.main}>
        <MainContent view={activeView} />
      </main>
    </>
  );
}
