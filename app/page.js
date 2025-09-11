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

// --- Placeholder Pages ---
// In the future, these will be moved to their own component files.

const CreatePage = () => (
  <div>
    <h2>Create a New Post</h2>
    <p>This is where the post types (Match Day, Squad, Result) will live.</p>
  </div>
);

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

const SettingsPage = () => (
  <div>
    <h2>Settings</h2>
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
      return <SettingsPage />;
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
