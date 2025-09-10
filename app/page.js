'use client';

import { useState } from 'react';
import styles from './page.module.css';
import Sidebar from '@/components/Layout/Sidebar';
import SquadAnnouncement from '@/components/SquadAnnouncement/SquadAnnouncement';
import MatchResult from '@/components/MatchResult/MatchResult';
import MatchDayAnnouncement from '@/components/MatchDayAnnouncement/MatchDayAnnouncement'; // Import the new component

// We update MainContent to accept and pass down the authKey
const MainContent = ({ view, authKey }) => {
  switch (view) {
    case 'squad':
      // Pass the key down to the component that needs it
      return <SquadAnnouncement authKey={authKey} />;
    case 'matchDay': // Add case for the new view
      return <MatchDayAnnouncement authKey={authKey} />;
    case 'result':
      return <MatchResult />;
    default:
      return <p>Select a post type to begin.</p>;
  }
};

export default function HomePage() {
  const [activeView, setActiveView] = useState('matchDay'); // Set our new component as the default
  // The state for the authorization key now lives here, in the parent component
  const [authKey, setAuthKey] = useState('');

  return (
    <>
      <Sidebar
        activeView={activeView}
        setView={setActiveView}
        authKey={authKey}
        setAuthKey={setAuthKey}
      />
      <main className={styles.main}>
        <MainContent view={activeView} authKey={authKey} />
      </main>
    </>
  );
}
