/*
 * =================================================================
 * COMPONENT: Home Page
 * PAGE: /
 * FILE: /app/page.js
 * =================================================================
 */
'use client';

import { useState } from 'react';
import styles from './page.module.css';
import DesktopNav from '@/components/Navigation/DesktopNav';
import MobileNav from '@/components/Navigation/MobileNav';
import CreatePage from '@/components/CreatePage/CreatePage';
import SettingsPage from '@/components/SettingsPage/SettingsPage'; // MODIFIED: Import the new component

// --- Placeholder Pages ---
const SchedulePage = () => (
  <div>
    <h2>Post Scheduler</h2>
    <p>This feature is coming soon.</p>
  </div>
);

const LiveMatchPage = () => (
  <div>
    <h2>Live Match Mode</h2>
    <p>This feature is coming soon.</p>
  </div>
);

// --- Main Content Renderer ---
const MainContent = ({ view }) => {
  switch (view) {
    case 'create':
      return <CreatePage />;
    case 'schedule':
      return <SchedulePage />;
    case 'live':
      return <LiveMatchPage />;
    case 'settings':
      return <SettingsPage />; // MODIFIED: Render the new SettingsPage component
    default:
      return <CreatePage />;
  }
};

export default function HomePage() {
  const [activeView, setActiveView] = useState('create');

  return (
    <div className={styles.pageContainer}>
      <DesktopNav activeView={activeView} setView={setActiveView} />
      <main className={styles.main}>
        <MainContent view={activeView} />
      </main>
      <MobileNav activeView={activeView} setView={setActiveView} />
    </div>
  );
}
