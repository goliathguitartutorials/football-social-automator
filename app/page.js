/*
 * ==========================================================
 * COMPONENT: Home Page
 * PAGE: /
 * FILE: /app/page.js
 ==========================================================
 */
'use client';

import { useState } from 'react';
import { useAppContext } from './context/AppContext'; // Import the context hook
import styles from './page.module.css';
import DesktopNav from '@/components/Navigation/DesktopNav';
import MobileNav from '@/components/Navigation/MobileNav';
import CreatePage from '@/components/CreatePage/CreatePage';
import SettingsPage from '@/components/SettingsPage/SettingsPage';
import AssetsPage from '@/components/AssetsPage/AssetsPage';
import SchedulePage from '@/components/SchedulePage/SchedulePage';
import MatchHubPage from '@/components/MatchHubPage/MatchHubPage'; // --- NEW: Import MatchHubPage

// --- Main Content Renderer ---
const MainContent = ({ view, appData }) => {
    switch (view) {
        case 'create':
            return <CreatePage />;
        case 'schedule':
            return <SchedulePage appData={appData} />;
        case 'matchHub': // --- MODIFIED: 'live' is now 'matchHub'
            return <MatchHubPage />; // --- MODIFIED: Render the new component
        case 'assets':
            return <AssetsPage appData={appData} />;
        case 'settings':
            return <SettingsPage />;
        default:
            return <CreatePage />;
    }
};

export default function HomePage() {
    const [activeView, setActiveView] = useState('create');
    const { appData } = useAppContext();

    return (
        <div className={styles.pageContainer}>
            <DesktopNav activeView={activeView} setView={setActiveView} />
            <main className={styles.main}>
                <MainContent view={activeView} appData={appData} />
            </main>
            <MobileNav activeView={activeView} setView={setActiveView} />
        </div>
    );
}
