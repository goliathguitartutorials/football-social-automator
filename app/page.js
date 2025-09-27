/*
 * ==========================================================
 * COMPONENT: Home Page
 * PAGE: /
 * FILE: /app/page.js
 ==========================================================
 */
'use client';

import { useState, useEffect } from 'react'; // MODIFIED: Import useEffect
import { useAppContext } from './context/AppContext';
import styles from './page.module.css';
import DesktopNav from '@/components/Navigation/DesktopNav';
import MobileNav from '@/components/Navigation/MobileNav';
import CreatePage from '@/components/CreatePage/CreatePage';
import SettingsPage from '@/components/SettingsPage/SettingsPage';
import AssetsPage from '@/components/AssetsPage/AssetsPage';
import SchedulePage from '@/components/SchedulePage/SchedulePage';
import MatchHubPage from '@/components/MatchHubPage/MatchHubPage';

const MainContent = ({ view, appData }) => {
    switch (view) {
        case 'create':
            return <CreatePage />;
        case 'schedule':
            return <SchedulePage appData={appData} />;
        case 'matchHub':
            return <MatchHubPage />;
        case 'assets':
            return <AssetsPage appData={appData} />;
        case 'settings':
            return <SettingsPage />;
        default:
            return <CreatePage />;
    }
};

export default function Home() { // MODIFIED: Renamed from HomePage for convention
    const [activeView, setActiveView] = useState('create');
    // MODIFIED: Get navigation state from context
    const { appData, navigationRequest, setNavigationRequest } = useAppContext();

    // NEW: This hook listens for navigation requests from other pages (like the Schedule page)
    useEffect(() => {
        if (navigationRequest && navigationRequest.page) {
            // If there's a navigation request, switch to the target page
            setActiveView(navigationRequest.page);
            // The request is consumed by the target page (MatchHubPage), 
            // so we don't clear it here.
        }
    }, [navigationRequest]);


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
