/*
 * ==========================================================
 * COMPONENT: Home Page
 * PAGE: /
 * FILE: /app/page.js
 * ==========================================================
 */
'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from './context/AppContext';
import styles from './page.module.css';
import DesktopNav from '@/components/Navigation/DesktopNav';
import MobileNav from '@/components/Navigation/MobileNav';
import CreatePage from '@/components/CreatePage/CreatePage';
import SettingsPage from '@/components/SettingsPage/SettingsPage';
import AssetsPage from '@/components/AssetsPage/AssetsPage';
import SchedulePage from '@/components/SchedulePage/SchedulePage';
import LivePage from '@/components/LivePage/LivePage'; // MODIFIED: Import LivePage instead of MatchHubPage

const MainContent = ({ view, appData }) => {
    switch (view) {
        case 'create':
            return <CreatePage />;
        case 'schedule':
            return <SchedulePage appData={appData} />;
        case 'live': // MODIFIED: Changed 'matchHub' to 'live'
            return <LivePage />; // MODIFIED: Render LivePage
        case 'assets':
            return <AssetsPage appData={appData} />;
        case 'settings':
            return <SettingsPage />;
        default:
            return <CreatePage />;
    }
};

export default function Home() {
    const [activeView, setActiveView] = useState('create');
    const { appData, navigationRequest, setNavigationRequest } = useAppContext();

    useEffect(() => {
        if (navigationRequest && navigationRequest.page) {
            setActiveView(navigationRequest.page);
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
