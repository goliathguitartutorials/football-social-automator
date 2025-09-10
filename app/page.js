'use client';

import { useState } from 'react';
import styles from './page.module.css';
import Sidebar from '@/components/Layout/Sidebar';
import SquadAnnouncement from '@/components/SquadAnnouncement/SquadAnnouncement';
import MatchResult from '@/components/MatchResult/MatchResult';
import MatchDayAnnouncement from '@/components/MatchDayAnnouncement/MatchDayAnnouncement';

// NEW: Import the context and the AuthGate
import { useAppContext } from './context/AppContext';
import AuthGate from '@/components/AuthGate/AuthGate';

// MODIFIED: This component no longer needs authKey passed to it
const MainContent = ({ view }) => {
  switch (view) {
    case 'squad':
      // The child components will get their data from the context now
      return <SquadAnnouncement />;
    case 'matchDay':
      return <MatchDayAnnouncement />;
    case 'result':
      return <MatchResult />;
    default:
      // A better default view when authenticated
      return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h2>Welcome!</h2>
          <p>Select a post type from the sidebar to begin creating content.</p>
        </div>
      );
  }
};

export default function HomePage() {
  const [activeView, setActiveView] = useState('matchDay');
  
  // MODIFIED: We get isAuthenticated directly from our global context
  const { isAuthenticated } = useAppContext();

  // REMOVED: The authKey state is no longer needed here.

  return (
    <>
      <Sidebar
        activeView={activeView}
        setView={setActiveView}
        // REMOVED: We no longer pass authKey state management props
      />
      <main className={styles.main}>
        {isAuthenticated ? (
          // If the user is authenticated, show the main app
          <MainContent view={activeView} />
        ) : (
          // Otherwise, show the authentication gate
          <AuthGate />
        )}
      </main>
    </>
  );
}
